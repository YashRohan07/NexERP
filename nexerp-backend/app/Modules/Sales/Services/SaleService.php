<?php

namespace App\Modules\Sales\Services;

use App\Models\Inventory;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Support\AppCache;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class SaleService
{
    public function getSales(array $filters): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 10);

        if ($perPage < 1 || $perPage > 100) {
            $perPage = 10;
        }

        $status = $filters['status'] ?? null;

        if ($status && ! in_array($status, ['draft', 'confirmed', 'cancelled'], true)) {
            $status = null;
        }

        return Sale::query()
            ->with('customer')
            ->when($filters['search'] ?? null, function (Builder $query, string $search): void {
                $query->whereHas('customer', function (Builder $query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%");
                });
            })
            ->when($status, function (Builder $query, string $status): void {
                $query->where('status', $status);
            })
            ->when($filters['date_from'] ?? null, function (Builder $query, string $dateFrom): void {
                $query->whereDate('sale_date', '>=', $dateFrom);
            })
            ->when($filters['date_to'] ?? null, function (Builder $query, string $dateTo): void {
                $query->whereDate('sale_date', '<=', $dateTo);
            })
            ->latest()
            ->paginate($perPage);
    }

    public function createSale(array $data): Sale
    {
        return DB::transaction(function () use ($data): Sale {
            $sale = Sale::create([
                'customer_id' => $data['customer_id'],
                'sale_date' => $data['sale_date'],
                'status' => 'draft',

                // Normal sales module sale.
                'sale_channel' => 'sales',
                'payment_method' => null,

                'total_amount' => 0,
                'note' => $data['note'] ?? null,
            ]);

            $totalAmount = 0;

            foreach ($data['items'] as $item) {
                $lineTotal = (int) $item['quantity'] * (float) $item['selling_price'];

                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'selling_price' => $item['selling_price'],
                    'line_total' => $lineTotal,
                ]);

                $totalAmount += $lineTotal;
            }

            $sale->update([
                'total_amount' => $totalAmount,
            ]);

            AppCache::clearDashboard();

            return $sale->load(['customer', 'items.product']);
        });
    }

    public function confirmSale(Sale $sale): Sale
    {
        return DB::transaction(function () use ($sale): Sale {
            /*
             * Lock the sale row first.
             * This prevents double confirmation from two concurrent requests.
             */
            $sale = Sale::query()
                ->with(['customer', 'items.product'])
                ->whereKey($sale->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($sale->status === 'confirmed') {
                throw new InvalidArgumentException('Sale is already confirmed.');
            }

            if ($sale->status === 'cancelled') {
                throw new InvalidArgumentException('Cancelled sale cannot be confirmed.');
            }

            /*
             * Aggregate quantity by product_id.
             * This prevents duplicate line items from bypassing stock validation.
             */
            $requiredQuantities = $sale->items
                ->groupBy('product_id')
                ->map(fn ($items): int => (int) $items->sum('quantity'));

            $inventories = Inventory::query()
                ->whereIn('product_id', $requiredQuantities->keys()->all())
                ->lockForUpdate()
                ->get()
                ->keyBy('product_id');

            foreach ($requiredQuantities as $productId => $requiredQuantity) {
                $inventory = $inventories->get($productId);
                $saleItem = $sale->items->firstWhere('product_id', $productId);
                $product = $saleItem?->product;

                if (! $product || ! $inventory) {
                    throw new InvalidArgumentException('Inventory record not found for product.');
                }

                if ((int) $inventory->quantity < $requiredQuantity) {
                    throw new InvalidArgumentException(
                        "Insufficient stock for product: {$product->name}"
                    );
                }
            }

            /*
             * Decrease stock once per product using the aggregated quantity.
             */
            foreach ($requiredQuantities as $productId => $requiredQuantity) {
                $inventory = $inventories->get($productId);

                $inventory->update([
                    'quantity' => (int) $inventory->quantity - $requiredQuantity,
                ]);
            }

            $sale->update([
                'status' => 'confirmed',
            ]);

            AppCache::clearDashboard();

            return $sale->refresh()->load(['customer', 'items.product']);
        });
    }

    public function cancelSale(Sale $sale): Sale
    {
        return DB::transaction(function () use ($sale): Sale {
            /*
             * Lock sale row to avoid race conditions with confirm/cancel requests.
             */
            $sale = Sale::query()
                ->whereKey($sale->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($sale->status !== 'draft') {
                throw new InvalidArgumentException('Only draft sale can be cancelled.');
            }

            $sale->update([
                'status' => 'cancelled',
            ]);

            AppCache::clearDashboard();

            return $sale->refresh()->load(['customer', 'items.product']);
        });
    }

    public function formatSale(Sale $sale, bool $withItems = false): array
    {
        $data = [
            'id' => $sale->id,
            'customer' => $sale->customer ? [
                'id' => $sale->customer->id,
                'name' => $sale->customer->name,
                'phone' => $sale->customer->phone,
                'email' => $sale->customer->email,
            ] : null,
            'sale_date' => $sale->sale_date?->format('Y-m-d'),
            'status' => $sale->status,

            // Useful for distinguishing normal sales and POS sales.
            'sale_channel' => $sale->sale_channel,
            'payment_method' => $sale->payment_method,

            'total_amount' => number_format((float) $sale->total_amount, 2, '.', ''),
            'note' => $sale->note,
            'created_at' => $sale->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $sale->updated_at?->format('Y-m-d H:i:s'),
        ];

        if ($withItems) {
            $data['items'] = $sale->items->map(function (SaleItem $item): array {
                return [
                    'id' => $item->id,
                    'product' => $item->product ? [
                        'id' => $item->product->id,
                        'sku' => $item->product->sku,
                        'name' => $item->product->name,
                        'size' => $item->product->size,
                        'color' => $item->product->color,
                    ] : null,
                    'quantity' => $item->quantity,
                    'selling_price' => number_format((float) $item->selling_price, 2, '.', ''),
                    'line_total' => number_format((float) $item->line_total, 2, '.', ''),
                ];
            })->values();
        }

        return $data;
    }
}
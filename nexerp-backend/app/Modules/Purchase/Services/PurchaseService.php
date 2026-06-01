<?php

namespace App\Modules\Purchase\Services;

use App\Models\Inventory;
use App\Models\Purchase;
use App\Support\AppCache;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class PurchaseService
{
    public function getPurchases(array $filters): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 10);

        if ($perPage < 1 || $perPage > 100) {
            $perPage = 10;
        }

        $status = $filters['status'] ?? null;

        if ($status && ! in_array($status, ['draft', 'confirmed', 'cancelled'], true)) {
            $status = null;
        }

        return Purchase::query()
            ->with('supplier')
            ->when($filters['search'] ?? null, function (Builder $query, string $search): void {
                $query->whereHas('supplier', function (Builder $query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%");
                });
            })
            ->when($status, function (Builder $query, string $status): void {
                $query->where('status', $status);
            })
            ->when($filters['date_from'] ?? null, function (Builder $query, string $dateFrom): void {
                $query->whereDate('purchase_date', '>=', $dateFrom);
            })
            ->when($filters['date_to'] ?? null, function (Builder $query, string $dateTo): void {
                $query->whereDate('purchase_date', '<=', $dateTo);
            })
            ->latest()
            ->paginate($perPage);
    }

    public function createPurchase(array $data): Purchase
    {
        return DB::transaction(function () use ($data): Purchase {
            $purchase = Purchase::create([
                'supplier_id' => $data['supplier_id'],
                'purchase_date' => $data['purchase_date'],
                'status' => 'draft',
                'total_amount' => 0,
                'note' => $data['note'] ?? null,
            ]);

            $totalAmount = 0;

            foreach ($data['items'] as $item) {
                $lineTotal = (int) $item['quantity'] * (float) $item['purchase_price'];
                $totalAmount += $lineTotal;

                $purchase->items()->create([
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'purchase_price' => $item['purchase_price'],
                    'line_total' => $lineTotal,
                ]);
            }

            $purchase->update([
                'total_amount' => $totalAmount,
            ]);

            AppCache::clearDashboard();

            return $purchase->load(['supplier', 'items.product']);
        });
    }

    public function getPurchase(int $id): Purchase
    {
        return Purchase::with(['supplier', 'items.product'])->findOrFail($id);
    }

    public function confirmPurchase(Purchase $purchase): Purchase
    {
        return DB::transaction(function () use ($purchase): Purchase {
            $purchase = Purchase::with(['supplier', 'items.product'])
                ->lockForUpdate()
                ->findOrFail($purchase->id);

            if ($purchase->status === 'confirmed') {
                throw new InvalidArgumentException('Purchase is already confirmed.');
            }

            if ($purchase->status === 'cancelled') {
                throw new InvalidArgumentException('Cancelled purchase cannot be confirmed.');
            }

            foreach ($purchase->items as $item) {
                if (! $item->product) {
                    throw new InvalidArgumentException('Purchase contains an unavailable product.');
                }

                $inventory = Inventory::query()
                    ->where('product_id', $item->product_id)
                    ->lockForUpdate()
                    ->first();

                if (! $inventory) {
                    throw new InvalidArgumentException('Inventory record not found for purchase item product.');
                }

                $oldQuantity = (int) $inventory->quantity;
                $oldPrice = (float) $inventory->purchase_price;
                $purchaseQuantity = (int) $item->quantity;
                $purchasePrice = (float) $item->purchase_price;

                $newQuantity = $oldQuantity + $purchaseQuantity;

                if ($oldQuantity === 0) {
                    $newPrice = $purchasePrice;
                } else {
                    $newPrice = (($oldQuantity * $oldPrice) + ($purchaseQuantity * $purchasePrice)) / $newQuantity;
                }

                $inventory->update([
                    'quantity' => $newQuantity,
                    'purchase_price' => round($newPrice, 2),
                    'purchase_date' => $purchase->purchase_date,
                ]);
            }

            $purchase->update([
                'status' => 'confirmed',
            ]);

            AppCache::clearDashboard();

            return $purchase->load(['supplier', 'items.product']);
        });
    }

    public function cancelPurchase(Purchase $purchase): Purchase
    {
        return DB::transaction(function () use ($purchase): Purchase {
            $purchase = Purchase::with(['supplier', 'items.product'])
                ->lockForUpdate()
                ->findOrFail($purchase->id);

            if ($purchase->status === 'confirmed') {
                throw new InvalidArgumentException('Confirmed purchase cannot be cancelled.');
            }

            if ($purchase->status === 'cancelled') {
                throw new InvalidArgumentException('Purchase is already cancelled.');
            }

            $purchase->update([
                'status' => 'cancelled',
            ]);

            AppCache::clearDashboard();

            return $purchase->load(['supplier', 'items.product']);
        });
    }

    public function formatPurchase(Purchase $purchase): array
    {
        return [
            'id' => $purchase->id,
            'supplier' => $purchase->supplier ? [
                'id' => $purchase->supplier->id,
                'name' => $purchase->supplier->name,
                'phone' => $purchase->supplier->phone,
                'email' => $purchase->supplier->email,
            ] : null,
            'purchase_date' => $purchase->purchase_date?->format('Y-m-d'),
            'status' => $purchase->status,
            'total_amount' => number_format((float) $purchase->total_amount, 2, '.', ''),
            'note' => $purchase->note,
            'created_at' => $purchase->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $purchase->updated_at?->format('Y-m-d H:i:s'),
        ];
    }

    public function formatPurchaseDetails(Purchase $purchase): array
    {
        $data = $this->formatPurchase($purchase);

        $data['items'] = $purchase->items
            ->map(function ($item): array {
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
                    'purchase_price' => number_format((float) $item->purchase_price, 2, '.', ''),
                    'line_total' => number_format((float) $item->line_total, 2, '.', ''),
                ];
            })
            ->values();

        return $data;
    }
}
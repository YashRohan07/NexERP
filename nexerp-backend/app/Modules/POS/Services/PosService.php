<?php

namespace App\Modules\POS\Services;

use App\Models\Customer;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Support\AppCache;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class PosService
{
    public function searchProducts(array $filters): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 10);

        if ($perPage < 1 || $perPage > 100) {
            $perPage = 10;
        }

        return Product::query()
            /*
             * Select only required inventory columns for POS product search.
             * POS needs stock, unit cost, and low-stock threshold only.
             */
            ->with('inventory:id,product_id,quantity,purchase_price,purchase_date,low_stock_threshold')
            ->when($filters['search'] ?? null, function (Builder $query, string $search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query->where('sku', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate($perPage);
    }

    public function checkout(array $data): array
    {
        return DB::transaction(function () use ($data): array {
            $customer = $this->getCustomer($data['customer_id'] ?? null);

            $items = collect($data['items']);
            $productIds = $items->pluck('product_id')->unique()->values();

            $products = Product::query()
                ->whereIn('id', $productIds->all())
                ->get()
                ->keyBy('id');

            /*
             * Lock inventory rows before stock validation and stock decrease.
             * This prevents overselling during concurrent POS checkouts.
             */
            $inventories = Inventory::query()
                ->whereIn('product_id', $productIds->all())
                ->lockForUpdate()
                ->get()
                ->keyBy('product_id');

            /*
             * Aggregate quantity by product_id.
             * This prevents duplicate cart lines from bypassing stock validation.
             */
            $requiredQuantities = $items
                ->groupBy('product_id')
                ->map(fn ($groupedItems): int => (int) $groupedItems->sum('quantity'));

            $this->checkStockAvailability($requiredQuantities, $products, $inventories);

            $sale = Sale::create([
                'customer_id' => $customer->id,
                'sale_date' => $data['sale_date'],
                'status' => 'confirmed',
                'sale_channel' => 'pos',
                'payment_method' => $data['payment_method'],
                'total_amount' => 0,
                'note' => $data['note'] ?? null,
            ]);

            $totalAmount = 0;

            /*
             * Keep original cart lines in sale_items.
             * Stock decrease is done once per product later using aggregated quantity.
             */
            foreach ($data['items'] as $item) {
                $product = $products->get($item['product_id']);
                $lineTotal = (int) $item['quantity'] * (float) $item['selling_price'];

                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'selling_price' => $item['selling_price'],
                    'line_total' => $lineTotal,
                ]);

                $totalAmount += $lineTotal;
            }

            /*
             * Decrease stock once per product using aggregated quantity.
             */
            foreach ($requiredQuantities as $productId => $requiredQuantity) {
                $inventory = $inventories->get($productId);

                $inventory->update([
                    'quantity' => (int) $inventory->quantity - $requiredQuantity,
                ]);
            }

            $sale->update([
                'total_amount' => $totalAmount,
            ]);

            AppCache::clearDashboard();

            return $this->formatReceipt(
                $sale->refresh()->load(['customer', 'items.product'])
            );
        });
    }

    public function getReceipt(Sale $sale): array
    {
        if ($sale->sale_channel !== 'pos') {
            throw new InvalidArgumentException('POS receipt not found.');
        }

        return $this->formatReceipt(
            $sale->load(['customer', 'items.product'])
        );
    }

    public function formatProduct(Product $product): array
    {
        $inventory = $product->inventory;
        $quantity = $inventory?->quantity ?? 0;
        $unitCost = $inventory?->purchase_price ?? 0;
        $lowStockThreshold = $inventory?->low_stock_threshold ?? 0;

        return [
            'product_id' => $product->id,
            'sku' => $product->sku,
            'name' => $product->name,
            'size' => $product->size,
            'color' => $product->color,
            'available_stock' => $quantity,
            'unit_cost' => number_format((float) $unitCost, 2, '.', ''),
            'stock_status' => $this->getStockStatus((int) $quantity, (int) $lowStockThreshold),
        ];
    }

    public function formatReceipt(Sale $sale): array
    {
        return [
            'sale_id' => $sale->id,
            'sale_channel' => $sale->sale_channel,
            'sale_date' => $sale->sale_date?->format('Y-m-d'),
            'customer' => $sale->customer ? [
                'id' => $sale->customer->id,
                'name' => $sale->customer->name,
                'phone' => $sale->customer->phone,
                'email' => $sale->customer->email,
            ] : null,
            'payment_method' => $sale->payment_method,
            'items' => $sale->items->map(function (SaleItem $item): array {
                return [
                    'sku' => $item->product?->sku,
                    'name' => $item->product?->name,
                    'quantity' => $item->quantity,
                    'selling_price' => number_format((float) $item->selling_price, 2, '.', ''),
                    'line_total' => number_format((float) $item->line_total, 2, '.', ''),
                ];
            })->values(),
            'total_amount' => number_format((float) $sale->total_amount, 2, '.', ''),
            'note' => $sale->note,
        ];
    }

    private function getCustomer(?int $customerId): Customer
    {
        if ($customerId) {
            return Customer::findOrFail($customerId);
        }

        return Customer::firstOrCreate(
            ['name' => 'Walk-in Customer'],
            [
                'phone' => null,
                'email' => null,
                'address' => null,
            ]
        );
    }

    private function checkStockAvailability($requiredQuantities, $products, $inventories): void
    {
        foreach ($requiredQuantities as $productId => $requiredQuantity) {
            $product = $products->get($productId);

            if (! $product) {
                throw new InvalidArgumentException('Product is unavailable.');
            }

            $inventory = $inventories->get($productId);

            if (! $inventory) {
                throw new InvalidArgumentException('Inventory record not found for product.');
            }

            if ((int) $inventory->quantity < $requiredQuantity) {
                throw new InvalidArgumentException(
                    "Insufficient stock for product: {$product->name}"
                );
            }
        }
    }

    private function getStockStatus(int $quantity, int $lowStockThreshold): string
    {
        if ($quantity === 0) {
            return 'Out of Stock';
        }

        if ($quantity <= $lowStockThreshold) {
            return 'Low Stock';
        }

        return 'In Stock';
    }
}
<?php

namespace App\Modules\Inventory\Services;

use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class InventoryService
{
    public function getInventory(array $filters): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 10);

        // Keep pagination practical and safe.
        if ($perPage < 1 || $perPage > 100) {
            $perPage = 10;
        }

        $stockStatus = $filters['stock_status'] ?? 'all';
        $sortBy = $filters['sort_by'] ?? 'quantity';
        $sortDirection = strtolower($filters['sort_direction'] ?? 'asc');

        // Fallback to safe values if invalid query params are sent.
        if (! in_array($stockStatus, ['all', 'low_stock', 'in_stock', 'out_of_stock'], true)) {
            $stockStatus = 'all';
        }

        if (! in_array($sortBy, ['quantity', 'price', 'total_value', 'purchase_date'], true)) {
            $sortBy = 'quantity';
        }

        if (! in_array($sortDirection, ['asc', 'desc'], true)) {
            $sortDirection = 'asc';
        }

        $query = Product::query()
            ->select('products.*')
            ->join('inventories', 'inventories.product_id', '=', 'products.id')
            ->with('inventory');

        // Search by product SKU or product name.
        $query->when($filters['search'] ?? null, function (Builder $query, string $search): void {
            $query->where(function (Builder $query) use ($search): void {
                $query->where('products.sku', 'like', "%{$search}%")
                    ->orWhere('products.name', 'like', "%{$search}%");
            });
        });

        // Filter by inventory purchase date range.
        $query->when($filters['date_from'] ?? null, function (Builder $query, string $dateFrom): void {
            $query->whereDate('inventories.purchase_date', '>=', $dateFrom);
        });

        $query->when($filters['date_to'] ?? null, function (Builder $query, string $dateTo): void {
            $query->whereDate('inventories.purchase_date', '<=', $dateTo);
        });

        // Stock status filter.
        if ($stockStatus === 'low_stock') {
            $query->where('inventories.quantity', '>', 0)
                ->whereColumn('inventories.quantity', '<=', 'inventories.low_stock_threshold');
        }

        if ($stockStatus === 'in_stock') {
            $query->whereColumn('inventories.quantity', '>', 'inventories.low_stock_threshold');
        }

        if ($stockStatus === 'out_of_stock') {
            $query->where('inventories.quantity', 0);
        }

        // Sorting.
        if ($sortBy === 'price') {
            $query->orderBy('inventories.purchase_price', $sortDirection);
        } elseif ($sortBy === 'total_value') {
            $query->orderByRaw("inventories.quantity * inventories.purchase_price {$sortDirection}");
        } elseif ($sortBy === 'purchase_date') {
            $query->orderBy('inventories.purchase_date', $sortDirection);
        } else {
            $query->orderBy('inventories.quantity', $sortDirection);
        }

        return $query->paginate($perPage);
    }

    public function adjustStock(Product $product, array $data): array
    {
        return DB::transaction(function () use ($product, $data): array {
            $product->load('inventory');

            if (! $product->inventory) {
                throw new InvalidArgumentException('Inventory record not found for this product.');
            }

            $inventory = $product->inventory;
            $previousQuantity = $inventory->quantity;
            $adjustmentType = $data['adjustment_type'];
            $quantity = (int) $data['quantity'];

            // Calculate new quantity based on adjustment type.
            if ($adjustmentType === 'increase') {
                $newQuantity = $previousQuantity + $quantity;
            } elseif ($adjustmentType === 'decrease') {
                $newQuantity = $previousQuantity - $quantity;
            } else {
                $newQuantity = $quantity;
            }

            if ($newQuantity < 0) {
                throw new InvalidArgumentException('Quantity cannot become negative.');
            }

            // Adjust Stock updates only quantity.
            $inventory->update([
                'quantity' => $newQuantity,
            ]);

            return [
                'product_id' => $product->id,
                'sku' => $product->sku,
                'name' => $product->name,
                'previous_quantity' => $previousQuantity,
                'new_quantity' => $newQuantity,
                'adjustment_type' => $adjustmentType,
            ];
        });
    }

    public function formatInventory(Product $product): array
    {
        $inventory = $product->inventory;

        $quantity = $inventory?->quantity ?? 0;
        $purchasePrice = $inventory?->purchase_price ?? 0;
        $lowStockThreshold = $inventory?->low_stock_threshold ?? 0;

        return [
            'product_id' => $product->id,
            'sku' => $product->sku,
            'name' => $product->name,
            'quantity' => $quantity,
            'purchase_price' => number_format((float) $purchasePrice, 2, '.', ''),
            'total_value' => number_format($quantity * (float) $purchasePrice, 2, '.', ''),
            'low_stock_threshold' => $lowStockThreshold,
            'status' => $this->getStockStatus($quantity, $lowStockThreshold),
            'purchase_date' => $inventory?->purchase_date?->format('Y-m-d'),
        ];
    }

    private function getStockStatus(int $quantity, int $lowStockThreshold): string
    {
        // Out of Stock must be checked first.
        if ($quantity === 0) {
            return 'Out of Stock';
        }

        if ($quantity <= $lowStockThreshold) {
            return 'Low Stock';
        }

        return 'In Stock';
    }
}
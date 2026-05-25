<?php

namespace App\Modules\POS\Services;

use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class PosService
{
    public function searchProducts(array $filters): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 10);

        if ($perPage < 1 || $perPage > 100) {
            $perPage = 10;
        }

        return Product::query()
            ->with('inventory')
            ->when($filters['search'] ?? null, function (Builder $query, string $search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query->where('sku', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate($perPage);
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
            'stock_status' => $this->getStockStatus($quantity, $lowStockThreshold),
        ];
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
<?php

namespace App\Modules\Product\Services;

use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class ProductService
{
    public function getProducts(array $filters): LengthAwarePaginator
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
            ->when($filters['size'] ?? null, function (Builder $query, string $size): void {
                $query->where('size', $size);
            })
            ->when($filters['color'] ?? null, function (Builder $query, string $color): void {
                $query->where('color', $color);
            })
            ->latest()
            ->paginate($perPage);
    }

    public function createProduct(array $data): Product
    {
        return DB::transaction(function () use ($data): Product {
            $product = Product::create([
                'sku' => $data['sku'],
                'name' => $data['name'],
                'size' => $data['size'] ?? null,
                'color' => $data['color'] ?? null,
            ]);

            $product->inventory()->create([
                'quantity' => $data['quantity'],
                'purchase_price' => $data['purchase_price'],
                'purchase_date' => $data['purchase_date'] ?? null,
                'low_stock_threshold' => $data['low_stock_threshold'],
            ]);

            return $product->load('inventory');
        });
    }

    public function getProduct(int $id): Product
    {
        return Product::with('inventory')->findOrFail($id);
    }

    public function updateProduct(int $id, array $data): Product
    {
        return DB::transaction(function () use ($id, $data): Product {
            $product = Product::with('inventory')->findOrFail($id);

            $product->update([
                'sku' => $data['sku'],
                'name' => $data['name'],
                'size' => $data['size'] ?? null,
                'color' => $data['color'] ?? null,
            ]);

            $product->inventory()->updateOrCreate(
                ['product_id' => $product->id],
                [
                    'quantity' => $data['quantity'],
                    'purchase_price' => $data['purchase_price'],
                    'purchase_date' => $data['purchase_date'] ?? null,
                    'low_stock_threshold' => $data['low_stock_threshold'],
                ]
            );

            return $product->load('inventory');
        });
    }

    public function deleteProduct(int $id): void
    {
        $product = Product::findOrFail($id);

        $product->delete();
    }

    public function formatProduct(Product $product): array
    {
        return [
            'id' => $product->id,
            'sku' => $product->sku,
            'name' => $product->name,
            'size' => $product->size,
            'color' => $product->color,
            'stock' => $product->inventory?->quantity ?? 0,
            'inventory' => $product->inventory ? [
                'quantity' => $product->inventory->quantity,
                'purchase_price' => $product->inventory->purchase_price,
                'purchase_date' => $product->inventory->purchase_date?->format('Y-m-d'),
                'low_stock_threshold' => $product->inventory->low_stock_threshold,
            ] : null,
        ];
    }
}
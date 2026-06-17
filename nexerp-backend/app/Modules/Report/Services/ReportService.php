<?php

namespace App\Modules\Report\Services;

use App\Models\Inventory;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\Sale;
use Illuminate\Database\Eloquent\Builder;

class ReportService
{
    public function getSummary(): array
    {
        $inventoryQuery = Inventory::query()->whereHas('product');

        $inventoryValue = (clone $inventoryQuery)
            ->selectRaw('COALESCE(SUM(quantity * purchase_price), 0) as total')
            ->value('total');

        return [
            'summary' => [
                'total_products' => Product::query()->count(),
                'total_quantity' => (int) (clone $inventoryQuery)->sum('quantity'),
                'total_inventory_value' => $this->formatMoney($inventoryValue),
                'low_stock_count' => (clone $inventoryQuery)
                    ->whereColumn('quantity', '<=', 'low_stock_threshold')
                    ->count(),
                'total_confirmed_purchases' => Purchase::query()
                    ->where('status', 'confirmed')
                    ->count(),
                'total_confirmed_purchase_amount' => $this->formatMoney(
                    Purchase::query()
                        ->where('status', 'confirmed')
                        ->sum('total_amount')
                ),
                'total_confirmed_sales' => Sale::query()
                    ->where('status', 'confirmed')
                    ->count(),
                'total_confirmed_sales_amount' => $this->formatMoney(
                    Sale::query()
                        ->where('status', 'confirmed')
                        ->sum('total_amount')
                ),
            ],
        ];
    }

    public function getInventoryReport(array $filters = [], ?int $limit = null): array
    {
        $query = Inventory::query()
            ->with('product:id,sku,name')
            ->whereHas('product')
            ->when(
                ! empty($filters['date_from']),
                fn (Builder $query) => $query->whereDate('purchase_date', '>=', $filters['date_from'])
            )
            ->when(
                ! empty($filters['date_to']),
                fn (Builder $query) => $query->whereDate('purchase_date', '<=', $filters['date_to'])
            );

        $summary = $this->inventorySummaryFromQuery(clone $query);

        $inventories = $this->applyLimit(
            $query->orderBy('id'),
            $limit
        )->get();

        $items = $inventories->map(function (Inventory $inventory): array {
            $totalValue = (float) $inventory->quantity * (float) $inventory->purchase_price;

            return [
                'sku' => $inventory->product->sku,
                'product' => $inventory->product->name,
                'quantity' => (int) $inventory->quantity,
                'unit_cost' => $this->formatMoney($inventory->purchase_price),
                'total_value' => $this->formatMoney($totalValue),
                'threshold' => (int) $inventory->low_stock_threshold,
                'status' => $this->stockStatus($inventory),
                'purchase_date' => $inventory->purchase_date?->format('Y-m-d'),
            ];
        });

        return [
            'summary' => $summary,
            'filters' => $this->reportFilters($filters),
            'items' => $items->values()->toArray(),
            'meta' => $this->reportMeta($limit, $summary['total_products']),
        ];
    }

    public function getLowStockReport(array $filters = [], ?int $limit = null): array
    {
        $query = Inventory::query()
            ->with('product:id,sku,name')
            ->whereHas('product')
            ->whereColumn('quantity', '<=', 'low_stock_threshold')
            ->when(
                ! empty($filters['date_from']),
                fn (Builder $query) => $query->whereDate('purchase_date', '>=', $filters['date_from'])
            )
            ->when(
                ! empty($filters['date_to']),
                fn (Builder $query) => $query->whereDate('purchase_date', '<=', $filters['date_to'])
            );

        $summary = $this->lowStockSummaryFromQuery(clone $query);

        $inventories = $this->applyLimit(
            $query->orderBy('quantity')->orderBy('id'),
            $limit
        )->get();

        $items = $inventories->map(function (Inventory $inventory): array {
            $totalValue = (float) $inventory->quantity * (float) $inventory->purchase_price;

            return [
                'sku' => $inventory->product->sku,
                'product' => $inventory->product->name,
                'quantity' => (int) $inventory->quantity,
                'threshold' => (int) $inventory->low_stock_threshold,
                'status' => $this->stockStatus($inventory),
                'unit_cost' => $this->formatMoney($inventory->purchase_price),
                'total_value' => $this->formatMoney($totalValue),
                'purchase_date' => $inventory->purchase_date?->format('Y-m-d'),
            ];
        });

        return [
            'summary' => $summary,
            'filters' => $this->reportFilters($filters),
            'items' => $items->values()->toArray(),
            'meta' => $this->reportMeta($limit, $summary['low_stock_count']),
        ];
    }

    public function getPurchaseReport(array $filters = [], ?int $limit = null): array
    {
        $query = Purchase::query()
            ->with('supplier:id,name')
            ->withCount('items')
            ->where('status', 'confirmed')
            ->when(
                ! empty($filters['date_from']),
                fn (Builder $query) => $query->whereDate('purchase_date', '>=', $filters['date_from'])
            )
            ->when(
                ! empty($filters['date_to']),
                fn (Builder $query) => $query->whereDate('purchase_date', '<=', $filters['date_to'])
            );

        $summary = [
            'total_purchases' => (clone $query)->count(),
            'total_purchase_amount' => $this->formatMoney((clone $query)->sum('total_amount')),
        ];

        $purchases = $this->applyLimit(
            $query->latest('purchase_date')->latest('id'),
            $limit
        )->get();

        $items = $purchases->map(function (Purchase $purchase): array {
            return [
                'id' => $purchase->id,
                'supplier' => $purchase->supplier?->name ?? '-',
                'purchase_date' => $purchase->purchase_date?->format('Y-m-d'),
                'status' => $purchase->status,
                'total_amount' => $this->formatMoney($purchase->total_amount),
                'items_count' => (int) $purchase->items_count,
            ];
        });

        return [
            'summary' => $summary,
            'filters' => $this->reportFilters($filters),
            'items' => $items->values()->toArray(),
            'meta' => $this->reportMeta($limit, $summary['total_purchases']),
        ];
    }

    public function getSalesReport(array $filters = [], ?int $limit = null): array
    {
        $query = Sale::query()
            ->with('customer:id,name')
            ->withCount('items')
            ->where('status', 'confirmed')
            ->when(
                ! empty($filters['date_from']),
                fn (Builder $query) => $query->whereDate('sale_date', '>=', $filters['date_from'])
            )
            ->when(
                ! empty($filters['date_to']),
                fn (Builder $query) => $query->whereDate('sale_date', '<=', $filters['date_to'])
            )
            ->when(
                ! empty($filters['sale_channel']) && $filters['sale_channel'] !== 'all',
                fn (Builder $query) => $query->where('sale_channel', $filters['sale_channel'])
            );

        $summary = [
            'total_sales' => (clone $query)->count(),
            'total_sales_amount' => $this->formatMoney((clone $query)->sum('total_amount')),
        ];

        $sales = $this->applyLimit(
            $query->latest('sale_date')->latest('id'),
            $limit
        )->get();

        $items = $sales->map(function (Sale $sale): array {
            return [
                'id' => $sale->id,
                'customer' => $sale->customer?->name ?? '-',
                'sale_date' => $sale->sale_date?->format('Y-m-d'),
                'sale_channel' => $sale->sale_channel,
                'status' => $sale->status,
                'payment_method' => $sale->payment_method,
                'total_amount' => $this->formatMoney($sale->total_amount),
                'items_count' => (int) $sale->items_count,
            ];
        });

        return [
            'summary' => $summary,
            'filters' => [
                'date_from' => $filters['date_from'] ?? null,
                'date_to' => $filters['date_to'] ?? null,
                'sale_channel' => $filters['sale_channel'] ?? 'all',
            ],
            'items' => $items->values()->toArray(),
            'meta' => $this->reportMeta($limit, $summary['total_sales']),
        ];
    }

    private function applyLimit(Builder $query, ?int $limit): Builder
    {
        if ($limit !== null && $limit > 0) {
            $query->limit($limit);
        }

        return $query;
    }

    private function inventorySummaryFromQuery(Builder $query): array
    {
        $totalProducts = (clone $query)->count();
        $totalQuantity = (int) (clone $query)->sum('quantity');

        $totalInventoryValue = (clone $query)
            ->selectRaw('COALESCE(SUM(quantity * purchase_price), 0) as total')
            ->value('total');

        $lowStockCount = (clone $query)
            ->whereColumn('quantity', '<=', 'low_stock_threshold')
            ->count();

        return [
            'total_products' => $totalProducts,
            'total_quantity' => $totalQuantity,
            'total_inventory_value' => $this->formatMoney($totalInventoryValue),
            'low_stock_count' => $lowStockCount,
        ];
    }

    private function lowStockSummaryFromQuery(Builder $query): array
    {
        $lowStockCount = (clone $query)->count();

        $outOfStockCount = (clone $query)
            ->where('quantity', '<=', 0)
            ->count();

        $lowStockInventoryValue = (clone $query)
            ->selectRaw('COALESCE(SUM(quantity * purchase_price), 0) as total')
            ->value('total');

        return [
            'low_stock_count' => $lowStockCount,
            'out_of_stock_count' => $outOfStockCount,
            'low_stock_inventory_value' => $this->formatMoney($lowStockInventoryValue),
        ];
    }

    private function reportMeta(?int $limit, int $total): array
    {
        return [
            'preview_limit' => $limit,
            'total_items' => $total,
            'is_preview' => $limit !== null,
        ];
    }

    private function reportFilters(array $filters): array
    {
        return [
            'date_from' => $filters['date_from'] ?? null,
            'date_to' => $filters['date_to'] ?? null,
        ];
    }

    private function stockStatus(Inventory $inventory): string
    {
        if ($inventory->quantity <= 0) {
            return 'Out of Stock';
        }

        if ($inventory->quantity <= $inventory->low_stock_threshold) {
            return 'Low Stock';
        }

        return 'In Stock';
    }

    private function formatMoney(mixed $amount): string
    {
        return number_format((float) $amount, 2, '.', '');
    }
}
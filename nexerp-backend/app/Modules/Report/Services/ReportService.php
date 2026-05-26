<?php

namespace App\Modules\Report\Services;

use App\Models\Inventory;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\Sale;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class ReportService
{
    public function getSummary(): array
    {
        $inventoryValue = Inventory::query()
            ->selectRaw('COALESCE(SUM(quantity * purchase_price), 0) as total')
            ->value('total');

        return [
            'summary' => [
                'total_products' => Product::query()->count(),
                'total_quantity' => (int) Inventory::query()->sum('quantity'),
                'total_inventory_value' => $this->formatMoney($inventoryValue),
                'low_stock_count' => Inventory::query()
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

    public function getInventoryReport(array $filters = []): array
    {
        $inventories = Inventory::query()
            ->with('product:id,sku,name')
            ->when(
                ! empty($filters['date_from']),
                fn (Builder $query) => $query->whereDate('purchase_date', '>=', $filters['date_from'])
            )
            ->when(
                ! empty($filters['date_to']),
                fn (Builder $query) => $query->whereDate('purchase_date', '<=', $filters['date_to'])
            )
            ->orderBy('id')
            ->get();

        $items = $inventories->map(function (Inventory $inventory) {
            $totalValue = (float) $inventory->quantity * (float) $inventory->purchase_price;

            return [
                'sku' => $inventory->product?->sku,
                'product' => $inventory->product?->name,
                'quantity' => (int) $inventory->quantity,
                'unit_cost' => $this->formatMoney($inventory->purchase_price),
                'total_value' => $this->formatMoney($totalValue),
                'threshold' => (int) $inventory->low_stock_threshold,
                'status' => $this->stockStatus($inventory),
                'purchase_date' => $inventory->purchase_date?->format('Y-m-d'),
            ];
        });

        return [
            'summary' => $this->inventorySummary($inventories),
            'filters' => $this->reportFilters($filters),
            'items' => $items->values()->toArray(),
        ];
    }

    public function getLowStockReport(array $filters = []): array
    {
        $inventories = Inventory::query()
            ->with('product:id,sku,name')
            ->whereColumn('quantity', '<=', 'low_stock_threshold')
            ->when(
                ! empty($filters['date_from']),
                fn (Builder $query) => $query->whereDate('purchase_date', '>=', $filters['date_from'])
            )
            ->when(
                ! empty($filters['date_to']),
                fn (Builder $query) => $query->whereDate('purchase_date', '<=', $filters['date_to'])
            )
            ->orderBy('quantity')
            ->orderBy('id')
            ->get();

        $items = $inventories->map(function (Inventory $inventory) {
            $totalValue = (float) $inventory->quantity * (float) $inventory->purchase_price;

            return [
                'sku' => $inventory->product?->sku,
                'product' => $inventory->product?->name,
                'quantity' => (int) $inventory->quantity,
                'threshold' => (int) $inventory->low_stock_threshold,
                'status' => $this->stockStatus($inventory),
                'unit_cost' => $this->formatMoney($inventory->purchase_price),
                'total_value' => $this->formatMoney($totalValue),
            ];
        });

        return [
            'summary' => $this->lowStockSummary($inventories),
            'filters' => $this->reportFilters($filters),
            'items' => $items->values()->toArray(),
        ];
    }

    public function getPurchaseReport(array $filters = []): array
    {
        $purchases = Purchase::query()
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
            )
            ->latest('purchase_date')
            ->latest('id')
            ->get();

        $items = $purchases->map(function (Purchase $purchase) {
            return [
                'id' => $purchase->id,
                'supplier' => $purchase->supplier?->name,
                'purchase_date' => $purchase->purchase_date?->format('Y-m-d'),
                'status' => $purchase->status,
                'total_amount' => $this->formatMoney($purchase->total_amount),
                'items_count' => (int) $purchase->items_count,
            ];
        });

        return [
            'summary' => [
                'total_purchases' => $purchases->count(),
                'total_purchase_amount' => $this->formatMoney($purchases->sum('total_amount')),
            ],
            'filters' => $this->reportFilters($filters),
            'items' => $items->values()->toArray(),
        ];
    }

    public function getSalesReport(array $filters = []): array
    {
        $sales = Sale::query()
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
            )
            ->latest('sale_date')
            ->latest('id')
            ->get();

        $items = $sales->map(function (Sale $sale) {
            return [
                'id' => $sale->id,
                'customer' => $sale->customer?->name,
                'sale_date' => $sale->sale_date?->format('Y-m-d'),
                'sale_channel' => $sale->sale_channel,
                'status' => $sale->status,
                'payment_method' => $sale->payment_method,
                'total_amount' => $this->formatMoney($sale->total_amount),
                'items_count' => (int) $sale->items_count,
            ];
        });

        return [
            'summary' => [
                'total_sales' => $sales->count(),
                'total_sales_amount' => $this->formatMoney($sales->sum('total_amount')),
            ],
            'filters' => [
                'date_from' => $filters['date_from'] ?? null,
                'date_to' => $filters['date_to'] ?? null,
                'sale_channel' => $filters['sale_channel'] ?? 'all',
            ],
            'items' => $items->values()->toArray(),
        ];
    }

    private function inventorySummary(Collection $inventories): array
    {
        return [
            'total_products' => $inventories->count(),
            'total_quantity' => (int) $inventories->sum('quantity'),
            'total_inventory_value' => $this->formatMoney(
                $inventories->sum(fn (Inventory $inventory) => (float) $inventory->quantity * (float) $inventory->purchase_price)
            ),
            'low_stock_count' => $inventories
                ->filter(fn (Inventory $inventory) => $inventory->quantity <= $inventory->low_stock_threshold)
                ->count(),
        ];
    }

    private function lowStockSummary(Collection $inventories): array
    {
        return [
            'low_stock_count' => $inventories->count(),
            'out_of_stock_count' => $inventories
                ->filter(fn (Inventory $inventory) => $inventory->quantity <= 0)
                ->count(),
            'low_stock_inventory_value' => $this->formatMoney(
                $inventories->sum(fn (Inventory $inventory) => (float) $inventory->quantity * (float) $inventory->purchase_price)
            ),
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
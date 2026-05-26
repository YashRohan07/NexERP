<?php

namespace App\Modules\Dashboard\Services;

use App\Models\Inventory;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\Sale;

class DashboardService
{
    public function getSummary(): array
    {
        return [
            'summary' => $this->getSummaryCards(),
            'low_stock_products' => $this->getLowStockProducts(),
            'recent_purchases' => $this->getRecentPurchases(),
            'recent_sales' => $this->getRecentSales(),
        ];
    }

    private function getSummaryCards(): array
    {
        $inventoryValue = Inventory::query()
            ->selectRaw('COALESCE(SUM(quantity * purchase_price), 0) as total')
            ->value('total');

        return [
            'total_products' => Product::query()->count(),
            'total_quantity' => (int) Inventory::query()->sum('quantity'),
            'inventory_value' => number_format((float) $inventoryValue, 2, '.', ''),
            'low_stock_count' => Inventory::query()
                ->whereColumn('quantity', '<=', 'low_stock_threshold')
                ->count(),
            'total_purchases' => number_format(
                (float) Purchase::query()
                    ->where('status', 'confirmed')
                    ->sum('total_amount'),
                2,
                '.',
                ''
            ),
            'total_sales' => number_format(
                (float) Sale::query()
                    ->where('status', 'confirmed')
                    ->sum('total_amount'),
                2,
                '.',
                ''
            ),
        ];
    }

    private function getLowStockProducts(): array
    {
        return Inventory::query()
            ->with('product:id,sku,name')
            ->whereColumn('quantity', '<=', 'low_stock_threshold')
            ->orderBy('quantity')
            ->limit(5)
            ->get()
            ->map(function (Inventory $inventory) {
                return [
                    'sku' => $inventory->product?->sku,
                    'name' => $inventory->product?->name,
                    'quantity' => (int) $inventory->quantity,
                    'threshold' => (int) $inventory->low_stock_threshold,
                    'status' => $inventory->quantity <= 0 ? 'Out of Stock' : 'Low Stock',
                ];
            })
            ->values()
            ->toArray();
    }

    private function getRecentPurchases(): array
    {
        return Purchase::query()
            ->with('supplier:id,name')
            ->latest('purchase_date')
            ->latest('id')
            ->limit(5)
            ->get()
            ->map(function (Purchase $purchase) {
                return [
                    'id' => $purchase->id,
                    'supplier' => $purchase->supplier?->name,
                    'purchase_date' => $purchase->purchase_date?->format('Y-m-d'),
                    'status' => $purchase->status,
                    'total_amount' => number_format((float) $purchase->total_amount, 2, '.', ''),
                ];
            })
            ->values()
            ->toArray();
    }

    private function getRecentSales(): array
    {
        return Sale::query()
            ->with('customer:id,name')
            ->latest('sale_date')
            ->latest('id')
            ->limit(5)
            ->get()
            ->map(function (Sale $sale) {
                return [
                    'id' => $sale->id,
                    'customer' => $sale->customer?->name,
                    'sale_date' => $sale->sale_date?->format('Y-m-d'),
                    'sale_channel' => $sale->sale_channel,
                    'status' => $sale->status,
                    'total_amount' => number_format((float) $sale->total_amount, 2, '.', ''),
                ];
            })
            ->values()
            ->toArray();
    }
}
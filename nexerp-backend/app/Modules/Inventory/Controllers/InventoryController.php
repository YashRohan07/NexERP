<?php

namespace App\Modules\Inventory\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Modules\Inventory\Services\InventoryService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function __construct(
        private readonly InventoryService $inventoryService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $inventory = $this->inventoryService->getInventory([
            'search' => $request->query('search'),
            'stock_status' => $request->query('stock_status'),
            'date_from' => $request->query('date_from'),
            'date_to' => $request->query('date_to'),
            'sort_by' => $request->query('sort_by'),
            'sort_direction' => $request->query('sort_direction'),
            'per_page' => $request->query('per_page'),
        ]);

        return ApiResponse::success('Inventory fetched successfully', [
            'inventory' => collect($inventory->items())
                ->map(fn (Product $product): array => $this->inventoryService->formatInventory($product))
                ->values(),
            'pagination' => [
                'current_page' => $inventory->currentPage(),
                'per_page' => $inventory->perPage(),
                'total' => $inventory->total(),
                'last_page' => $inventory->lastPage(),
            ],
        ]);
    }

    public function adjustStock(): JsonResponse
    {
        // Full stock adjustment logic will be added in Step 3.
        return ApiResponse::success('Inventory adjust stock route is ready');
    }
}
<?php

namespace App\Modules\Sales\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Modules\Sales\Requests\StoreSaleRequest;
use App\Modules\Sales\Services\SaleService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SaleController extends Controller
{
    public function __construct(
        private readonly SaleService $saleService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $sales = $this->saleService->getSales($request->query());

        return ApiResponse::success('Sales fetched successfully', [
            'sales' => collect($sales->items())
                ->map(fn (Sale $sale): array => $this->saleService->formatSale($sale))
                ->values(),
            'pagination' => [
                'current_page' => $sales->currentPage(),
                'per_page' => $sales->perPage(),
                'total' => $sales->total(),
                'last_page' => $sales->lastPage(),
            ],
        ]);
    }

    public function store(StoreSaleRequest $request): JsonResponse
    {
        $sale = $this->saleService->createSale($request->validated());

        return ApiResponse::success('Sale draft created successfully', [
            'sale' => $this->saleService->formatSale($sale, true),
        ], 201);
    }

    public function show(Sale $sale): JsonResponse
    {
        $sale->load(['customer', 'items.product']);

        return ApiResponse::success('Sale fetched successfully', [
            'sale' => $this->saleService->formatSale($sale, true),
        ]);
    }
}
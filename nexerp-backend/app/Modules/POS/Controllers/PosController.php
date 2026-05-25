<?php

namespace App\Modules\POS\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Sale;
use App\Modules\POS\Requests\PosCheckoutRequest;
use App\Modules\POS\Services\PosService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class PosController extends Controller
{
    public function __construct(
        private readonly PosService $posService
    ) {
    }

    public function products(Request $request): JsonResponse
    {
        $products = $this->posService->searchProducts($request->query());

        return ApiResponse::success('POS products fetched successfully', [
            'products' => collect($products->items())
                ->map(fn (Product $product): array => $this->posService->formatProduct($product))
                ->values(),
            'pagination' => [
                'current_page' => $products->currentPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
                'last_page' => $products->lastPage(),
            ],
        ]);
    }

    public function checkout(PosCheckoutRequest $request): JsonResponse
    {
        try {
            $receipt = $this->posService->checkout($request->validated());

            return ApiResponse::success('POS checkout completed successfully', [
                'receipt' => $receipt,
            ], 201);
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), null, 422);
        }
    }

    public function receipt(Sale $sale): JsonResponse
    {
        try {
            $receipt = $this->posService->getReceipt($sale);

            return ApiResponse::success('POS receipt fetched successfully', [
                'receipt' => $receipt,
            ]);
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), null, 404);
        }
    }
}
<?php

namespace App\Modules\Purchase\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Purchase;
use App\Modules\Purchase\Requests\StorePurchaseRequest;
use App\Modules\Purchase\Services\PurchaseService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class PurchaseController extends Controller
{
    public function __construct(
        private readonly PurchaseService $purchaseService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $purchases = $this->purchaseService->getPurchases($request->query());

        return ApiResponse::success('Purchases fetched successfully', [
            'purchases' => collect($purchases->items())
                ->map(fn (Purchase $purchase): array => $this->purchaseService->formatPurchase($purchase))
                ->values(),
            'pagination' => [
                'current_page' => $purchases->currentPage(),
                'per_page' => $purchases->perPage(),
                'total' => $purchases->total(),
                'last_page' => $purchases->lastPage(),
            ],
        ]);
    }

    public function store(StorePurchaseRequest $request): JsonResponse
    {
        $purchase = $this->purchaseService->createPurchase($request->validated());

        return ApiResponse::success('Purchase draft created successfully', [
            'purchase' => $this->purchaseService->formatPurchaseDetails($purchase),
        ], 201);
    }

    public function show(Purchase $purchase): JsonResponse
    {
        $purchase = $this->purchaseService->getPurchase($purchase->id);

        return ApiResponse::success('Purchase fetched successfully', [
            'purchase' => $this->purchaseService->formatPurchaseDetails($purchase),
        ]);
    }

    public function confirm(Purchase $purchase): JsonResponse
    {
        try {
            $purchase = $this->purchaseService->confirmPurchase($purchase);

            return ApiResponse::success('Purchase confirmed successfully', [
                'purchase' => $this->purchaseService->formatPurchaseDetails($purchase),
            ]);
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), null, 422);
        }
    }

    public function cancel(Purchase $purchase): JsonResponse
    {
        try {
            $purchase = $this->purchaseService->cancelPurchase($purchase);

            return ApiResponse::success('Purchase cancelled successfully', [
                'purchase' => $this->purchaseService->formatPurchaseDetails($purchase),
            ]);
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), null, 422);
        }
    }
}
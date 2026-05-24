<?php

namespace App\Modules\Product\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Product\Requests\StoreProductRequest;
use App\Modules\Product\Requests\UpdateProductRequest;
use App\Modules\Product\Services\ProductService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function __construct(
        private readonly ProductService $productService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        // Product list filters should only come from query params, not request body.
        $products = $this->productService->getProducts([
            'search' => $request->query('search'),
            'size' => $request->query('size'),
            'color' => $request->query('color'),
            'per_page' => $request->query('per_page'),
        ]);

        return ApiResponse::success('Products fetched successfully', [
            'products' => collect($products->items())
                ->map(fn ($product) => $this->productService->formatProduct($product))
                ->values(),
            'pagination' => [
                'current_page' => $products->currentPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
                'last_page' => $products->lastPage(),
            ],
        ]);
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $product = $this->productService->createProduct($request->validated());

        return ApiResponse::success('Product created successfully', [
            'product' => $this->productService->formatProduct($product),
        ], 201);
    }

    public function show(int $product): JsonResponse
    {
        $product = $this->productService->getProduct($product);

        return ApiResponse::success('Product fetched successfully', [
            'product' => $this->productService->formatProduct($product),
        ]);
    }

    public function update(UpdateProductRequest $request, int $product): JsonResponse
    {
        $product = $this->productService->updateProduct($product, $request->validated());

        return ApiResponse::success('Product updated successfully', [
            'product' => $this->productService->formatProduct($product),
        ]);
    }

    public function destroy(int $product): JsonResponse
    {
        $this->productService->deleteProduct($product);

        return ApiResponse::success('Product deleted successfully');
    }
}
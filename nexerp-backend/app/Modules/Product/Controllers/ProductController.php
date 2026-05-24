<?php

namespace App\Modules\Product\Controllers;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class ProductController extends Controller
{
    public function index(): JsonResponse
    {
        return ApiResponse::success('Product list endpoint is ready');
    }

    public function store(): JsonResponse
    {
        return ApiResponse::success('Product create endpoint is ready');
    }

    public function show(int $product): JsonResponse
    {
        return ApiResponse::success('Product details endpoint is ready');
    }

    public function update(int $product): JsonResponse
    {
        return ApiResponse::success('Product update endpoint is ready');
    }

    public function destroy(int $product): JsonResponse
    {
        return ApiResponse::success('Product delete endpoint is ready');
    }
}
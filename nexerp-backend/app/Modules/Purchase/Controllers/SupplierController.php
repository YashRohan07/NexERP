<?php

namespace App\Modules\Purchase\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Modules\Purchase\Requests\StoreSupplierRequest;
use App\Modules\Purchase\Requests\UpdateSupplierRequest;
use App\Modules\Purchase\Services\SupplierService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function __construct(
        private readonly SupplierService $supplierService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $suppliers = $this->supplierService->getSuppliers($request->query());

        return ApiResponse::success('Suppliers fetched successfully', [
            'suppliers' => $suppliers->getCollection()
                ->map(fn (Supplier $supplier): array => $this->supplierService->formatSupplier($supplier))
                ->values(),
            'pagination' => [
                'current_page' => $suppliers->currentPage(),
                'per_page' => $suppliers->perPage(),
                'total' => $suppliers->total(),
                'last_page' => $suppliers->lastPage(),
            ],
        ]);
    }

    public function store(StoreSupplierRequest $request): JsonResponse
    {
        $supplier = $this->supplierService->createSupplier($request->validated());

        return ApiResponse::success('Supplier created successfully', [
            'supplier' => $this->supplierService->formatSupplier($supplier),
        ], 201);
    }

    public function show(Supplier $supplier): JsonResponse
    {
        return ApiResponse::success('Supplier fetched successfully', [
            'supplier' => $this->supplierService->formatSupplier($supplier),
        ]);
    }

    public function update(UpdateSupplierRequest $request, Supplier $supplier): JsonResponse
    {
        $supplier = $this->supplierService->updateSupplier($supplier, $request->validated());

        return ApiResponse::success('Supplier updated successfully', [
            'supplier' => $this->supplierService->formatSupplier($supplier),
        ]);
    }

    public function destroy(Supplier $supplier): JsonResponse
    {
        $this->supplierService->deleteSupplier($supplier);

        return ApiResponse::success('Supplier deleted successfully');
    }
}
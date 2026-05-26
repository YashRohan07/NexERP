<?php

namespace App\Modules\Report\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Report\Services\ReportService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(
        private readonly ReportService $reportService
    ) {
    }

    public function summary()
    {
        return ApiResponse::success(
            'Reports summary fetched successfully',
            $this->reportService->getSummary()
        );
    }

    public function inventory(Request $request)
    {
        $filters = $this->validateDateFilters($request);

        return ApiResponse::success(
            'Inventory report fetched successfully',
            $this->reportService->getInventoryReport($filters)
        );
    }

    public function lowStock(Request $request)
    {
        $filters = $this->validateDateFilters($request);

        return ApiResponse::success(
            'Low stock report fetched successfully',
            $this->reportService->getLowStockReport($filters)
        );
    }

    public function purchases(Request $request)
    {
        $filters = $this->validateDateFilters($request);

        return ApiResponse::success(
            'Purchase report fetched successfully',
            $this->reportService->getPurchaseReport($filters)
        );
    }

    public function sales(Request $request)
    {
        $filters = $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'sale_channel' => ['nullable', 'in:all,sales,pos'],
        ]);

        return ApiResponse::success(
            'Sales report fetched successfully',
            $this->reportService->getSalesReport($filters)
        );
    }

    private function validateDateFilters(Request $request): array
    {
        return $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);
    }
}
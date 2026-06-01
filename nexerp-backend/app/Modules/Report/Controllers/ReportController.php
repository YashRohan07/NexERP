<?php

namespace App\Modules\Report\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Report\Exports\PdfExportService;
use App\Modules\Report\Requests\PurchaseReportFilterRequest;
use App\Modules\Report\Requests\ReportDateFilterRequest;
use App\Modules\Report\Requests\SalesReportFilterRequest;
use App\Modules\Report\Services\ReportService;
use App\Support\ApiResponse;

class ReportController extends Controller
{
    public function __construct(
        private readonly ReportService $reportService,
        private readonly PdfExportService $pdfExportService
    ) {
    }

    public function summary()
    {
        return ApiResponse::success(
            'Reports summary fetched successfully',
            $this->reportService->getSummary()
        );
    }

    public function inventory(ReportDateFilterRequest $request)
    {
        return ApiResponse::success(
            'Inventory report fetched successfully',
            $this->reportService->getInventoryReport($request->validated())
        );
    }

    public function lowStock(ReportDateFilterRequest $request)
    {
        return ApiResponse::success(
            'Low stock report fetched successfully',
            $this->reportService->getLowStockReport($request->validated())
        );
    }

    public function purchases(PurchaseReportFilterRequest $request)
    {
        return ApiResponse::success(
            'Purchase report fetched successfully',
            $this->reportService->getPurchaseReport($request->validated())
        );
    }

    public function sales(SalesReportFilterRequest $request)
    {
        return ApiResponse::success(
            'Sales report fetched successfully',
            $this->reportService->getSalesReport($request->validated())
        );
    }

    public function inventoryPdf(ReportDateFilterRequest $request)
    {
        $report = $this->reportService->getInventoryReport($request->validated());

        return $this->pdfExportService->download(
            'pdf.inventory-report',
            [
                'title' => 'Inventory Report',
                'generatedAt' => now()->format('Y-m-d H:i:s'),
                'summary' => $report['summary'],
                'filters' => $report['filters'],
                'items' => $report['items'],
            ],
            'inventory-report.pdf'
        );
    }

    public function lowStockPdf(ReportDateFilterRequest $request)
    {
        $report = $this->reportService->getLowStockReport($request->validated());

        return $this->pdfExportService->download(
            'pdf.low-stock-report',
            [
                'title' => 'Low Stock Report',
                'generatedAt' => now()->format('Y-m-d H:i:s'),
                'summary' => $report['summary'],
                'filters' => $report['filters'],
                'items' => $report['items'],
            ],
            'low-stock-report.pdf'
        );
    }

    public function purchasesPdf(PurchaseReportFilterRequest $request)
    {
        $report = $this->reportService->getPurchaseReport($request->validated());

        return $this->pdfExportService->download(
            'pdf.purchase-report',
            [
                'title' => 'Purchase Report',
                'generatedAt' => now()->format('Y-m-d H:i:s'),
                'summary' => $report['summary'],
                'filters' => $report['filters'],
                'items' => $report['items'],
            ],
            'purchase-report.pdf'
        );
    }

    public function salesPdf(SalesReportFilterRequest $request)
    {
        $report = $this->reportService->getSalesReport($request->validated());

        return $this->pdfExportService->download(
            'pdf.sales-report',
            [
                'title' => 'Sales Report',
                'generatedAt' => now()->format('Y-m-d H:i:s'),
                'summary' => $report['summary'],
                'filters' => $report['filters'],
                'items' => $report['items'],
            ],
            'sales-report.pdf'
        );
    }
}
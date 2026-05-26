<?php

use App\Modules\Report\Controllers\ReportController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('reports')->group(function () {
    Route::get('/summary', [ReportController::class, 'summary']);

    Route::get('/inventory', [ReportController::class, 'inventory']);
    Route::get('/inventory/pdf', [ReportController::class, 'inventoryPdf']);

    Route::get('/low-stock', [ReportController::class, 'lowStock']);
    Route::get('/low-stock/pdf', [ReportController::class, 'lowStockPdf']);

    Route::get('/purchases', [ReportController::class, 'purchases']);
    Route::get('/sales', [ReportController::class, 'sales']);
});
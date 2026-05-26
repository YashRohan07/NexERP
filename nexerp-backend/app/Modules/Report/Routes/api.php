<?php

use App\Modules\Report\Controllers\ReportController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('reports')->group(function () {
    Route::get('/summary', [ReportController::class, 'summary']);
    Route::get('/inventory', [ReportController::class, 'inventory']);
    Route::get('/low-stock', [ReportController::class, 'lowStock']);
});
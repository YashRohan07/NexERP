<?php

use App\Modules\POS\Controllers\PosController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/pos/products', [PosController::class, 'products']);
    Route::get('/pos/receipt/{sale}', [PosController::class, 'receipt']);

    Route::middleware('role:admin')->group(function (): void {
        Route::post('/pos/checkout', [PosController::class, 'checkout']);
    });
});
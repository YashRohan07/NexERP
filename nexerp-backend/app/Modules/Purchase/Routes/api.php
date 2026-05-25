<?php

use App\Modules\Purchase\Controllers\PurchaseController;
use App\Modules\Purchase\Controllers\SupplierController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/suppliers', [SupplierController::class, 'index']);
    Route::get('/suppliers/{supplier}', [SupplierController::class, 'show']);

    Route::get('/purchases', [PurchaseController::class, 'index']);
    Route::get('/purchases/{purchase}', [PurchaseController::class, 'show']);

    Route::middleware('role:admin')->group(function (): void {
        Route::post('/suppliers', [SupplierController::class, 'store']);
        Route::put('/suppliers/{supplier}', [SupplierController::class, 'update']);
        Route::delete('/suppliers/{supplier}', [SupplierController::class, 'destroy']);

        Route::post('/purchases', [PurchaseController::class, 'store']);
        Route::patch('/purchases/{purchase}/confirm', [PurchaseController::class, 'confirm']);
        Route::patch('/purchases/{purchase}/cancel', [PurchaseController::class, 'cancel']);
    });
});
<?php

use App\Modules\POS\Controllers\PosController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/pos/products', [PosController::class, 'products']);
});
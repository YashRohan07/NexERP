<?php

use App\Modules\Inventory\Controllers\InventoryController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/inventory', [InventoryController::class, 'index']);

    Route::patch('/inventory/{product}/adjust-stock', [InventoryController::class, 'adjustStock'])
        ->middleware('role:admin');
});
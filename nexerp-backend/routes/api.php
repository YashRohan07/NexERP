<?php

use App\Support\ApiResponse;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return ApiResponse::success('NexERP API is running', [
        'app' => config('app.name'),
        'environment' => app()->environment(),
    ]);
});

require __DIR__.'/../app/Modules/Auth/Routes/api.php';
require __DIR__.'/../app/Modules/Product/Routes/api.php';
require __DIR__.'/../app/Modules/Inventory/Routes/api.php';
require __DIR__.'/../app/Modules/Purchase/Routes/api.php';
require __DIR__.'/../app/Modules/Sales/Routes/api.php';
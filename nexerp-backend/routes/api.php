<?php

use App\Support\ApiResponse;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return ApiResponse::success('NexERP API is running', [
        'app' => config('app.name'),
        'environment' => app()->environment(),
    ]);
});
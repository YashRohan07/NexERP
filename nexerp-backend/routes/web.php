<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'success' => true,
        'message' => 'NexERP Backend API is running',
        'data' => [
            'app' => config('app.name'),
            'environment' => app()->environment(),
            'api_health_url' => url('/api/health'),
        ],
    ]);
});
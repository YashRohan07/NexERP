<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;

class AppCache
{
    public static function clearDashboard(): void
    {
        Cache::forget('dashboard.summary');
    }
}
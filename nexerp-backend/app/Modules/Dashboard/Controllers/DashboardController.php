<?php

namespace App\Modules\Dashboard\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Dashboard\Services\DashboardService;
use App\Support\ApiResponse;

class DashboardController extends Controller
{
    public function __construct(
        private readonly DashboardService $dashboardService
    ) {
    }

    public function summary()
    {
        return ApiResponse::success(
            'Dashboard summary fetched successfully',
            $this->dashboardService->getSummary()
        );
    }
}
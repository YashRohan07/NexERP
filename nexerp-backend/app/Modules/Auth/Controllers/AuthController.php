<?php

namespace App\Modules\Auth\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Auth\Requests\LoginRequest;
use App\Modules\Auth\Services\AuthService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(
        private readonly AuthService $authService
    ) {
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $data = $this->authService->login($request->validated());

        if (! $data) {
            return ApiResponse::error('Invalid credentials', null, 401);
        }

        return ApiResponse::success('Login successful', $data);
    }

    public function me(Request $request): JsonResponse
    {
        return ApiResponse::success('Authenticated user fetched successfully', [
            'user' => $this->authService->formatUser($request->user()),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return ApiResponse::success('Logout successful');
    }
}
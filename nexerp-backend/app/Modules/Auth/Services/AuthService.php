<?php

namespace App\Modules\Auth\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;

class AuthService
{
    public function login(array $credentials): ?array
    {
        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            return null;
        }

        /*
         * Create a Sanctum personal access token for API authentication.
         * The token name is only an internal label.
         */
        $token = $user->createToken('nexerp-auth-token')->plainTextToken;

        return [
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $this->formatUser($user),
        ];
    }

    public function logout(User $user): void
    {
        /*
         * currentAccessToken() returns the token used for the current request.
         * The instanceof check helps static analyzers like Intelephense understand
         * that delete() exists on Sanctum's PersonalAccessToken model.
         */
        $currentToken = $user->currentAccessToken();

        if ($currentToken instanceof PersonalAccessToken) {
            $currentToken->delete();
        }
    }

    public function formatUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
        ];
    }
}
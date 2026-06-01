<?php

namespace App\Modules\Product\Requests;

use App\Support\ApiResponse;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $productId = $this->route('product');

        return [
            'sku' => [
                'required',
                'string',
                'max:100',
                Rule::unique('products', 'sku')->ignore($productId),
            ],
            'name' => ['required', 'string', 'max:255'],
            'size' => ['nullable', 'string', 'max:100'],
            'color' => ['nullable', 'string', 'max:100'],

            /*
             * Product update should not overwrite stock quantity, purchase price,
             * or purchase date after Purchase/Sales/POS modules are added.
             *
             * Stock should be changed only through:
             * - Inventory Adjust
             * - Purchase Confirm
             * - Sales Confirm
             * - POS Checkout
             */
            'low_stock_threshold' => ['required', 'integer', 'min:0'],
        ];
    }

    // Keep validation error response consistent with the rest of the API.
    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            ApiResponse::error('Validation failed', $validator->errors(), 422)
        );
    }
}
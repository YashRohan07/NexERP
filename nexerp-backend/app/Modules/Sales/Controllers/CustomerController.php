<?php

namespace App\Modules\Sales\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Modules\Sales\Requests\StoreCustomerRequest;
use App\Modules\Sales\Requests\UpdateCustomerRequest;
use App\Modules\Sales\Services\CustomerService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class CustomerController extends Controller
{
    public function __construct(
        private readonly CustomerService $customerService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $customers = $this->customerService->getCustomers($request->query());

        return ApiResponse::success('Customers fetched successfully', [
            'customers' => collect($customers->items())
                ->map(fn (Customer $customer): array => $this->customerService->formatCustomer($customer))
                ->values(),
            'pagination' => [
                'current_page' => $customers->currentPage(),
                'per_page' => $customers->perPage(),
                'total' => $customers->total(),
                'last_page' => $customers->lastPage(),
            ],
        ]);
    }

    public function store(StoreCustomerRequest $request): JsonResponse
    {
        $customer = $this->customerService->createCustomer($request->validated());

        return ApiResponse::success('Customer created successfully', [
            'customer' => $this->customerService->formatCustomer($customer),
        ], 201);
    }

    public function show(Customer $customer): JsonResponse
    {
        return ApiResponse::success('Customer fetched successfully', [
            'customer' => $this->customerService->formatCustomer($customer),
        ]);
    }

    public function update(UpdateCustomerRequest $request, Customer $customer): JsonResponse
    {
        $customer = $this->customerService->updateCustomer($customer, $request->validated());

        return ApiResponse::success('Customer updated successfully', [
            'customer' => $this->customerService->formatCustomer($customer),
        ]);
    }

    public function destroy(Customer $customer): JsonResponse
    {
        try {
            $this->customerService->deleteCustomer($customer);

            return ApiResponse::success('Customer deleted successfully');
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), null, 422);
        }
    }
}
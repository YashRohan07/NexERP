<?php

namespace App\Modules\Purchase\Services;

use App\Models\Supplier;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use InvalidArgumentException;

class SupplierService
{
    public function getSuppliers(array $filters): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 10);

        if ($perPage < 1 || $perPage > 100) {
            $perPage = 10;
        }

        return Supplier::query()
            ->when($filters['search'] ?? null, function (Builder $query, string $search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate($perPage);
    }

    public function createSupplier(array $data): Supplier
    {
        return Supplier::create([
            'name' => $data['name'],
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
            'address' => $data['address'] ?? null,
        ]);
    }

    public function getSupplier(int $id): Supplier
    {
        return Supplier::findOrFail($id);
    }

    public function updateSupplier(Supplier $supplier, array $data): Supplier
    {
        $supplier->update([
            'name' => $data['name'],
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
            'address' => $data['address'] ?? null,
        ]);

        return $supplier->refresh();
    }

    public function deleteSupplier(Supplier $supplier): void
    {
        /*
         * Supplier should not be deleted if purchase history exists.
         * This prevents database constraint errors and protects business history.
         */
        if ($supplier->purchases()->exists()) {
            throw new InvalidArgumentException('Supplier cannot be deleted because purchase records exist.');
        }

        $supplier->delete();
    }

    public function formatSupplier(Supplier $supplier): array
    {
        return [
            'id' => $supplier->id,
            'name' => $supplier->name,
            'phone' => $supplier->phone,
            'email' => $supplier->email,
            'address' => $supplier->address,
            'created_at' => $supplier->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $supplier->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}
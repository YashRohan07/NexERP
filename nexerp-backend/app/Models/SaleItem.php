<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleItem extends Model
{
    protected $fillable = [
        'sale_id',
        'product_id',
        'quantity',
        'selling_price',
        'line_total',
    ];

    protected $casts = [
        'selling_price' => 'decimal:2',
        'line_total' => 'decimal:2',
    ];

    /**
     * A sale item belongs to one sale.
     */
    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    /**
     * A sale item belongs to one product.
     */
    public function product(): BelongsTo
    {
        /*
         * Product uses soft deletes.
         * withTrashed keeps historical sale item details visible
         * even if the product is later soft deleted.
         */
        return $this->belongsTo(Product::class)->withTrashed();
    }
}
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Inventory extends Model
{
    protected $fillable = [
        'product_id',
        'quantity',
        'purchase_price',
        'purchase_date',
        'low_stock_threshold',
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'purchase_price' => 'decimal:2',
    ];

    // Inventory belongs to one product.
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
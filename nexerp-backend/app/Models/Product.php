<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'sku',
        'name',
        'size',
        'color',
    ];

    // Product has one inventory record.
    public function inventory(): HasOne
    {
        return $this->hasOne(Inventory::class);
    }
}
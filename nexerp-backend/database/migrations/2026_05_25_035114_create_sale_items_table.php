<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create sale_items table.
     */
    public function up(): void
    {
        Schema::create('sale_items', function (Blueprint $table): void {
            $table->id();

            /*
             * If a sale is deleted, its items can be deleted too.
             * This keeps sale header and sale item records consistent.
             */
            $table->foreignId('sale_id')->constrained()->cascadeOnDelete();

            /*
             * Do not cascade delete sale items when a product is deleted.
             * Product uses soft delete, and historical sales records should stay safe.
             */
            $table->foreignId('product_id')->constrained()->restrictOnDelete();

            $table->integer('quantity');
            $table->decimal('selling_price', 10, 2);
            $table->decimal('line_total', 12, 2);
            $table->timestamps();

            $table->index('sale_id');
            $table->index('product_id');
        });
    }

    // Drop sale_items table.
    public function down(): void
    {
        Schema::dropIfExists('sale_items');
    }
};
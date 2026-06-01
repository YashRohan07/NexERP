<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_items', function (Blueprint $table): void {
            $table->id();

            /*
             * If a purchase is deleted, its items can be deleted too.
             * This keeps purchase header and purchase item records consistent.
             */
            $table->foreignId('purchase_id')->constrained()->cascadeOnDelete();

            /*
             * Do not cascade delete purchase items when a product is deleted.
             * Product uses soft delete, and historical purchase records should stay safe.
             */
            $table->foreignId('product_id')->constrained()->restrictOnDelete();

            $table->integer('quantity');
            $table->decimal('purchase_price', 10, 2);
            $table->decimal('line_total', 12, 2);
            $table->timestamps();

            $table->index('purchase_id');
            $table->index('product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_items');
    }
};
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table): void {
            $table->id();

            // Unique product SKU. Unique automatically creates an index.
            $table->string('sku')->unique();

            // Basic product information.
            $table->string('name');
            $table->string('size')->nullable();
            $table->string('color')->nullable();

            $table->timestamps();

            // Soft delete support.
            $table->softDeletes();

            /*
             * Indexes for product search/filter performance.
             * name is used in search.
             * size/color are used as product list filters.
             */
            $table->index('name');
            $table->index('size');
            $table->index('color');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
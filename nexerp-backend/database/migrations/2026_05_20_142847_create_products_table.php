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

            // Unique product SKU
            $table->string('sku')->unique();

            // Basic product information
            $table->string('name');
            $table->string('size')->nullable();
            $table->string('color')->nullable();

            $table->timestamps();

            // Soft delete support
            $table->softDeletes();

            // Indexes
            $table->index('name');
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
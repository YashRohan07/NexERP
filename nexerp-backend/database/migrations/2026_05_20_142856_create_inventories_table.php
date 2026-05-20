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
        Schema::create('inventories', function (Blueprint $table): void {
            $table->id();

            // One product should have only one inventory record in the MVP.
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->unique('product_id');

            // Current stock information
            $table->integer('quantity')->default(0);
            $table->decimal('purchase_price', 10, 2)->default(0);
            $table->date('purchase_date')->nullable();
            $table->integer('low_stock_threshold')->default(0);

            $table->timestamps();

            // Indexes for filtering and reporting
            $table->index('purchase_date');
            $table->index('quantity');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventories');
    }
};
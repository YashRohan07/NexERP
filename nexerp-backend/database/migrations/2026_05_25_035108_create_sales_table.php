<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Create sales table.
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table): void {
            $table->id();

            /*
             * Do not cascade delete sales when a customer is deleted.
             * Sales history should remain protected in an ERP system.
             */
            $table->foreignId('customer_id')->constrained()->restrictOnDelete();

            $table->date('sale_date');
            $table->string('status')->default('draft');
            $table->decimal('total_amount', 12, 2)->default(0);
            $table->text('note')->nullable();
            $table->timestamps();

            $table->index('customer_id');
            $table->index('status');
            $table->index('sale_date');
        });
    }

    // Drop sales table
    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
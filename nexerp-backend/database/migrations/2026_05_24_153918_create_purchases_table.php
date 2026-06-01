<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchases', function (Blueprint $table): void {
            $table->id();

            /*
             * Do not cascade delete purchases when a supplier is deleted.
             * Purchase history should remain protected in an ERP system.
             */
            $table->foreignId('supplier_id')->constrained()->restrictOnDelete();

            $table->date('purchase_date');
            $table->string('status')->default('draft');
            $table->decimal('total_amount', 12, 2)->default(0);
            $table->text('note')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('purchase_date');
            $table->index('supplier_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchases');
    }
};
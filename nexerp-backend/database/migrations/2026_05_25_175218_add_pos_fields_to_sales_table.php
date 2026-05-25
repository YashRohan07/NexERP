<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add POS-specific fields to the existing sales table.
     */
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table): void {
            $table->string('sale_channel')->default('sales')->after('status');
            $table->string('payment_method')->nullable()->after('sale_channel');
        });
    }

    /**
     * Remove POS-specific fields from the sales table.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table): void {
            $table->dropColumn(['sale_channel', 'payment_method']);
        });
    }
};
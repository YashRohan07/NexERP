<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /*
     * Add targeted composite indexes for report-heavy queries.
     *
     * Purchase reports filter confirmed purchases by purchase_date.
     * Sales reports filter confirmed sales by sale_date.
     * Sales reports can also filter by sale_channel and sale_date.
     */
    public function up(): void
    {
        Schema::table('purchases', function (Blueprint $table): void {
            $table->index(
                ['status', 'purchase_date'],
                'purchases_status_purchase_date_index'
            );
        });

        Schema::table('sales', function (Blueprint $table): void {
            $table->index(
                ['status', 'sale_date'],
                'sales_status_sale_date_index'
            );

            $table->index(
                ['sale_channel', 'sale_date'],
                'sales_sale_channel_sale_date_index'
            );
        });
    }

    /*
     * Drop indexes safely if migration is rolled back.
     */
    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table): void {
            $table->dropIndex('purchases_status_purchase_date_index');
        });

        Schema::table('sales', function (Blueprint $table): void {
            $table->dropIndex('sales_status_sale_date_index');
            $table->dropIndex('sales_sale_channel_sale_date_index');
        });
    }
};
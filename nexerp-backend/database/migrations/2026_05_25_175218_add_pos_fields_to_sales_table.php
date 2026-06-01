<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Add POS-specific fields to the existing sales table.
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table): void {
            /*
             * sales = normal Sales module sale
             * pos   = POS checkout sale
             */
            $table->string('sale_channel')->default('sales')->after('status');

            /*
             * Payment method is nullable because normal Sales module does not require it.
             * POS checkout will require payment_method through request validation.
             */
            $table->string('payment_method')->nullable()->after('sale_channel');

            /*
             * Indexes improve report filtering by sale_channel/payment_method.
             */
            $table->index('sale_channel');
            $table->index('payment_method');
        });
    }

    // Remove POS-specific fields from the sales table.
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table): void {
            /*
             * Drop indexes before dropping columns.
             * Laravel default index names:
             * sales_sale_channel_index
             * sales_payment_method_index
             */
            $table->dropIndex(['sale_channel']);
            $table->dropIndex(['payment_method']);

            $table->dropColumn(['sale_channel', 'payment_method']);
        });
    }
};
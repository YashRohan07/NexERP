<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create customers table.
     */
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('phone', 50)->nullable();
            $table->string('email')->nullable();
            $table->string('address', 500)->nullable();
            $table->timestamps();

            $table->index('name');
            $table->index('phone');
            $table->index('email');
        });
    }

    /**
     * Drop customers table.
     */
    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
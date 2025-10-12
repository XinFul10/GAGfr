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
        Schema::table('notifications', function (Blueprint $table) {
            $table->decimal('product_price', 10, 2)->nullable()->after('product_name');
            $table->string('product_image')->nullable()->after('product_price');
            $table->string('buyer_name')->nullable()->after('product_image');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropColumn(['product_price', 'product_image', 'buyer_name']);
        });
    }
};

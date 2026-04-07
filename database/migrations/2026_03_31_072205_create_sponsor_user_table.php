<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sponsor_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sponsor_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status')->default('pending'); // pending | verified | rejected
            $table->string('request_type');               // claim_existing | new_sponsor_request
            $table->text('editor_note')->nullable();
            $table->text('admin_note')->nullable();
            $table->string('proposed_sponsor_name')->nullable();
            $table->string('proposed_sponsor_website')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->foreignId('verified_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('status');
            $table->index(['user_id', 'status']);
        });

        Schema::table('sponsors', function (Blueprint $table) {
            $table->string('website')->nullable()->after('slug');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sponsor_user');

        Schema::table('sponsors', function (Blueprint $table) {
            $table->dropColumn('website');
        });
    }
};

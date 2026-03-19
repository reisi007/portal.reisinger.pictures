<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->string('name');
            $table->string('password')->nullable();
            $table->string('metadata_copyright')->nullable();
            $table->boolean('can_edit_metadata')->default(false);
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50)->unique();
        });

        DB::table('roles')->insert([
            ['name' => 'admin'], ['name' => 'photographer'], ['name' => 'client']
        ]);

        Schema::create('user_roles', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('role_id')->constrained()->onDelete('cascade');
            $table->primary(['user_id', 'role_id']);
        });

        Schema::create('gallery_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->nullable()->constrained('gallery_groups')->onDelete('set null');
            $table->string('name');
            $table->string('slug')->unique();
            $table->boolean('is_public')->default(false);
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('galleries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gallery_group_id')->nullable()->constrained()->onDelete('set null');
            $table->string('name');
            $table->string('slug')->unique();
            $table->enum('type', ['selection', 'delivery'])->default('delivery');
            $table->boolean('is_live')->default(false);
            $table->boolean('is_public')->default(false);
            $table->string('password_hash')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('current_ftp_gallery_id')->nullable()->constrained('galleries')->onDelete('set null');
        });

        Schema::create('photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gallery_id')->constrained()->onDelete('cascade');
            $table->string('filename');
            $table->string('lr_uuid', 64);
            $table->integer('width')->default(0);
            $table->integer('height')->default(0);
            $table->string('title')->nullable();
            $table->text('description')->nullable();
            $table->string('artist')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->unique(['gallery_id', 'lr_uuid']);
        });

        Schema::create('ratings', function (Blueprint $table) {
            $table->foreignId('photo_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->tinyInteger('rating');
            $table->text('comment')->nullable();
            $table->primary(['photo_id', 'user_id']);
        });

        Schema::create('user_gallery_groups', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('gallery_group_id')->constrained()->onDelete('cascade');
            $table->primary(['user_id', 'gallery_group_id']);
        });

        Schema::create('user_galleries', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('gallery_id')->constrained()->onDelete('cascade');
            $table->primary(['user_id', 'gallery_id']);
        });

        Schema::create('download_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('user_name_snapshot')->nullable();
            $table->foreignId('gallery_id')->nullable()->constrained()->onDelete('set null');
            $table->string('gallery_name_snapshot')->nullable();
            $table->enum('item_type', ['single_image', 'full_zip']);
            $table->string('item_identifier');
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('gallery_invites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gallery_id')->constrained()->onDelete('cascade');
            $table->string('token', 64)->unique();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('settings', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->text('value')->nullable();
        });

        Schema::create('email_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('subject');
            $table->text('body');
            $table->timestamp('created_at')->useCurrent();
        });

        DB::table('email_templates')->insert([
            'name' => 'Galerie Update',
            'subject' => 'Neuigkeiten in deiner Galerie: {gallery_name}',
            'body' => '<p>Hallo {user_name},</p><p>Es gibt Neuigkeiten in deiner Galerie <strong>{gallery_name}</strong>.</p><p><a href=\"{link}\">Hier geht es zur Galerie</a></p>'
        ]);
    }

    public function down(): void {
        Schema::dropIfExists('email_templates');
        Schema::dropIfExists('settings');
        Schema::dropIfExists('gallery_invites');
        Schema::dropIfExists('download_logs');
        Schema::dropIfExists('user_galleries');
        Schema::dropIfExists('user_gallery_groups');
        Schema::dropIfExists('ratings');
        Schema::dropIfExists('photos');
        Schema::table('users', function (Blueprint $table) { $table->dropForeign(['current_ftp_gallery_id']); });
        Schema::dropIfExists('galleries');
        Schema::dropIfExists('domain_mappings');
        Schema::dropIfExists('gallery_groups');
        Schema::dropIfExists('user_roles');
        Schema::dropIfExists('roles');
        Schema::dropIfExists('users');
    }
};
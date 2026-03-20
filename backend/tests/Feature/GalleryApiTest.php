<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Role;
use App\Models\Gallery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;

class GalleryApiTest extends TestCase
{
    use RefreshDatabase;

    protected $adminUser;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Admin User Setup
        $this->adminUser = User::factory()->create([
            'email' => 'admin@example.com',
            'password' => bcrypt('password')
        ]);
        
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $this->adminUser->roles()->attach($adminRole);
    }

    public function test_admin_can_create_gallery(): void
    {
        $token = Auth::guard('api')->login($this->adminUser);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/management/galleries', [
            'name' => 'Test Hochzeit 2026',
            'type' => 'delivery',
            'is_public' => true
        ]);

        $response->assertStatus(200)
                 ->assertJsonPath('success', true)
                 ->assertJsonPath('gallery.name', 'Test Hochzeit 2026');
                 
        $this->assertDatabaseHas('galleries', [
            'name' => 'Test Hochzeit 2026'
        ]);
    }

    public function test_guest_cannot_create_gallery(): void
    {
        $response = $this->postJson('/api/management/galleries', [
            'name' => 'Hacker Gallery'
        ]);

        $response->assertStatus(401);
    }
}
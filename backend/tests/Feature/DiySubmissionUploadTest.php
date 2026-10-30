<?php

namespace Tests\Feature;

use App\Models\DiyGuide;
use App\Models\User;
use App\Models\WasteCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Tes fitur upload karya DIY dari sisi user (warga):
 * - Upload karya terkait guide tersimpan ke database
 * - Karya yang diupload muncul di daftar karya user (Dampak Saya)
 */
class DiySubmissionUploadTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Bangun UploadedFile gambar PNG asli tanpa GD (lingkungan tes tak punya ekstensi GD).
     * Aturan validasi `image`/`mimes` memakai fileinfo (terinstall) untuk menebak ekstensi.
     */
    private function fakeImage(string $name = 'karya.png'): UploadedFile
    {
        // 1x1 pixel PNG valid ( transparan ).
        $png = base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/IqJAAAAAElFTkSuQmCC',
            true,
        );

        return UploadedFile::fake()->createWithContent($name, $png);
    }

    #[Test]
    public function user_can_upload_karya_and_it_is_saved(): void
    {
        Storage::fake('public');

        $category = WasteCategory::factory()->create();
        $guide = DiyGuide::factory()->create([
            'waste_category_id' => $category->id,
            'reward_points' => 30,
        ]);
        $user = User::factory()->create(['points_balance' => 0]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/user/diy-submissions', [
            'diy_guide_id' => $guide->id,
            'proof_image' => $this->fakeImage(),
            'notes' => 'Catatan proses pembuatan.',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.diy_guide_id', $guide->id)
            ->assertJsonPath('data.status', 'pending');

        // Tersimpan di database
        $this->assertDatabaseHas('diy_submissions', [
            'user_id' => $user->id,
            'diy_guide_id' => $guide->id,
            'status' => 'pending',
            'points_awarded' => 0,
        ]);

        // File foto benar-benar tersimpan
        $path = $response->json('data.proof_image');
        $this->assertNotEmpty($path, 'proof_image path tidak boleh kosong.');
        Storage::disk('public')->assertExists($path);
    }

    #[Test]
    public function uploaded_karya_appears_in_user_dampak_saya_list(): void
    {
        Storage::fake('public');

        $category = WasteCategory::factory()->create();
        $guide = DiyGuide::factory()->create([
            'waste_category_id' => $category->id,
            'reward_points' => 30,
        ]);
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $this->postJson('/api/user/diy-submissions', [
            'diy_guide_id' => $guide->id,
            'proof_image' => $this->fakeImage(),
        ])->assertStatus(201);

        // GET daftar karya — harus muncul
        $this->getJson('/api/user/diy-submissions')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.diy_guide_id', $guide->id)
            ->assertJsonPath('data.0.status', 'pending');
    }

    #[Test]
    public function upload_without_guide_id_is_rejected(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $this->postJson('/api/user/diy-submissions', [
            'proof_image' => $this->fakeImage(),
        ])->assertStatus(422);
    }

    #[Test]
    public function user_can_upload_custom_karya_without_guide(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/user/diy-submissions', [
            'title' => 'Lampu hias dari tutup botol',
            'category' => 'Plastik',
            'proof_image' => $this->fakeImage(),
            'notes' => 'Pakai 12 tutup botol dan lem tembak.',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.diy_guide_id', null)
            ->assertJsonPath('data.title', 'Lampu hias dari tutup botol')
            ->assertJsonPath('data.category', 'Plastik')
            ->assertJsonPath('data.notes', 'Pakai 12 tutup botol dan lem tembak.')
            ->assertJsonPath('data.status', 'pending');

        // Tersimpan di database tanpa guide
        $this->assertDatabaseHas('diy_submissions', [
            'user_id' => $user->id,
            'diy_guide_id' => null,
            'title' => 'Lampu hias dari tutup botol',
            'category' => 'Plastik',
            'status' => 'pending',
        ]);
    }

    #[Test]
    public function custom_karya_without_title_is_rejected(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $this->postJson('/api/user/diy-submissions', [
            'category' => 'Plastik',
            'proof_image' => $this->fakeImage(),
        ])->assertStatus(422);
    }

    #[Test]
    public function notes_are_persisted_for_guide_based_karya(): void
    {
        Storage::fake('public');

        $category = WasteCategory::factory()->create();
        $guide = DiyGuide::factory()->create(['waste_category_id' => $category->id]);
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $this->postJson('/api/user/diy-submissions', [
            'diy_guide_id' => $guide->id,
            'proof_image' => $this->fakeImage(),
            'notes' => 'Proses pembuatan butuh 45 menit.',
        ])->assertStatus(201);

        $this->assertDatabaseHas('diy_submissions', [
            'user_id' => $user->id,
            'diy_guide_id' => $guide->id,
            'notes' => 'Proses pembuatan butuh 45 menit.',
        ]);
    }
}

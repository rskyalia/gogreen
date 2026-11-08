<?php

namespace Tests\Feature;

use App\Models\DiyGuide;
use App\Models\DiySubmission;
use App\Models\MaterialRequest;
use App\Models\MaterialRequestResponse;
use App\Models\User;
use App\Models\WasteBank;
use App\Models\WasteCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MaterialRequestTest extends TestCase
{
    use RefreshDatabase;

    private User $officer;

    private WasteBank $bank;

    private WasteCategory $category;

    private User $community;

    protected function setUp(): void
    {
        parent::setUp();

        $this->officer = User::factory()->wasteBank()->create();
        $this->bank = WasteBank::factory()->verified()->create(['user_id' => $this->officer->id]);
        $this->category = WasteCategory::factory()->create(['is_recyclable' => true]);
        $this->community = User::factory()->community()->create();

        $this->bank->acceptedCategories()->attach($this->category->id);
    }

    private function makeOpenRequest(): MaterialRequest
    {
        return MaterialRequest::create([
            'community_id' => $this->community->id,
            'waste_category_id' => $this->category->id,
            'quantity_needed_kg' => 10.0,
            'notes' => 'Test request',
            'status' => 'open',
        ]);
    }

    // ── Index ─────────────────────────────────────────────────────────────

    public function test_community_dashboard_returns_stats_and_recent_submissions(): void
    {
        $community = User::factory()->community()->create();
        $guide = DiyGuide::factory()->create(['created_by' => $community->id]);

        $submitterA = User::factory()->create();
        $submitterB = User::factory()->create();

        DiySubmission::create([
            'user_id' => $submitterA->id,
            'diy_guide_id' => $guide->id,
            'proof_image' => 'pending.jpg',
            'status' => 'pending',
        ]);

        DiySubmission::create([
            'user_id' => $submitterB->id,
            'diy_guide_id' => $guide->id,
            'proof_image' => 'approved.jpg',
            'status' => 'approved',
            'reviewed_by' => $community->id,
            'reviewed_at' => now(),
            'points_awarded' => 25,
        ]);

        DiySubmission::create([
            'user_id' => $submitterA->id,
            'diy_guide_id' => $guide->id,
            'proof_image' => 'rejected.jpg',
            'status' => 'rejected',
            'review_note' => 'Tidak sesuai panduan.',
            'reviewed_by' => $community->id,
            'reviewed_at' => now(),
        ]);

        MaterialRequest::create([
            'community_id' => $community->id,
            'permintaan_bahan' => 'Botol Plastik',
            'waste_category_id' => $this->category->id,
            'quantity_needed_kg' => 12.5,
            'notes' => 'Diperlukan untuk workshop.',
            'status' => 'open',
        ]);

        $this->actingAs($community)
            ->getJson('/api/community/dashboard?limit=10')
            ->assertOk()
            ->assertJsonPath('data.user.name', $community->name)
            ->assertJsonPath('data.stats.pending', 1)
            ->assertJsonPath('data.stats.approved', 1)
            ->assertJsonPath('data.stats.rejected', 1)
            ->assertJsonPath('data.stats.open_material_requests', 1)
            ->assertJsonCount(3, 'data.submissions');
    }

    public function test_officer_sees_real_permintaan_bahan_value_from_database(): void
    {
        MaterialRequest::create([
            'community_id' => $this->community->id,
            'permintaan_bahan' => 'Botol Plastik 5kg',
            'waste_category_id' => $this->category->id,
            'quantity_needed_kg' => 5.0,
            'status' => 'open',
        ]);

        $this->actingAs($this->officer)
            ->getJson('/api/waste-bank/material-requests')
            ->assertOk()
            ->assertJsonPath('data.0.permintaan_bahan', 'Botol Plastik 5kg');
    }

    public function test_officer_sees_open_requests_for_accepted_categories(): void
    {
        $this->makeOpenRequest();

        $this->actingAs($this->officer)
            ->getJson('/api/waste-bank/material-requests')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_officer_does_not_see_requests_for_unaccepted_categories(): void
    {
        $otherCat = WasteCategory::factory()->create(['is_recyclable' => true]);
        // Kategori ini tidak diterima oleh bank petugas

        MaterialRequest::create([
            'community_id' => $this->community->id,
            'waste_category_id' => $otherCat->id,
            'quantity_needed_kg' => 5.0,
            'status' => 'open',
        ]);

        $this->actingAs($this->officer)
            ->getJson('/api/waste-bank/material-requests')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_fulfilled_requests_are_not_shown(): void
    {
        MaterialRequest::create([
            'community_id' => $this->community->id,
            'waste_category_id' => $this->category->id,
            'quantity_needed_kg' => 5.0,
            'status' => 'fulfilled', // sudah terpenuhi
        ]);

        $this->actingAs($this->officer)
            ->getJson('/api/waste-bank/material-requests')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    // ── Respond ───────────────────────────────────────────────────────────

    public function test_officer_can_submit_offer(): void
    {
        $request = $this->makeOpenRequest();

        $this->actingAs($this->officer)
            ->postJson("/api/waste-bank/material-requests/{$request->id}/responses", [
                'quantity_offered_kg' => 5.0,
                'notes' => 'Siap kirim minggu ini.',
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'offered')
            ->assertJsonPath('data.quantity_offered_kg', 5);

        $this->assertDatabaseHas('material_request_responses', [
            'material_request_id' => $request->id,
            'responder_id' => $this->officer->id,
            'status' => 'offered',
        ]);
    }

    public function test_officer_cannot_offer_twice_to_same_request(): void
    {
        $request = $this->makeOpenRequest();

        MaterialRequestResponse::create([
            'material_request_id' => $request->id,
            'responder_id' => $this->officer->id,
            'quantity_offered_kg' => 5.0,
            'status' => 'offered',
        ]);

        $this->actingAs($this->officer)
            ->postJson("/api/waste-bank/material-requests/{$request->id}/responses", [
                'quantity_offered_kg' => 3.0,
            ])
            ->assertUnprocessable()
            ->assertJsonPath('errors.response.0', 'Tawaran sudah ada.');
    }

    public function test_cannot_offer_to_closed_request(): void
    {
        $closed = MaterialRequest::create([
            'community_id' => $this->community->id,
            'waste_category_id' => $this->category->id,
            'quantity_needed_kg' => 5.0,
            'status' => 'closed',
        ]);

        $this->actingAs($this->officer)
            ->postJson("/api/waste-bank/material-requests/{$closed->id}/responses", [
                'quantity_offered_kg' => 3.0,
            ])
            ->assertNotFound(); // scopeOpen() memfilter
    }

    // ── Mark delivered ────────────────────────────────────────────────────

    public function test_officer_can_mark_accepted_response_as_delivered(): void
    {
        $request = $this->makeOpenRequest();
        $response = MaterialRequestResponse::create([
            'material_request_id' => $request->id,
            'responder_id' => $this->officer->id,
            'quantity_offered_kg' => 5.0,
            'status' => 'accepted',
        ]);

        $this->actingAs($this->officer)
            ->patchJson("/api/waste-bank/responses/{$response->id}/delivered")
            ->assertOk()
            ->assertJsonPath('data.status', 'delivered');

        $this->assertDatabaseHas('material_request_responses', [
            'id' => $response->id,
            'status' => 'delivered',
        ]);
    }

    public function test_cannot_mark_offered_response_as_delivered(): void
    {
        $request = $this->makeOpenRequest();
        $response = MaterialRequestResponse::create([
            'material_request_id' => $request->id,
            'responder_id' => $this->officer->id,
            'quantity_offered_kg' => 5.0,
            'status' => 'offered', // belum accepted
        ]);

        $this->actingAs($this->officer)
            ->patchJson("/api/waste-bank/responses/{$response->id}/delivered")
            ->assertUnprocessable()
            ->assertJsonPath('errors.status.0', 'Status harus accepted.');
    }

    public function test_officer_cannot_update_another_officers_response(): void
    {
        $other = User::factory()->wasteBank()->create();
        WasteBank::factory()->verified()->create(['user_id' => $other->id]);
        $request = $this->makeOpenRequest();

        $response = MaterialRequestResponse::create([
            'material_request_id' => $request->id,
            'responder_id' => $other->id, // milik officer lain
            'quantity_offered_kg' => 5.0,
            'status' => 'accepted',
        ]);

        $this->actingAs($this->officer)
            ->patchJson("/api/waste-bank/responses/{$response->id}/delivered")
            ->assertNotFound();
    }

    // ── My responses ──────────────────────────────────────────────────────

    public function test_officer_sees_own_responses(): void
    {
        $request = $this->makeOpenRequest();

        MaterialRequestResponse::create([
            'material_request_id' => $request->id,
            'responder_id' => $this->officer->id,
            'quantity_offered_kg' => 5.0,
            'status' => 'offered',
        ]);

        $this->actingAs($this->officer)
            ->getJson('/api/waste-bank/responses')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_community_can_list_own_material_requests(): void
    {
        MaterialRequest::create([
            'community_id' => $this->community->id,
            'waste_category_id' => $this->category->id,
            'quantity_needed_kg' => 12.5,
            'notes' => 'Butuh untuk workshop',
            'status' => 'open',
        ]);

        $this->actingAs($this->community)
            ->getJson('/api/community/material-requests')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_community_can_create_material_request(): void
    {
        $this->actingAs($this->community)
            ->postJson('/api/community/material-requests', [
                'title' => 'Dibutuhkan 12 Botol Plastik Bekas',
                'category' => $this->category->name,
                'quantity' => '12 Botol',
                'description' => 'Untuk kegiatan workshop eco-brick.',
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'open');

        $this->assertDatabaseHas('material_requests', [
            'community_id' => $this->community->id,
            'status' => 'open',
        ]);
    }
}

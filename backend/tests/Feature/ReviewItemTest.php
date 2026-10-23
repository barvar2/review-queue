<?php

namespace Tests\Feature;

use App\Enums\ItemStatus;
use App\Models\Item;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReviewItemTest extends TestCase
{
    use RefreshDatabase;

    private function review(Item $item, array $payload)
    {
        return $this->postJson("/api/items/{$item->id}/review", $payload);
    }

    public function test_approving_records_the_decision_note_and_time(): void
    {
        $this->freezeSecond();
        $item = Item::factory()->create();

        $this->review($item, ['decision' => 'approve', 'note' => '  Looks fine.  '])
            ->assertOk()
            ->assertJsonPath('data.status', 'approved')
            ->assertJsonPath('data.review_note', 'Looks fine.')
            ->assertJsonPath('data.reviewed_at', now()->toJSON());
    }

    public function test_a_second_review_returns_a_conflict_and_keeps_the_first_decision(): void
    {
        $item = Item::factory()->create();
        $this->review($item, ['decision' => 'approve', 'note' => 'First reviewer'])->assertOk();

        $this->review($item, ['decision' => 'reject', 'note' => 'Second reviewer'])
            ->assertConflict()
            ->assertJsonPath('data.status', 'approved')
            ->assertJsonPath('data.review_note', 'First reviewer');
    }

    public function test_a_reviewer_holding_a_stale_copy_cannot_overwrite_a_concurrent_decision(): void
    {
        $item = Item::factory()->create();
        $staleCopy = Item::find($item->id);

        Item::find($item->id)->review(ItemStatus::Approved, 'Won the race');

        $this->assertFalse($staleCopy->review(ItemStatus::Rejected, 'Lost the race'));
        $this->assertDatabaseHas('items', ['id' => $item->id, 'status' => 'approved', 'review_note' => 'Won the race']);
    }

    public function test_an_invalid_decision_is_rejected(): void
    {
        $item = Item::factory()->create();

        $this->review($item, ['decision' => 'escalate'])->assertUnprocessable()->assertJsonValidationErrors(['decision']);
    }
}

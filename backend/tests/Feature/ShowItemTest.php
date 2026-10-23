<?php

namespace Tests\Feature;

use App\Models\Item;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShowItemTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_returns_the_full_item_with_its_flags(): void
    {
        $flags = [['code' => 'links', 'label' => 'Links', 'reason' => 'Contains a link']];
        $item = Item::factory()->create(['body' => "Line one\n<b>not html</b>", 'flags' => $flags]);

        $this->getJson("/api/items/{$item->id}")
            ->assertOk()
            ->assertJsonPath('data.body', "Line one\n<b>not html</b>")
            ->assertJsonPath('data.flags', $flags)
            ->assertJsonPath('data.review_note', null);
    }

    public function test_unknown_or_malformed_ids_return_not_found(): void
    {
        $this->getJson('/api/items/999999')->assertNotFound();
        $this->getJson('/api/items/abc')->assertNotFound();
    }
}

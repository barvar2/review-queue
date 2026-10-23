<?php

namespace Tests\Feature;

use App\Models\Item;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DatabaseSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeding_adds_realistic_items_once_and_keeps_existing_data(): void
    {
        $existing = Item::factory()->create(['title' => 'My own report']);

        $this->seed();
        $seeded = Item::count();
        $this->seed();

        $this->assertSame($seeded, Item::count());
        $this->assertModelExists($existing);
        $this->assertEqualsCanonicalizing(['pending', 'approved', 'rejected'], Item::pluck('status')->map->value->unique()->values()->all());
        $this->assertSame(['suspicious_words', 'links'], array_column(Item::where('title', 'FREE MONEY for teachers!!!')->sole()->flags, 'code'));
        $this->assertTrue(Item::whereNotNull('review_note')->exists());
    }
}

<?php

namespace Tests\Feature;

use App\Enums\ItemStatus;
use App\Models\Item;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ListItemsTest extends TestCase
{
    use RefreshDatabase;

    private function listedIds(array $query = []): array
    {
        return $this->getJson('/api/items?'.http_build_query($query))->assertOk()->json('data.*.id');
    }

    public function test_it_filters_by_status_and_defaults_to_pending(): void
    {
        $pending = Item::factory()->create();
        $approved = Item::factory()->approved()->create();
        $rejected = Item::factory()->rejected()->create();

        $this->assertSame([$pending->id], $this->listedIds());
        $this->assertSame([$approved->id, $rejected->id], $this->listedIds(['status' => 'reviewed']));
        $this->assertSame([$pending->id, $approved->id, $rejected->id], $this->listedIds(['status' => 'all']));
    }

    public function test_it_searches_title_and_body_case_insensitively(): void
    {
        $byTitle = Item::factory()->create(['title' => 'Volcano video is silent']);
        $byBody = Item::factory()->create(['body' => 'The VOLCANO lesson has no sound.']);
        Item::factory()->create(['title' => 'Quiz issue', 'body' => 'Score was not saved.']);

        $this->assertSame([$byTitle->id, $byBody->id], $this->listedIds(['search' => 'volcano']));

        $zero = Item::factory()->create(['title' => 'Score shows 0', 'body' => 'Nothing else.']);
        $this->assertSame([$zero->id], $this->listedIds(['search' => '0']));
    }

    public function test_it_can_show_only_flagged_items(): void
    {
        Item::factory()->create();
        $flagged = Item::factory()->create(['flags' => [['code' => 'links', 'label' => 'Links', 'reason' => 'Contains a link']]]);

        $this->assertSame([$flagged->id], $this->listedIds(['flagged' => 1]));
    }

    public function test_the_total_is_exact_up_to_a_thousand_and_capped_above(): void
    {
        $insert = fn (int $count, string $title) => DB::table('items')->insert(array_fill(0, $count, [
            'title' => $title, 'body' => 'Body', 'status' => 'pending', 'flags' => '[]', 'created_at' => now(), 'updated_at' => now(),
        ]));

        $insert(1000, 'Common report');
        $this->getJson('/api/items')->assertJsonPath('meta.total', 1000)->assertJsonPath('meta.total_capped', false);

        $insert(1, 'Common report');
        $this->getJson('/api/items')->assertJsonPath('meta.total', 1000)->assertJsonPath('meta.total_capped', true);

        $insert(3, 'Rare report');
        $this->getJson('/api/items?search=rare')->assertJsonPath('meta.total', 3)->assertJsonPath('meta.total_capped', false);
        $this->getJson('/api/items?search=nothing')->assertJsonPath('meta.total', 0)->assertJsonPath('meta.total_capped', false);
    }

    public function test_reviewing_items_while_paging_does_not_skip_or_repeat_pending_items(): void
    {
        $ids = collect(range(1, 60))
            ->map(fn (int $minute) => Item::factory()->create(['created_at' => now()->subHours(2)->addMinutes($minute)])->id)
            ->all();

        $firstPage = $this->getJson('/api/items')->assertOk()->assertJsonPath('meta.total', 60);
        $this->assertSame(array_slice($ids, 0, 25), $firstPage->json('data.*.id'));

        Item::whereKey(array_slice($ids, 0, 5))->update(['status' => ItemStatus::Approved]);

        $secondPage = $this->getJson('/api/items?cursor='.$firstPage->json('meta.next_cursor'))->assertOk()->assertJsonPath('meta.total', 55);
        $this->assertSame(array_slice($ids, 25, 25), $secondPage->json('data.*.id'));
    }
}

<?php

namespace Tests\Feature;

use App\Models\Item;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class StoreItemTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_submission_is_stored_as_pending_with_flags_hidden_from_the_submitter(): void
    {
        $this->postJson('/api/items', [
            'title' => 'Free money inside',
            'body' => 'Visit https://example.com to claim it.',
            'status' => 'approved',
        ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonMissingPath('data.flags');

        $item = Item::sole();
        $this->assertSame('pending', $item->status->value);
        $this->assertSame(['suspicious_words', 'links'], array_column($item->flags, 'code'));
    }

    #[DataProvider('invalidPayloads')]
    public function test_invalid_submissions_are_rejected(array $payload, string $invalidField): void
    {
        $this->postJson('/api/items', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors([$invalidField]);

        $this->assertDatabaseCount('items', 0);
    }

    public static function invalidPayloads(): array
    {
        return [
            'missing title' => [['body' => 'Some content'], 'title'],
            'whitespace-only title' => [['title' => '   ', 'body' => 'Some content'], 'title'],
            'body too long' => [['title' => 'Some title', 'body' => str_repeat('a', 5001)], 'body'],
        ];
    }
}

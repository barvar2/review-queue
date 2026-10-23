<?php

namespace App\Models;

use App\Enums\ItemStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['title', 'body'])]
class Item extends Model
{
    use HasFactory;

    protected $attributes = [
        'status' => ItemStatus::Pending->value,
        'flags' => '[]',
    ];

    protected function casts(): array
    {
        return [
            'status' => ItemStatus::class,
            'flags' => 'array',
            'reviewed_at' => 'datetime',
        ];
    }

    public function review(ItemStatus $decision, ?string $note): bool
    {
        $updated = static::query()
            ->whereKey($this->id)
            ->where('status', ItemStatus::Pending)
            ->update([
                'status' => $decision,
                'review_note' => $note,
                'reviewed_at' => now(),
            ]);

        $this->refresh();

        return $updated === 1;
    }
}

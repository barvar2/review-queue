<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

class ItemSummaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'excerpt' => Str::limit(Str::squish($this->body), 140),
            'status' => $this->status,
            'flags' => $this->flags,
            'created_at' => $this->created_at,
        ];
    }
}

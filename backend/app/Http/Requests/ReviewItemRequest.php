<?php

namespace App\Http\Requests;

use App\Enums\ItemStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReviewItemRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'decision' => ['required', Rule::in(['approve', 'reject'])],
            'note' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function decision(): ItemStatus
    {
        return match ($this->validated('decision')) {
            'approve' => ItemStatus::Approved,
            'reject' => ItemStatus::Rejected,
        };
    }

    public function note(): ?string
    {
        return $this->validated('note');
    }
}

<?php

namespace App\Http\Requests;

use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Pagination\Cursor;
use Illuminate\Validation\Rule;

class ListItemsRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'status' => ['nullable', Rule::in(['pending', 'reviewed', 'all'])],
            'search' => ['nullable', 'string', 'max:100'],
            'sort' => ['nullable', Rule::in(['oldest', 'newest'])],
            'flagged' => ['nullable', 'boolean'],
            'cursor' => ['nullable', 'string', $this->validCursor(...)],
        ];
    }

    public function status(): string
    {
        return $this->validated('status') ?? 'pending';
    }

    public function sortDirection(): string
    {
        return $this->validated('sort') === 'newest' ? 'desc' : 'asc';
    }

    public function search(): ?string
    {
        return $this->validated('search');
    }

    public function onlyFlagged(): bool
    {
        return $this->boolean('flagged');
    }

    private function validCursor(string $attribute, mixed $value, Closure $fail): void
    {
        $parameters = is_string($value) ? Cursor::fromEncoded($value)?->toArray() : null;

        if (! isset($parameters['created_at'], $parameters['id'])) {
            $fail('The cursor is invalid.');
        }
    }
}

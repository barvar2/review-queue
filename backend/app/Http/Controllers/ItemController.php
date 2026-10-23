<?php

namespace App\Http\Controllers;

use App\Enums\ItemStatus;
use App\Http\Requests\ListItemsRequest;
use App\Http\Requests\StoreItemRequest;
use App\Http\Resources\ItemResource;
use App\Http\Resources\ItemSummaryResource;
use App\Http\Resources\SubmittedItemResource;
use App\Models\Item;
use App\Moderation\ContentFlagger;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class ItemController
{
    private const PAGE_SIZE = 25;

    private const COUNT_LIMIT = 1000;

    public function index(ListItemsRequest $request): AnonymousResourceCollection
    {
        $status = $request->status();
        $direction = $request->sortDirection();
        $search = $request->search();

        $matching = Item::query()
            ->when($status === 'pending', fn (Builder $query) => $query->where('status', ItemStatus::Pending))
            ->when($status === 'reviewed', fn (Builder $query) => $query->whereIn('status', ItemStatus::reviewedStatuses()))
            ->when($search !== null, fn (Builder $query) => $this->applySearch($query, $search))
            ->when($request->onlyFlagged(), fn (Builder $query) => $query->whereJsonLength('flags', '>', 0));

        $total = $this->countUpToLimit($matching);

        $items = $matching
            ->orderBy('created_at', $direction)
            ->orderBy('id', $direction)
            ->cursorPaginate(self::PAGE_SIZE);

        return ItemSummaryResource::collection($items)->additional(['meta' => [
            'total' => min($total, self::COUNT_LIMIT),
            'total_capped' => $total > self::COUNT_LIMIT,
        ]]);
    }

    public function show(Item $item): ItemResource
    {
        return new ItemResource($item);
    }

    public function store(StoreItemRequest $request, ContentFlagger $flagger): SubmittedItemResource
    {
        $item = new Item($request->validated());
        $item->flags = $flagger->flagsFor($item->title, $item->body);
        $item->save();

        return new SubmittedItemResource($item);
    }

    private function countUpToLimit(Builder $matching): int
    {
        $firstMatches = $matching->clone()->select('id')->limit(self::COUNT_LIMIT + 1);

        return DB::query()->fromSub($firstMatches, 'matching')->count();
    }

    private function applySearch(Builder $query, string $search): void
    {
        $pattern = '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $search).'%';

        $query->where(fn (Builder $query) => $query
            ->whereRaw("title like ? escape '!'", [$pattern])
            ->orWhereRaw("body like ? escape '!'", [$pattern]));
    }
}

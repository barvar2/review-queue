<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReviewItemRequest;
use App\Http\Resources\ItemResource;
use App\Models\Item;
use Illuminate\Http\JsonResponse;

class ItemReviewController
{
    public function __invoke(ReviewItemRequest $request, Item $item): ItemResource|JsonResponse
    {
        $reviewed = $item->review($request->decision(), $request->note());
        $resource = new ItemResource($item);

        if (! $reviewed) {
            return $resource
                ->additional(['message' => 'This item has already been reviewed.'])
                ->response()
                ->setStatusCode(JsonResponse::HTTP_CONFLICT);
        }

        return $resource;
    }
}

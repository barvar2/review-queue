<?php

use App\Http\Controllers\ItemController;
use App\Http\Controllers\ItemReviewController;
use Illuminate\Support\Facades\Route;

Route::apiResource('items', ItemController::class)
    ->only(['index', 'store', 'show'])
    ->where(['item' => '[0-9]{1,18}']);

Route::post('items/{item}/review', ItemReviewController::class)
    ->where('item', '[0-9]{1,18}');

<?php

namespace Database\Factories;

use App\Enums\ItemStatus;
use Illuminate\Database\Eloquent\Factories\Factory;

class ItemFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(4),
            'body' => fake()->paragraph(),
        ];
    }

    public function approved(): static
    {
        return $this->state(['status' => ItemStatus::Approved]);
    }

    public function rejected(): static
    {
        return $this->state(['status' => ItemStatus::Rejected]);
    }
}

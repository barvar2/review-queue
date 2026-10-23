<?php

namespace App\Enums;

enum ItemStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Rejected = 'rejected';

    public static function reviewedStatuses(): array
    {
        return [self::Approved, self::Rejected];
    }
}

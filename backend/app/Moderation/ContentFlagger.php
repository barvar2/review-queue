<?php

namespace App\Moderation;

class ContentFlagger
{
    private const LINK_PATTERN = '~\bhttps?://\S+|\bwww\.\S+~i';

    public function flagsFor(string $title, string $body): array
    {
        $text = $title."\n".$body;

        return array_values(array_filter([
            $this->suspiciousWords($text),
            $this->links($text),
        ]));
    }

    private function suspiciousWords(string $text): ?array
    {
        $found = array_values(array_filter(config('moderation.suspicious_words'), function (string $phrase) use ($text) {
            $pattern = str_replace(' ', '\s+', preg_quote($phrase, '/'));

            return preg_match('/\b'.$pattern.'\b/iu', $text) === 1;
        }));

        if ($found === []) {
            return null;
        }

        return $this->flag('suspicious_words', 'Suspicious words', 'Contains suspicious words: '.implode(', ', $found));
    }

    private function links(string $text): ?array
    {
        $linkCount = preg_match_all(self::LINK_PATTERN, $text);

        if ($linkCount === 0) {
            return null;
        }

        return $this->flag('links', 'Links', $linkCount === 1 ? 'Contains a link' : "Contains {$linkCount} links");
    }

    private function flag(string $code, string $label, string $reason): array
    {
        return ['code' => $code, 'label' => $label, 'reason' => $reason];
    }
}

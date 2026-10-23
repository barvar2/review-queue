<?php

namespace Tests\Unit;

use App\Moderation\ContentFlagger;
use Tests\TestCase;

class ContentFlaggerTest extends TestCase
{
    private function flags(string $title, string $body): array
    {
        return (new ContentFlagger)->flagsFor($title, $body);
    }

    public function test_clean_content_has_no_flags(): void
    {
        $this->assertSame([], $this->flags('Typo on the about page', 'The second paragraph says "teh".'));
    }

    public function test_suspicious_words_match_whole_words_regardless_of_case(): void
    {
        $this->assertSame([[
            'code' => 'suspicious_words',
            'label' => 'Suspicious words',
            'reason' => 'Contains suspicious words: scam, free money',
        ]], $this->flags('Totally not a SCAM', 'Get your Free Money now'));

        $this->assertSame([], $this->flags('The scamper game', 'Two passwords were reset.'));
    }

    public function test_the_word_list_comes_from_the_moderation_config(): void
    {
        config(['moderation.suspicious_words' => ['lottery']]);

        $this->assertSame('Contains suspicious words: lottery', $this->flags('You won the lottery', 'Claim it today.')[0]['reason']);
        $this->assertSame([], $this->flags('Totally not a scam', 'Nothing else.'));
    }

    public function test_links_are_flagged_with_their_count(): void
    {
        $this->assertSame([['code' => 'links', 'label' => 'Links', 'reason' => 'Contains a link']], $this->flags('Help', 'See https://a.example'));
        $this->assertSame('Contains 2 links', $this->flags('Help', 'See www.a.example and http://b.example')[0]['reason']);
    }
}

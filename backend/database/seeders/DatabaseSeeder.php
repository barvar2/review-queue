<?php

namespace Database\Seeders;

use App\Enums\ItemStatus;
use App\Models\Item;
use App\Moderation\ContentFlagger;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    private const ITEMS = [
        ['Volcano video freezes at 2:10', 'The Volcanoes movie stops loading after about two minutes in Chrome. Refreshing does not help.'],
        ['Quiz score was not saved', 'My class finished the Fractions quiz but the scores page shows nothing for today.'],
        ['FREE MONEY for teachers!!!', 'Click here to claim your reward: http://free-money.example and www.prizes.example'],
        ['Typo in the Photosynthesis lesson', 'The second paragraph says "chlorophyl" instead of "chlorophyll".', ItemStatus::Approved, 'Fixed the spelling in the lesson text.'],
        ['I forgot my password', 'I cannot log in to my class account. Please help me reset my password.'],
        ['Captions out of sync in Ecosystems', 'Captions run about three seconds behind the narration in the Ecosystems movie.'],
        ['Great lesson on fractions', 'My students loved the pizza example. Thank you!', ItemStatus::Approved],
        ['This reward game is a scam', 'Students say the points disappear after every round, so the game feels like a scam.', ItemStatus::Rejected, 'Not a content issue. Forwarded to the games team.'],
        ['Missing transcript for Gravity', 'The Gravity movie has no transcript link, which our hearing-impaired student needs.'],
        ['Audio too quiet on tablets', 'On iPads the narration is much quieter than on laptops.'],
        ['Wrong answer in the Water Cycle quiz', 'Question 4 marks "evaporation" as wrong, but it is the correct answer.'],
        ['Earthquakes activity link is broken', 'The activity link at https://example.com/earthquakes returns a 404 page.'],
        ['Ancient Egypt printable is blurry', 'The hieroglyphics worksheet prints blurry on every printer we tried.'],
        ['Solar System movie will not start in Safari', 'The movie shows a spinner forever in Safari 17. Chrome works fine.'],
        ['Win a tablet for your class', 'Click here and visit www.win-a-tablet.example to enter the draw.', ItemStatus::Rejected, 'Spam.'],
        ['Magnets lesson needs a Spanish version', 'Half of my class are Spanish speakers. A translated version would help a lot.'],
        ['Plate Tectonics map labels overlap', 'On smaller screens the labels for the Pacific and Nazca plates overlap.'],
        ['Electric Circuits quiz times out', 'Students get logged out before they can finish the ten questions.'],
        ['Food Chains game freezes on level 3', 'The game stops responding when the hawk appears on level 3.'],
        ['Duplicate word in the Weather vocabulary list', 'The word "humidity" appears twice in the vocabulary list.', ItemStatus::Approved, 'Removed the duplicate.'],
        ['Rocks and Minerals video has no captions', 'The captions button is greyed out for this movie only.'],
        ['Simple Machines diagram is mislabeled', 'The pulley in the second diagram is labeled as a lever.'],
        ['States of Matter quiz answer looks wrong', 'Question 2 says ice is a liquid. The answer key should be checked.'],
        ['Human Body lesson is too advanced for grade 3', 'The vocabulary is too hard for my third graders.', ItemStatus::Rejected, 'The grade level is set correctly. No change needed.'],
        ['Climate lesson cites an old statistic', 'The lesson uses a temperature figure from 2009. Newer data is available.'],
        ['Light and Sound activity keeps resetting', 'My students hate that the activity resets whenever they switch tabs.'],
        ['Habitats worksheet is missing page 2', 'The PDF only contains the first page of the worksheet.'],
        ['Cells movie audio cuts out', 'The audio drops for a few seconds around the 3 minute mark.'],
        ['Erosion quiz shows the wrong image', 'Question 5 shows a picture of a volcano instead of a canyon.'],
        ['Map Skills printable is missing the answer key', 'The teacher version does not include the answer key.'],
        ['Measurement unit uses inches only', 'Our school uses the metric system. Centimeter examples would help.', ItemStatus::Approved, 'Added metric examples.'],
        ['Poetry lesson link points to the wrong page', 'The "read more" link at www.example.org/poetry opens the Math page.'],
        ['Rude comment in the Civil Rights discussion', 'A student wrote "you idiot" to another student in the discussion board.'],
    ];

    public function run(ContentFlagger $flagger): void
    {
        foreach (self::ITEMS as $position => $entry) {
            [$title, $body, $decision, $note] = $entry + [2 => null, 3 => null];

            if (Item::where('title', $title)->exists()) {
                continue;
            }

            $item = new Item(['title' => $title, 'body' => $body]);
            $item->flags = $flagger->flagsFor($title, $body);
            $item->created_at = now()->subMinutes((count(self::ITEMS) - $position) * 37);
            $item->save();

            if ($decision !== null) {
                $item->review($decision, $note);
            }
        }
    }
}

# Review Queue

## Overview

A small full-stack review queue built with Vue 2.7 and Laravel 13. Users submit items, and reviewers work through a queue, approving or rejecting each item with an optional note. The queue can be browsed by status, searched, sorted and filtered. Suspicious words and links are flagged automatically to help the reviewer decide. Flags never make the decision.

## How to Run

Requirements: PHP 8.4.1+ (with `pdo_sqlite`), Composer, and Node.js 22.22.2+, 24.15+ or 26+.

```sh
# Backend: API on http://127.0.0.1:8000
cd backend
composer setup      # installs dependencies, creates .env and the SQLite database, migrates, seeds sample data
php artisan serve

# Frontend: app on http://localhost:5173 (in a second terminal)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The queue starts with 33 sample items: pending, approved and rejected, some of them flagged. Running `php artisan db:seed` again only adds sample items that are missing.

```sh
cd backend && php artisan test   # backend tests
cd frontend && npm test          # frontend tests
cd frontend && npm run build     # production build
```

In development, Vite proxies `/api` to Laravel, so no CORS setup is needed.

## Key Decisions

**Data model: one `items` table.** It holds the title, body, status (`pending`, `approved`, `rejected`), moderation flags (JSON), and the review note and time. An item is reviewed exactly once, so the decision lives on the item instead of a separate reviews table. Flags are computed once at submission and stored. That makes "Flagged only" a simple query, and each item keeps the flags it was reviewed with even if the rules change.

**API: resources plus a separate review action.** Reviewing is its own endpoint rather than a `PATCH` on `status`, because it has its own rules: it happens once, it records a note and a time, and clients can't set an arbitrary status. A review is a single conditional update, `UPDATE … WHERE id = ? AND status = 'pending'`. If two reviewers act at once, exactly one succeeds, and the other gets `409 Conflict` with the current item. Laravel Form Requests validate all input, and API Resources define the response shapes. For example, the submission response leaves out the flags.

**Pagination: cursor-based (the stretch goal).** Reviewing removes items from the Pending list, so offset pagination would skip items as the list shrinks. A cursor on `(created_at, id)` continues after the last item seen, so nothing is skipped or repeated. Totals are counted exactly up to 1,000 and shown as "1,000+" beyond that, which keeps the count cheap.

**Persistence: SQLite.** The data is one table with one atomic write, so a single file with no server to install keeps setup to two commands. The conditional update works unchanged on PostgreSQL, which would be the next step for heavier concurrent use.

**Moderation heuristic: two transparent rules.** `ContentFlagger` flags suspicious words (whole-word, case-insensitive) and links, and gives a reason for each flag. The word list lives in `config/moderation.php`, separate from the matching logic. Simple rules are easy to explain, test and change, and reviewers can see exactly why an item was flagged.

**Frontend.**
- **The URL holds the filters:** tab, search, sort and "Flagged only". Views survive a refresh and can be shared, and no global store is needed.
- **Each view owns its data** and ignores responses that arrive after a newer request.
- **One small `fetch` client** turns every failure into a single error type, so all views handle errors the same way.
- **After a decision,** the next pending item opens automatically. On a conflict, the app shows the other reviewer's decision and keeps the unsaved note.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/items` | List with `status` (`pending`, `reviewed`, `all`), `search`, `sort` (`oldest`, `newest`), `flagged=1` and `cursor`. Returns `data`, `meta.next_cursor`, `meta.total` and `meta.total_capped`. |
| `GET` | `/api/items/{id}` | Full item with flags and decision. |
| `POST` | `/api/items` | Submit `{ title, body }`. Returns `201`. |
| `POST` | `/api/items/{id}/review` | Review with `{ decision: "approve" \| "reject", note? }`. Returns `200`, or `409` if already reviewed. |

Errors are JSON: `404` for unknown items, and `422` with field errors for invalid input.

## Assumptions

- **No authentication.** Anyone can submit and anyone can review. The assignment doesn't define users or roles.
- **Decisions are final.** An approved or rejected item can't be reviewed again.
- **Items can't be edited or deleted** after submission.
- **The queue is first in, first out.** It shows the oldest first by default, and reviewers can switch to newest first.
- **Search is a case-insensitive substring match** on title and content.

## Trade-offs

**Optimized for:** A reliable review workflow, including safe handling of concurrent decisions, predictable pagination, and a simple, maintainable architecture.

**Intentionally not built:**

- **Authentication and item claiming:** Outside the assignment's scope. Concurrent reviews are handled safely, although reviewers may occasionally work on the same item.
- **Real-time updates:** The queue refreshes when data is requested, and conflicting decisions are handled by the API.
- **Advanced search and moderation:** Simple text search and transparent flagging rules were preferred over more complex solutions.
- **Review history and item editing:** Excluded to keep the focus on the core submission and review workflow.

**Known limitations:** Page totals may become temporarily approximate as items are reviewed, and deep pagination or text searches may slow down on very large SQLite datasets.

## Testing

**What was tested, and why.** The tests target the behaviour that would be most costly to get wrong:
- **Backend (PHPUnit):** submission and validation, moderation rules, approve and reject, `409` conflicts including concurrent decisions, filters and search, paging while items are being reviewed, capped totals, and safe re-seeding.
- **Frontend (Vitest):** URL filter parsing, ignoring out-of-order responses, Previous/Next and page boundaries, auto-advance, conflict handling, the search debounce, and rendering user content as text, never as HTML.

**What wasn't tested, and why.**
- **Presentational components and styling:** they have little logic, and snapshot tests would mostly fail on harmless markup changes.
- **Browser end-to-end tests:** a tool like Playwright adds significant setup for a small app. The full flow was checked manually.
- **Load testing:** out of scope for this size. Performance was checked by hand with generated data.

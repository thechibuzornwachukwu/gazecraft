# Gazecraft

A word game for kids: words hide across the gaps in real sentences ("a most" hides AMOS). React 19 + Vite on Cloudflare Pages, a Cloudflare Worker for the API, Supabase for accounts and scores. English, Spanish, French and German.

## Before you start

Estimate the time and tokens the task will take, compare it with the context window left, and tell the owner what that means before going on.

Read the doc for the area you touch, and only that one:

| Work on | Read first |
| --- | --- |
| Any screen | `design/V3_STYLE.md` (the look and the words), then the screen's section of `design/SPEC.md` |
| Data, auth, the Worker, a migration | `design/SECURITY.md` |
| A new puzzle text | `design/PUZZLE_STANDARD.md` |
| What to build next | `design/BUILD_PLAN.md` |

## Commands

- Dev: `npm run dev`. Worker: `npm run worker:dev`.
- Check everything: `npm run verify` (secrets, lint, types, unit tests, audit). The pre-push hook runs it.
- Unit tests: run Vitest from PowerShell, never Git Bash. In Git Bash every file fails with "failed to find the current suite". Read the `Test Files` line, not only the exit code.
- Database tests: `npm run test:db`, with Docker running. Required after any change in `supabase/migrations`.
- Deploy, in this order: `npx supabase db push`, `npm run deploy:api`, `npm run deploy:site`.
- Seed: `npm run db:seed:gen`, then `npx supabase db query --linked -f supabase/seed.sql`.

## Rules the code will not tell you

- Every UI string goes through `t('English text')`, and the same key goes into `src/i18n/{es,fr,de}/*.ts`, or the typecheck fails. Write for text 20 to 40% longer than English.
- Styles in `src/components` use tokens from `src/styles/tokens.css`: no hex, no px radius, no raw durations (`src/test/tokens.test.ts`). The four tab screens take font sizes from `src/styles/type.module.css` (`src/test/type.test.ts`).
- `Icon` sizes are 16, 18, 20 or `'em'`. A help answer is 2 sentences at most.
- Tabs are Puzzles, People, League, You. On a phone the dock names the tab, so the page title is for screen readers only.
- Most players are guests under 13. A guest never sees other players to follow; the ask is "Ask a grown-up to sign in".
- Numbers on screen follow the real rules: `src/engine/stars.ts` (half found is 1 star), 100 points a word, 25 a tip-off. A result under half found banks no points.
- A pack's puzzles come from one place: `getPassage` and `caseClues` in `src/games/catalog.ts`. `src/games/cases.test.ts` holds the path to them in every language.

## Done means

- `npm run verify` passes, and `npm run test:db` too if a migration changed.
- A changed screen was looked at in a browser at 390 and 1280 wide, light and dark, before it is shown to the owner.
- Commit, push and deploy only when the owner asks. No line in a commit, PR or file names Claude or AI as an author.

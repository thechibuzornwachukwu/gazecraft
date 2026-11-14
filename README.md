# Gazecraft

A word game for kids. Words hide across the gaps in ordinary sentences: "This is a most remarkable puzzle" hides AMOS. You are a young detective, your pet partner helps, and each pack of puzzles is a case to close.

Play it at [fignda.pages.dev](https://fignda.pages.dev). No account needed.

## What is in the game

- **25 packs** in English, plus puzzles written in Spanish (8), French (7) and German (3). The screens are in all four languages.
- **A pack is a case.** Its puzzles open in order: passages of one text, then special rounds (Liar, Groups, Relay, Mirror, Series, sums).
- **Stars and points.** Half the words found is 1 star and a solved puzzle, 80% is 2 stars, and all found with no tip-off and no wrong pick is 3. A word is 100 points, a tip-off costs 25.
- **Pets.** Mochi the cat is free. Tobs, Puff and 404 join at 3,000, 9,000 and 20,000 points.
- **People and League.** Accounts are for players aged 13 and over. They follow friends, cheer medals and play a weekly league. Guests play everything else, and their points are kept in the browser they play in.

## Run it

You need Node 22 or later, and Docker for the database tests only.

```sh
npm install
npm run dev          # the site, at http://localhost:5173
npm run worker:dev   # the API, at http://localhost:8787
```

Without Supabase keys the game runs as a guest: puzzles, stars, pets and points all work, People and League do not.

## Check it

```sh
npm run verify       # secrets, lint, types, unit tests, dependency audit
npm run test:db      # the database rules, needs Docker
npm run e2e          # browser tests, needs the local stack
```

`git push` runs `npm run verify` first. On Windows it runs the tests through PowerShell, because Vitest fails under Git Bash.

## How the code is laid out

| Folder | What is in it |
| --- | --- |
| `src/engine` | The puzzle rules: building a puzzle from text, checking a pick, stars, the path through the packs |
| `src/games` | The catalogue, each game type, the case cards |
| `src/routes` | One file per screen |
| `src/components` | Shared pieces: the swipe deck, the tab bar, the pet |
| `src/i18n` | Spanish, French and German, keyed by the English text |
| `data` | The puzzles, word lists, Liar statements and Groups boards |
| `worker` | The Cloudflare Worker: checked scores, invites, made and generated puzzles, reminders |
| `supabase` | Migrations, row rules and the seed |
| `design` | The spec, the style guide, the build plan, security rules |

## Deploy

Deploy in this order, so the site never calls an API or a table that is not there yet:

```sh
npx supabase db push
npm run deploy:api
npm run deploy:site
```

The site is on Cloudflare Pages as `fignda`, the API as `fignda-api`. Both keep the old name until the domain is bought.

## Where to read next

- [design/BUILD_PLAN.md](design/BUILD_PLAN.md): what is left to build, and what the owner still has to decide.
- [design/V3_STYLE.md](design/V3_STYLE.md): how every screen looks and talks.
- [design/SPEC.md](design/SPEC.md): how each part works.
- [design/SECURITY.md](design/SECURITY.md): the rules for secrets, accounts and scores.
- [CLAUDE.md](CLAUDE.md): the short version, for coding agents.

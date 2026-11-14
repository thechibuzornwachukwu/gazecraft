# Build plan

What is left for Gazecraft, in sets that ship one at a time. What is built is in `SPEC.md` and git history; how to run, check and deploy is in `CLAUDE.md`.

## To build, in sets

Each item names who champions it. **Opus**: engines, the server, data, money, anything that can cost points or trust. **Sonnet**: screens, drawing, research. **Haiku**: tests, copy, screenshots. **Free model** (OpenRouter's free tier): bulk drafts of words only, never code, always checked by the engine or a person. **You**: accounts, money, signatures and decisions.

One set at a time. Each set is small, works on its own and leaves the live game whole. After each set: lint, typecheck, unit tests and the browser tests pass.

### 12. Your language first

A Spanish player today gets the 8 Spanish puzzles first, then all 25 English packs with "(en inglés)" on them. A hidden-word sentence cannot be translated: each one is written in its own language, so every language needs its own puzzles.

- [ ] **Sonnet.** **Set 12a. The deck in your language.** In Spanish, French or German, the Puzzles deck holds that language's puzzles only. The English packs move to their own shelf, "Practise English", which Set 10f gives a reason to be there.
- [ ] **Free model** drafts, the engine keeps only sentences whose words truly hide, **a native speaker** reads them, **Haiku** adds them. **Set 12b. 15 puzzles in each language.** Today: Spanish 8, French 7, German 3 (`data/games.{es,fr,de}.json`). German first.

### 11. Sign up and come back

3 accounts, 1 active player: people play as guests, forget the game, and never sign up.

- [x] **Opus** (flow, server), **Sonnet** (screens). **Set 11a. Ask at the win.** The sign up ask at the moment a puzzle is won, as "keep your streak", not only at the guest wall. A guest's progress (stars, clues, streak) is carried into the new account. Built: the run line after any win, the link reads "Keep your streak" from a run of 2, and the guest's days move to the account (`merge_guest_days`, migration `20261103000100_guest_days.sql`). Deploy owed: `npx supabase db push`, then `npm run deploy:site`.
- [ ] **Sonnet.** **Set 11b. Back on the home screen.** An install prompt (add to home screen) after the second win, and reminders offered to guests too, not only signed in players.

### 10. New game types

- [ ] **You** decide, then **Opus** (engine, replay, scoring) and **Sonnet** (screens). **Set 10d. Against the clock.** Proposed by the owner on 3 Nov 2026: now and then a Series or hidden words clue is played to a countdown, and the player finds as many as they can before it ends. Open questions: how long, how it is scored and starred when not everything can be found, and how the server checks the time (the play log already carries it).
- [ ] **You** decide, then **Opus** and **Sonnet**. **Set 10e. Word jumble.** Proposed by the owner on 3 Nov 2026: a new game type, letters shuffled, make the word. Needs a word list checked for crude and rare words, like Relay's.

- [ ] **Opus** (engine) and **Sonnet** (screens), **you** check the word pairs. **Set 10f. Translation.** Proposed by the owner on 14 Nov 2026; both versions wanted. (1) *Find the word*: the partner shows a word in the player's language, PERRO, and the player finds DOG hiding in an English sentence. The same pick and check as hidden words, so it can be a clue in an English pack. (2) *Word cards*: a word in one language and 4 in the other, tap or swipe the match, like the Liar deck. Easier for the youngest. Word pairs start from the topics the packs already have (animals, colours, fruits, the body), checked by a person, one list per language.
- [ ] **Free model** drafts, **you** check, **Haiku** adds. **Set 10c. More boards.** Each category has 1 Groups board and 1 Liar bank today, so every pack in a category shows the same Groups board. 3 more Groups picture boards for General, Science and Health (`data/groups.json`, Fluent Emoji 3D icons only), and 10 more Liar statements for each category (`data/liar.json`).
- [ ] **Opus.** Relay reaches 6 of 25 packs. Find more chains (a wider word list from SCOWL level 35, or 2-link chains on short packs) without letting in crude or rare words.
- [ ] **Free model** drafts paragraphs, the engine keeps only those whose words truly hide, **Haiku** adds them to `data/games.json`. **Set 10b. More packs,** 5 at a time, on topics players ask Make for most.

### 7. Pets

- [ ] **You** (Paystack), then **Opus** (payments), **Sonnet** (drawing the outfits). **Set 7p. Outfits for sale,** once Paystack is in: more outfits for each pet, bought once, cosmetic only.

### 8. Data and privacy (GDPR, Nigeria's NDPA)

Play with no account, and sponsors get numbers, never people.

- [ ] **You** (the agreement), then **Opus** (members only see their own). Private boards: a data agreement with the school or company, and an organiser who sees only its own members.
- [ ] **You** (a lawyer's read), then **Sonnet** (the age check screen). EU players under 16 checked before any marketing there.

### 9. Smaller

- [ ] **You** (SMTP), then **Sonnet**. Reminders by email, once SMTP is set.
- [ ] **Free model** drafts the emails, **you** edit and set up Loops. Later, with it: email sequences on Loops, to teach a new player the game a little at a time (the first puzzle, a circle, a pet). Advised to the owner. It needs the domain and a yes from the player at sign up, it is a new company that receives email addresses, so the privacy page names it, and every email has a way out. No guilt and no word about what would be lost, as in reminders.

## Owner

- [ ] **You.** Add the contact line to the pitch (https://claude.ai/code/artifact/6f192f99-4099-4177-b67e-ef36ca74b316), then share it from its Share menu.
- [ ] **You.** Set up Google sign in in Supabase. A 6 digit email code is the hardest step for a new player, and one tap removes it. Likely worth more than any change to guest mode.
- [ ] **You.** Decide: the name (suggested: keep Gazecraft. Free as .com and .game on 9 Oct 2026, registry check only: gazecraft, keensleuth, sleuthtrail, cluestop, plainsleuth, loupequest).
- [ ] **You.** Decide: what is sold to a church, a school or a wedding now. The price list sells a puzzle on the buyer's subject.
- [ ] **You.** Prices for the models above. None is set. Pets open at 3,000, 9,000 and 20,000 points for now (`PARTNER_POINTS` and `partner_slots`): confirm or change.
- [ ] **You.** The robot is named 404. A trademark search on that name has not been run.
- [ ] **You.** A list of 20 people to ask first: brands, schools, churches, event planners.
- [ ] **Sonnet** drafts, **you** decide. What a sponsor may and may not write.
- [ ] **You.** Buy the domain. Unlocks reliable email, Paystack on our own address, and ads.
- [ ] **You.** Paystack: account, the business details it asks for, a test payment.
- [ ] **You.** A lawyer's read before private boards for schools, before ads, and before any under-13 account.
- [ ] **You.** OpenRouter: buy $10 of credit once. The daily limit goes from 50 requests to 1,000.
- [ ] **You.** Custom SMTP (Brevo, free) so sign in emails carry a 6 digit code. The branded email is ready.
- [ ] **You.** Reminder keys: `npm run push:keys`, the public key and `VAPID_SUBJECT` in `worker/wrangler.toml`, `npx wrangler secret put VAPID_PRIVATE_KEY --config worker/wrangler.toml`, `npm run deploy:api`.
- [ ] **You.** Groq key, optional: `npx wrangler secret put GROQ_API_KEY --config worker/wrangler.toml` and `worker/.dev.vars`.
- [ ] **You.** Read: the Liar statements (`data/liar.json`, about 90, each with its source) and the 3 Groups boards (`data/groups.json`). A wrong fact or a set with 2 answers is unfair to a player.
- [ ] **You.** Read: the look tags on hairstyles (`src/avatar/parts/hair.ts`), the 4 Naija packs in `data/games.json`, the 7 terms in `worker/src/blocklistLocal.ts`, and 10 machine-written puzzles from the live site.
- [ ] **Haiku** looks them up, **you** check. The dates of the moving seasons for the year ahead, for `data/holidays.json`: Lunar New Year, Easter, Ramadan and Eid, Diwali.
- [ ] **You.** Decide: which seasons a player sees by default. Suggested: the ones the whole world shares the weather or the date for (New Year, spring, summer, harvest, December snow), and the rest by where the player is or what they choose.
- Still under the old name until the domain exists: fignda.pages.dev, the Cloudflare projects `fignda` and `fignda-api`, the local Supabase project id, the database functions `fignda_day_no` and `fignda_score`.

## Running it in production

None of these exist yet. Each matters before the first school or paying sponsor.

- [ ] **Opus.** Error tracking for the site and the Worker, with no player data in the reports.
- [ ] **Opus.** An uptime check on the site and `/api/health`, telling the owner when either is down.
- [ ] **You** (the plan), then **Opus.** Database backups you have restored once, so you know they work.
- [ ] **Opus** drafts, **you** keep. What to do when something leaks or breaks: who is told, what is switched off, what players are told.
- [ ] **Opus.** Rotating every secret (Supabase service key, VAPID, Groq, OpenRouter) on a date, and a note of when each was last changed.

## Checks still owed

- [ ] **Opus.** `supabase/migrations/20261114000100_one_pack_rule.sql` (one rule for a finished pack, a run day for a whole puzzle, leagues that count a clue once) has not run anywhere. `npm run test:db` with Docker running, then `npx supabase db push`. Until then the server keeps the old rules for pack badges, run days and league points.
- [ ] **Opus.** The browser tests (`e2e/`) still look for the screens before V3: the path list, the old titles and the clock. Rewrite them for the case deck, the speech bubble, the case card and the stamped result, then run them against the local stack.
- [ ] **Sonnet.** Liar does not keep the true statements already swiped past: after a reload they come back. The score is not affected.

- [ ] **Opus.** The browser tests for the 4 new games (Liar, Relay, Series, Groups) and the Your People phone test (the dot on the tab), with the local Supabase stack running. They were checked by hand in a browser, not by the e2e suite.
- [ ] **Opus.** Your People's Top players feed is slow on a database with many plays (`squad_feed` reads `player_points()` for everyone). Fine at today's size; measure before it grows.

- [ ] **Opus.** The safety model (Llama Guard) with one real call. Its answer shape is assumed.
- [ ] **You.** On real phones: the dock on an iPhone Home Screen app, a room game on 2 phones, a machine-written puzzle through the site, the waiting screen with the phone locked.
- [ ] **You,** or **Sonnet** in your browser once you are signed in. Signed in screens on the live site with a real second account.
- [ ] **You.** One real push on Android and iPhone. Needs the reminder keys.
- [ ] **Sonnet** (research). The numbers in `INSIGHTS.html` against primary sources before any goes on a public page. Its "13 badges" (lines 80 and 89) too.

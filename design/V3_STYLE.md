# Gazecraft V3 style: the detective's desk

The chosen direction for every screen (14 Nov 2026). The drawn screens, phone and desktop, live on the design canvas https://claude.ai/artifact/JbKLCbSBKMWk8APcB2aLUw (private to the owner). Build the app's screens to match them. The `/_blob/...` urls below are art stored on that canvas; in the app the same art comes from `public/pets`, `public/icons/fluent` and `design/characters/characters.ts`.

Every screen is a page of a kids' word game where you are a young detective and your pet partner helps. Fun first, never cluttered. The reference artboards are Puzzles on the canvas (`Main.dc.html` for phone, `PuzzlesDesktop.dc.html` for desktop): copy their patterns, helmet block, header and dock.

## Who it is for
Kids 8 to 14 and the families who play with them. One clear thing to do per screen. A pet character is always on stage and reacts to what the player does.

## The canvas format (for drawing on the canvas only; each artboard is one `.dc.html` file, and a broken rule fails silently)
- Copy the skeleton of `Main.dc.html`: `<!doctype html>`, `<script src="./support.js"></script>` in `<head>` exactly, `<x-dc>` with a `<helmet>` (Google Fonts link + `<style>`), then the markup, then `<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":W,"height":H}}'>` with `class Component extends DCLogic { renderVals() { return {...}; } }`.
- Close every element, quote every attribute. Styles inline (`style="..."`). The helmet `<style>` holds only `body{margin:0;background:#f6f6f7}`, link colours, the keyframes and animation classes below.
- `{{hole}}` is a dotted lookup into `renderVals()` only, never an expression. Compute in JS.
- Loops: `<sc-for list="{{items}}" as="item" hint-placeholder-count="3">`; branches: `<sc-if value="{{flag}}" hint-placeholder-val="{{ true }}">`. Events: `onClick="{{fn}}"`, `onPointerDown="{{fn}}"` etc, functions returned from `renderVals()`; state via `this.state` / `this.setState`.
- All UI is markup. Never build DOM in script. No global keydown handlers. No `<iframe>`. Icons: inline stroke SVG (24 viewBox, stroke 2 to 2.6, round caps) or the uploaded art below. Never emoji.
- Links between artboards: `<a href="GamePhone.dc.html">` (style the `<a>` as the button). Phone screens link to phone screens, desktop to desktop.
- PHONE artboard: root `<div style="width: 390px; height: Hpx; box-sizing: border-box; position: relative; overflow: hidden; ...">`, fixed size, the dock `<nav>` absolutely at the bottom (copy from `Main.dc.html`, set `aria-current="page"` and the green pill style on the tab you are on; the game and result screens have NO dock). H is as tall as the content needs (800 to 1700).
- DESKTOP artboard: a fluid PAGE. Root `<div style="min-height: Hpx; ...">`, header copied from `PuzzlesDesktop.dc.html`, then `<main style="max-width: 1200px; margin: 0 auto; padding: 40px 24px 60px; display: flex; flex-wrap: wrap; gap: 48px">` with a main column `flex: 999 1 560px; min-width: 0` and a side column `flex: 1 1 340px; min-width: 0`. Must still work at phone width (it wraps). `$preview` width 1280, height = its height at 1280.

## Look
- Background `#f6f6f7`. Surfaces `#ffffff` with `1px solid #e3e3e7`, radius 20 to 24, and a solid drop "ledge" `box-shadow: 0 6px 0 #e3e3e7` (the toy-like feel: things look pressable). Dark panels `#111113` with white text for rewards and secrets.
- Ink `#111113`; secondary `#55555c`; tertiary `#6a6a72` (lowest allowed for text on white). Lime `#d4f04c` means FOUND, NOW or GO: the primary round button, a found word, the current stone. Its dark ink for text on white: `#5a6b00`. Ledge under lime: `#a8c22c`.
- Pack hues (tinted, for card headers): science `#c9c0ff`, football `#a6e9ee`, space `#dcd3ff`, fruit/market `#ffd0c9`, animals `#c7dcff`, Bible `#ffc9c2`, names `#ffd9b0`, health `#ffc8dc`, AI `#efcfff`, history `#fbe7a6`, Naija `#bff0d8`. Full strength for small swatches: `#9b8cff` `#4fd1dc` `#6aa3ff` `#f06a5a` `#ff9f43` `#ff8bb0` `#d48cff` `#f2c94c` `#3ec486`.
- Type: headings Bungee (`font-family: Bungee, Manrope, sans-serif; font-weight: 400`), CAPITALS, 16 to 44px. Everything else Manrope 600 to 800. Puzzle text Manrope 600, 21 to 30px, line-height 1.6.
- Buttons: the primary action is a big round lime button (84 to 96px) with a dark play triangle and the lime ledge, or a lime pill `min-height: 56px; border-radius: 999px` with a word on it. Secondary: white round 60px with the grey ledge. Every tap target at least 44px.
- Stamps (FOUND, PUZZLE SOLVED, CASE CLOSED for the last puzzle of a pack, PLAY!): Bungee in a 3px bordered, rotated rectangle, drawn in markup (see the PLAY! stamp on the Puzzles card).

## Characters (use the uploaded art; urls go in verbatim)
Pets: Mochi the cat (every new player's partner and the host of every screen), Tobs the dino, Puff the dog, 404 the robot. A new pet slot opens at 3,000, 9,000 and 20,000 points, and the player chooses who fills it, so a pet the player has not chosen appears only as a black silhouette with a lime ? (never in colour).
- Mochi waving `/_blob/72ac21c6abd315fc09fce9f4cd789575` · detective with magnifier `/_blob/d187597c53c1f65f02e75d28f635beff` · thinking with monocle (bust) `/_blob/f9bac90c57f275dc5e6401be7e1e99b0` · stumped `/_blob/138a2e49267565bf4ce99a85f687007a` · sleepy `/_blob/cae242e561d8e10e1cdac0ffdf83df0e`
- Tobs party hat `/_blob/2fa91e21cde51d51069fa9063f56cfe3` · Tobs found `/_blob/cc81d37f321de303ead62c1af8da032a`
- Puff beanie found `/_blob/b325ff236415e58d329c7d73f4a47fb4` · Puff waving `/_blob/01e46bbba211d7b4bd81bcfd9b841e16`
- 404 calm `/_blob/72507b15ee8cfb2fb62e1d386f82ae8b` · 404 found `/_blob/1380f645e9d2c2881f8d192b102de787`
- A pet still locked: any pet `<img>` with `style="filter: brightness(0); opacity: .9"` plus a twinkling lime `?`.
Players (round avatars, 96px art, show at 28 to 64px with `border-radius: 50%`): Ada `/_blob/7f7dc653e8bd7e13eaad2bdac65ebe80` (the player), Tunde `/_blob/17b026fe950ab35628208bdd863f8474`, Chioma `/_blob/0e5fb23b12e69d5134ffed41f73eff9c`, Leo `/_blob/8a35e7de62b14ec052490277f8789ba4`, Zara `/_blob/b4f80130c01f32dac8bc5a9e2c441205`, Sam `/_blob/bc15cc2e2d84081c8562e882293e6ce0`.
Rank shields: `/_blob/61938ab8b1d71a1660f0f4326e21fb26`, `/_blob/3c65dd5db931216707ce6dd11638909a`. The ranks are Starter, Keen, Sharp and Master (src/engine/level.ts), 5 levels each.
3D topic icons: microscope `/_blob/7635086556d8c6e73873e2f04285f82e`, football `/_blob/f6a3715fa4c1c5b2b0268cba7182e2a3`, planet `/_blob/c63465f1ba526143e4af88d655f94be3`, apple `/_blob/2b9bef2bf4c6af4f00c5afc2fbb298b5`, elephant `/_blob/7fb250dd3c5251cd91cf189dba756682`, star `/_blob/e0a30d7867daccf828ee24febdd83699`, fire `/_blob/05ee42fd226623caa242489e39309c3a`.

## Motion (copy these into the helmet; every one stops under reduced motion)
```
@keyframes bob{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-8px) rotate(2deg)}}
@keyframes glow{0%,100%{box-shadow:0 0 0 0 rgba(212,240,76,0)}50%{box-shadow:0 0 0 5px rgba(212,240,76,.45)}}
@keyframes hop{0%,100%{transform:translateY(0)}40%{transform:translateY(-14px)}60%{transform:translateY(-14px)}}
@keyframes twinkle{0%,100%{transform:scale(1) rotate(0)}50%{transform:scale(1.18) rotate(12deg)}}
@keyframes flame{0%,100%{transform:scale(1) rotate(-3deg)}50%{transform:scale(1.1) rotate(3deg)}}
@keyframes pop{0%{transform:scale(.6);opacity:0}70%{transform:scale(1.06);opacity:1}100%{transform:scale(1)}}
@keyframes cheer{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
.bob{animation:bob 2.6s ease-in-out infinite;transform-origin:50% 100%} .glow{animation:glow 1.8s ease-in-out infinite}
.hop{animation:hop 1.4s ease-in-out infinite} .twinkle{animation:twinkle 2.2s ease-in-out infinite}
.flame{animation:flame 1.1s ease-in-out infinite;transform-origin:50% 90%} .pop{animation:pop .35s ease-out both}
.cheer{animation:cheer 1.6s ease-in-out infinite}
@media (prefers-reduced-motion: reduce){.bob,.glow,.hop,.twinkle,.flame,.pop,.cheer{animation:none}}
```
Add your own keyframes when a screen needs one (a stamp slamming down, confetti falling, a card flipping), always with the reduced-motion override.

## Natural interaction: every screen gets one
Borrow a gesture kids already know from outside games, and make it real in the artboard with state: a swipe deck (Puzzles), a stamp you press, a card you flip, a sticker you peel, a ticket you tear, a slider you drag, a chest you tap open, cards you fan out, a tape measure you pull. Always offer a plain button that does the same thing, for a mouse, a keyboard and a screen reader.

## Words
- Short and warm, the way a friendly older kid talks. Sentence case except Bungee headings. No em dashes. No "Your ..." page titles; tabs are Puzzles, People, League, You.
- The pet speaks in a speech bubble: `<p role="status" class="pop" style="... background: #111113; color: #ffffff; border-radius: 18px 18px 18px 4px; ...">`. It reacts to what just happened.
- Real content only. Puzzle text, pack names and hidden words come from `data/games.json` (field `text`, `title`, `noun`, `expectedAnswers`). Pick passages where you can check the hidden word letter by letter across the gap. Player names: Ada (the player), Tunde, Chioma, Leo, Zara, Sam. Sample numbers must match the game's rules and agree across screens: Ada has 1,240 points (rank Starter, level 3, 140 of 720 to level 4), a 3-day run, 12 stars, goal Regular (2 a day, 2 of 2 today), 0 packs finished (Short note 2 of 5), so every outfit and gear piece is still locked with its real need (src/lib/petOutfit.ts, src/avatar/earned.ts); badges earned: First puzzle and a 3 day run.

## Never
Eyebrow labels (small all-caps over a heading), three icon cards in a row, gradient washes, left-border cards, emoji, lorem ipsum, a second focal point competing with the main one, helper text a layout could make unnecessary, fake status bars.

## Accessible as drawn
Real `<button>` and `<a href>`; `aria-label` on icon-only controls; decorative images `alt=""`; text contrast 4.5:1 (use the inks above); colour never the only signal (found words also get a mark or a tick).

## Learned in review
- One chrome on every screen: the phone dock has word labels (Puzzles with a magnifier, People, League, You with the player's avatar) and the desktop header has the logo, three links, the streak and stars chips, and the avatar. No page title on phone tabs; the dock names the tab.
- Accounts are for 13 and over, so most players are guests: People, League and You each have a guest state with one action, "Ask a grown-up to sign in", and show what works without an account.
- No running clock in a puzzle; time shows on the result. A result under half found has no stamp, banks no points and offers Try again.
- Touch: tap targets at least 44px (a tap snaps to the nearest letter), and no drag surface may block page scrolling.
- Children do not get stranger suggestions: "Invite a friend" with a link replaces "People to follow".
- Numbers follow the game's real rules: 100 points a word, 25 a tip-off, stars from `src/engine/stars.ts` (6 of 8 found is 1 star; 2 stars needs 80%). Never write a count the data does not hold; say "Find the rest" instead.
- The first card on Puzzles is the case the player is in the middle of, with its own progress stones; new cases follow. A new player (no streak, no stars) gets Mochi's introduction instead.
- Every pack stays reachable: the "All cases" shelf (a sheet on phone, the side column on desktop).
- One panel per idea: the team and the next pet to unlock are one panel; the rank lives on You only.
- Tabs and page titles are plain names: Puzzles, People, League, You.

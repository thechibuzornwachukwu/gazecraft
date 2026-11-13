# Moving a line into the translation layer

Every line a player can see or hear goes through `t()` from `src/i18n`. The English line itself is the key.

## Do

- Visible text, `aria-label`, `title`, `placeholder`, `alt`, `label` props, button text, error and status lines, toasts.
- `<p>Sign in</p>` becomes `<p>{t('Sign in')}</p>`.
- A line with values: `` `${n} found` `` becomes `t('{n} found', { n })`. Name slots after what they hold: `{n}`, `{name}`, `{title}`, `{secs}`.
- A count with a noun: `n === 1 ? '1 player' : `${n} players`` becomes `plural(n, '{n} player', '{n} players')`.
- A sentence split by a link: keep each piece a key, in reading order. `Sign in{' '}` stays 2 keys with the link between.
- A table of lines at module level (like `const HOW = {...}`): wrap each string where it is written. `t()` is safe at module level.
- Numbers shown to a player: `n.toLocaleString('en-US')` becomes `num(n)` from `src/i18n`.
- Add every key you use to the area's file in `src/i18n/es/` with `''` as its value, in the order you meet them. One key once per file. Keep the file's `} as const;`.
- Import with a relative path: `import { t, plural, num } from '../i18n';` (only what you use).

## Do not

- Puzzle content: anything from `data/games.json`, answers, passages, statements, `def.title`, `def.noun`, `def.category`, player names and handles.
- Keys for storage, routes, URLs, class names, `data-*` values, event names, analytics, console messages, thrown `Error` text, test ids.
- `*.test.*` files, `CardsHarness.tsx`, anything under `src/engine` unless listed for you.
- Do not change what a line says. Not a word, not punctuation. Wording is reviewed later.
- Do not reformat code you did not change.

## Check

- `npx tsc -p .` (slow: up to 4 minutes, give it a 300000 ms timeout). A key missing from the `es` files is a type error: add it.
- `npx vitest run <the test files for your files>` from PowerShell, not Git Bash (Git Bash breaks vitest on this machine). Tests read English, and English is the default, so they should pass unchanged.

// SEO, GEO and link previews. One source for every public page's title, description, preview image,
// structured data (JSON-LD) and crawler-readable text. Used by Pages Functions only (never the app
// bundle). Facts only: nothing here claims numbers we do not have.

import gamesFile from '../../data/games.json';
import { pick } from '../copy';
import { buildHiddenWords } from '../engine/hiddenWords';
import { sponsorOf } from '../engine/sponsor';
import { HELP_ARTICLES, helpArticle } from '../help/articles';
import type { HelpArticle } from '../help/types';

type Game = { id: string; category: string; title: string; noun: string; text: string; dict: string[]; sponsor?: unknown };
const data = gamesFile as unknown as { games: Game[]; dailyPool: string[]; filters: string[] };
/** Curated order for lists: follows the filter tabs, so no single topic leads. */
const games = [...data.games].sort((a, b) => data.filters.indexOf(a.category) - data.filters.indexOf(b.category));

export const SITE = 'Gazecraft';
export const PITCH =
  'A free word puzzle game in your browser. Words hide across the gaps in real sentences: in "Pat omitted", ATOM is hiding. No download and no account.';

/** What people type when they look for a game like this. Honest about what it is: a word puzzle, never a promise. */
export const SEARCH_TERMS = ['word puzzle', 'hidden words', 'word search', 'word game', 'brain teaser', 'puzzle game', 'free online game', 'number puzzle', 'play with friends'];

export type ProfileSummary = {
  handle: string;
  name: string;
  current_streak: number;
  dailies: number;
  perfect: number;
  followers: number;
};

export type Page = {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  /** Path used for the canonical link and og:url. */
  canonical: string;
  jsonLd: object[];
  /** Plain HTML for readers that do not run JavaScript (AI crawlers, some previewers). Escaped. */
  body: string;
  /** Keep this page out of search results. */
  noindex?: boolean;
};

export const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const count = (g: Game) => buildHiddenWords(g).answers.length;
const level = (g: Game) => buildHiddenWords(g).difficulty;
const question = (g: Game) => `Can you find ${count(g)} ${g.noun}?`;
/** The first hidden word of a puzzle and the letters it hides in: "le, Mon" and LEMON. Null when there is none. */
function example(g: Game): { phrase: string; word: string } | null {
  const p = buildHiddenWords(g);
  const a = p.answers.flatMap((x) => x.spans.map((span) => ({ label: x.label, span }))).sort((x, y) => x.span[0] - y.span[0])[0];
  if (!a) return null;
  const from = p.chars.findIndex((c) => c.li === a.span[0]);
  const to = p.chars.findIndex((c) => c.li === a.span[1]) + 1;
  return { phrase: p.chars.slice(from, to).map((c) => c.ch).join(''), word: a.label.toUpperCase() };
}
/** "With NAME." on a sponsored puzzle, else nothing. The same rule and the same line as the app. */
function withLine(g: Game): string {
  const s = sponsorOf(g.sponsor);
  // "Chi Farms Ltd." already ends its own sentence.
  return s ? `${pick('sponsorWith', { name: s.name }).replace(/\.$/, '')}.` : '';
}
/**
 * The rounds that are not about a pack's topic, by clue number, and what each asks. The numbers are the engine's
 * (src/engine/journey.ts SUMS_FROM, 21 to 29; src/engine/specials.ts, 31 to 35), written here so the page builder
 * loads no translations.
 */
const ROUNDS: Record<number, readonly [name: string, ask: string]> = {
  21: ['Hidden sums', 'Find the runs of digits that add up to the target.'],
  31: ['Mirror', 'Find the words that read right to left.'],
  32: ['Relay', 'Find the chain where each word starts as the last one ends.'],
  33: ['Series', 'Find the runs of digits that step up or down evenly.'],
  34: ['Liar', 'Spot the statements that are false.'],
  35: ['Groups', 'Sort 16 words into 4 groups of 4.'],
};
/** Joins sentences, leaving out the empty ones. */
const say = (...parts: string[]) => parts.filter(Boolean).join(' ');

export const FAQ: Array<[string, string]> = [
  ['What is Gazecraft?', PITCH],
  [
    'How do you play?',
    'Read the paragraph and drag across the letters of a hidden word. On a phone, swipe across the letters, or tap the first letter and then the last. Answers can run across spaces and punctuation.',
  ],
  ['Is Gazecraft free?', 'Yes. Every puzzle is free to play in your browser, on a phone or a laptop. There is nothing to download.'],
  [
    'Is it like word search, Wordle or 4 Pics 1 Word?',
    'It is its own game. Like a word search, you find hidden words, but they hide across the gaps in real sentences, not in a grid of letters. Like Wordle, each puzzle is short. It takes focus: most players read straight past a few.',
  ],
  ['Can I play with friends?', 'Yes. Open a puzzle, choose Play together and send the link. Everyone finds words on the same board at once, and there is a weekly league.'],
  ['Do I need an account?', 'No. You can play as a guest. Sign in to keep your streak, get on the leaderboard and follow other players.'],
  [
    'How is the score counted?',
    '100 points per word found, minus 25 for each tip-off. Finding every word adds a time bonus.',
  ],
];

const GAME_LD = {
  '@context': 'https://schema.org',
  '@type': 'VideoGame',
  name: SITE,
  description: PITCH,
  genre: ['Word game', 'Puzzle', 'Word search', 'Brain teaser'],
  keywords: SEARCH_TERMS.join(', '),
  gamePlatform: 'Web browser',
  applicationCategory: 'Game',
  operatingSystem: 'Any',
  playMode: ['SinglePlayer', 'MultiPlayer'],
  inLanguage: 'en',
  isAccessibleForFree: true,
  offers: { '@type': 'Offer', price: 0, priceCurrency: 'USD' },
};

function crumbs(origin: string, items: Array<[string, string]>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${origin}${path}` })),
  };
}

const faqHtml = () =>
  `<h2>Questions</h2>${FAQ.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join('')}`;

function home(origin: string): Page {
  const list = games.map((g) => `<li><a href="/play/${g.id}">${esc(question(g))}</a> ${esc(g.category)}, ${esc(level(g))}.</li>`).join('');
  return {
    title: 'Gazecraft: free hidden word puzzle game',
    description: `"Pat omitted" hides ATOM. Words hide across the gaps in real sentences. ${games.length} packs, free, no account needed.`,
    image: '/og/default.png',
    imageAlt: 'A Gazecraft case card: "This line is a most ordinary sentence", with "a most" lit up because it hides AMOS.',
    canonical: '/',
    jsonLd: [
      { ...GAME_LD, url: `${origin}/` },
      { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE, url: `${origin}/`, description: PITCH, inLanguage: 'en' },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
      },
    ],
    body:
      `<h1>${SITE}: a free hidden word puzzle game</h1><p>${esc(PITCH)}</p>` +
      `<p>Short word puzzles and number puzzles, a few minutes each. Play alone, or play with friends in a room and a weekly league. No download, no account needed.</p>` +
      `<h2>How to play</h2><ol><li>Open a pack.</li><li>Read the paragraph.</li><li>Drag across the letters of each hidden word. They can run across spaces and punctuation.</li></ol>` +
      `<p>Example: in "Pat omitted nothing", the letters "Pat omitted" hide ATOM.</p>` +
      `<h2>Puzzles</h2><ul>${list}</ul>` +
      faqHtml(),
  };
}

function gamePage(origin: string, g: Game): Page {
  const q = question(g);
  const ex = example(g);
  const more = count(g) - 1;
  return {
    title: `${q} · Gazecraft`,
    description: say(
      ex ? `"${ex.phrase}" hides ${ex.word}. ${more} more ${g.noun} are hiding in the same paragraph.` : `${count(g)} ${g.noun} are hiding in one paragraph.`,
      `${level(g)}, free, no sign up.`,
      withLine(g),
    ),
    image: `/og/${g.id}.png`,
    imageAlt: say(`Gazecraft puzzle: ${q}`, withLine(g)),
    canonical: `/play/${g.id}`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Game',
        name: `${g.title}: ${q}`,
        description: `A Gazecraft word puzzle. ${count(g)} ${g.noun} are hidden across spaces and punctuation in one paragraph.`,
        url: `${origin}/play/${g.id}`,
        genre: 'Word puzzle',
        isAccessibleForFree: true,
        isPartOf: { '@type': 'VideoGame', name: SITE, url: `${origin}/` },
      },
      crumbs(origin, [
        ['Gazecraft', '/'],
        ['Games', '/play'],
        [g.title, `/play/${g.id}`],
      ]),
    ],
    body:
      `<h1>${esc(q)}</h1><p>${esc(say(`${g.category} puzzle, ${level(g)}. Words hide across spaces and punctuation.`, withLine(g)))}</p>` +
      `<blockquote>${esc(g.text)}</blockquote>` +
      `<p><a href="/play/${g.id}">Play this puzzle on Gazecraft</a>. <a href="/play">More puzzles</a>.</p>`,
  };
}

export function profilePage(origin: string, p: ProfileSummary): Page {
  const stats = `${p.current_streak} day run · ${p.perfect} perfect`;
  return {
    title: `${p.name} (@${p.handle}) on Gazecraft`,
    description: `@${p.handle} set the bar: ${stats}. Think you can beat it?`,
    image: '/og/default.png',
    imageAlt: `${p.name} on Gazecraft`,
    canonical: `/u/${p.handle}`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        url: `${origin}/u/${p.handle}`,
        mainEntity: {
          '@type': 'Person',
          name: p.name,
          alternateName: `@${p.handle}`,
          url: `${origin}/u/${p.handle}`,
          interactionStatistic: { '@type': 'InteractionCounter', interactionType: 'https://schema.org/FollowAction', userInteractionCount: p.followers },
        },
      },
    ],
    body: `<h1>${esc(p.name)} (@${esc(p.handle)})</h1><p>${esc(stats)}. ${p.followers} ${p.followers === 1 ? 'follower' : 'followers'} on Gazecraft.</p>`,
  };
}

const simple = (path: string, title: string, description: string, body: string): Page => ({
  title,
  description,
  image: '/og/default.png',
  imageAlt: 'Gazecraft. Find it. Figure it out.',
  canonical: path,
  jsonLd: [{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: title, description }],
  body: `<h1>${esc(title.replace(/ · Gazecraft$/, ''))}</h1><p>${esc(description)}</p>${body}`,
});

/** One help article: its question, answer, steps and facts, as text a crawler reads. */
function helpPage(a: HelpArticle): Page {
  const steps = a.steps?.length ? `<ol>${a.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>` : '';
  const facts = a.facts?.length ? `<ul>${a.facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : '';
  return {
    title: `${a.title} · Gazecraft`,
    description: a.answer,
    image: '/og/default.png',
    imageAlt: 'Gazecraft. Find it. Figure it out.',
    canonical: `/help/${a.slug}`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [{ '@type': 'Question', name: a.title, acceptedAnswer: { '@type': 'Answer', text: a.answer } }],
      },
    ],
    body: `<h1>${esc(a.title)}</h1><p>${esc(a.answer)}</p>${steps}${facts}`,
  };
}

/** Everything a crawler or link previewer needs for one path. Profiles need their summary passed in. */
export function pageFor(path: string, origin: string): Page {
  const clean = path.replace(/\/+$/, '') || '/';
  if (clean === '/') return home(origin);

  const play = clean.match(/^\/play\/([a-z0-9-]{2,40})$/);
  if (play) {
    const g = games.find((x) => x.id === play[1]);
    return g ? gamePage(origin, g) : home(origin);
  }
  // A puzzle of a pack. A word round is the pack's own words: its preview. Any other round is not about the pack's
  // topic (a number round in French names), so it says what it is, with the plain image and no word from the pack.
  const part = clean.match(/^\/play\/([a-z0-9-]{2,40})\/(\d{1,2})$/);
  if (part) {
    const g = games.find((x) => x.id === part[1]);
    if (!g) return home(origin);
    const round = ROUNDS[Number(part[2])] ?? (Number(part[2]) >= 21 && Number(part[2]) <= 29 ? ROUNDS[21] : undefined);
    if (!round) return { ...gamePage(origin, g), canonical: clean };
    return simple(clean, `${round[0]}, in ${g.title} · Gazecraft`, `${round[1]} A round in ${g.title}, free, no sign up.`, '');
  }

  // There is no daily any more. An old link to one, or to its answers, is the cases.
  if (/^\/d\/\d{1,6}(\/answers)?$/.test(clean)) return { ...home(origin), canonical: '/play', noindex: true };

  if (clean === '/play') {
    const list = games.map((g) => `<li><a href="/play/${g.id}">${esc(question(g))}</a></li>`).join('');
    return simple('/play', 'Puzzles · Gazecraft', `${games.length} packs of puzzles. In each, words hide across the gaps in real sentences, a few minutes a puzzle.`, `<ul>${list}</ul>`);
  }
  if (clean === '/leaderboard') return simple('/leaderboard', 'League · Gazecraft', "This week's league on Gazecraft: every word you find moves you along the track.", '');
  if (clean === '/players') return simple('/players', 'People · Gazecraft', "Your friends' medals this month on Gazecraft, and a link to invite more.", '');
  if (clean === '/privacy') return simple('/privacy', 'Privacy · Gazecraft', 'What Gazecraft keeps, why, and how to delete it.', '');
  if (clean === '/help') {
    const list = HELP_ARTICLES.map((a) => `<li><a href="/help/${a.slug}">${esc(a.title)}</a></li>`).join('');
    return simple(
      '/help',
      'Help · Gazecraft',
      'How Gazecraft works: playing, packs, points, leagues, pets, friends and your account.',
      `<ul>${list}</ul>`,
    );
  }

  const help = clean.match(/^\/help\/([a-z0-9-]{2,80})$/);
  if (help) {
    const a = helpArticle(help[1] ?? '', HELP_ARTICLES);
    return a ? helpPage(a) : { ...home(origin), canonical: clean, noindex: true };
  }

  // Custom puzzles, sign in, settings and anything else: generic preview, not indexed.
  return { ...home(origin), canonical: clean, noindex: !clean.startsWith('/u/') };
}

/** URLs worth indexing, for sitemap.xml. Profiles are left out on purpose. */
export function sitemapPaths(): Array<{ path: string; daily?: boolean }> {
  return [
    { path: '/' },
    { path: '/play' },
    ...games.map((g) => ({ path: `/play/${g.id}` })),
    { path: '/leaderboard' },
    { path: '/players' },
    { path: '/privacy' },
    { path: '/help' },
    ...HELP_ARTICLES.map((a) => ({ path: '/help/' + a.slug })),
  ];
}

/** llms.txt: a short, factual guide for AI assistants (https://llmstxt.org). */
export function llmsTxt(origin: string): string {
  return [
    `# ${SITE}`,
    '',
    `> ${PITCH}`,
    '',
    'Gazecraft runs in the browser at no cost. Guests can play every puzzle; signing in keeps a streak, ranks verified scores on the leaderboard and lets players follow each other.',
    '',
    '## Key pages',
    `- [Home](${origin}/): what Gazecraft is and a playable example`,
    `- [Packs](${origin}/play): every pack, a puzzle at a time`,
    `- [League](${origin}/leaderboard): this week's league, where every word you find moves you along`,
    `- [Players](${origin}/players): find players to follow`,
    `- [Privacy](${origin}/privacy): what is stored and how to delete it`,
    '',
    '## Puzzles',
    ...games.map((x) => `- [${x.title}](${origin}/play/${x.id}): ${question(x)} (${x.category}, ${level(x)})`),
    '',
    '## How it works',
    ...FAQ.map(([q, a]) => `- ${q} ${a}`),
    '',
  ]
    .filter((l, i, a) => !(l === '' && a[i - 1] === ''))
    .join('\n');
}

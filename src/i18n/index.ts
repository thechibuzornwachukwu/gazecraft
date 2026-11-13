// Languages. English is the source: its text is the key. Each other language maps every English line to its own.
// `t` takes only keys that es.ts has, so a line nobody listed fails the build; i18n.test.ts fails on any language
// that is missing a line or leaves one empty.

import { de } from './de';
import { es } from './es';
import { fr } from './fr';
import { storage } from '../lib/storage';

export const LANGS = ['en', 'es', 'fr', 'de'] as const;
export type Lang = (typeof LANGS)[number];
export const LANG_NAMES: Record<Lang, string> = { en: 'English', es: 'Español', fr: 'Français', de: 'Deutsch' };
export const LANG_KEY = 'gazecraft-lang';

export type Key = keyof typeof es;
export type Dict = Partial<Record<Key, string>>;
export const DICTS: Record<Exclude<Lang, 'en'>, Dict> = { es, fr, de };
export type Vars = Record<string, string | number | null | undefined>;

function detect(): Lang {
  const kept = storage.get(LANG_KEY);
  if ((LANGS as readonly string[]).includes(kept ?? '')) return kept as Lang;
  const nav = typeof navigator === 'undefined' ? [] : (navigator.languages ?? [navigator.language]);
  // The first language the browser lists that the game speaks.
  for (const l of nav) {
    const base = l?.toLowerCase().split('-')[0];
    if ((LANGS as readonly string[]).includes(base ?? '')) return base as Lang;
  }
  return 'en';
}

/** Read once per page load. Changing it reloads the page, so nothing needs to listen. */
export const lang: Lang = detect();
/** For Intl and toLocaleString. */
export const locale = lang === 'en' ? 'en-GB' : lang;

if (typeof document !== 'undefined') document.documentElement.lang = lang;

export function setLang(next: Lang): void {
  if (next === lang) return;
  storage.set(LANG_KEY, next);
  window.location.reload();
}

/** Fill {name} slots. A missing value leaves nothing, never "undefined". */
export const fill = (text: string, vars?: Vars): string =>
  vars ? text.replace(/\{(\w+)\}/g, (_, k: string) => (vars[k] != null ? String(vars[k]) : '')) : text;

/** The line in the player's language. */
export function t(key: Key, vars?: Vars): string {
  return fill(lang === 'en' ? key : DICTS[lang][key] || key, vars);
}

/** A count with its noun: `plural(n, '{n} word', '{n} words')`. Both forms are keys. */
export function plural(n: number, one: Key, other: Key, vars?: Vars): string {
  return t(n === 1 ? one : other, { n, ...vars });
}

/** A number written the player's way. */
export const num = (n: number): string => n.toLocaleString(locale);

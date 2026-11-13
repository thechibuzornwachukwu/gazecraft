import { HELP_ARTICLES } from './articles';
import { HELP_ARTICLES_DE, HELP_GROUP_DE } from './articles.de';
import { HELP_ARTICLES_ES, HELP_GROUP_ES } from './articles.es';
import { HELP_ARTICLES_FR, HELP_GROUP_FR } from './articles.fr';
import { HELP_GROUPS } from './types';

describe.each([
  ['es', HELP_ARTICLES_ES, HELP_GROUP_ES],
  ['fr', HELP_ARTICLES_FR, HELP_GROUP_FR],
  ['de', HELP_ARTICLES_DE, HELP_GROUP_DE],
] as const)('the %s help', (_lang, ARTICLES, GROUPS) => {
  it('has every article, in the same order and groups, with the same links', () => {
    expect(ARTICLES.map((a) => [a.slug, a.group, a.related ?? [], a.steps?.length ?? 0, a.facts?.length ?? 0])).toEqual(
      HELP_ARTICLES.map((a) => [a.slug, a.group, a.related ?? [], a.steps?.length ?? 0, a.facts?.length ?? 0]),
    );
  });

  it('names every group, and prints no holes', () => {
    for (const g of HELP_GROUPS) expect(GROUPS[g]).toBeTruthy();
    expect(JSON.stringify(ARTICLES)).not.toMatch(/undefined|NaN|null/);
  });
});

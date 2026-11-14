import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup, configure } from '@testing-library/react';

// findBy and waitFor give a page 5 seconds, not 1: in a full run, with both workers busy, a page can be slow to
// open, and how fast it opens is not what these tests check.
configure({ asyncUtilTimeout: 5000 });

// Most tests run in plain Node. The few that need a page say so with `// @vitest-environment jsdom`.
const hasDom = typeof document !== 'undefined';

afterEach(() => {
  if (!hasDom) return;
  cleanup();
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

// jsdom has no matchMedia.
if (hasDom && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

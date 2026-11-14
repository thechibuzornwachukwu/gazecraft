// Text fits in every language. Spanish, French and German run 20 to 40% longer than English, and German makes long
// single words. At the narrowest phone, every screen must show all its text: nothing clipped, nothing spilling out
// of its box or off the screen, and no button label on two lines (a label that does not fit is shortened in its
// language file, not wrapped). Rows that scroll sideways on purpose are left out.
import { expect, test, type Page } from '@playwright/test';

// xx is the pseudo language (src/i18n): every line 40 to 100% longer, so it finds tight spots before a real one does.
const LANGS = ['en', 'es', 'fr', 'de', 'xx'] as const;
const ROUTES = ['/', '/play', '/play/bible/1', '/play/bible/34', '/play/general', '/play/fr-animaux', '/me', '/players', '/leaderboard', '/help', '/help/how-to-play', '/privacy', '/signin', '/welcome', '/circles', '/made'];

type Misfit = { route: string; what: string; text: string };

/** `checkLines`: a button label must sit on one line. The pseudo language checks fit only: its labels run long on purpose. */
async function misfits(page: Page, route: string, checkLines: boolean): Promise<Misfit[]> {
  return page.evaluate(({ route, checkLines }) => {
    const out: { route: string; what: string; text: string }[] = [];
    const vw = document.documentElement.clientWidth;
    const scrollsSideways = (el: Element) => {
      for (let p = el.parentElement; p; p = p.parentElement) {
        const ox = getComputedStyle(p).overflowX;
        if ((ox === 'auto' || ox === 'scroll') && p.scrollWidth > p.clientWidth) return true;
      }
      return false;
    };
    /** The boxes of the text inside an element, line by line. Icons and padding are not text. */
    const textRects = (el: Element) => {
      const rects: DOMRect[] = [];
      const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n = walk.nextNode(); n; n = walk.nextNode()) {
        if (!n.textContent?.trim()) continue;
        // Screen reader text is a 1px box on purpose; it is not on the screen to fit.
        const box = n.parentElement?.getBoundingClientRect();
        if (!box || box.width <= 2 || box.height <= 2) continue;
        const range = document.createRange();
        range.selectNodeContents(n);
        rects.push(...[...range.getClientRects()].filter((r) => r.width > 0));
      }
      return rects;
    };
    for (const el of document.querySelectorAll<HTMLElement>('button, a, label, h1, h2, h3, p, span, li, dt, dd, legend')) {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || el.closest('[aria-hidden="true"]')) continue;
      const rect = el.getBoundingClientRect();
      // Screen reader text is 1px wide on purpose.
      if (rect.width <= 2 || rect.height === 0) continue;
      const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 60);
      if (!text || scrollsSideways(el)) continue;
      const rects = textRects(el);
      const wider = el.scrollWidth > el.clientWidth + 1;
      if (wider && cs.overflowX !== 'visible') out.push({ route, what: 'clipped', text });
      else if (wider && el.children.length === 0) out.push({ route, what: 'spills out of its box', text });
      else if (rects.some((r) => r.right > vw + 1 || r.left < -1)) out.push({ route, what: 'runs off the screen', text });
      if (checkLines && (el.tagName === 'BUTTON' || el.matches('a[class*="button"]'))) {
        const lines = new Set(rects.map((r) => Math.round(r.top / 4)));
        if (lines.size > 1) out.push({ route, what: 'button label on 2 lines', text });
      }
    }
    return out;
  }, { route, checkLines });
}

for (const lang of LANGS) {
  test.describe(`text fits in ${lang}`, () => {
    test.use({ viewport: { width: 320, height: 720 }, hasTouch: true });

    test(`every screen at 320 wide`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.addInitScript((l) => localStorage.setItem('gazecraft-lang', l), lang);
      const found: Misfit[] = [];
      for (const route of ROUTES) {
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        found.push(...(await misfits(page, route, lang !== 'xx')));
      }
      expect(found, found.map((m) => `${m.route}: ${m.what}: "${m.text}"`).join('\n')).toEqual([]);
    });
  });
}

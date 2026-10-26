// Renders the 3D street's previews into design/sketches/map/3d: every camera, by day, at dawn, at night, in weather.
// Run: npm run street3d:render. It starts the dev server, opens /__street for each shot, and photographs the canvas.
// `npm run street3d:render -- posters` writes the 2 pictures Cases shows while its map loads (public/street).

import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'design/sketches/map/3d');
mkdirSync(out, { recursive: true });

const shots: Array<[string, string]> = [
  ['iso.png', 'view=iso&hour=15'],
  ['iso-dawn.png', 'view=iso&hour=7'],
  ['iso-night.png', 'view=iso&hour=22'],
  ['plan.png', 'view=plan&hour=13'],
  ['front.png', 'view=front&hour=17&x=420'],
  ['enter.png', 'view=enter&hour=9'],
  ['walk.png', 'view=walk&hour=11&x=330'],
  ['walk-night.png', 'view=walk&hour=22&x=330'],
  ['walk-rain.png', 'view=walk&hour=12&x=500&weather=rain'],
  ['walk-snow.png', 'view=walk&hour=12&x=500&weather=snow'],
  ['iso-snow.png', 'view=iso&hour=13&weather=snow'],
  ['walk-dawn.png', 'view=walk&hour=7&x=200'],
  ['walk-storm.png', 'view=enter&hour=17&weather=storm'],
  ['iso-storm.png', 'view=iso&hour=17&weather=storm'],
  ['iso-flood.png', 'view=iso&hour=11&weather=flood'],
];

const server = await createServer({ root, server: { port: 5199, strictPort: true }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
// At 2x, as a phone or a good screen shows it: sharp edges and faces.
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 });
// Name shots to render only those: npm run street3d:render -- walk-storm iso-storm
const only = process.argv.slice(2);
// npm run street3d:render -- poses trench : 1 detective in every posture, each from its own angle at its own spot.
const posesAt = only.indexOf('poses');
if (posesAt >= 0) {
  const dir = join(root, 'design/characters/detective/poses');
  mkdirSync(dir, { recursive: true });
  const looks = only[posesAt + 1] ? [only[posesAt + 1]!] : ['trench', 'overcoat', 'noir'];
  // Spots along the bakery side picked clear of poles, the post box and the parked cars.
  const shots = [['stand', 0, 470], ['walk', 35, 340], ['look', 90, 380], ['point', 150, 440], ['think', 330, 345], ['watch', 20, 250], ['map', 300, 410]] as const;
  await page.setViewportSize({ width: 420, height: 560 });
  // A list of poses after the look renders only those: npm run street3d:render -- poses trench think,watch
  const pick = only[posesAt + 2]?.split(',');
  for (const look of looks) {
    for (const [pose, yaw, x] of shots.filter(([p]) => !pick || pick.includes(p))) {
      await page.goto(`http://localhost:5199/__street?bare&w=420&h=560&view=pose&hour=11&x=${x}&figure=${look}&pose=${pose}&yaw=${yaw}`, { waitUntil: 'domcontentloaded', timeout: 600_000 });
      await page.waitForFunction(() => document.body.dataset.ready, null, { timeout: 600_000 });
      await page.locator('canvas').screenshot({ path: join(dir, `${look}-${pose}.png`), timeout: 300_000 });
    }
  }
}
if (only.includes('figures')) {
  // The detective's 3 looks, to choose from (design/characters/detective): side by side, then each full length and close.
  const dir = join(root, 'design/characters/detective');
  mkdirSync(dir, { recursive: true });
  const looks = [['all', 'figure', 1200, 675], ['trench', 'figure', 600, 800], ['overcoat', 'figure', 600, 800], ['noir', 'figure', 600, 800], ['trench', 'portrait', 600, 800], ['overcoat', 'portrait', 600, 800], ['noir', 'portrait', 600, 800]] as const;
  // Add `day` for daylight only: npm run street3d:render -- figures day
  for (const [look, view, w, h] of looks) {
    for (const hour of only.includes('day') ? [11] : [11, 21]) {
      await page.setViewportSize({ width: w, height: h });
      await page.goto(`http://localhost:5199/__street?bare&w=${w}&h=${h}&view=${view}&hour=${hour}&x=470&figure=${look}`, { waitUntil: 'domcontentloaded', timeout: 600_000 });
      await page.waitForFunction(() => document.body.dataset.ready, null, { timeout: 600_000 });
      await page.locator('canvas').screenshot({ path: join(dir, `${look}-${view}-${hour < 18 ? 'day' : 'night'}.png`), timeout: 300_000 });
    }
  }
}
if (only.includes('posters')) {
  // What Cases shows the moment it opens, by day and by night, until the live street is drawn: small JPEGs at 16:10.
  mkdirSync(join(root, 'public/street'), { recursive: true });
  await page.setViewportSize({ width: 1280, height: 800 });
  for (const [file, hour] of [['day.jpg', 15], ['night.jpg', 22]] as const) {
    await page.goto(`http://localhost:5199/__street?bare&w=1280&h=800&view=iso&hour=${hour}`, { waitUntil: 'domcontentloaded', timeout: 600_000 });
    await page.waitForFunction(() => document.body.dataset.ready, null, { timeout: 600_000 });
    await page.locator('canvas').screenshot({ path: join(root, 'public/street', file), type: 'jpeg', quality: 72 });
  }
}
for (const [file, q] of shots.filter(([f]) => only.length === 0 || only.includes(f.replace(/\.png$/, '')))) {
  // The first visit compiles three.js, which is slow; after that each shot is quick.
  await page.goto(`http://localhost:5199/__street?bare&w=1600&h=900&${q}`, { waitUntil: 'domcontentloaded', timeout: 600_000 });
  await page.waitForFunction(() => document.body.dataset.ready, null, { timeout: 600_000 });
  await page.locator('canvas').screenshot({ path: join(out, file) });
}
await browser.close();
await server.close();

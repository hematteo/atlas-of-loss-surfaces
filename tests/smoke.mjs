// Smoke test: serve the folder, open the atlas in headless Chromium (software WebGL2) and visit every plate.
// Fails on a page error, a console error, a non-finite particle (NaN), or the frame's error screen.
// A phone-sized pass checks that the tools sit in the plate card.   npm test   (or: node tests/smoke.mjs)
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif' };
const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  try {
    const body = await readFile(join(ROOT, path.endsWith('/') ? path + 'index.html' : path));
    res.writeHead(200, { 'content-type': TYPES[extname(path) || '.html'] || 'application/octet-stream' }).end(body);
  } catch { res.writeHead(404).end(); }
}).listen(0, '127.0.0.1');
await new Promise((r) => server.once('listening', r));
const URL0 = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const failures = [];
const watch = (page, tag) => {
  page.on('pageerror', (e) => failures.push(`${tag}: page error: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text())) failures.push(`${tag}: console error: ${m.text()}`); });
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  watch(page, 'desktop');
  await page.goto(URL0);
  await page.waitForFunction(() => typeof PLATES !== 'undefined' && window.__debug && window.__debug.fps != null, null, { timeout: 30000 });
  const n = await page.evaluate(() => { F.setParam('speed', 60); return PLATES.length; });
  // a plate without text throws on load; text without a plate is caught here
  const orphans = await page.evaluate(() => Object.keys(TEXT.plates).filter((id) => !PLATES.some((p) => p.id === id)));
  const chapters = await page.evaluate(() => CHAPTERS.filter(Boolean).length === ROMAN.length);
  console.log(`${orphans.length || !chapters ? 'FAIL' : 'ok  '}  text: every entry in text/ belongs to a plate, every chapter has a title`);
  if (orphans.length) failures.push(`text/ has entries for no plate: ${orphans.join(', ')}`);
  if (!chapters) failures.push('text/ is missing a chapter title');
  for (let i = 0; i < n; i++) {
    await page.evaluate((k) => gotoPlate(k), i);
    await wait(1800);
    const s = await page.evaluate(() => ({ id: PL.id, nan: window.__debug.nan, broken: !!document.querySelector('.hl-error') }));
    const bad = s.nan > 0 || s.broken;
    if (s.nan > 0) failures.push(`plate ${i + 1} (${s.id}): ${s.nan} non-finite particles`);
    if (s.broken) failures.push(`plate ${i + 1} (${s.id}): error screen`);
    console.log(`${bad ? 'FAIL' : 'ok  '}  ${String(i + 1).padStart(2)}  ${s.id}`);
  }
  const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  watch(phone, 'phone');
  await phone.goto(URL0);
  await phone.waitForFunction(() => typeof PLATES !== 'undefined' && window.__debug && window.__debug.fps != null, null, { timeout: 30000 });
  await wait(1500);
  const inCard = await phone.evaluate(() => document.querySelector('.pl-tools').closest('.pl-card') !== null);
  console.log(`${inCard ? 'ok  ' : 'FAIL'}  phone: tools in the plate card`);
  if (!inCard) failures.push('phone: tools are not in the plate card');
} finally {
  await browser.close();
  server.close();
}
if (failures.length) { console.error(`\n${failures.length} failure(s):\n` + failures.join('\n')); process.exit(1); }
console.log('\nall plates passed');

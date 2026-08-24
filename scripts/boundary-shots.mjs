import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const BASE = process.env.BASE ?? 'http://localhost:4175';
const OUT = '/tmp/claude-0/-home-user-Ai-Agent/ae36228a-3a88-5d5f-ba6c-41e656162fdc/scratchpad/shots';
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();

for (const [name, w, h] of [['d', 1440, 900], ['m', 390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: name === 'm' ? 2 : 1, isMobile: name === 'm', locale: 'ru-RU' });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(900);

  // первый экран без прокрутки — проверяем, что шапка ничего не режет
  await p.screenshot({ path: `${OUT}/${name}-fold.png` });

  // стыки светлого и тёмного: ставим границу секции в середину кадра
  for (const [id, tag] of [
    ['usloviya', 'styk-1-usloviya-vhod'],
    ['process', 'styk-2-usloviya-vyhod'],
    ['park', 'styk-3-park-vhod'],
    ['obyekty', 'styk-4-park-vyhod'],
  ]) {
    const top = await p.evaluate(
      (sel) => {
        const el = document.querySelector(sel);
        return el ? el.getBoundingClientRect().top + window.scrollY : null;
      },
      `#${id}`,
    );
    if (top === null) continue;
    await p.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), Math.max(0, top - h / 2));
    await p.waitForTimeout(1500);
    await p.screenshot({ path: `${OUT}/${name}-${tag}.png` });
  }
  await ctx.close();
  console.log(name, 'ok');
}
await b.close();

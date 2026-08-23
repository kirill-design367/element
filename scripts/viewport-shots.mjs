import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const BASE = 'http://localhost:4173';
const OUT = '/tmp/claude-0/-home-user-Ai-Agent/ae36228a-3a88-5d5f-ba6c-41e656162fdc/scratchpad/shots';
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
for (const [n, w, h] of [['fold-1440',1440,900],['fold-1920',1920,1080],['fold-2560',2560,1440],['fold-390',390,844]]) {
  const ctx = await b.newContext({ viewport:{width:w,height:h}, deviceScaleFactor: w>2000?0.5:1, locale:'ru-RU' });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/`, { waitUntil:'networkidle' });
  await p.waitForTimeout(600);
  await p.screenshot({ path:`${OUT}/${n}-home.png` });
  await p.goto(`${BASE}/catalog/`, { waitUntil:'networkidle' });
  await p.waitForTimeout(600);
  await p.screenshot({ path:`${OUT}/${n}-catalog.png` });
  await ctx.close();
  console.log(n, 'ok');
}
await b.close();

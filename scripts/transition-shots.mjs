import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE ?? 'http://localhost:4173';
const OUT = '/tmp/claude-0/-home-user-Ai-Agent/ae36228a-3a88-5d5f-ba6c-41e656162fdc/scratchpad/shots';
mkdirSync(OUT, { recursive: true });

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, locale: 'ru-RU' });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(900);

// Карточка «Щебень» в кадр
const card = page.locator('a[href*="category=shcheben"]').last();
await card.scrollIntoViewIfNeeded();
await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}/flip-0-before.png` });

// Клик и покадровая съёмка перелёта
await card.click({ noWaitAfter: true });
for (const [i, ms] of [120, 260, 420, 620].entries()) {
  await page.waitForTimeout(i === 0 ? ms : ms - [120, 260, 420, 620][i - 1]);
  await page.screenshot({ path: `${OUT}/flip-${i + 1}-${ms}ms.png` });
}
await page.waitForTimeout(700);
await page.screenshot({ path: `${OUT}/flip-5-after.png` });
console.log('URL после перелёта:', page.url());

// Обратный перелёт
const back = page.locator('nav[aria-label="Хлебные крошки"] a').first();
await back.click({ noWaitAfter: true });
for (const [i, ms] of [140, 340, 560].entries()) {
  await page.waitForTimeout(i === 0 ? ms : ms - [140, 340, 560][i - 1]);
  await page.screenshot({ path: `${OUT}/flipback-${i + 1}-${ms}ms.png` });
}
await page.waitForTimeout(700);
await page.screenshot({ path: `${OUT}/flipback-4-after.png` });
console.log('URL после возврата:', page.url());

// Прямой заход по адресу — анимации быть не должно
const ctx2 = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p2 = await ctx2.newPage();
await p2.goto(`${BASE}/catalog/?category=pesok`, { waitUntil: 'domcontentloaded' });
await p2.waitForTimeout(120);
await p2.screenshot({ path: `${OUT}/flip-direct-120ms.png` });
console.log('прямой заход снят');

console.log('ошибки страницы:', errors.length ? errors.slice(0, 5) : 'нет');
await b.close();

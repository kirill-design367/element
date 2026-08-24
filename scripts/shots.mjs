import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE ?? 'http://localhost:4173';
const OUT = process.env.OUT ?? '/tmp/claude-0/-home-user-Ai-Agent/ae36228a-3a88-5d5f-ba6c-41e656162fdc/scratchpad/shots';
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  mobile: {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
};

const BLOCKS = [
  ['hero', 'section:first-of-type'],
  ['raschet', '#raschet'],
  ['materialy', '#materialy'],
  ['usloviya', '#usloviya'],
  ['process', '#process'],
  ['park', '#park'],
  ['obyekty', '#obyekty'],
  ['zayavka', '#zayavka'],
  ['kontakty', '#kontakty'],
];

const browser = await chromium.launch();

for (const [name, vp] of Object.entries(VIEWPORTS)) {
  const ctx = await browser.newContext({ ...vp, locale: 'ru-RU' });
  const page = await ctx.newPage();

  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/${name}-00-full.png`, fullPage: true });

  for (const [id, sel] of BLOCKS) {
    const el = page.locator(sel).first();
    if (!(await el.count())) { console.log('нет', sel); continue; }
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(650);
    await el.screenshot({ path: `${OUT}/${name}-${id}.png` });
  }

  // Каталог
  await page.goto(`${BASE}/catalog/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/${name}-catalog-top.png` });
  await page.screenshot({ path: `${OUT}/${name}-catalog-full.png`, fullPage: true });

  // Каталог с фильтром
  await page.goto(`${BASE}/catalog/?category=shcheben&fraction=20-40`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/${name}-catalog-filtered.png` });

  // Заявка-список
  await page.locator('article button:has-text("В заявку")').first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/${name}-catalog-request.png`, fullPage: false });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/${name}-catalog-bar.png` });

  // Шрифты
  await page.goto(`${BASE}/fonts/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/${name}-fonts-top.png` });
  await page.screenshot({ path: `${OUT}/${name}-fonts-full.png`, fullPage: true });

  await ctx.close();
  console.log(`${name} готово`);
}

await browser.close();

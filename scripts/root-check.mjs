/**
 * ЖИВАЯ ПРОВЕРКА СБОРКИ ПОД КОРЕНЬ.
 *
 * Раньше этот обход проверял обратное — что все ссылки ведут внутрь /element
 * на GitHub Pages. Подпапки больше нет, и проверять надо, что её нет нигде.
 *
 * Статическую часть — обход файлов выдачи — делает scripts/no-basepath.mjs.
 * Здесь то, что видно только в браузере: пришёл ли шрифт, работает ли перелёт
 * в каталог, отдаёт ли прямая ссылка с фильтром верную выборку.
 *
 * Перед запуском: npm run build && npx serve out -p 4174
 * Адрес можно переопределить: BASE=https://elementst.ru node scripts/root-check.mjs
 */
import { chromium } from 'playwright';

const BASE = (process.env.BASE ?? 'http://localhost:4174').replace(/\/$/, '');
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
const failed = [];
p.on('response', (r) => { if (r.status() >= 400) failed.push(r.status() + ' ' + r.url()); });
p.on('pageerror', (e) => failed.push('JS: ' + e.message.slice(0, 120)));

await p.goto(`${BASE}/`, { waitUntil: 'networkidle' });
await p.waitForTimeout(900);
console.log('шрифт H1:', (await p.evaluate(() => getComputedStyle(document.querySelector('h1')).fontFamily)).split(',')[0]);
console.log('иконка вкладки:', await p.evaluate(() => document.querySelector('link[rel*=icon]')?.getAttribute('href')));

const hrefs = await p.$$eval('a[href^="/"]', (els) => els.map((e) => e.getAttribute('href')));
const bad = hrefs.filter((h) => h.startsWith('/element/') || h === '/element');
console.log('ссылок в подпапку /element:', bad.length ? bad : 'нет');

await p.locator('a[href*="category=shcheben"]').last().scrollIntoViewIfNeeded();
await p.waitForTimeout(700);
await p.locator('a[href*="category=shcheben"]').last().click();
await p.waitForTimeout(1100);
console.log('после перелёта:', p.url());
console.log('позиций видно:', await p.locator('article:visible').count());

await p.locator('article button:has-text("В заявку")').first().click();
await p.waitForTimeout(400);
console.log('панель заявки открылась:', await p.locator('[role="dialog"]').isVisible());
await p.keyboard.press('Escape');

await p.goto(`${BASE}/catalog/?category=pesok&fraction=0-5`, { waitUntil: 'networkidle' });
await p.waitForTimeout(500);
console.log('прямая ссылка с фильтром, позиций:', await p.locator('article:visible').count());

console.log('сбои сети и JS:', failed.length ? failed.slice(0, 6) : 'нет');
await b.close();

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
/* Смешанное содержимое ловится по фактическим запросам страницы, а не по
   разметке: часть адресов подставляет скрипт уже в браузере. */
const insecure = new Set();
p.on('request', (r) => { if (r.url().startsWith('http://')) insecure.add(r.url()); });
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

// Якоря меню: проверяются КЛИКОМ, а не подстановкой location.hash — это два
// разных пути, и прокрутку ведёт Lenis, а не браузер.
await p.goto(`${BASE}/`, { waitUntil: 'networkidle' });
await p.waitForTimeout(800);
for (const anchor of ['#raschet', '#usloviya', '#process', '#kontakty']) {
  const link = p.locator(`header a[href$="${anchor}"]`).first();
  if (!(await link.count())) { console.log(`якорь ${anchor}: пункта меню нет`); continue; }
  await link.click();
  await p.waitForTimeout(1400);
  const top = await p.evaluate((id) => {
    const el = document.querySelector(id);
    return el ? Math.round(el.getBoundingClientRect().top) : null;
  }, anchor);
  console.log(`якорь ${anchor}: цель на ${top} px от верха окна`);
}

// Калькулятор: меняем объём и смотрим, что итог пересчитался.
await p.goto(`${BASE}/#raschet`, { waitUntil: 'networkidle' });
await p.waitForTimeout(900);
const total = () => p.locator('[data-total]').first().innerText();
const before = await total();
const volume = p.locator('input[inputmode="decimal"]').first();
await volume.fill('40');
await p.waitForTimeout(1200);
const after = await total();
console.log('итог расчёта:', JSON.stringify(before), '→', JSON.stringify(after),
  before === after ? '— НЕ ПЕРЕСЧИТАЛСЯ' : '— пересчитался');

// Горизонтальный вылет на трёх ширинах.
for (const [w, h] of [[1920, 1080], [1512, 820], [390, 844]]) {
  await p.setViewportSize({ width: w, height: h });
  await p.waitForTimeout(500);
  const moved = await p.evaluate(() => {
    const was = window.scrollX;
    window.scrollTo(9999, 0);
    const moved = window.scrollX - was;
    window.scrollTo(0, 0);
    return moved;
  });
  console.log(`вылет вбок на ${w}×${h}: ${moved} px`);
}

console.log('сбои сети и JS:', failed.length ? failed.slice(0, 8) : 'нет');
console.log('запросов по http (смешанное содержимое):',
  insecure.size ? [...insecure].slice(0, 8) : 'нет');
await b.close();
if (insecure.size) process.exitCode = 1;

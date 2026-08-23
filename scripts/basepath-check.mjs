import { chromium } from 'playwright';
const BASE='http://localhost:4174/element';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:1440,height:900} });
const p = await ctx.newPage();
const failed=[];
p.on('response', r => { if(r.status()>=400) failed.push(r.status()+' '+r.url()); });
p.on('pageerror', e => failed.push('JS: '+e.message.slice(0,120)));

await p.goto(`${BASE}/`, {waitUntil:'networkidle'});
await p.waitForTimeout(900);
const font = await p.evaluate(()=>getComputedStyle(document.querySelector('h1')).fontFamily);
console.log('шрифт H1:', font.split(',')[0]);
console.log('иконка вкладки:', await p.evaluate(()=>document.querySelector('link[rel*=icon]')?.getAttribute('href')));

// все ссылки должны вести внутрь /element
const hrefs = await p.$$eval('a[href^="/"]', els=>els.map(e=>e.getAttribute('href')));
const bad = hrefs.filter(h=>!h.startsWith('/element'));
console.log('ссылки мимо basePath:', bad.length? bad : 'нет');

// перелёт в каталог
await p.locator('a[href*="category=shcheben"]').last().scrollIntoViewIfNeeded();
await p.waitForTimeout(700);
await p.locator('a[href*="category=shcheben"]').last().click();
await p.waitForTimeout(1100);
console.log('после перелёта:', p.url());
console.log('позиций видно:', await p.locator('article:visible').count());

// заявка
await p.locator('article button:has-text("В заявку")').first().click();
await p.waitForTimeout(400);
console.log('панель заявки открылась:', await p.locator('[role="dialog"]').isVisible());
await p.keyboard.press('Escape');

// прямая ссылка с фильтром
await p.goto(`${BASE}/catalog/?category=pesok&fraction=0-5`, {waitUntil:'networkidle'});
await p.waitForTimeout(500);
console.log('прямая ссылка, позиций:', await p.locator('article:visible').count());
await p.screenshot({path:'/tmp/claude-0/-home-user-Ai-Agent/ae36228a-3a88-5d5f-ba6c-41e656162fdc/scratchpad/shots/prod-basepath.png'});

await p.goto(`${BASE}/fonts/`, {waitUntil:'networkidle'});
await p.waitForTimeout(600);
console.log('сбои сети и JS:', failed.length? failed.slice(0,6) : 'нет');
await b.close();

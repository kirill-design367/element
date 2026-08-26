import { chromium } from 'playwright';
const OUT='/tmp/claude-0/-home-user-element/ad81a4a0-be22-5501-865e-399fe70f69de/scratchpad/m';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const p = await (await b.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1})).newPage();
const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
await p.goto('http://localhost:4514/catalog/?category=metall',{waitUntil:'networkidle'});
await p.waitForTimeout(1500);
await p.screenshot({ path:`${OUT}/cat-metall.png`, fullPage:false });
const info = await p.evaluate(() => {
  const cards=[...document.querySelectorAll('article[data-cat]')].filter(e=>e.offsetParent!==null);
  return { видно: cards.length, найдено: document.querySelector('[data-found] span')?.textContent,
           чипы: [...document.querySelectorAll('[data-chip^="group:"]')].map(e=>e.textContent.trim()) };
});
console.log('каталог металла:', JSON.stringify(info), 'ошибки:', errs);
// лента на главной
const h = await (await b.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1})).newPage();
await h.goto('http://localhost:4514/',{waitUntil:'networkidle'});
await h.waitForTimeout(1800);
await h.evaluate(()=>document.querySelector('#materialy')?.scrollIntoView());
await h.waitForTimeout(1200);
await h.screenshot({ path:`${OUT}/rail.png` });
// калькулятор с металлом
await h.evaluate(()=>document.querySelector('#raschet')?.scrollIntoView());
await h.waitForTimeout(900);
await h.selectOption('select#\\:R2mral6\\:-material', {}).catch(()=>{});
const sel = await h.$('select');
console.log('готово');
await b.close();

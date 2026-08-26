import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const p = await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('http://localhost:4514/',{waitUntil:'networkidle'});
await p.waitForTimeout(1500);
const t = await p.evaluate(() => document.body.innerText.replace(/ /g,' '));
// только прозаические абзацы: выкидываем списки материалов и цифры
console.log(t.split('\n').filter(l => l.trim().length > 45).join('\n\n'));
await b.close();

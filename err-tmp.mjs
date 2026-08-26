import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
for (const url of ['/', '/catalog/', '/catalog/?category=metall']) {
  const p = await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  const cons=[]; p.on('console',m=>{ if(m.type()==='error') cons.push(m.text()); });
  await p.goto('http://localhost:4514'+url,{waitUntil:'networkidle'});
  await p.waitForTimeout(1200);
  for (let i=0;i<14;i++){ await p.mouse.wheel(0, 700); await p.waitForTimeout(120); }
  await p.waitForTimeout(1200);
  console.log(url, '→ pageerror', errs.length, 'console.error', cons.length, errs.concat(cons).slice(0,2));
}
await b.close();

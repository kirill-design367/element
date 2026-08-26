import { chromium } from 'playwright';
const URL = process.env.URL || 'http://localhost:4514/';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await b.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:1 });
const p = await ctx.newPage();
// Придушенный процессор — как у человека на среднем ноутбуке.
const cdp = await ctx.newCDPSession(p);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

await p.addInitScript(() => {
  window.__rec = { paint: null, marks: [], frames: [] };
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') window.__rec.paint = e.startTime;
  }).observe({ type: 'paint', buffered: true });
  const mo = new MutationObserver((recs) => {
    for (const r of recs) {
      const el = r.target;
      if (el.matches && el.matches('img[data-parallax]')) {
        window.__rec.marks.push({
          t: +performance.now().toFixed(1),
          transform: getComputedStyle(el).transform,
          top: +el.getBoundingClientRect().top.toFixed(2),
          h: el.offsetHeight,
          sect: el.closest('section')?.offsetHeight,
        });
      }
    }
  });
  const start = () => mo.observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['style'] });
  if (document.documentElement) start(); else addEventListener('DOMContentLoaded', start);
  // покадровая запись положения кадра
  const tick = () => {
    const el = document.querySelector('img[data-parallax]');
    if (el) {
      const top = +el.getBoundingClientRect().top.toFixed(2);
      const h = el.offsetHeight;
      const f = window.__rec.frames;
      if (!f.length || f[f.length - 1].top !== top || f[f.length - 1].h !== h) {
        f.push({ t: +performance.now().toFixed(1), top, h });
      }
    }
    if (performance.now() < 6000) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});

await p.goto(URL, { waitUntil: 'load' });
await p.waitForTimeout(5000);
const rec = await p.evaluate(() => window.__rec);
const tops = rec.frames.map(f => f.top);
console.log('FCP:', rec.paint?.toFixed(0), 'мс');
console.log('положений кадра записано:', rec.frames.length);
console.log('первые 12:', JSON.stringify(rec.frames.slice(0, 12)));
console.log('размах top:', Math.min(...tops).toFixed(2), '→', Math.max(...tops).toFixed(2),
            '= скачок', (Math.max(...tops) - Math.min(...tops)).toFixed(2), 'px');
console.log('правки style у кадра:', JSON.stringify(rec.marks.slice(0, 6)));
await b.close();

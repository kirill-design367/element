/**
 * Замер рывков на НАСТОЯЩЕЙ инерционной прокрутке.
 *
 * Синтетический window.scrollTo шагами по 48 px не ловит ничего: он обходит
 * Lenis, не даёт инерции и не нагружает те же кадры, что живой пользователь.
 * Здесь прокрутка идёт колесом — событиями wheel, которые Lenis перехватывает
 * и разгоняет сам, — на всю высоту страницы, с включённым параллаксом.
 *
 * Что снимается:
 *   - длительности кадров через requestAnimationFrame (медиана, 95-й, худший);
 *   - долгие задачи через PerformanceObserver('longtask');
 *   - счётчики и время пересчёта стилей и вёрстки из CDP Performance.getMetrics
 *     (LayoutCount / RecalcStyleCount — это и есть layout thrashing в числах);
 *   - горизонтальный вылет страницы.
 *
 * Запуск: BASE=http://localhost:4501 node scripts/jank-trace.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:4501';
const PATHS = (process.env.PATHS ?? '/').split(',');
const VIEWPORTS = [
  ['1920×1080', 1920, 1080, false],
  ['390×844', 390, 844, true],
];

const browser = await chromium.launch({ args: ['--enable-gpu-rasterization'] });

for (const path of PATHS) {
  for (const [name, width, height, mobile] of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width, height },
      isMobile: mobile,
      hasTouch: mobile,
      deviceScaleFactor: 1,
      locale: 'ru-RU',
    });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Performance.enable');

    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    // Lenis грузится после интерактива по requestIdleCallback — ждём его.
    await page.waitForFunction(() => document.documentElement.classList.contains('lenis'), {
      timeout: 8000,
    }).catch(() => {});
    await page.waitForTimeout(1500);

    const before = Object.fromEntries(
      (await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]),
    );

    // Счётчики кадров и долгих задач ставим до начала прокрутки.
    await page.evaluate(() => {
      const w = window;
      w.__f = [];
      w.__long = [];
      w.__last = performance.now();
      w.__stop = false;
      const tick = (t) => {
        w.__f.push(t - w.__last);
        w.__last = t;
        if (!w.__stop) requestAnimationFrame(tick);
      };
      requestAnimationFrame((t) => {
        w.__last = t;
        requestAnimationFrame(tick);
      });
      w.__po = new PerformanceObserver((list) => {
        for (const e of list.getEntries()) w.__long.push(Math.round(e.duration));
      });
      w.__po.observe({ entryTypes: ['longtask'] });
    });

    // Прокрутка колесом: так же, как крутит человек. Шаг крупный, пауза
    // короткая — Lenis всё это время догоняет и рисует промежуточные кадры.
    const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    const step = Math.round(height * 0.55);
    const steps = Math.ceil(total / step) + 2;
    await page.mouse.move(width / 2, height / 2);
    for (let i = 0; i < steps; i += 1) {
      await page.mouse.wheel(0, step);
      await page.waitForTimeout(90);
    }
    await page.waitForTimeout(1200);

    const res = await page.evaluate(() => {
      const w = window;
      w.__stop = true;
      w.__po.disconnect();
      const f = w.__f.slice(3).sort((a, b) => a - b);
      const q = (x) => f[Math.min(f.length - 1, Math.floor(f.length * x))];
      return {
        кадров: f.length,
        медиана: +q(0.5).toFixed(1),
        p95: +q(0.95).toFixed(1),
        худший: +f[f.length - 1].toFixed(1),
        'кадров дольше 20 мс': f.filter((x) => x > 20).length,
        'кадров дольше 33 мс': f.filter((x) => x > 33).length,
        'долгих задач': w.__long.length,
        'сумма долгих задач, мс': w.__long.reduce((a, b) => a + b, 0),
        'горизонтальный вылет, px':
          document.documentElement.scrollWidth - document.documentElement.clientWidth,
        доскроллено: Math.round(window.scrollY),
      };
    });

    const after = Object.fromEntries(
      (await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]),
    );
    const d = (k) => +(after[k] - before[k]).toFixed(3);

    console.log(
      `${path} ${name}`,
      JSON.stringify(
        {
          ...res,
          'пересчётов стиля': d('RecalcStyleCount'),
          'время пересчёта стиля, мс': +(d('RecalcStyleDuration') * 1000).toFixed(0),
          'пересчётов вёрстки': d('LayoutCount'),
          'время вёрстки, мс': +(d('LayoutDuration') * 1000).toFixed(0),
          'скрипт, мс': +(d('ScriptDuration') * 1000).toFixed(0),
        },
        null,
        0,
      ),
    );

    await page.close();
    await ctx.close();
  }
}

await browser.close();

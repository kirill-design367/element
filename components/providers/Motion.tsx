'use client';

import { useEffect } from 'react';
import { DUR, EASE, prefersReducedMotion } from '@/lib/motion';

/**
 * Всё движение сайта в одном месте: инерционная прокрутка, появления,
 * параллакс. Раньше это были два независимых провайдера — SmoothScroll и
 * Reveal, — и каждый сам импортировал gsap со ScrollTrigger и заводил свой
 * порядок инициализации. Lenis при этом стартовал по requestIdleCallback,
 * то есть уже после того, как ScrollTrigger построил триггеры и посчитал
 * позиции: два такта, два источника правды о прокрутке.
 *
 * Теперь загрузка одна и порядок жёсткий:
 *   1. gsap + ScrollTrigger + Lenis грузятся одним динамическим импортом;
 *   2. Lenis подписывается на ScrollTrigger.update и садится на тикер gsap
 *      (тикер отдаёт секунды, lenis.raf ждёт миллисекунды — отсюда × 1000);
 *   3. lagSmoothing выключается, иначе gsap на тяжёлом кадре делает рывок
 *      наверстывания;
 *   4. и только после этого строятся появления и параллакс.
 *
 * Принципиальное правило прежнее: элементы НИКОГДА не прячутся заранее.
 * Появление — это gsap.from в момент входа в кадр. Не выполнился скрипт,
 * не сработал ScrollTrigger, страницу снимают целиком — содержимое на месте.
 */
export function Motion() {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;
    let cleanupRail: (() => void) | undefined;

    const start = async () => {
      const [{ gsap }, { ScrollTrigger }, { SplitText }, { default: Lenis }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
        import('gsap/SplitText'),
        import('lenis'),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger, SplitText);

      /* ── 1. Прокрутка ───────────────────────────────────────────────────
         Затухание экспоненциальное: разгон мгновенный, остановка мягкая, без
         ощущения удара в конце. duration 1.15 — столько догоняет позиция
         после последнего щелчка колеса. */
      const lenis = new Lenis({
        duration: 1.15,
        easing: (t: number) => 1 - Math.pow(1 - t, 4),
        wheelMultiplier: 1,
        touchMultiplier: 1.5,
        smoothWheel: true,
      });
      lenis.on('scroll', ScrollTrigger.update);
      const raf = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
      document.documentElement.classList.add('lenis-ready');

      /* Якорные ссылки внутри страницы ведёт Lenis: иначе браузер прыгает
         мгновенно, а Lenis потом догоняет — получается двойное движение. */
      const onAnchor = (e: MouseEvent) => {
        const a = (e.target as HTMLElement | null)?.closest?.('a[href*="#"]');
        if (!a) return;
        const href = a.getAttribute('href') ?? '';
        const hash = href.slice(href.indexOf('#'));
        if (hash.length < 2) return;
        const isSamePage = href.startsWith('#') || href.startsWith('/#');
        if (!isSamePage) return;
        const target = document.querySelector(hash);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target as HTMLElement, { offset: -96, duration: 1.1 });
        history.replaceState(null, '', hash);
      };
      document.addEventListener('click', onAnchor);

      /* Пилюля шапки ужимается, как только страница тронулась с места.
         Порог 40 px и флаг на <html>: переход описан в CSS, JS только
         переключает состояние — никаких стилей в цикле прокрутки. */
      const root = document.documentElement;
      const onScroll = ({ scroll }: { scroll: number }) => {
        const on = scroll > 40;
        if (on !== root.hasAttribute('data-scrolled')) {
          if (on) root.setAttribute('data-scrolled', '');
          else root.removeAttribute('data-scrolled');
        }
      };
      lenis.on('scroll', onScroll);
      onScroll({ scroll: window.scrollY });

      /* ── Лента материалов ──────────────────────────────────────────────
         У ленты своя горизонтальная копия Lenis. Обе сидят на одном тикере
         gsap, поэтому вертикальная и горизонтальная прокрутка идут в одном
         такте: лента не отстаёт от страницы на кадр и не дёргается, когда
         крутят и то и другое сразу.

         gestureOrientation: horizontal — принципиально. При 'both' колесо над
         лентой крутит ленту вместо страницы, и, докрутив ленту до конца,
         человек упирается: страница под курсором стоит. Сейчас вертикальное
         колесо всегда ведёт страницу, ленту двигают горизонтальный жест
         трекпада, shift + колесо, свайп и клавиатура. syncTouch выключен: на
         телефоне свайп и так инерционный, вторая инерция поверх ощущается
         как залипание.

         Полоса прогресса под лентой: ширина бегунка — доля видимой части,
         положение — доля прокрутки. Двигается transform. */
      const rail = document.querySelector<HTMLElement>('[data-rail]');
      const railBar = document.querySelector<HTMLElement>('[data-rail-bar]');
      let railLenis: InstanceType<typeof Lenis> | undefined;
      if (rail) {
        railLenis = new Lenis({
          wrapper: rail,
          content: rail,
          orientation: 'horizontal',
          gestureOrientation: 'horizontal',
          duration: 0.9,
          easing: (t: number) => 1 - Math.pow(1 - t, 4),
          smoothWheel: true,
          syncTouch: false,
        });
        const railRaf = (time: number) => railLenis?.raf(time * 1000);
        gsap.ticker.add(railRaf);

        const paint = () => {
          if (!railBar) return;
          const max = rail.scrollWidth - rail.clientWidth;
          const view = rail.clientWidth / rail.scrollWidth;
          const pos = max > 0 ? rail.scrollLeft / max : 0;
          gsap.set(railBar, {
            scaleX: view,
            x: (rail.clientWidth - rail.clientWidth * view) * pos,
          });
        };
        rail.addEventListener('scroll', paint, { passive: true });
        paint();
        const railCleanup = () => {
          rail.removeEventListener('scroll', paint);
          gsap.ticker.remove(railRaf);
          railLenis?.destroy();
        };
        cleanupRail = railCleanup;
      }

      /* ── 2. Появления ───────────────────────────────────────────────────
         Сдвиг снизу плюс проявление. Порог входа — top 85%: блок начинает
         появляться, когда до центра экрана ему остаётся треть высоты, и
         заканчивает до того, как доедет. */
      const ctx = gsap.context(() => {
        const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
        const below = nodes.filter(
          (el) => el.getBoundingClientRect().top > window.innerHeight * 0.86,
        );
        if (below.length) {
          ScrollTrigger.batch(below, {
            start: 'top 85%',
            once: true,
            // Строки и карточки, входящие в кадр вместе, играют одной
            // группой: интервал сборки 0,08 с, не больше шести в пачке —
            // иначе длинная сетка каталога уезжает одной простынёй.
            interval: 0.08,
            batchMax: 6,
            onEnter: (batch) =>
              gsap.from(batch, {
                opacity: 0,
                y: 48,
                duration: DUR.reveal,
                ease: EASE,
                stagger: 0.07,
                overwrite: 'auto',
                clearProps: 'opacity,transform,willChange',
                willChange: 'transform,opacity',
              }),
          });
        }

        /** Именованная группа: то же появление, но со своими параметрами. */
        const enter = (
          selector: string,
          vars: Record<string, unknown>,
          opts: { start?: string; stagger?: number } = {},
        ) => {
          const els = Array.from(document.querySelectorAll<HTMLElement>(selector));
          if (!els.length) return;
          const visible = els.filter(
            (el) => el.getBoundingClientRect().top < window.innerHeight * 0.86,
          );
          const later = els.filter((el) => !visible.includes(el));
          if (visible.length) {
            // Уже в кадре при загрузке — играем сразу, ждать нечего.
            gsap.from(visible, {
              ...vars,
              stagger: opts.stagger ?? 0.07,
              overwrite: 'auto',
              clearProps: 'opacity,transform,willChange',
              willChange: 'transform,opacity',
            });
          }
          later.forEach((el) => {
            ScrollTrigger.create({
              trigger: el,
              start: opts.start ?? 'top 85%',
              once: true,
              onEnter: () =>
                gsap.from(el, {
                  ...vars,
                  overwrite: 'auto',
                  clearProps: 'opacity,transform,willChange',
                  willChange: 'transform,opacity',
                }),
            });
          });
        };

        enter('[data-hero]', { opacity: 0, y: 44, duration: DUR.reveal, ease: EASE }, { stagger: 0.08 });
        enter('[data-fact]', { opacity: 0, y: 40, duration: DUR.reveal, ease: EASE }, { stagger: 0.07 });
        enter('[data-rail-item]', { opacity: 0, y: 48, duration: DUR.reveal, ease: EASE }, { stagger: 0.07 });
        enter('[data-fleet="lead"], [data-total]', { opacity: 0, y: 56, duration: DUR.reveal, ease: EASE });
        enter(
          '[data-fleet="rest"], [data-fleet="label"]',
          { opacity: 0, y: 40, duration: DUR.reveal, ease: EASE },
          { stagger: 0.07 },
        );

        /* ── Бегущая строка фактов ───────────────────────────────────────
           Лента с двумя копиями едет влево на половину ширины и повторяется
           без стыка. Длительность считается от ширины копии, а не задаётся
           числом: на 390 px и на 2560 px скорость должна быть одна и та же —
           70 пикселей в секунду. При наведении лента не встаёт, а сбавляет
           ход вчетверо за 0,5 с; менять длительность CSS-анимации на лету
           нельзя, она перескакивает, поэтому это tween с timeScale. */
        const track = document.querySelector<HTMLElement>('[data-marquee-track]');
        const strip = document.querySelector<HTMLElement>('[data-marquee]');
        if (track && strip && track.children.length > 1) {
          const copyWidth = (track.children[0] as HTMLElement).offsetWidth;
          const run = gsap.to(track, {
            x: -copyWidth,
            ease: 'none',
            duration: copyWidth / 70,
            repeat: -1,
          });
          strip.addEventListener('pointerenter', () => gsap.to(run, { timeScale: 0.25, duration: 0.5 }));
          strip.addEventListener('pointerleave', () => gsap.to(run, { timeScale: 1, duration: 0.5 }));
          // Копия меряется по факту, а не по проценту: шрифт может ещё не
          // приехать в момент замера, и тогда ширина будет чужая.
          void document.fonts?.ready.then(() => {
            const w = (track.children[0] as HTMLElement).offsetWidth;
            if (Math.abs(w - copyWidth) > 2) {
              run.vars.x = -w;
              run.duration(w / 70);
              run.invalidate().restart();
            }
          });
        }

        /* Заголовки секций проявляются строками из-под маски: строка
           выезжает снизу, следующая идёт через 0,07 с. SplitText режет уже
           после загрузки шрифта — иначе строки посчитаются по подменному
           начертанию и разъедутся, когда придёт CoFo. Прятать заранее
           по-прежнему нельзя: маска и сдвиг ставятся в момент входа в кадр,
           а не при разборе страницы. */
        const splitHeads = () => {
          document.querySelectorAll<HTMLElement>('[data-lines]').forEach((head) => {
            const play = () => {
              const split = SplitText.create(head, { type: 'lines', mask: 'lines', aria: 'auto' });
              gsap.from(split.lines, {
                yPercent: 108,
                duration: DUR.reveal,
                ease: EASE,
                stagger: 0.07,
                onComplete: () => split.revert(),
              });
            };
            if (head.getBoundingClientRect().top < window.innerHeight * 0.86) play();
            else ScrollTrigger.create({ trigger: head, start: 'top 85%', once: true, onEnter: play });
          });
        };
        if (document.fonts?.status === 'loaded') splitHeads();
        else void document.fonts?.ready.then(() => !cancelled && splitHeads());

        /* ── 3. Параллакс ─────────────────────────────────────────────────
           Возит только transform. Триггером берётся ближайший предок с
           высотой, а не родитель напрямую: у кадра первого экрана родитель —
           <picture>, инлайновый элемент нулевой высоты. Диапазон
           «top bottom → bottom top» на нулевой высоте вырождается в точку,
           прогресс перескакивал с 0 на 1 за один пиксель прокрутки, и кадр
           дёргался вниз одним движением при первом же касании колеса.

           Смещение задано в процентах от высоты самого кадра: кадр выше
           своего блока на 48 px, ±2% от него — это те же ±20 px, но без
           пересчёта при смене высоты экрана. */
        const parallax = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
        parallax.forEach((el) => {
          let box: HTMLElement = el;
          while (box.parentElement && box.getBoundingClientRect().height < 1) {
            box = box.parentElement;
          }
          // Блок в самом верху документа: диапазон «top bottom» для него уже
          // отработан на нулевой прокрутке, отсчёт начинается от верха экрана.
          const atTop = box.getBoundingClientRect().top + window.scrollY < window.innerHeight * 0.5;
          gsap.fromTo(
            el,
            { yPercent: -2 },
            {
              yPercent: 2,
              ease: 'none',
              scrollTrigger: {
                trigger: box,
                start: atTop ? 'top top' : 'top bottom',
                end: 'bottom top',
                // 0,4 — короткая догонка: под инерцией Lenis жёсткий scrub
                // отыгрывает каждый микрошаг колеса и кадр мелко трясётся.
                scrub: 0.4,
                invalidateOnRefresh: true,
                // will-change висит только пока кадр в работе: постоянный
                // слой композитора на трёх фотографиях — это лишняя память
                // и лишний повод для браузера не сливать слои обратно.
                onToggle: (self) => {
                  el.style.willChange = self.isActive ? 'transform' : '';
                },
              },
            },
          );
        });
      });

      cleanup = () => {
        cleanupRail?.();
        document.removeEventListener('click', onAnchor);
        ctx.revert();
        gsap.ticker.remove(raf);
        lenis.destroy();
        root.removeAttribute('data-scrolled');
        document.documentElement.classList.remove('lenis-ready');
      };
    };

    // requestIdleCallback есть не везде — таймер как запасной путь.
    const idle =
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback(() => void start(), { timeout: 900 })
        : window.setTimeout(() => void start(), 300);

    return () => {
      cancelled = true;
      if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idle as number);
      else window.clearTimeout(idle as number);
      cleanup?.();
    };
  }, []);

  return null;
}

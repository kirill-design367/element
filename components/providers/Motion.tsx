'use client';

import { useEffect } from 'react';
import { DUR, EASE, EASE_REVEAL, REVEAL, prefersReducedMotion } from '@/lib/motion';

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
      const [{ gsap }, { ScrollTrigger }, { default: Lenis }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
        import('lenis'),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

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

      /* Единственное, что шапка меняет по прокрутке, — геометрия. Ни
         плотность заливки, ни радиус размытия, ни насыщенность не трогаются
         никогда: любое изменение прозрачности по ходу прокрутки читается как
         моргание.

         Сжатие привязано к прокрутке на отрезке 0-160 px. Доля квантуется
         до 1/60: писать переменную на каждый пиксель незачем, 2,7 px
         прокрутки на шаг глазом не отличить, а пересчётов втрое меньше.
         Порог, который был здесь раньше, схлопывал панель в первый же
         щелчок колеса. */
      const root = document.documentElement;
      const PILL_RANGE = 160;
      let pillStep = -1;
      const onScroll = ({ scroll }: { scroll: number }) => {
        const step = Math.round(Math.min(1, Math.max(0, scroll / PILL_RANGE)) * 60);
        if (step !== pillStep) {
          pillStep = step;
          root.style.setProperty('--pill', String(step / 60));
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
      // Горизонтальный Lenis нужен только там, где крутят колесом и
      // трекпадом. На телефоне свайп родной и инерционный сам по себе —
      // лишняя копия движка там только ест главный поток при загрузке.
      const finePointer = window.matchMedia('(pointer: fine)').matches;
      const rail = finePointer ? document.querySelector<HTMLElement>('[data-rail]') : null;
      const railBar = document.querySelector<HTMLElement>('[data-rail-bar]');
      const railNative = !finePointer ? document.querySelector<HTMLElement>('[data-rail]') : null;
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

        /* Перетаскивание мышью. Пока тянут, Lenis выключен и позиция
           пишется напрямую; на отпускании остаток скорости уходит в
           lenis.scrollTo — лента доезжает по инерции, а не встаёт колом. */
        let dragging = false;
        let startX = 0;
        let startLeft = 0;
        let lastX = 0;
        let lastT = 0;
        let velocity = 0;
        const onDown = (e: PointerEvent) => {
          if (e.button !== 0) return;
          dragging = true;
          startX = lastX = e.clientX;
          startLeft = rail.scrollLeft;
          lastT = performance.now();
          velocity = 0;
          railLenis?.stop();
          rail.classList.add('is-dragging');
          rail.setPointerCapture(e.pointerId);
        };
        const onMove = (e: PointerEvent) => {
          if (!dragging) return;
          const now = performance.now();
          const dt = Math.max(1, now - lastT);
          velocity = (e.clientX - lastX) / dt;
          lastX = e.clientX;
          lastT = now;
          rail.scrollLeft = startLeft - (e.clientX - startX);
        };
        const onUp = (e: PointerEvent) => {
          if (!dragging) return;
          dragging = false;
          rail.classList.remove('is-dragging');
          rail.releasePointerCapture?.(e.pointerId);
          railLenis?.start();
          // 260 — во столько раз догоняет остаток жеста; подобрано так,
          // чтобы бросок пальцем проходил примерно карточку.
          const throwTo = rail.scrollLeft - velocity * 260;
          railLenis?.scrollTo(Math.max(0, Math.min(rail.scrollWidth - rail.clientWidth, throwTo)), {
            duration: 1.1,
          });
        };
        rail.addEventListener('pointerdown', onDown);
        rail.addEventListener('pointermove', onMove);
        rail.addEventListener('pointerup', onUp);
        rail.addEventListener('pointercancel', onUp);
        // Клик по карточке после протаскивания открывал бы каталог.
        rail.addEventListener(
          'click',
          (e) => {
            if (Math.abs(lastX - startX) > 6) {
              e.preventDefault();
              e.stopPropagation();
            }
          },
          true,
        );

        /* Стрелки: листают на ширину карточки и гаснут на краях. */
        const prev = document.querySelector<HTMLButtonElement>('[data-rail-prev]');
        const next = document.querySelector<HTMLButtonElement>('[data-rail-next]');
        const step = () => (rail.querySelector<HTMLElement>('[data-rail-item]')?.offsetWidth ?? 320) + 16;
        const go = (dir: number) =>
          railLenis?.scrollTo(
            Math.max(0, Math.min(rail.scrollWidth - rail.clientWidth, rail.scrollLeft + dir * step())),
            { duration: 0.9 },
          );
        prev?.addEventListener('click', () => go(-1));
        next?.addEventListener('click', () => go(1));
        const edges = () => {
          const max = rail.scrollWidth - rail.clientWidth;
          if (prev) prev.disabled = rail.scrollLeft < 4;
          if (next) next.disabled = rail.scrollLeft > max - 4;
        };
        rail.addEventListener('scroll', edges, { passive: true });
        edges();
        const railCleanup = () => {
          rail.removeEventListener('scroll', paint);
          rail.removeEventListener('scroll', edges);
          rail.removeEventListener('pointerdown', onDown);
          rail.removeEventListener('pointermove', onMove);
          rail.removeEventListener('pointerup', onUp);
          rail.removeEventListener('pointercancel', onUp);
          gsap.ticker.remove(railRaf);
          railLenis?.destroy();
        };
        cleanupRail = railCleanup;
      } else if (railNative && railBar) {
        // Без своей копии Lenis лента крутится родной прокруткой, но полоса
        // прогресса нужна и там.
        const paint = () => {
          const max = railNative.scrollWidth - railNative.clientWidth;
          const view = railNative.clientWidth / railNative.scrollWidth;
          const pos = max > 0 ? railNative.scrollLeft / max : 0;
          gsap.set(railBar, {
            scaleX: view,
            x: (railNative.clientWidth - railNative.clientWidth * view) * pos,
          });
        };
        railNative.addEventListener('scroll', paint, { passive: true });
        paint();
        cleanupRail = () => railNative.removeEventListener('scroll', paint);
      }

      /* ── Стекло в движении ──────────────────────────────────────────
         Панели живут: чем ниже по первому экрану, тем толще стекло — радиус
         растёт с 32 до 48 px, заливка чуть светлеет. Сами панели идут вверх
         с небольшим параллаксом, пока кадр за ними едет вниз: подложка
         заметно движется за стеклом.

         Ключевое: радиус НЕ пишется каждый кадр. Замер — 49 кадров дольше
         33 мс за восемь щелчков колеса: смена переменной размытия
         заставляет композитор пересчитывать блюр всей панели заново, и на
         движении это дороже всего остального вместе взятого. Поэтому во
         время движения CSS держит радиус на 18 px, цель считается в
         onUpdate дёшево (только число), а применяется один раз — когда
         страница остановилась. Переход 0,35 с описан в CSS. */
      /* Панели первого экрана идут параллаксом относительно кадра: подложка
         за стеклом заметно двигается, и стекло от этого живёт. Двигается
         только положение — ни плотность, ни радиус размытия по прокрутке не
         меняются нигде на сайте.

         Раньше здесь стоял скраб: радиус ехал 32 -> 48, заливка 0,5 -> 0,44.
         Плюс на время движения размытие у шапки подменялось плотной
         заливкой и возвращалось через 160 мс. Оба механизма читались как
         моргание — и на десктопе, и на телефоне. Убраны. */
      const heroSection = document.querySelector<HTMLElement>('section');
      const panels = gsap.utils.toArray<HTMLElement>('[data-glass-parallax]');
      if (heroSection && panels.length) {
        gsap.fromTo(
          panels,
          { y: 0 },
          {
            y: -34,
            ease: 'none',
            scrollTrigger: {
              trigger: heroSection,
              start: 'top top',
              end: 'bottom top',
              scrub: 0.5,
              onToggle: (self) => {
                // Слой композитора и will-change — только на время работы.
                panels.forEach((el) => {
                  el.style.willChange = self.isActive ? 'transform' : '';
                });
              },
            },
          },
        );
      }

      /* ── 2. Появление ───────────────────────────────────────────────────
         Одно на весь сайт: прозрачность 0 → 1 и масштаб 0,98 → 1 от центра.
         Ни сдвига по вертикали, ни по горизонтали, ни разбора текста на
         строки. Обе свойства композитор считает сам, вёрстка не
         пересчитывается — моргать физически нечему.

         Играет только то, что при загрузке лежит ниже кадра. Элементы,
         которые уже видны, не трогаются вовсе: движение поднимается по
         первому намерению листать, то есть заведомо после первой отрисовки,
         и любое прятание таких элементов скриптом — это вспышка на готовом
         содержимом. Пряталось бы стилями — тот же элемент остался бы
         невидимым, если ScrollTrigger не отработал; это уже съедало полстраницы
         на мобильной, и правило 10 писалось именно поэтому.

         Сборка идёт частями через простой, а не одной задачей: одна задача
         разбора и построения всех триггеров занимала на придушенном вшестеро
         процессоре около 150 мс и целиком попадала во время блокировки. */
      const chunks: (() => void)[] = [];
      let revealGuard = 0;
      const ctx = gsap.context(() => {
        const SEL = [
          '[data-reveal]',
          '[data-hero]',
          '[data-fact]',
          '[data-rail-item]',
          '[data-fleet]',
          '[data-total]',
          '[data-term]',
          '[data-step]',
        ].join(',');

        const below = Array.from(document.querySelectorAll<HTMLElement>(SEL)).filter(
          (el) => el.getBoundingClientRect().top > window.innerHeight * 0.86,
        );

        if (below.length) {
          /* Прячем сразу, одним gsap.set, — и только те элементы, которые
             прямо сейчас ниже кадра. Это и есть лекарство от вспышки.

             gsap.from на пороге top 85% гасил элемент в тот момент, когда он
             уже вошёл в кадр на 15% высоты экрана: человек видел готовый
             блок, блок гас и проявлялся заново. Замер ловил 25 таких вспышек
             за один проход страницы.

             Прятать стилями заранее нельзя: элемент останется невидимым,
             если скрипт не выполнится, — правило 10 писалось после того, как
             это съело полстраницы на мобильной. Здесь прячет и показывает
             один и тот же механизм: не работает ScrollTrigger — ничего и не
             спрятано. */
          gsap.set(below, {
            opacity: 0,
            scale: REVEAL.scale,
            transformOrigin: '50% 50%',
            // Слой композитора создаётся здесь, заранее, а не в момент
            // старта анимации: иначе первый кадр появления уходит на
            // подготовку слоя.
            willChange: 'transform,opacity',
          });

          // Кто ещё не показан. Список нужен страховке ниже: по нему она
          // ходит вместо всей страницы и читает только геометрию, не стили.
          const pending = new Set(below);
          const show = (els: HTMLElement[]) => {
            els.forEach((el) => pending.delete(el));
            gsap.to(els, {
              opacity: 1,
              scale: 1,
              duration: DUR.reveal,
              ease: EASE_REVEAL,
              stagger: REVEAL.stagger,
              overwrite: 'auto',
              clearProps: 'opacity,transform,willChange',
            });
          };

          ScrollTrigger.batch(below, {
            start: REVEAL.start,
            once: true,
            // Элементы, входящие в кадр вместе, играют одной группой.
            // Не больше шести в пачке — иначе длинная сетка каталога
            // проявляется одной простынёй.
            interval: 0.08,
            batchMax: 6,
            onEnter: (batch) => show(batch as HTMLElement[]),
          });

          /* Страховка на случай, если триггер не отработал: спрятанный
             элемент, оказавшийся в кадре, показывается принудительно.

             Ходит только по тем, кто ещё не показан, и читает
             getBoundingClientRect, а не getComputedStyle. Первая версия
             читала стили у всех элементов страницы раз в две секунды и
             добавляла 190 пересчётов стиля за проход — страховка стоила
             дороже того, от чего страхует. Когда показывать больше некого,
             проверка снимает себя. */
          revealGuard = window.setInterval(() => {
            if (!pending.size) {
              window.clearInterval(revealGuard);
              revealGuard = 0;
              return;
            }
            const late: HTMLElement[] = [];
            pending.forEach((el) => {
              const b = el.getBoundingClientRect();
              if (b.bottom > 0 && b.top < window.innerHeight) late.push(el);
            });
            if (late.length) show(late);
          }, 2000);
        }

        chunks.push(() => {
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

        });

        chunks.push(() => {
        /* ── Порядок работы и условия: сползание секции ─────────────────
           Ни одного закрепления. Раньше здесь стояли две закреплённые
           секции подряд: человек крутил колесо, а страница не двигалась
           сначала шесть условий, потом пять шагов. Теперь секция едет
           вместе со страницей, а её содержимое отстаёт — сползает примерно
           на 15% от пройденной прокрутки.

           Отставание симметричное: содержимое входит чуть ниже своего места
           и уходит чуть выше. Односторонний сдвиг на те же 15% уводил бы
           блок за верхнюю кромку задолго до конца.

           Размах ограничен сверху: на длинной секции 15% от полного прохода
           это уже сотни пикселей. Потолок 180 px на весь проход, то есть
           ±90 — ровно столько, чтобы содержимое не вылезало за собственную
           отбивку секции (96 px). На потолке 240 замер показывал выход на
           24 px за верхнюю границу в конце прохода. */
        const wfDrift = document.querySelector<HTMLElement>('[data-workflow-drift]');
        const wfBox = document.querySelector<HTMLElement>('[data-workflow]');
        if (wfDrift && wfBox) {
          const half = () => {
            const pass = wfBox.getBoundingClientRect().height + window.innerHeight;
            return Math.min(180, Math.max(110, pass * 0.15)) / 2;
          };
          gsap.fromTo(
            wfDrift,
            { y: () => half() },
            {
              y: () => -half(),
              ease: 'none',
              scrollTrigger: {
                trigger: wfBox,
                start: 'top bottom',
                end: 'bottom top',
                // Короткая догонка: под инерцией Lenis жёсткий скраб
                // отыгрывает каждый микрошаг колеса и блок мелко трясётся.
                scrub: 0.5,
                invalidateOnRefresh: true,
                onToggle: (self) => {
                  wfDrift.style.willChange = self.isActive ? 'transform' : '';
                },
              },
            },
          );
        }

        });

        chunks.push(() => {
        /* ── Объекты: кадр едет внутри рамки ────────────────────────────
           Увеличения при наведении больше нет. Оно дёргало кадр рывком на
           каждое движение мыши по списку и к содержанию строки отношения не
           имело: снимок один на все объекты, менялся только кроп.

           Вместо этого кадр медленно едет внутри неподвижной рамки по мере
           прокрутки: ±5% собственной высоты, то есть 10% за весь проход
           блока. Изображение крупнее рамки на 16% и сдвинуто вверх на 8,
           поэтому пустые края не открываются ни в одном положении.

           Наведение на строку осталось, но трогает только строку — подсветку
           делает CSS, скрипт в этом не участвует. */
        const objPhoto = document.querySelector<HTMLElement>('[data-object-photo] img');
        const objBox = document.querySelector<HTMLElement>('[data-object-photo]');
        if (objPhoto && objBox) {
          gsap.fromTo(
            objPhoto,
            { yPercent: -5 },
            {
              yPercent: 5,
              ease: 'none',
              scrollTrigger: {
                trigger: objBox,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 0.5,
                invalidateOnRefresh: true,
                onToggle: (self) => {
                  objPhoto.style.willChange = self.isActive ? 'transform' : '';
                },
              },
            },
          );
        }

        });

        chunks.push(() => {
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
      });

      /* Куски выполняются по одному в простое; если простоя нет — таймером,
         но всё равно по одному за задачу. */
      const runChunk = () => {
        const next = chunks.shift();
        if (!next || cancelled) return;
        ctx.add(next);
        if (chunks.length) {
          if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(runChunk, { timeout: 400 });
          } else {
            window.setTimeout(runChunk, 0);
          }
        } else {
          ScrollTrigger.refresh();
        }
      };
      runChunk();

      cleanup = () => {
        cleanupRail?.();
        document.removeEventListener('click', onAnchor);
        ctx.revert();
        gsap.ticker.remove(raf);
        lenis.destroy();
        window.clearInterval(revealGuard);
        root.style.removeProperty('--pill');
        document.documentElement.classList.remove('lenis-ready');
      };
    };

    /* Когда поднимать движение.
       Разбор gsap с Lenis — это около 190 мс работы главного потока на
       придушенном вшестеро процессоре: два куска по 110 и 81 мс. Если они
       встают между первой отрисовкой и готовностью к вводу, это чистое время
       блокировки, а пользы в них в этот момент ноль: смотреть ещё не на что.

       Поэтому старт привязан к первому намерению листать — колесо, касание,
       клавиша, движение мыши, — либо к простою через 1,5 с после load, что
       наступит раньше. Человек, который сразу тянется к колесу, получает
       движение мгновенно; вкладка, открытая и брошенная, не тратит на него
       ни миллисекунды. */
    let started = false;
    const kick = () => {
      if (started || cancelled) return;
      started = true;
      detach();
      void start();
    };
    const EVENTS = ['wheel', 'touchstart', 'keydown', 'pointermove', 'scroll'] as const;
    let idle = 0;
    const detach = () => {
      EVENTS.forEach((e) => window.removeEventListener(e, kick));
      if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
    const arm = () => {
      EVENTS.forEach((e) => window.addEventListener(e, kick, { once: true, passive: true }));
      // Запасной подъём по простою — страховка на случай, когда человек
      // открыл страницу и ничего не делает. Потолок трогать бессмысленно:
      // requestIdleCallback срабатывает на первом же простое, а не по
      // таймауту, — поднимали до 5 с, медиана Lighthouse не сдвинулась
      // (89 против 89,5).
      idle =
        typeof window.requestIdleCallback === 'function'
          ? window.requestIdleCallback(kick, { timeout: 1500 })
          : window.setTimeout(kick, 1200);
    };
    if (document.readyState === 'complete') arm();
    else window.addEventListener('load', arm, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener('load', arm);
      detach();
      cleanup?.();
    };
  }, []);

  return null;
}

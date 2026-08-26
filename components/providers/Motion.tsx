'use client';

import { useEffect, useLayoutEffect } from 'react';
import { DUR, EASE, EASE_REVEAL, REVEAL, prefersReducedMotion } from '@/lib/motion';
/* Lenis импортируется статически, а не по требованию. Динамический импорт
   стоил ещё полсекунды после гидратации: замер давал готовность прокрутки
   на 1773 мс при гидратации 1272 — модуль надо было сходить забрать и
   разобрать, пока главный поток занят. Со статическим он уже в первом
   бандле, и прокрутка поднимается в тот же кадр, что и эффект. Цена — около
   11 КБ в первом бандле; gsap и ScrollTrigger, которые вчетверо тяжелее,
   по-прежнему грузятся по требованию. */
import Lenis from 'lenis';

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
/* На сервере layout-эффектов нет, и React об этом предупреждает. Компонент
   ничего не рисует и осмыслен только на клиенте, поэтому подменяем хук. */
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function Motion() {
  /* ПРОКРУТКА ПОДНИМАЕТСЯ В LAYOUT-ЭФФЕКТЕ, а не в обычном.
     Обычные эффекты React выполняет после того, как коммит завершён и
     страница отрисована, и на придушенном вшестеро процессоре это оказалось
     на 490 мс позже конца гидратации: разбор закончился на 1272 мс, а
     эффекты пошли на 1762. Всё это время под человеком работала нативная
     прокрутка. Layout-эффект выполняется сразу после коммита, до отрисовки,
     и модель прокрутки встаёт на место в тот же кадр, что и разметка. */
  useIsoLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const l = new Lenis({
      duration: 1.15,
      easing: (t: number) => 1 - Math.pow(1 - t, 4),
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      smoothWheel: true,
    });
    /* Экземпляр выставлен наружу намеренно и ровно для одного: модальные
       панели должны уметь остановить прокрутку страницы под собой.
       overflow: hidden на body Lenis не останавливает — он ведёт прокрутку
       сам, мимо штатного механизма. */
    const w = window as unknown as { lenis?: Lenis; __lenisOwnLoop?: () => void };
    w.lenis = l;
    /* Пока gsap не пришёл, Lenis крутится на собственном rAF. Когда придёт,
       петля передаётся его тикеру — инвариант «оба в одном такте» из
       CLAUDE.md восстанавливается. Способ снять свою петлю выставлен наружу:
       без него два цикла гнали бы lenis.raf дважды за кадр. */
    let raf = 0;
    const tick = (time: number) => {
      l.raf(time);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const stopOwnLoop = () => {
      if (!raf) return;
      cancelAnimationFrame(raf);
      raf = 0;
    };
    w.__lenisOwnLoop = stopOwnLoop;
    document.documentElement.classList.add('lenis-ready');
    return () => {
      stopOwnLoop();
      delete w.lenis;
      delete w.__lenisOwnLoop;
      l.destroy();
      document.documentElement.classList.remove('lenis-ready');
    };
  }, []);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;
    let cleanupRail: (() => void) | undefined;

    /* ── ПОРЯДОК ПОДЪЁМА ────────────────────────────────────────────────
       Раньше прокрутка и всё остальное поднимались одним куском, и этот
       кусок ждал window.load плюс простоя. Замер на придушенном вшестеро
       процессоре: первая отрисовка 348 мс, гидратация 1272, а инерционная
       прокрутка — только 2665. Две с лишним секунды страница листалась
       нативно, потом поведение под человеком менялось.

       Теперь подъём разделён на два. Прокрутка — это один Lenis, ~10 КБ и
       никакого разбора триггеров: она поднимается сразу, как только эффект
       выполнился, то есть на гидратации. Всё тяжёлое — gsap, ScrollTrigger,
       появления, параллакс, лента — по-прежнему ждёт первого намерения
       листать или простоя: это те самые ~190 мс работы главного потока,
       ради которых отсрочка и заводилась.

       Пока gsap не пришёл, Lenis крутится на собственном rAF. Когда gsap
       появляется, петля передаётся его тикеру — инвариант «оба в одном
       такте» из CLAUDE.md восстанавливается. */
    const start = async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      /* Экземпляр уже поднят layout-эффектом выше — здесь его только
         подхватывают и передают петлю тикеру gsap. */
      const w = window as unknown as { lenis?: Lenis; __lenisOwnLoop?: () => void };
      const lenis = w.lenis;
      if (cancelled || !lenis) return;
      /* Локальная ссылка: дальше по функции TypeScript иначе не верит, что
         поле не обнулилось между await-ами. */
      const scroll = lenis;
      gsap.registerPlugin(ScrollTrigger);

      /* ── 1. Прокрутка ───────────────────────────────────────────────────
         Петля переезжает с собственного rAF Lenis на тикер gsap: с этого
         момента lenis.raf и анимации идут в одном такте, как и было
         задумано. Тикер отдаёт секунды, raf ждёт миллисекунды — × 1000.
         Своя петля снимается ДО добавления тикера: иначе lenis.raf вызывался
         бы дважды за кадр и прокрутка шла бы вдвое быстрее. */
      w.__lenisOwnLoop?.();
      scroll.on('scroll', ScrollTrigger.update);
      const raf = (time: number) => scroll.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
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
        scroll.scrollTo(target as HTMLElement, {
          offset: -96,
          duration: 1.1,
          /* Фокус переносится на цель, иначе он остаётся на ссылке. Для
             обычного пункта меню это мелочь, а для ссылки «К основному
             содержанию» — весь её смысл: она обязана пропустить шапку, а
             перехват тут отменял штатное поведение браузера и фокус не
             двигался вовсе. tabIndex ставится на время и снимается по
             уходу фокуса, чтобы цель не появилась в обходе табом. */
          onComplete: () => {
            const el = target as HTMLElement;
            if (!el.hasAttribute('tabindex')) {
              el.setAttribute('tabindex', '-1');
              el.addEventListener('blur', () => el.removeAttribute('tabindex'), { once: true });
            }
            el.focus({ preventScroll: true });
          },
        });
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
         Лента обязана листаться всеми способами, и ни один из них не имеет
         права зависеть от того, какой у человека указатель. Раньше зависел:
         вся обвязка стояла под условием `pointer: fine`, и на ноутбуке с
         сенсорным экраном — а это обычный ноутбук, не планшет — медиа-запрос
         отдаёт coarse, обвязка не поднималась вовсе. Замер на таком экране:
         кнопка-стрелка двигала ленту на 0 px, тяга мышью на 0 px. Лента
         стояла колом при полностью рабочей мыши.

         Теперь под указателем стоит ровно одна вещь — горизонтальная копия
         Lenis. Она нужна только там, где крутят колесом и трекпадом; на
         телефоне свайп родной и инерционный, и вторая инерция поверх
         ощущается как залипание. Всё остальное — тяга, стрелки, полоса
         прогресса — поднимается всегда, а на телефоне тяга пропускает
         касания: там их ведёт родная прокрутка.

         gestureOrientation: horizontal — принципиально. При 'both' колесо над
         лентой крутит ленту вместо страницы, и, докрутив ленту до конца,
         человек упирается: страница под курсором стоит. Сейчас вертикальное
         колесо всегда ведёт страницу, ленту двигают горизонтальный жест
         трекпада, shift + колесо, свайп, клавиатура и кнопки.

         Полоса прогресса под лентой: ширина бегунка — доля видимой части,
         положение — доля прокрутки. Двигается transform. */
      const rail = document.querySelector<HTMLElement>('[data-rail]');
      const railBar = document.querySelector<HTMLElement>('[data-rail-bar]');
      let railLenis: InstanceType<typeof Lenis> | undefined;
      if (rail) {
        const finePointer = window.matchMedia('(pointer: fine)').matches;
        let railRaf: ((time: number) => void) | undefined;
        if (finePointer) {
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
          railRaf = (time: number) => railLenis?.raf(time * 1000);
          gsap.ticker.add(railRaf);
        }

        /* Доводка до позиции: через Lenis, если он есть, иначе родной
           плавной прокруткой. Без запасного пути кнопки и инерция молчали
           бы везде, где копия Lenis не поднимается. */
        const maxLeft = () => Math.max(0, rail.scrollWidth - rail.clientWidth);
        const glide = (to: number, duration: number) => {
          const target = Math.max(0, Math.min(maxLeft(), to));
          if (railLenis) railLenis.scrollTo(target, { duration });
          else rail.scrollTo({ left: target, behavior: 'smooth' });
        };

        /* Shift + колесо — один из четырёх записанных способов листать ленту,
           и он не работал вовсе. Браузер отдаёт этот жест как deltaY с
           поднятым shiftKey, а копия Lenis у ленты слушает
           gestureOrientation: 'horizontal' и такого события не видит. Дальше
           его забирал вертикальный Lenis и вёл страницу.

           Перехват на самой ленте в фазе перехвата: Lenis вешает свой
           обработчик на window в фазе всплытия, поэтому здесь мы раньше.
           stopPropagation не даёт событию дойти до него вовсе. */
        const onShiftWheel = (e: WheelEvent) => {
          if (!e.shiftKey) return;
          const delta = e.deltaY || e.deltaX;
          if (!delta) return;
          e.preventDefault();
          e.stopPropagation();
          glide(rail.scrollLeft + delta, 0.5);
        };
        rail.addEventListener('wheel', onShiftWheel, { passive: false, capture: true });

        const paint = () => {
          if (!railBar) return;
          const max = maxLeft();
          const view = rail.clientWidth / rail.scrollWidth;
          const pos = max > 0 ? rail.scrollLeft / max : 0;
          gsap.set(railBar, {
            scaleX: view,
            x: (rail.clientWidth - rail.clientWidth * view) * pos,
          });
        };
        rail.addEventListener('scroll', paint, { passive: true });
        paint();

        /* Родной drag-and-drop уводил жест у тяги. Картинка внутри карточки
           и сама ссылка перетаскиваемы по умолчанию (img.draggable и
           a.draggable равны true), dragstart никто не отменял — браузер на
           первом же движении начинал тащить картинку, присылал
           pointercancel, и тяга обрывалась, не сдвинув ленту. Синтетическая
           мышь этого не воспроизводит, поэтому в прогонах тяга «работала», а
           у человека нет. Отменяем dragstart на ленте целиком. */
        const onDragStart = (e: Event) => e.preventDefault();
        rail.addEventListener('dragstart', onDragStart);

        /* Перетаскивание мышью. Пока тянут, Lenis выключен и позиция
           пишется напрямую; на отпускании остаток скорости уходит в
           доводку — лента доезжает по инерции, а не встаёт колом.
           Касания пропускаем: там ведёт родная прокрутка.

           Захват указателя берётся НЕ на нажатии, а только когда смещение
           перешло порог. Это не тонкость: пока захват брался на
           pointerdown, элементом клика становилась сама лента, а не ссылка
           под курсором, — карточка переставала открывать каталог. Замер:
           клик по карточке оставлял адрес на «/» вместо
           «/catalog/?category=shcheben». Захват нужен только тяге — чтобы
           жест не рвался, когда курсор ушёл за пределы ленты, — а тяга к
           этому моменту уже отличена от клика. */
        const DRAG_THRESHOLD = 5;
        let pressed = false;
        let dragging = false;
        let startX = 0;
        let startLeft = 0;
        let lastX = 0;
        let lastT = 0;
        let moved = 0;
        let velocity = 0;
        const onDown = (e: PointerEvent) => {
          if (e.button !== 0 || e.pointerType === 'touch') return;
          pressed = true;
          dragging = false;
          startX = lastX = e.clientX;
          startLeft = rail.scrollLeft;
          lastT = performance.now();
          moved = 0;
          velocity = 0;
        };
        const onMove = (e: PointerEvent) => {
          if (!pressed) return;
          moved = Math.max(moved, Math.abs(e.clientX - startX));
          if (!dragging) {
            if (moved <= DRAG_THRESHOLD) return;
            dragging = true;
            railLenis?.stop();
            rail.classList.add('is-dragging');
            rail.setPointerCapture(e.pointerId);
          }
          const now = performance.now();
          const dt = Math.max(1, now - lastT);
          velocity = (e.clientX - lastX) / dt;
          lastX = e.clientX;
          lastT = now;
          rail.scrollLeft = startLeft - (e.clientX - startX);
        };
        const onUp = (e: PointerEvent) => {
          if (!pressed) return;
          pressed = false;
          if (!dragging) return;
          dragging = false;
          rail.classList.remove('is-dragging');
          if (rail.hasPointerCapture?.(e.pointerId)) rail.releasePointerCapture(e.pointerId);
          railLenis?.start();
          // 260 — во столько раз догоняет остаток жеста; подобрано так,
          // чтобы бросок пальцем проходил примерно карточку.
          glide(rail.scrollLeft - velocity * 260, 1.1);
        };
        rail.addEventListener('pointerdown', onDown);
        rail.addEventListener('pointermove', onMove);
        rail.addEventListener('pointerup', onUp);
        rail.addEventListener('pointercancel', onUp);
        // Клик по карточке после протаскивания открывал бы каталог.
        // Порог тот же: сдвинулись меньше чем на 5 px — это клик.
        const onClick = (e: MouseEvent) => {
          if (moved > DRAG_THRESHOLD) {
            e.preventDefault();
            e.stopPropagation();
          }
        };
        rail.addEventListener('click', onClick, true);

        /* Стрелки: листают на ширину карточки и гаснут на краях. */
        const prev = document.querySelector<HTMLButtonElement>('[data-rail-prev]');
        const next = document.querySelector<HTMLButtonElement>('[data-rail-next]');
        const step = () => (rail.querySelector<HTMLElement>('[data-rail-item]')?.offsetWidth ?? 320) + 16;
        const goPrev = () => glide(rail.scrollLeft - step(), 0.9);
        const goNext = () => glide(rail.scrollLeft + step(), 0.9);
        prev?.addEventListener('click', goPrev);
        next?.addEventListener('click', goNext);
        const edges = () => {
          const max = maxLeft();
          if (prev) prev.disabled = rail.scrollLeft < 4;
          if (next) next.disabled = rail.scrollLeft > max - 4;
        };
        rail.addEventListener('scroll', edges, { passive: true });
        edges();

        cleanupRail = () => {
          rail.removeEventListener('wheel', onShiftWheel, true);
          rail.removeEventListener('scroll', paint);
          rail.removeEventListener('scroll', edges);
          rail.removeEventListener('dragstart', onDragStart);
          rail.removeEventListener('pointerdown', onDown);
          rail.removeEventListener('pointermove', onMove);
          rail.removeEventListener('pointerup', onUp);
          rail.removeEventListener('pointercancel', onUp);
          rail.removeEventListener('click', onClick, true);
          prev?.removeEventListener('click', goPrev);
          next?.removeEventListener('click', goNext);
          if (railRaf) gsap.ticker.remove(railRaf);
          railLenis?.destroy();
        };
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
        /* Кадр анонса металла едет тем же приёмом и с тем же размахом, что
           и кадр объектов: ±5% своей высоты внутри неподвижной рамки, то
           есть 10% за проход блока. Один рецепт на оба кадра — заводить для
           нового блока своё движение незачем. */
        const metalPhoto = document.querySelector<HTMLElement>('[data-metal-photo] img');
        const metalBox = document.querySelector<HTMLElement>('[data-metal-photo]');
        if (metalPhoto && metalBox) {
          gsap.fromTo(
            metalPhoto,
            { yPercent: -5 },
            {
              yPercent: 5,
              ease: 'none',
              scrollTrigger: {
                trigger: metalBox,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 0.5,
                invalidateOnRefresh: true,
                onToggle: (self) => {
                  metalPhoto.style.willChange = self.isActive ? 'transform' : '';
                },
              },
            },
          );
        }

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
        window.clearInterval(revealGuard);
        root.style.removeProperty('--pill');
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
    /* Тяжёлое — по намерению листать или по простою. Ждать window.load для
       этого больше незачем: раньше отсчёт начинался только после него, а
       load ждёт все изображения страницы — замер давал 1253 мс на
       придушенном процессоре. requestIdleCallback и сам не выстрелит, пока
       главный поток занят разбором и гидратацией. */
    arm();

    return () => {
      cancelled = true;
      detach();
      cleanup?.();
    };
  }, []);

  return null;
}

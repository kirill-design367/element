import { PHOTO } from '@/lib/assets';
import { Photo } from '@/components/ui/Photo';
import { ButtonLink } from '@/components/ui/Button';
import { typo } from '@/lib/format';

/**
 * Анонс металлопроката.
 *
 * Направление только открывается: номенклатуры, марок стали, ГОСТов, цен и
 * сроков ещё нет, и в тексте их нет тоже — ни одной цифры и ни одного
 * названия позиции. Карточка сообщает факт направления и ведёт в заявку,
 * больше ничего не обещая. Это же причина, по которой металла нет ни в
 * каталоге, ни в калькуляторе, ни в фильтрах, ни в счётчике позиций: число
 * позиций считается из lib/catalog.ts и остаётся прежним.
 *
 * Устройство повторяет блок «Объекты»: текст слева в контейнере, кадр
 * справа уходит за правый край экрана. Текст на кадр не ложится вовсе,
 * поэтому спокойная зона снимка не тратится на читаемость — она просто
 * остаётся видимой.
 *
 * На телефоне кадр вертикальный и стоит сверху, текст с кнопкой под ним.
 */
export function Metal() {
  return (
    <div className="grid items-stretch gap-8 lg:grid-cols-12 lg:gap-0">
      {/* ── Кадр ──────────────────────────────────────────────────────────
          На телефоне идёт первым — order-1, на десктопе уходит вправо.
          Рамка неподвижна, кадр едет внутри неё по прокрутке: ±5% своей
          высоты, то есть 10% за проход. Изображение крупнее рамки на 16% и
          сдвинуто вверх на 8 — пустых краёв не открывается ни в одном
          положении. contain: paint и свой слой композитора обязательны: без
          них кадр рвётся при прокрутке. */}
      <div className="order-1 lg:order-2 lg:col-span-6">
        {/* Правая половина уходит за край экрана: у неё нет правого поля, а
            вылет обрезает сама страница (overflow-x: clip на html). Скругление
            только слева — справа кадр упирается в край экрана. */}
        <div
          data-metal-photo
          className="group relative h-full min-h-[280px] overflow-hidden bg-surface-2 [contain:paint] [transform:translateZ(0)] lg:min-h-[420px] lg:rounded-l-panel"
        >
          {PHOTO.metal.file && (
            <Photo
              file={PHOTO.metal.file}
              mobile={PHOTO.metal.mobile}
              alt={PHOTO.metal.brief}
              sizes="(min-width: 1024px) 52vw, 100vw"
              className="absolute inset-0"
              imgClassName="photo-zoom absolute inset-x-0 -top-[8%] h-[116%]"
            />
          )}
        </div>
      </div>

      {/* ── Текст и кнопка ───────────────────────────────────────────────
          Стоят в контейнере слева, на кадр не заходят. */}
      <div className="order-2 lg:order-1 lg:col-span-6 lg:flex lg:flex-col lg:justify-center">
        <div className="narrow narrow-left lg:max-w-none lg:pr-10">
          <h2 data-reveal className="font-black text-t4 leading-[1.04] tracking-[-.02em]">
            {typo('Ещё и металл')}
          </h2>
          <p className="mt-4 max-w-[46ch] text-t2 leading-relaxed text-ink-2">
            {typo(
              'Помимо инертных материалов возим металлопрокат. Номенклатуру собираем, цену считаем по запросу — напишите, что нужно, и мы ответим сроком и стоимостью.',
            )}
          </p>
          <ButtonLink href="#zayavka" className="mt-7">
            Запросить прайс
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

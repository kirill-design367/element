import { nbsp } from '@/lib/format';
import { COMPANY } from '@/lib/company';

/**
 * Одна строка и минимум высоты.
 *
 * Меню в три колонки отсюда убрано: те же разделы стоят в шапке, которая
 * висит на экране всегда, и дублировать их внизу незачем — подвал от этого
 * был выше первого экрана телефона.
 *
 * Осталось то, что в подвале действительно ищут: кто это и как связаться.
 * Связь — телефон и почта: почта вернулась 29.08, когда появился настоящий
 * адрес. Оговорка про оферту убрана заказчиком.
 */
export function Footer() {
  return (
    /* Запас под нижнюю липкую панель висит на подвале, а не на <main>:
       подвал лежит РЯДОМ с main, а не внутри, и запас на main оставлял его
       незакрытым. Замер на 390 в самом низу страницы: панель высотой 69 px
       ложилась на подвал высотой 121 px и закрывала 69 из них, а докрутить
       было нечем — страница уже кончилась. */
    <footer className="border-t border-line bg-surface-2 py-6 pb-[calc(24px+var(--bar-h)+8px)] lg:pb-6">
      <div className="shell flex flex-col gap-3 text-t1 text-ink-2 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-t2 font-black text-ink">Элемент</span>
          <span>
            © {new Date().getFullYear()} {COMPANY.legalName}
          </span>
        </p>

        <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {/* Цель нажатия поднята до 45,6 px по высоте: строка телефона сама
              по себе 15,6, и пальцем в неё попасть нечем. Поле добавляет
              .tap-y, отрицательный margin его вычитает — в раскладке не
              сдвинулось ничего. Плашка наведения при этом не выросла: она
              считает свой отступ от того же --tap-y. */}
          <a
            href={`tel:${COMPANY.phone}`}
            className="nav-zoom tap-y tap-phone rounded font-semibold text-ink"
          >
            {nbsp(COMPANY.phoneLabel)}
          </a>
          {/* Почта тем же приёмом, что телефон: та же плашка наведения, то
              же поле под палец. Набрана вторичным цветом — телефон впереди. */}
          <a
            href={`mailto:${COMPANY.email}`}
            className="nav-zoom tap-y tap-phone rounded"
          >
            {COMPANY.email}
          </a>
        </p>
      </div>
    </footer>
  );
}

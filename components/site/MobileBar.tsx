import Link from 'next/link';
import { COMPANY } from '@/lib/company';
import { PhoneIcon } from './Icons';

/**
 * Нижняя панель на телефоне и планшете. Телефон и заявка закреплены на
 * экране постоянно — путь до заявки с любой точки страницы равен одному
 * касанию.
 *
 * Порог lg, а не md, и это не косметика. Пока панель пряталась с 768, а
 * кнопка в шапке появлялась с той же ширины, на полосе 768-934 px кнопки
 * заявки не было НИГДЕ: в пилюле она не помещалась и уезжала за правый край
 * экрана — на 768 за пилюлю на 155 px, за экран на 138. Полтора экрана
 * планшетов оставались без главного действия сайта, что прямо нарушало
 * правило 2 проекта. Теперь до lg действие даёт эта панель, с lg — кнопка
 * в шапке, и ровно одно из двух в любой момент.
 */
export function MobileBar() {
  return (
    /* Линии по верхней кромке нет: ни border, ни тени, ни псевдоэлемента.
       Тонкая полоса держалась на экране постоянно и читалась швом поперёк
       страницы. Панель отделяется от содержимого только своим фоном.

       Фон объявлен классом .mobile-bar в globals.css, а не утилитой
       Tailwind. Здесь стояло bg-bg/95 — и оно не давало НИЧЕГО: цвет темы
       объявлен как var(--bg), модификатор прозрачности к переменной
       неприменим, правило не генерируется вовсе. Замер computed style:
       background-color rgba(0, 0, 0, 0). Панель стояла вообще без фона, и
       держала её ровно та линия, которую велено снять; содержимое
       проходило под кнопками насквозь. */
    <div className="mobile-bar no-print fixed inset-x-0 bottom-0 z-50 lg:hidden">
      <div className="grid grid-cols-2 gap-2 px-3 py-2.5 pb-[max(10px,env(safe-area-inset-bottom))]">
        <a
          href={`tel:${COMPANY.phone}`}
          className="flex h-12 items-center justify-center gap-2 rounded-card border border-line-strong bg-surface text-t2 font-medium text-ink transition-colors hover:border-ink"
        >
          <PhoneIcon className="h-[18px] w-[18px] text-ink-3" />
          Позвонить
        </a>
        <Link
          href="/#zayavka"
          className="flex h-12 items-center justify-center rounded-card bg-accent text-t2 font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Оставить заявку
        </Link>
      </div>
    </div>
  );
}

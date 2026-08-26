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
    <div className="no-print fixed inset-x-0 bottom-0 z-50 border-t border-line bg-bg/95 backdrop-blur-[6px] lg:hidden">
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

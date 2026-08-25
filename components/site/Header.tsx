import Link from 'next/link';
import { COMPANY } from '@/lib/company';
import { nbsp } from '@/lib/format';
import { ButtonLink } from '@/components/ui/Button';
import { PhoneIcon } from './Icons';

const NAV = [
  { href: '/catalog/', label: 'Каталог' },
  { href: '/#raschet', label: 'Расчёт' },
  { href: '/#usloviya', label: 'Условия' },
  { href: '/#process', label: 'Как работаем' },
  { href: '/#kontakty', label: 'Контакты' },
];

/**
 * Плавающая пилюля.
 *
 * Шапка больше не полоса, приклеенная к кромке: скруглённая панель висит
 * поверх содержимого с полями от краёв экрана, и под ней виден кадр. Она
 * не прячется при прокрутке ни на пиксель — телефон и кнопка заявки должны
 * быть на экране в любой момент, это прямое требование к сайту.
 *
 * Фон — матовое стекло: размытие подложки плюс достаточно плотная заливка,
 * чтобы текст читался и над фотографией, и над светлой секцией, и над
 * тёмным парком. Плотность подобрана замером, а не на глаз: см. токены
 * --glass-* в globals.css и раздел про контраст в CLAUDE.md. Браузеру без
 * backdrop-filter отдаётся почти непрозрачная заливка — читаемость важнее
 * приёма.
 *
 * При прокрутке пилюля ужимается по высоте и по ширине и получает более
 * плотный фон: класс на <html> ставит Motion, переход описан здесь же в CSS.
 * Шапка вынута из потока (fixed) и содержит contain: layout — её пересчёт
 * не выходит за пределы панели.
 */
export function Header() {
  return (
    <header className="site-header no-print">
      <div className="site-pill glass">
        {/* Без aria-label: доступное имя должно совпадать с видимой надписью,
            иначе голосовое управление не найдёт ссылку по тому, что видит человек. */}
        <Link href="/" className="shrink-0 rounded-pill px-1 py-1.5">
          <span className="text-t3 font-black leading-none tracking-[-.02em]">Элемент</span>
        </Link>

        <nav aria-label="Основные разделы" className="hidden flex-1 md:block">
          {/* Пункты меню набраны основным цветом, а не вторичным: панель
                висит над фотографией, и серый #5a5f66 над тёмным пикселем
                кадра давал 3,6:1 при заливке 0,78. Основной даёт 9,9:1. */}
          <ul className="flex items-center gap-5 pl-4 text-t2 text-ink lg:gap-6">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="link-underline rounded py-2 transition-colors duration-300 hover:text-accent">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2 md:gap-3">
          <a
            href={`tel:${COMPANY.phone}`}
            className="tnum flex min-h-[44px] items-center gap-1.5 rounded-pill px-1 text-t1 font-semibold tracking-[-.01em] transition-colors duration-300 hover:text-accent md:text-t2"
          >
            <PhoneIcon className="h-4 w-4 text-ink-3 md:h-[18px] md:w-[18px]" />
            <span className="whitespace-nowrap">{nbsp(COMPANY.phoneLabel)}</span>
          </a>
          <ButtonLink href="/#zayavka" size="md" className="hidden shrink-0 md:inline-flex">
            Запросить прайс
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}

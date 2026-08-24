import Link from 'next/link';
import { COMPANY } from '@/lib/company';
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
 * Шапка липкая и не прячется при скролле: телефон и кнопка заявки должны
 * быть на экране в любой момент — это прямое требование к сайту.
 */
export function Header() {
  return (
    <header
      // Фон непрозрачный, без альфы и размытия: полупрозрачная шапка
      // превращала логотип и меню в нечитаемое пятно поверх содержимого.
      className="sticky top-0 z-50 border-b border-line bg-bg"
    >
      <div className="shell flex h-14 items-center gap-4 md:h-[68px] md:gap-8">
        {/* Без aria-label: доступное имя должно совпадать с видимой надписью,
            иначе голосовое управление не найдёт ссылку по тому, что видит человек. */}
        <Link href="/" className="group -my-2 flex shrink-0 items-baseline gap-2 rounded py-2">
          <span className="font-display text-[17px] font-bold uppercase leading-none tracking-[.12em] md:text-[19px]">
            Элемент
          </span>
          <span className="hidden text-[11px] leading-none text-ink-2 lg:inline">
            строительный дом
          </span>
        </Link>

        <nav aria-label="Основные разделы" className="hidden flex-1 md:block">
          <ul className="flex items-center gap-6 text-[14px] text-ink-2">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  className="rounded py-2 transition-colors hover:text-ink focus-visible:text-ink"
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <a
            href={`tel:${COMPANY.phone}`}
            className="tnum -my-2 flex min-h-[44px] items-center gap-1.5 rounded py-2 font-display text-[13px] font-semibold tracking-[-.01em] transition-colors hover:text-accent md:text-[16px]"
          >
            <PhoneIcon className="h-4 w-4 text-accent md:h-[18px] md:w-[18px]" />
            <span className="whitespace-nowrap">{COMPANY.phoneLabel}</span>
          </a>
          <ButtonLink href="/#zayavka" size="md" className="hidden md:inline-flex">
            Запросить прайс
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}

import { nbsp } from '@/lib/format';
import { COMPANY } from '@/lib/company';

/**
 * Одна строка и минимум высоты.
 *
 * Меню в три колонки отсюда убрано: те же разделы стоят в шапке, которая
 * висит на экране всегда, и дублировать их внизу незачем — подвал от этого
 * был выше первого экрана телефона.
 *
 * Остались три вещи, которые в подвале действительно ищут: кто это, как
 * позвонить и оговорка про оферту.
 */
export function Footer() {
  return (
    <footer className="border-t border-line bg-surface-2 py-6">
      <div className="shell flex flex-col gap-3 text-t1 text-ink-2 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-t2 font-black text-ink">Элемент</span>
          <span>
            © {new Date().getFullYear()} {COMPANY.legalName}
          </span>
        </p>

        <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <a href={`tel:${COMPANY.phone}`} className="link-underline rounded font-semibold text-ink">
            {nbsp(COMPANY.phoneLabel)}
          </a>
          <a href={`mailto:${COMPANY.email}`} className="link-underline rounded">
            {COMPANY.email}
          </a>
          <span>Цены на сайте не являются публичной офертой</span>
        </p>
      </div>
    </footer>
  );
}

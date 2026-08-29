import type { Metadata } from 'next';
import { ButtonLink } from '@/components/ui/Button';
import { Section } from '@/components/ui/Section';
import { COMPANY } from '@/lib/company';
import { nbsp, plural, typo } from '@/lib/format';
import { CATEGORIES, POSITIONS_TOTAL } from '@/lib/catalog';

/**
 * СТРАНИЦА 404.
 *
 * Раньше здесь стояла стоковая страница Next — «404: This page could not be
 * found», латиницей на русском сайте. Она честно отдавалась из выдачи, то
 * есть формально была своей, но правило проекта про латиницу нарушала, и на
 * фирменном домене выглядела чужой заплаткой.
 *
 * Шапка, нижняя панель и подвал приходят сами: файл лежит в корневом layout,
 * как любая другая страница.
 *
 * Человек попадает сюда двумя путями: опечатался в адресе или пришёл по
 * ссылке на снятую страницу. В обоих случаях ему нужно не извинение, а
 * дорога дальше — поэтому кнопки идут сразу за заголовком, а не под текстом.
 */
export const metadata: Metadata = {
  title: 'Страница не найдена',
  /* В выдачу ей не надо: это не содержимое, а тупик. */
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <Section tone="bg" width="shell" pad="loose">
      <div className="max-w-[720px]">
        <p className="mark text-t1 text-ink-2">Ошибка 404</p>

        <h1 className="mt-4 font-black text-t4 leading-[1.04] tracking-[-.02em]">
          {typo('Такой страницы нет')}
        </h1>

        <p className="mt-5 max-w-[54ch] text-t2 leading-relaxed text-ink-2">
          {typo(
            'Адрес набран с ошибкой или страницу сняли. Материалы и цены никуда не делись — они в каталоге.',
          )}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/catalog/" size="lg" className="w-full sm:w-auto">
            Перейти в каталог
          </ButtonLink>
          <ButtonLink href="/" variant="secondary" size="lg" className="w-full sm:w-auto">
            На главную
          </ButtonLink>
        </div>

        {/* Числа считаются из данных, а не набраны: правило проекта. */}
        <p className="mt-8 text-t1 text-ink-3">
          {nbsp(
            `В каталоге ${POSITIONS_TOTAL} ${plural(POSITIONS_TOTAL, 'позиция', 'позиции', 'позиций')} в ${CATEGORIES.length} ${plural(CATEGORIES.length, 'группе', 'группах', 'группах')}: щебень, песок, ПГС, отсев, грунт, металлопрокат.`,
          )}
        </p>

        <p className="mt-6 text-t2 text-ink-2">
          Не нашли нужное — звоните:{' '}
          <a href={`tel:${COMPANY.phone}`} className="link-underline rounded font-medium text-accent">
            {nbsp(COMPANY.phoneLabel)}
          </a>
        </p>
      </div>
    </Section>
  );
}

import { COMPANY, CONTACTS_ARE_PLACEHOLDER } from '@/lib/company';
import { nbsp, typo } from '@/lib/format';
import { PhoneIcon } from '@/components/site/Icons';

/**
 * Три равные карточки разбиты.
 *
 * Телефон и почта — первыми и крупно: сюда приходят позвонить или написать,
 * а не читать ОГРН. Адреса идут компактным блоком следом, реквизиты убраны в
 * раскрывающийся блок и по умолчанию свёрнуты. Карта — невысокая полоса во
 * всю ширину экрана под контактами.
 */
export function Contacts() {
  return (
    <>
      <div className="shell">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          {/* ── Телефон и адреса ──────────────────────────────────────── */}
          <div className="lg:col-span-7">
            <h2 data-lines className="font-black text-t4 leading-[1.04] tracking-[-.02em]">
              Контакты
            </h2>

            <a
              href={`tel:${COMPANY.phone}`}
              className="group mt-6 flex items-center gap-4 rounded transition-colors duration-300 hover:text-accent"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line-strong">
                <PhoneIcon className="h-5 w-5 text-ink-3" />
              </span>
              <span className="tnum font-black text-t4 leading-none tracking-[-.03em]">
                {nbsp(COMPANY.phoneLabel)}
              </span>
            </a>

            <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-t2 text-ink-2">
              <a href={`mailto:${COMPANY.email}`} className="link-underline rounded text-t3 font-medium text-ink">
                {COMPANY.email}
              </a>
              <span>{COMPANY.hoursOffice}</span>
            </p>

            {/* Адреса компактным блоком рядом с телефоном, а не таблицей на
                четыре строки: их читают один раз перед выездом. */}
            <dl className="mt-8 grid gap-x-8 gap-y-4 border-t border-line pt-6 sm:grid-cols-2">
              <Line term="Офис" value={COMPANY.officeAddress} />
              <Line term="Отгрузка" value={COMPANY.siteAddress} />
              <Line term="Часы отгрузки" value={COMPANY.hoursShipping} />
              <Line term="География" value={COMPANY.geo} />
            </dl>

            {/* Пока контакты демонстрационные, страница говорит об этом на
                виду, а не внутри свёрнутых реквизитов: телефон и почта здесь
                тоже ненастоящие, и человек должен узнать это до звонка. */}
            {CONTACTS_ARE_PLACEHOLDER && (
              <p className="mt-6 text-t1 leading-snug text-ink-2">
                {typo('Телефон, почта, адреса и реквизиты приведены для примера и заменяются перед запуском.')}
              </p>
            )}
          </div>

          {/* ── Реквизиты ─────────────────────────────────────────────── */}
          <div className="lg:col-span-4 lg:col-start-9">
            <details className="requisites rounded-panel border border-line bg-surface p-5 md:p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-t2 font-black">
                Реквизиты
                <span aria-hidden="true" className="requisites-mark" />
              </summary>

              <dl className="mt-4 space-y-2.5 text-t1">
                <Line term="Наименование" value={COMPANY.legalName} tight />
                <Line term="ИНН / КПП" value={nbsp(`${COMPANY.inn} / ${COMPANY.kpp}`)} tight mono />
                <Line term="ОГРН" value={COMPANY.ogrn} tight mono />
                <Line term="Банк" value={COMPANY.bank} tight />
                <Line term="Р/с" value={COMPANY.account} tight mono />
                <Line term="К/с" value={COMPANY.corr} tight mono />
                <Line term="БИК" value={COMPANY.bik} tight mono />
              </dl>
            </details>
          </div>
        </div>
      </div>

      {/* ── Карта во всю ширину экрана ──────────────────────────────────
          Схема, а не карта: чужих тайлов и стоковой картинки здесь нет.
          Слот PHOTO.map остаётся пустым до решения по Яндекс.Картам. */}
      <div
        className="relative mt-12 h-[200px] overflow-hidden border-y border-line bg-surface-2 md:mt-16 md:h-[240px]"
        role="img"
        aria-label="Схема расположения площадки отгрузки. Интерактивная карта подключается при запуске."
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              'linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)',
            backgroundSize: '34px 34px',
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(115deg, transparent 46%, var(--line-strong) 46%, var(--line-strong) 47.2%, transparent 47.2%)',
          }}
        />
        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
          <span className="h-3 w-3 rounded-full bg-ink ring-4 ring-ink/15" aria-hidden="true" />
          <span className="mt-3 rounded-pill bg-surface px-3 py-1.5 text-t1 font-medium shadow-card">
            Площадка отгрузки
          </span>
        </div>
        <p className="absolute inset-x-0 bottom-0 bg-surface/85 px-4 py-2.5 text-t1 text-ink-2">
          Интерактивная карта подключается при запуске
        </p>
      </div>
    </>
  );
}

function Line({
  term,
  value,
  tight,
  mono,
}: {
  term: string;
  value: string;
  tight?: boolean;
  mono?: boolean;
}) {
  return (
    <div className={tight ? 'flex flex-wrap gap-x-2' : ''}>
      <dt className={`text-ink-2 ${tight ? 'min-w-[92px]' : 'text-t1'}`}>{term}</dt>
      <dd className={`${tight ? 'flex-1' : 'mt-1 text-t2'} ${mono ? 'tnum' : ''}`}>{value}</dd>
    </div>
  );
}

import { COMPANY, CONTACTS_ARE_PLACEHOLDER } from '@/lib/company';

/**
 * Контакты как реквизитный лист: два столбца полей с выравниванием по
 * колонке значений. Телефон — самая крупная строка блока, потому что это
 * и есть действие. Карта заменена схемой: чужих тайлов и стоков не ставим.
 */
export function Contacts() {
  return (
    <div className="grid gap-x-10 gap-y-12 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <p className="mark text-ink-2">Связь</p>
        <a
          href={`tel:${COMPANY.phone}`}
          className="figure mt-3 block text-t4 font-semibold transition-colors hover:text-accent"
        >
          {COMPANY.phoneLabel}
        </a>
        <a
          href={`mailto:${COMPANY.email}`}
          className="mt-3 inline-block text-t2 text-accent underline underline-offset-4 decoration-accent/40 hover:decoration-accent"
        >
          {COMPANY.email}
        </a>

        <dl className="mt-8">
          <Field term="Офис" value={COMPANY.officeAddress} />
          <Field term="Отгрузка" value={COMPANY.siteAddress} />
          <Field term="Часы" value={`${COMPANY.hoursOffice}. ${COMPANY.hoursShipping}`} />
          <Field term="География" value={COMPANY.geo} />
        </dl>
      </div>

      <div className="lg:col-span-4">
        <p className="mark text-ink-2">Реквизиты</p>
        {CONTACTS_ARE_PLACEHOLDER && (
          <p className="mt-3 text-t2 text-ink-2">
            Реквизиты и контакты приведены для примера и заменяются перед запуском.
          </p>
        )}
        <dl className="mt-6">
          <Field term="Наименование" value={COMPANY.legalName} />
          <Field term="ИНН / КПП" value={`${COMPANY.inn} / ${COMPANY.kpp}`} mono />
          <Field term="ОГРН" value={COMPANY.ogrn} mono />
          <Field term="Банк" value={COMPANY.bank} />
          <Field term="Р/с" value={COMPANY.account} mono />
          <Field term="К/с" value={COMPANY.corr} mono />
          <Field term="БИК" value={COMPANY.bik} mono />
        </dl>
      </div>

      {/* Схема проезда: сетка кварталов и вылетная трасса, без чужих тайлов. */}
      <div className="lg:col-span-3">
        <p className="mark text-ink-2">Площадка</p>
        <div
          className="relative mt-3 min-h-[240px] overflow-hidden border border-line bg-surface-2"
          role="img"
          aria-label="Схема расположения площадки отгрузки. Интерактивная карта подключается при запуске."
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-80"
            style={{
              backgroundImage:
                'linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(115deg, transparent 46%, var(--line-strong) 46%, var(--line-strong) 48.5%, transparent 48.5%)',
            }}
          />
          <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
            <span className="h-2.5 w-2.5 bg-ink" aria-hidden="true" />
            <span className="mark mt-3 bg-bg px-2 py-1">Площадка отгрузки</span>
          </div>
          <p className="mark-value absolute inset-x-0 bottom-0 border-t border-line bg-bg/90 px-3 py-2 text-ink-2">
            карта подключается при запуске
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ term, value, mono }: { term: string; value: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[104px_minmax(0,1fr)] gap-4 border-b border-line py-2.5">
      <dt className="mark pt-0.5 text-ink-2">{term}</dt>
      <dd className={mono ? 'mark-value' : 'text-t2'}>{value}</dd>
    </div>
  );
}

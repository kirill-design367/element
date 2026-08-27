import { COMPANY } from '@/lib/company';
import { nbsp, typo } from '@/lib/format';
import { PhoneIcon } from '@/components/site/Icons';
import { PHOTO } from '@/lib/assets';
import { Photo } from '@/components/ui/Photo';

/**
 * Три равные карточки разбиты.
 *
 * Телефон первым и крупно: сюда приходят позвонить, а не читать ОГРН.
 * Почты на сайте нет — каналов связи два, телефон и форма заявки.
 * Адреса идут компактным блоком следом, реквизиты убраны в
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
            <h2 data-reveal className="font-black text-t4 leading-[1.04] tracking-[-.02em]">
              Контакты
            </h2>

            <a
              href={`tel:${COMPANY.phone}`}
              className="group mt-6 flex items-center gap-4 rounded transition-colors duration-300 hover:text-accent"
            >
              <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line-strong sm:flex">
                <PhoneIcon className="h-5 w-5 text-ink-3" />
              </span>
              <span className="font-black text-t4 leading-none tracking-[-.03em]">
                {nbsp(COMPANY.phoneLabel)}
              </span>
            </a>

            {/* Адрес компактным блоком рядом с телефоном, а не таблицей на
                четыре строки: его читают один раз перед выездом. Адрес один —
                офис и площадка отгрузки по нему же, поэтому строка называется
                «Адрес», а не «Офис» и «Отгрузка». */}
            <dl className="mt-8 grid gap-x-8 gap-y-4 border-t border-line pt-6 sm:grid-cols-2">
              <Line term="Адрес" value={COMPANY.address} />
              <Line term="Часы работы" value={COMPANY.hoursOffice} />
              <Line term="Часы отгрузки" value={COMPANY.hoursShipping} />
              <Line term="Отгрузка" value={COMPANY.shipping} />
            </dl>
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
          Вся полоса — одна ссылка, открывающая адрес в Яндекс.Картах в новой
          вкладке. Ключа для этого не нужно: ссылка ведёт на обычный поиск по
          адресу.

          Изображение карты берётся из слота PHOTO.map. Пока слот пуст,
          полоса рисует адрес и метку на собственном фоне — и НИ ОДНОЙ
          нарисованной дороги: выдумывать картографию реального адреса
          нельзя, а сеть в сборочной среде закрыта политикой, тайлы и
          геокодер недоступны. Как только в assets/photos/ ляжет map.jpg и
          имя попадёт в PLAN скрипта сборки кадров, снимок появится здесь
          сам — правка ровно одна, в lib/assets.ts. Что нужно для перехода
          на интерактивную карту, записано в CLAUDE.md. */}
      {/* Поиск на карте идёт по тому же адресу, что показан рядом. Отдельной
          строки addressQuery больше нет: это была вторая запись того же
          адреса, набранная иначе, и разъехаться им было нечем помешать. */}
      <a
        href={`https://yandex.ru/maps/?text=${encodeURIComponent(COMPANY.address)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative mt-12 flex h-[200px] items-center justify-center overflow-hidden border-y border-line bg-surface-2 md:mt-16 md:h-[240px]"
        aria-label={`Открыть адрес «${COMPANY.address}» в Яндекс.Картах в новой вкладке`}
      >
        {PHOTO.map.file && (
          <Photo
            file={PHOTO.map.file}
            alt={PHOTO.map.brief}
            sizes="100vw"
            className="absolute inset-0"
            imgClassName="photo-zoom absolute inset-0 h-full w-full"
          />
        )}

        <span className="relative flex flex-col items-center px-5 text-center">
          <span className="h-3 w-3 rounded-full bg-accent ring-4 ring-accent-soft" aria-hidden="true" />
          <span className="mt-3 rounded-pill bg-surface px-4 py-2 text-t2 font-medium shadow-card">
            {typo(COMPANY.address)}
          </span>
          <span className="mt-2 text-t1 text-ink-2 underline-offset-4 group-hover:underline">
            Открыть в Яндекс.Картах
          </span>
        </span>
      </a>
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

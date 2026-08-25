import { typo } from '@/lib/format';

const TERMS = [
  {
    title: 'Отсрочка платежа до 30 дней',
    body: 'Для постоянных заказчиков после первой оплаченной поставки. Лимит согласуем под объём объекта.',
  },
  {
    title: 'Договор поставки',
    body: 'Рамочный договор с приложением спецификаций на каждую партию. Правки от вашего юриста принимаем.',
  },
  {
    title: 'Закрывающие документы, УПД',
    body: 'УПД, транспортная накладная и счёт-фактура. Оригиналы — с водителем, сканы — в день отгрузки.',
  },
  {
    title: 'Паспорта качества и сертификаты',
    body: 'Паспорт карьера на каждую партию: марка прочности, лещадность, морозостойкость, радиологический класс.',
  },
  {
    title: 'Персональный менеджер',
    body: 'Один человек ведёт объект от первого просчёта до последней машины. Телефон прямой, без колл-центра.',
  },
  {
    title: 'Отгрузка по графику под объект',
    body: 'Согласуем окна подачи на неделю вперёд и держим их. Сдвинулись работы — переносим без штрафа.',
  },
];

/**
 * Закреплённая секция: левая колонка стоит, правая листается.
 *
 * Пункты сменяют друг друга по прокрутке — входящий приходит снизу со
 * сдвигом и проявлением, уходящий уползает вверх и гаснет. Скраб делает это
 * обратимым: при прокрутке вверх всё воспроизводится назад.
 *
 * Слева под заголовком индикатор: номер текущего пункта и сколько всего.
 *
 * Разметка остаётся обычным списком в потоке. Абсолютное позиционирование
 * включает класс is-pinned, который ставит Motion уже после того, как
 * таймлайн собран: без скрипта и в режиме покоя это шесть пунктов подряд,
 * которые просто читаются сверху вниз.
 *
 * Тексты и состав условий не менялись.
 */
export function Terms() {
  return (
    <div data-terms className="relative">
      <div
        data-terms-stage
        className="grid gap-10 lg:min-h-[76svh] lg:grid-cols-12 lg:items-center lg:gap-8"
      >
      <div className="lg:col-span-4">
        <div>
          <h2
            id="usloviya-title"
            data-reveal
            className="font-black text-t4 leading-[1.04] tracking-[-.02em]"
          >
            {typo('Условия для юридических лиц')}
          </h2>
          <p className="mt-4 max-w-[38ch] text-t2 leading-relaxed text-ink-2">
            {typo(
              'То, ради чего снабженец меняет поставщика: документы вовремя, отсрочка и один ответственный человек.',
            )}
          </p>

          {/* Индикатор: где мы в списке. Дублирует номер пункта, поэтому от
              скринридера скрыт. */}
          <p
            aria-hidden="true"
            className="tnum mt-10 flex items-baseline gap-2 text-t1 text-ink-2"
          >
            <span data-terms-current className="font-black text-t3 leading-none text-ink">
              01
            </span>
            <span>/ {String(TERMS.length).padStart(2, '0')}</span>
          </p>
        </div>
      </div>

      <ol data-terms-list className="terms-list lg:col-span-7 lg:col-start-6">
        {TERMS.map((t, i) => (
          <li
            key={t.title}
            data-term
            className="term-item flex gap-5 border-t border-line py-8 first:border-t-0 first:pt-0 md:gap-8 md:py-10"
          >
            <span
              aria-hidden="true"
              className="term-num tnum shrink-0 font-black text-t3 leading-none text-ink-2"
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0">
              <h3 className="term-title text-t3 font-bold leading-snug tracking-[-.01em] text-ink-2">
                {typo(t.title)}
              </h3>
              <p className="mt-2 max-w-[52ch] text-t2 leading-relaxed text-ink-2">{typo(t.body)}</p>
            </div>
          </li>
        ))}
      </ol>
      </div>
    </div>
  );
}

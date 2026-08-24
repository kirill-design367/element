/**
 * Разрез гранулометрии — то, что раньше занимала точечная заглушка.
 *
 * Зёрна нарисованы в едином масштабе: одна переменная `--mm` задаёт,
 * сколько пикселей приходится на миллиметр, и действует сразу на все
 * четыре группы. Поэтому соотношение размеров правдиво на любом экране —
 * на телефоне масштаб мельче, но зерно 40–70 остаётся ровно во столько
 * же раз крупнее отсева, во сколько раз крупнее в жизни. Рядом стоит
 * эталонный отрезок в 10 мм, чтобы масштаб можно было прочитать.
 *
 * Форма угловатая: щебень — дроблёный камень, а не окатыш. Куча каждой
 * группы собирается строкой разметки и вставляется одним куском: как JSX
 * это было две сотни узлов на гидратацию в первом же экране, а первый
 * экран не должен ничего ждать.
 */

const SHAPES = [
  '12% 4%, 62% 0%, 96% 28%, 88% 78%, 44% 100%, 6% 72%',
  '4% 34%, 40% 2%, 84% 10%, 100% 56%, 66% 96%, 18% 88%',
  '20% 0%, 78% 12%, 100% 46%, 76% 92%, 26% 100%, 0% 54%',
  '8% 18%, 54% 0%, 92% 22%, 100% 70%, 52% 98%, 10% 80%',
  '0% 42%, 30% 6%, 74% 4%, 100% 38%, 84% 88%, 32% 96%',
];

interface Band {
  label: string;
  range: string;
  use: string;
  tint: string;
  grains: number[];
}

/**
 * Размеры зёрен в миллиметрах — реальный разброс внутри каждой фракции.
 * Число зёрен подобрано так, чтобы каждая группа собиралась в кучу
 * сопоставимой высоты: у отсева зёрна мелкие, поэтому их много, у щебня
 * 40–70 крупные и их восемь. Масштаб при этом общий.
 */
const BANDS: Band[] = [
  {
    label: 'Отсев',
    range: '0–5 мм',
    use: 'под плитку',
    tint: '#c3bfb7',
    grains: Array.from({ length: 78 }, (_, i) => 0.9 + ((i * 37) % 42) / 10),
  },
  {
    label: 'Щебень',
    range: '5–20 мм',
    use: 'бетон',
    tint: '#b0aba2',
    grains: Array.from({ length: 30 }, (_, i) => 5.5 + ((i * 23) % 145) / 10),
  },
  {
    label: 'Щебень',
    range: '20–40 мм',
    use: 'основание дороги',
    tint: '#9d978d',
    grains: Array.from({ length: 15 }, (_, i) => 21 + ((i * 29) % 19)),
  },
  {
    label: 'Щебень',
    range: '40–70 мм',
    use: 'отсыпка',
    tint: '#8a847a',
    grains: Array.from({ length: 8 }, (_, i) => 42 + ((i * 31) % 28)),
  },
];

function heap(band: Band): string {
  return band.grains
    .map((mm, i) => {
      const h = (mm * (0.78 + ((i * 7) % 5) * 0.055)).toFixed(2);
      return (
        `<span style="width:calc(${mm} * var(--mm));height:calc(${h} * var(--mm));` +
        `background:${band.tint};clip-path:polygon(${SHAPES[i % SHAPES.length]})"></span>`
      );
    })
    .join('');
}

const HEAPS = BANDS.map(heap);

export function FractionScale() {
  return (
    <figure
      className="m-0 border-y border-line-strong py-6 [--mm:0.62px] sm:[--mm:0.9px] lg:[--mm:1.35px]"
      aria-label="Разрез гранулометрии: зёрна четырёх фракций в едином масштабе, от отсева 0–5 мм до щебня 40–70 мм"
    >
      <div className="grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-4 sm:gap-x-6">
        {BANDS.map((band, i) => (
          <div key={band.range} className="flex flex-col">
            <div className="mb-3 border-b border-line pb-2">
              <p className="mark text-ink-2">
                {band.label} <span className="text-ink">{band.range}</span>
              </p>
              <p className="mark-value mt-1 text-ink-2">{band.use}</p>
            </div>
            {/* Кучи стоят на общей линии — как образцы партий на лотке. */}
            <div
              className="flex flex-1 flex-wrap content-end items-end gap-[2px] border-b border-line pb-1"
              style={{ minHeight: 'calc(96 * var(--mm))' }}
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: HEAPS[i] }}
            />
          </div>
        ))}
      </div>

      <figcaption className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3">
        <span className="mark text-ink-2">Масштаб</span>
        <span className="flex items-center gap-2">
          <span
            className="block h-px bg-ink"
            style={{ width: 'calc(10 * var(--mm))' }}
            aria-hidden="true"
          />
          <span className="mark-value text-ink-2">10 мм</span>
        </span>
        <span className="mark-value text-ink-2">
          зёрна показаны в едином масштабе, форма — дроблёный гранит
        </span>
      </figcaption>
    </figure>
  );
}

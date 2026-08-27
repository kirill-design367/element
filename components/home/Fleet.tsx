import { Counter } from './Counter';
import { PHOTO } from '@/lib/assets';
import { Photo } from '@/components/ui/Photo';
import { typo } from '@/lib/format';
import { FLEET_LEAD, FLEET_REST } from '@/lib/fleet-numbers';


/**
 * Полноэкранный блок: кадр парка, одно крупное число слева и сетка цифр
 * справа.
 *
 * Затемнение кадра — 35% и ни процентом больше: техника должна читаться.
 * Раньше поверх лежали два градиента по 0,92 и 0,93, и снимок был почти
 * чёрным. Контраст держат не подложки на весь кадр, а две тёмные стеклянные
 * панели под самими цифрами — тот же материал, что на первом экране, только
 * тёмный: парк снят днём, и белая цифра над жёлтым бортом самосвала без
 * панели давала 2,1:1.
 *
 * У каждой мелкой цифры своя подпись и своё пояснение, между строками тонкие
 * разделители: раньше справа висели три числа без объяснения, что они значат.
 */
export function Fleet() {
  return (
    <div
      className="inv relative flex min-h-[86svh] flex-col justify-end overflow-hidden py-16 md:py-24"
      /* Фон .inv прозрачный: он непрозрачным перекрывал фотографию, лежащую
         ниже по стопке. Тёмный тон теперь даёт сам кадр плюс затемнение. */
      style={{ background: 'transparent' }}
    >
      <div className="absolute inset-0 -z-10 overflow-hidden bg-[#14161a]">
        {PHOTO.fleet.file && (
          <Photo
            file={PHOTO.fleet.file}
            alt={PHOTO.fleet.brief}
            sizes="100vw"
            parallax="fleet"
            className="absolute inset-0"
            imgClassName="absolute inset-x-0 -top-6 h-[calc(100%+48px)]"
          />
        )}
        {/* Ровное затемнение кадра — 35%, ни процентом больше: техника
            должна читаться. Всё остальное держат стеклянные панели под
            цифрами, а не подложка на весь снимок. */}
        {PHOTO.fleet.file && (
          <div
            aria-hidden="true"
            className="absolute inset-0 z-[2]"
            style={{ background: 'rgba(12, 14, 17, .35)' }}
          />
        )}
      </div>

      <div className="shell grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-8">
        {/* ── Главное число ─────────────────────────────────────────────── */}
        {/* Панель главного числа рисуется, только если такое число есть.
            Пустой список цифр — пустое место, а не падение сборки. */}
        {FLEET_LEAD && (
        <div className="glass-dark rounded-panel p-6 md:p-8 lg:col-span-6">
          {/* Шаблон один на весь блок: число с единицей, под ним подпись,
              под ней уточнение. Раньше уточнение стояло НАД числом, а в сетке
              справа число было слева от подписи — три пары читались тремя
              разными способами. Кегль у главного числа свой (t5 против t4),
              это единственное, чем оно отличается: оно главное в блоке.

              tracking-normal на потомках — не украшение. letter-spacing в em
              наследуется вычисленным значением: −0,04em от 128 px это −5,1 px,
              и на подписи в 16 px буквы налезали друг на друга. */}
          <p
            data-fleet="lead"
            className="font-black text-t5 leading-[.82] tracking-[-.04em]"
          >
            <Counter value={FLEET_LEAD.value} />
            <span className="ml-3 text-[.28em] font-medium tracking-normal text-ink-2">
              {FLEET_LEAD.unit}
            </span>
          </p>
          <p data-fleet="label" className="mt-3 text-t2 font-medium">
            {FLEET_LEAD.label}
          </p>
          <p className="mt-1.5 max-w-[34ch] text-t1 leading-snug text-ink-2">
            {typo(FLEET_LEAD.note)}
          </p>
        </div>
        )}

        {/* ── Остальные цифры сеткой ────────────────────────────────────── */}
        <dl className="glass-dark rounded-panel p-6 md:p-7 lg:col-span-5 lg:col-start-8">
          {FLEET_REST.map((n) => (
            <div
              key={n.label}
              data-fleet="rest"
              className="flex flex-col border-t border-line py-5 first:border-t-0 first:pt-0"
            >
              {/* dt стоит перед dd — этого требует разметка списка
                  определений; визуальный порядок задаёт order. Раньше число
                  стояло СЛЕВА от подписи и занимало две строки — у трёх пар
                  выходило три разных выравнивания. Теперь все три стопкой от
                  одной левой линии: число, подпись, уточнение. */}
              <dt className="order-2 mt-3 text-t2 font-medium">{n.label}</dt>
              <dd className="tnum order-1 font-black text-t4 leading-none tracking-[-.03em]">
                <Counter value={n.value} />
                {n.unit && (
                  <span className="ml-1.5 text-[.34em] font-medium tracking-normal text-ink-2">
                    {n.unit}
                  </span>
                )}
              </dd>
              <dd className="order-3 mt-1.5 max-w-[34ch] text-t1 leading-snug text-ink-2">
                {typo(n.note)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

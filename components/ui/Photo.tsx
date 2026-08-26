import { asset, fallbackSrc, lqipOf, srcSet, type PhotoFile } from '@/lib/assets';
import { PARALLAX_FROM_PERCENT } from '@/lib/motion';

/**
 * Кадр в вёрстке.
 *
 * Три вещи, ради которых он существует:
 *
 * 1. Ширина по месту. Каждый кадр собран в трёх размерах и двух форматах;
 *    браузер выбирает по sizes и плотности экрана. Телефон не тянет
 *    десктопный файл, а WebP экономит около 40% против JPEG. Запасной JPEG
 *    объявлен через type у <source>: браузер, который не читает WebP,
 *    возьмёт его сам.
 *
 * 2. Загрузка без белого мигания. На месте кадра сразу стоит миниатюра
 *    24 px шириной, растянутая и размытая, — несколько сотен байт прямо в
 *    разметке. Когда кадр пришёл, подложка уходит по прозрачности за 0,6 с.
 *    Ни серых заглушек, ни скелетонов: сначала пятна цвета того же снимка,
 *    потом сам снимок.
 *
 * 3. Отсутствие JS не ломает картину. Подложка показывается только при
 *    классе `js` на <html> — его ставит крошечный встроенный скрипт, он же
 *    снимает подложку по событию load. Скрипт не выполнился — подложки нет
 *    вовсе, кадр просто появляется, когда загрузится.
 *
 * 4. Кадр с параллаксом РОЖДАЕТСЯ в начальном положении параллакса, а не
 *    доезжает до него. Параллакс возит кадр от −2% до +2% его высоты, и
 *    начало отрезка — минус два процента. Пока этого сдвига не было в
 *    разметке, кадр стоял на нуле до тех пор, пока не поднимется gsap, а
 *    поднимается он по первому намерению листать или по простою: замер на
 *    придушенном вчетверо процессоре — первая отрисовка 240 мс, скачок на
 *    1254 мс, ровно на 17,24 px вверх. Человек видел готовую фотографию и
 *    через секунду её рывок.
 *
 *    Сдвиг ставится инлайном, а не классом: gsap пишет transform тоже
 *    инлайном, и значения обязаны совпасть знак в знак — иначе первый же
 *    кадр анимации снова даст скачок.
 */


export function Photo({
  file,
  mobile,
  alt,
  sizes,
  className = '',
  imgClassName = '',
  priority = false,
  parallax,
  /** Медиазапрос, по которому берётся узкий кадр. */
  mobileMedia = '(max-width: 767px)',
}: {
  file: PhotoFile;
  mobile?: PhotoFile;
  alt: string;
  /** Ширина показа для выбора файла из srcset. */
  sizes: string;
  className?: string;
  imgClassName?: string;
  /** Первый экран: грузится сразу и с высоким приоритетом. */
  priority?: boolean;
  /** Имя группы параллакса; без него кадр стоит неподвижно. */
  parallax?: string;
  /** Медиазапрос, по которому берётся узкий кадр. */
  mobileMedia?: string;
}) {
  const lqip = lqipOf(mobile ?? file);
  const lqipWide = lqipOf(file);

  return (
    <div className={`photo-box ${className}`}>
      {/* Подложка. Две штуки, если у узкого экрана свой кадр: пятна должны
          совпадать с тем снимком, который реально приедет. */}
      {mobile ? (
        <>
          <span
            aria-hidden="true"
            className="lqip md:hidden"
            style={{ backgroundImage: `url(${lqip})` }}
          />
          <span
            aria-hidden="true"
            className="lqip hidden md:block"
            style={{ backgroundImage: `url(${lqipWide})` }}
          />
        </>
      ) : (
        <span aria-hidden="true" className="lqip" style={{ backgroundImage: `url(${lqipWide})` }} />
      )}

      <picture>
        {mobile && (
          <source
            media={mobileMedia}
            type="image/webp"
            srcSet={srcSet(mobile, 'webp')}
            sizes={sizes}
          />
        )}
        {mobile && (
          <source media={mobileMedia} type="image/jpeg" srcSet={srcSet(mobile, 'jpg')} sizes={sizes} />
        )}
        <source type="image/webp" srcSet={srcSet(file, 'webp')} sizes={sizes} />
        <source type="image/jpeg" srcSet={srcSet(file, 'jpg')} sizes={sizes} />
        <img
          src={fallbackSrc(file)}
          alt={alt}
          data-photo=""
          data-parallax={parallax}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          /* Картинка перетаскиваема по умолчанию, и в ленте материалов это
             уводило жест в родной drag-and-drop: браузер начинал тащить
             снимок, присылал pointercancel, и тяга ленты обрывалась. */
          draggable={false}
          className={`photo-img ${imgClassName}`}
          style={parallax ? { transform: `translateY(${PARALLAX_FROM_PERCENT}%)` } : undefined}
        />
      </picture>
    </div>
  );
}

/** Адрес мастер-кадра — только для служебных мест вроде og:image. */
export function photoHref(file: PhotoFile): string {
  return asset(`/img/${file.name}-${file.widths[file.widths.length - 1]}.jpg`);
}

/**
 * Снятие размытой подложки.
 *
 * Подложка нужна ровно до момента, когда кадр пришёл, и снять её может только
 * событие load. React для этого не нужен: девять фотографий, ни одного
 * состояния — вешать на каждую клиентский компонент означало бы гидратировать
 * половину страницы ради одного класса.
 *
 * Скрипт делает две вещи. Ставит `js` на <html> — по нему CSS показывает
 * подложки, и если скрипт не выполнился, подложек нет вовсе и кадр просто
 * появляется, когда загрузится. И слушает load в фазе перехвата (событие load
 * у картинок не всплывает), помечая контейнер классом is-loaded.
 *
 * Кадры из кэша грузятся до того, как скрипт успеет подписаться, поэтому по
 * DOMContentLoaded ещё раз проверяется img.complete.
 */
export const PHOTO_SCRIPT =
  `(function(){var d=document,r=d.documentElement;r.classList.add('js');` +
  `function m(i){var b=i.closest&&i.closest('.photo-box');if(b)b.classList.add('is-loaded')}` +
  `d.addEventListener('load',function(e){var t=e.target;if(t&&t.tagName==='IMG'&&t.hasAttribute('data-photo'))m(t)},true);` +
  `function s(){d.querySelectorAll('img[data-photo]').forEach(function(i){if(i.complete&&i.naturalWidth)m(i)})}` +
  `if(d.readyState!=='loading')s();else d.addEventListener('DOMContentLoaded',s)})()`;

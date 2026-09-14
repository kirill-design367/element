import { ART, PATHS, type Art } from '@/lib/logo-art';
import { asset } from '@/lib/assets';
import { nbsp } from '@/lib/format';
import {
  ADDRESSES, BANK, BRAND_NAME, CALL, CONTACTS, FACTS, LEGAL_NAME, OFFER, ORG, QR,
  SHIPPING,
} from './data';

/**
 * ВИЗИТКА И КАРТОЧКА ОРГАНИЗАЦИИ НА ОДНОМ ЛИСТЕ A4.
 *
 * СТРАНИЦ БЫЛО ДВЕ, СТАЛА ОДНА — решение заказчика 14.09: лист должен
 * уходить одной картинкой. Прежний расчёт «реквизиты не помещаются» был
 * верен для той раскладки и неверен как приговор: он считал реестр в одну
 * колонку, где каждое значение занимает свою строку во всю полосу набора.
 * Четырнадцать значений так и дают 200 мм. Те же четырнадцать в три колонки
 * дают 31 мм на группу — место нашлось не в отступах, а в ширине листа,
 * которая до этого не использовалась вовсе.
 *
 * ЧТО УЖАТО И ЧТО НЕТ. Ужаты кадр, кегли заголовка и цифр условий, поля
 * карточек. НЕ ужат ни один реквизит: пол 3,5 мм сплошным чёрным табличными
 * держится, потому что именно эти цифры переписывают в платёжное поручение.
 * Призыв не выброшен, а переехал НА синюю плашку, к телефону, — там он и
 * значит то, что говорит: «звоните» рядом с номером, а не отдельной
 * карточкой через весь лист.
 *
 * ЧЕРНО-БЕЛАЯ ПЕЧАТЬ — ГЛАВНОЕ УСЛОВИЕ, И ОНО НЕ ТРОНУТО:
 *
 *   • СИНИЙ В СЕРОМ РАВЕН ЧЁРНОМУ. У vc-sin светлота L* 20,7 при собственном
 *     чёрном лазера L* 20,4 — 1,00:1 на бумаге. НИ ОДНА ВЕЛИЧИНА НЕ РАЗВЕДЕНА
 *     КРАСКОЙ: всё различается кеглем, весом, положением или линией. Два
 *     адреса — в первую очередь.
 *   • ВОЛОСЯНЫЕ ЛИНИИ — ink-3, А НЕ line. #deded8 это 18 % краски и 1,20:1 к
 *     бумаге: при 0,3 мм линия ложится пунктиром, а на первой же ксерокопии
 *     тинты ниже 15 % отсекаются порогом копира. Вместе с линией исчезала бы
 *     вся карточная форма — цементное поле в печати становится белым.
 *   • ТИНТА ВНУТРИ ВЫВОРОТКИ НЕТ. Весь текст на синей плашке чисто белый и
 *     весом не ниже 500: 13 % краски внутри штриха 0,32 мм драйвер кладёт
 *     непредсказуемо.
 *   • ФОН ЛИСТА В ПЕЧАТИ БЕЛЫЙ. bg #f4f4f1 — 0–2 % краски, ниже устойчивой
 *     точки лазера.
 *
 * Стили лежат строкой рядом с разметкой, а не в globals.css: файл стилей
 * встраивается в КАЖДУЮ страницу сайта. Размеры инлайном и в миллиметрах.
 */

export function logoSvg(id: string, heightMm: number, cls = '') {
  const a: Art | undefined = ART[id];
  if (!a) return '';
  return `<svg viewBox="0 0 ${a.w} ${a.h}" class="${cls}"`
    + ` style="height:${heightMm}mm;width:auto" aria-hidden="true" focusable="false">`
    + a.parts.map((p) => (p.d
      ? `<path d="${p.d}" fill="var(--c-${p.role})"/>`
      : `<use href="#p-${p.ref}" x="${p.x ?? 0}" y="${p.y ?? 0}" fill="var(--c-${p.role})"/>`))
      .join('')
    + `</svg>`;
}

/** Общие контуры знака: буквы объявлены по разу и переиспользуются. */
export const CARD_DEFS =
  '<svg width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute">'
  + '<defs>'
  + Object.entries(PATHS).map(([k, d]) => `<path id="p-${k}" d="${d}"/>`).join('')
  + '</defs></svg>';

export const CARD_CSS = `
.vc{position:relative;width:210mm;height:297mm;overflow:hidden;
  background:var(--bg);color:var(--ink);
  font-family:var(--font-text),system-ui,sans-serif;
  -webkit-print-color-adjust:exact;print-color-adjust:exact}
.vc *{box-sizing:border-box}

/* СИНИЙ У ДОКУМЕНТА СВОЙ, И ОН ТЕМНЕЕ КНОПОЧНОГО. Экранный --accent #173fa6
   на бумаге читается лёгким: сплошная заливка на принтере всегда выходит
   светлее экранной. Тон и насыщенность взяты у кнопки знак в знак — H 223,2,
   S 75,7 %, — опущена только светлота: 37,1 % на 25,9 %.
   Токен живёт ТОЛЬКО здесь и только на печатной вёрстке. */
.vc{--vc-sin:#102c74}

/* ── КАДР ПЛОЩАДКИ ──────────────────────────────────────────────────── */

/* Кадр идёт во всю ширину листа, поля 6 мм — только чтобы он не упирался в
   обрез. Высота опущена с 78 до 41 мм решением заказчика 14.09: это самая
   большая статья листа, и лист должен вместить реквизиты. Прежний запрет
   «не добирать высоту из самого кадра» писался, когда на листе была одна
   визитка и добирать было не для чего.
   ПОЛОСА, А НЕ ОКНО: при 198 на 41 мм пропорция 4,8:1, и кадр читается
   фризом над документом, а не уменьшенной фотографией. */
.vc-frame{position:relative;margin:6mm 6mm 0;border-radius:6mm;overflow:hidden;
  background:var(--ink)}
/* Точка кадрирования поднята с 52 % до 46 %: на узкой полосе середина
   снимка срезала кабины сверху, а низ отдавала пустой площадке. */
.vc-photo{display:block;width:100%;height:100%;object-fit:cover;
  object-position:50% 46%}
/* ПРИТЕМНЕНИЯ ПОД ЗНАКОМ НЕТ, И ЭТО РЕЗУЛЬТАТ ЗАМЕРА: знак — тёмная плашка
   со светлыми буквами, и затемнять снимок под ним значит сажать его силуэт.
   Буквы по своей плашке дают 11,4:1 — читается то, что и читают. */
.vc-mark{position:absolute;z-index:2}

/* ── ВЕРХ ЛИСТА: ПРЕДЛОЖЕНИЕ ────────────────────────────────────────── */

.vc-body{display:flex;flex-direction:column;padding:0 14mm 14mm}
/* Заголовок опущен с 12 до 8 мм и встал в две строки вместо трёх. Кегль
   реквизитов при этом не тронут: ужимается то, что читают один раз. */
.vc-offer{font-size:8mm;font-weight:900;letter-spacing:-.035em;line-height:.96;
  max-width:172mm}
/* Строка про самовывоз — обычный текст, а не служебная пометка: прописными
   вразрядку бледно-серым она читалась подписью к чему-то, хотя это условие
   работы, то самое, ради чего к нам едут. */
.vc-kicker{font-size:3.7mm;line-height:1.35;color:var(--ink);text-decoration:underline;
  text-underline-offset:.24em;text-decoration-thickness:.055em}

/* ── ТРИ ПОКАЗАТЕЛЯ ─────────────────────────────────────────────────── */

/* Карточки: белый лист поверх цементного поля, скругление 6 мм, обводка
   ink-3, а не line — см. шапку файла. Число опущено с 18 до 9,5 мм: оно
   остаётся крупнейшей цифрой вне синей плашки и держит иерархию, а 18 были
   роскошью пустого листа. */
.vc-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm}
.vc-card{display:flex;flex-direction:column;background:var(--surface);
  border:.3mm solid var(--ink-3);border-radius:6mm;padding:3mm 3.5mm}
.vc-card-v{font-size:9.5mm;font-weight:900;letter-spacing:-.045em;line-height:.88;
  color:var(--vc-sin);font-variant-numeric:tabular-nums}
.vc-card-u{font-size:3.8mm;font-weight:700;letter-spacing:0;margin-left:1.4mm;
  display:inline-block}
/* Отбивка над линией ФИКСИРОВАННАЯ, а не margin-top:auto. С auto линия
   вставала по низу самой высокой карточки, и у соседей она оказывалась на
   разной высоте от числа — три линейки на трёх уровнях. */
.vc-card-l{margin-top:2.2mm;padding-top:1.8mm;border-top:.3mm solid var(--ink-3);
  font-size:3.2mm;line-height:1.25;color:var(--ink-2)}

/* ── СИНЯЯ ПЛАШКА: ПРИЗЫВ, ТЕЛЕФОН, ПОЧТА, АДРЕС ────────────────────── */

/* Единственная сплошная синяя плашка листа. Призыв переехал сюда с
   отдельной карточки: он про телефон, и рядом с телефоном занимает на
   17 мм меньше, ничего не теряя. Белая линия под ним сплошная 0,4 мм —
   0,3 мм при выворотке съедается разбегом тонера целиком. */
/* QR СТОИТ ОТДЕЛЬНОЙ КОЛОНКОЙ, А НЕ В СТРОКЕ С ТЕЛЕФОНОМ. В строке его
   24 мм задавали высоту всей строки, и текст рядом не мог быть ниже кода:
   сколько бы ни ужимали телефон с почтой, плашка не худела ни на миллиметр.
   Вынесенный в свою колонку, код встаёт вровень с четырьмя строками текста и
   не стоит листу ничего: слева четыре строки текста дают 36,6 мм, коду с
   полями нужно 28. Поэтому код ВЕРНУЛСЯ к 24 мм — ровно к тому размеру, на
   котором его расшифровывали декодером, — и не потребовал ни одного
   миллиметра листа. Модуль 0,96 мм при 25 модулях. */
.vc-contacts{background:var(--vc-sin);color:#fff;border-radius:6mm;padding:4.5mm 5mm;
  display:flex;align-items:center;gap:7mm}
.vc-cta{font-size:4.2mm;font-weight:700;line-height:1.25;letter-spacing:-.015em;
  padding-bottom:2.6mm;margin-bottom:2.8mm;border-bottom:.4mm solid #fff}
.vc-contacts-main{flex:1;min-width:0}
/* nowrap: номер с кодом города рвался после «+7», а разорванный телефон
   читается двумя числами. */
.vc-phone{font-size:9.6mm;font-weight:900;letter-spacing:-.03em;line-height:1;
  color:#fff;text-decoration:none;display:block;white-space:nowrap}
/* ВЕСЬ ТЕКСТ НА ПЛАШКЕ ЧИСТО БЕЛЫЙ И ВЕСОМ НЕ НИЖЕ 500. Прежний #dde3f8 —
   13 % краски внутри выворотки; разбег тонера съедает 0,04–0,09 мм с каждой
   кромки штриха, и тинт внутри него непредсказуем. */
.vc-line{margin-top:2.2mm;font-size:3.7mm;font-weight:500;line-height:1.35;color:#fff}
.vc-two{display:flex;gap:8mm}
.vc-hours{margin-top:2.8mm;padding-top:2.6mm;border-top:.4mm solid #fff;
  font-size:4mm;font-weight:700;letter-spacing:-.01em}
/* QR лежит на белом квадрате: тёмные модули по светлому читает любой сканер,
   светлые по синему — не любой. */
.vc-qr-box{background:#fff;border-radius:3mm;padding:2.5mm;flex:none}
.vc-qr{display:block;width:24mm;height:24mm;color:var(--ink)}

/* ── РЕКВИЗИТЫ ──────────────────────────────────────────────────────── */

/* ТРИ КОЛОНКИ ВМЕСТО ОДНОЙ — ЭТО И ЕСТЬ ВСЯ ЭКОНОМИЯ. Реестр в одну колонку
   тратит на «ИНН 5027294043» всю полосу набора 182 мм, из которых занято 40.
   Значение шириной в треть полосы — 57 мм, а самое длинное из наших, счёт в
   двадцать знаков табличными при 3,5 мм, это 38,5 мм. Запас полтора раза,
   переноса нет ни у одного значения — проверено замером ширины строки, а не
   прикидкой. */
.rq-card{background:var(--surface);border:.3mm solid var(--ink-3);
  border-radius:6mm;padding:3.5mm 5mm}
.rq-t{font-size:3.6mm;font-weight:700;line-height:1.25;color:var(--ink)}
/* Секции внутри карточки разделены волосяной линией, а не отбивкой: на
   плотном реестре отбивка в 2 мм читается случайной, а линия — границей. */
.rq-sec{border-top:.3mm solid var(--ink-3);margin-top:2.2mm;padding-top:2.2mm}
.rq-g3{display:grid;grid-template-columns:repeat(3,1fr);gap:2.2mm 6mm}
/* Асимметрия колонок намеренная: юридический адрес длиннее фактического на
   23 знака, и равные колонки дали бы ему лишнюю строку. */
.rq-g2{display:grid;grid-template-columns:1.08fr 1fr;gap:2.2mm 8mm}
/* Наименование и директор стоят ОДНОЙ строкой, а не двумя секциями. Директор
   это одно значение, и отдельная секция под него тратила 13,4 мм на пустые
   две трети ширины. Рядом с наименованием он читается как на бланке: слева
   кто, справа кто подписывает. */
.rq-top{display:grid;grid-template-columns:1.25fr 1fr;gap:8mm;align-items:start}
.rq-k{font-size:3.1mm;font-weight:500;line-height:1.25;color:var(--ink-2)}
/* ПОЛ ЗНАЧЕНИЯ — 3,5 мм СПЛОШНЫМ ЧЁРНЫМ. Ниже высота строчных уходит под
   1,4 мм, а штрих под ячейку растра 0,240 мм, и цифра печатается чётками из
   точек. Переписывают в платёжку именно её, поэтому пол не двигается ни
   ради одной страницы, ни ради какой другой причины. */
.rq-v{font-size:3.5mm;font-weight:700;line-height:1.3;color:var(--ink);
  margin-top:.5mm}
.rq-v .tnum{font-variant-numeric:tabular-nums}
/* Наименование — не строка реестра, а заголовок карточки реквизитов: оно
   единственное, что читают вслух по телефону. */
.rq-name{font-size:5.4mm;font-weight:900;letter-spacing:-.025em;line-height:1.08;
  color:var(--ink);margin-top:.6mm}
.rq-brand{font-size:3.1mm;font-weight:500;line-height:1.3;color:var(--ink-2);
  margin-top:1.2mm}
/* Примечание — 100 % краски, не ink-2 и не ink-3. Строка, которая
   предупреждает, куда НЕ подавать самосвал, не может быть самым бледным
   текстом листа. */
.rq-an{font-size:3.1mm;font-weight:400;line-height:1.3;margin-top:1.2mm;
  color:var(--ink)}
/* Выноска платёжного блока — форма призыва с прежней визитки: синяя грань
   2,5 мм псевдоэлементом, а не border-left (у border скругление коробки
   срезает концы, и вместо стойки получается запятая). ЕДИНСТВЕННЫЙ синий
   объект в нижней половине листа: из всего документа в платёжное поручение
   переписывают именно его. */
.rq-pay{position:relative;padding-left:9.5mm}
.rq-pay::before{content:'';position:absolute;left:4mm;top:3.5mm;bottom:3.5mm;
  width:2.5mm;border-radius:1.25mm;background:var(--vc-sin)}
.rq-note{font-size:3.1mm;font-weight:400;line-height:1.3;margin-top:2mm;
  color:var(--ink)}

@media print{
  @page{size:210mm 297mm;margin:0}
  html,body{margin:0!important;padding:0!important;background:#fff!important}
  /* Фон листа белый: bg это 0–2 % краски, ниже устойчивой точки лазера. */
  .vc{background:#fff!important;box-shadow:none!important;
    break-inside:avoid;page-break-inside:avoid}
}
`;

/* ── СБОРКА ЛИСТА ────────────────────────────────────────────────────── */

function facts() {
  return `<div class="vc-cards">` + FACTS.map((f) =>
    `<div class="vc-card"><div class="vc-card-v tnum">${f.value}`
    + `<span class="vc-card-u">${f.unit}</span></div>`
    + `<div class="vc-card-l">${f.label}</div></div>`).join('') + `</div>`;
}

function contacts() {
  const site = CONTACTS.site
    ? `<span>${CONTACTS.site.replace(/^https?:\/\//, '')}</span>` : '';
  const qr = QR
    ? `<div class="vc-qr-box"><svg class="vc-qr" viewBox="0 0 ${QR.size} ${QR.size}"`
      + ` aria-hidden="true"><path d="${QR.path}" fill="currentColor"/></svg></div>` : '';
  /* АДРЕСА ЗДЕСЬ НЕТ, И ЭТО НЕ ПОТЕРЯ. Пока лист был визиткой, адрес
     площадки стоял на плашке, потому что другого места не было. Теперь он
     стоит ниже, в реквизитах, рядом с юридическим и со строкой назначения
     под каждым — то есть там, где его и различают. Второй раз на плашке он
     занимал 12 мм и отвечал на тот же вопрос хуже. */
  const main = `<div class="vc-contacts-main">`
    + `<p class="vc-cta">${CALL}</p>`
    + `<a class="vc-phone" href="${CONTACTS.phoneHref}">${CONTACTS.phone}</a>`
    /* Почта и сайт стоят ОДНОЙ строкой через промежуток, а не двумя: вместе
       они занимают 62 мм из 118 доступных, и вторая строка под них тратила
       7,2 мм ради воздуха, которого на этом листе нет. Разделительного знака
       между ними нет — границу держит промежуток, как в бегущей строке
       сайта. */
    + `<p class="vc-line vc-two">${CONTACTS.email}${site}</p>`
    + `<p class="vc-hours">${CONTACTS.hours}</p></div>`;
  return `<div class="vc-contacts">${main}${qr}</div>`;
}

/** Ячейка реестра: подпись сверху, значение снизу. */
function cell(term: string, value: string, digits = false) {
  return `<div><div class="rq-k">${term}</div>`
    /* .tnum вешается на САМО число, а не на строку: в CoFo Sans фича
       подменяет заодно пробел широким табличным, и «ООО «СД ЭЛЕМЕНТ»»
       разъехалось бы тройной разрядкой. */
    + `<div class="rq-v">${digits ? `<span class="tnum">${value}</span>` : value}`
    + `</div></div>`;
}

/** Карточка «Реквизиты»: наименование, коды, директор и два адреса. */
function requisites() {
  const codes = ORG.slice(0, 3).map((r) => cell(r.term, r.value, r.digits)).join('');
  const dir = ORG[3];
  const addr = ADDRESSES.map((a) =>
    `<div><div class="rq-k">${a.term}</div>`
    + `<div class="rq-v">${a.value}</div>`
    + `<p class="rq-an">${a.note}</p></div>`).join('');

  return `<div class="rq-card">`
    + `<div class="rq-top">`
    + `<div><div class="rq-k">Полное наименование</div>`
    + `<div class="rq-name">${nbsp(LEGAL_NAME)}</div>`
    + `<div class="rq-brand">${BRAND_NAME} — торговое наименование</div></div>`
    + `${cell(dir.term, dir.value)}</div>`
    + `<div class="rq-sec"><div class="rq-g3">${codes}</div></div>`
    /* ДВА АДРЕСА СТОЯТ РЯДОМ, А НЕ В РАЗНЫХ УГЛАХ ЛИСТА, И ЭТО РЕШЕНИЕ ПО
       СУЩЕСТВУ. Человек путает адреса тогда, когда видит один и не знает,
       который; разнесённые по листу, они как раз и дают этот случай. Рядом
       различие видно до чтения, и держат его три вещи, ни одна из которых
       не цвет: подписи полными словами, соседство и строка назначения. */
    + `<div class="rq-sec"><div class="rq-g2">${addr}</div></div>`
    + `</div>`;
}

/** Выноска «Для платёжного поручения»: семь значений в три колонки. */
function payment() {
  /* ПОРЯДОК НЕ МЕНЯТЬ: он повторяет порядок полей платёжного поручения —
     получатель, счёт, банк, БИК, корсчёт, — и при потоке по строкам слева
     направо бухгалтер переписывает сверху вниз, не перескакивая. */
  const cells = BANK.map((r) => cell(r.term, r.value, r.digits)).join('');
  return `<div class="rq-card rq-pay">`
    + `<div class="rq-t">Для платёжного поручения</div>`
    + `<div class="rq-sec"><div class="rq-g3">${cells}</div></div>`
    + `<p class="rq-note">ИНН и КПП в конце блока — банка, а не наши: `
    + `наши стоят выше.</p></div>`;
}

function page1() {
  /* Кадр 198 мм по ширине — на печати это 282 dpi у файла 2200 px. */
  const src = asset('/img/park-2200.webp');
  const PAD = 6;      // поле кадра от краёв листа, мм — только от обреза
  const LOGO = 12;    // высота знака, мм
  const SEAM = 47;    // нижняя кромка кадра, мм от верха листа
  const MARK = 8;     // отступ знака от нижней и левой кромки кадра, мм
  return `<div class="vc">`
    + `<div class="vc-frame" style="height:${SEAM - PAD}mm">`
    + `<img class="vc-photo" src="${src}" alt=""/>`
    + `<div class="vc-mark" style="bottom:${MARK}mm;left:${MARK}mm;`
    + `--c-bg:${'#f4f4f1'};--c-ink:${'#17191c'}">${logoSvg('o1', LOGO)}</div></div>`
    /* Гибкая отбивка margin-top:auto между блоками делит свободную высоту
       поровну, а не копит её внизу одним провалом. Минимум задан
       padding-top: ниже него блоки не сойдутся даже при нулевом запасе. */
    + `<div class="vc-body" style="height:${297 - SEAM}mm;padding-top:6mm">`
    + `<h2 class="vc-offer">${OFFER}</h2>`
    + `<p class="vc-kicker" style="margin-top:2.5mm">${SHIPPING}</p>`
    + `<div style="margin-top:auto;padding-top:3mm">${facts()}</div>`
    + `<div style="margin-top:auto;padding-top:3mm">${contacts()}</div>`
    + `<div style="margin-top:auto;padding-top:3mm">${requisites()}</div>`
    + `<div style="margin-top:auto;padding-top:2.5mm">${payment()}</div>`
    + `</div></div>`;
}

/** Лист один: визитка сверху, реквизиты снизу. */
export function documentHtml() {
  return page1();
}

export const PAGES = [
  { n: 1, name: 'Визитка и реквизиты', html: page1 },
];

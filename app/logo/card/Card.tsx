import { ART, type Art } from '../art';
import { PATHS } from '../art';
import { asset } from '@/lib/assets';
import { CONTACTS, FACTS, LEGAL, LEGAL_NAME, OFFER, POSITIONS, ROWS, SHIPPING } from './data';

/**
 * ВИЗИТКА, ТРИ ВАРИАНТА. Формат A4 книжной, 210×297 мм.
 *
 * Стили лежат строкой рядом, а не в globals.css: файл стилей встраивается в
 * КАЖДУЮ страницу сайта, и правила визитки утяжелили бы лендинг и каталог.
 * Здесь они приходят только на те страницы, где визитка показана.
 *
 * Логотип берётся тем же кодом, что и на витрине выше, — из ART, а не
 * картинкой.
 */

const U = 700; // высота прописных логотипной гарнитуры

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

/** Общие контуры логотипа. Нужны, когда визитка живёт отдельным маршрутом:
 *  на витрине они уже объявлены разделом defs. */
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
.vc-pad{padding:14mm}
.vc h2{font-weight:900;letter-spacing:-.03em;line-height:.95}
.vc-offer{font-size:11.5mm;font-weight:900;letter-spacing:-.035em;line-height:.94}
.vc-lead{font-size:3.6mm;line-height:1.45;color:var(--ink-2)}
.vc-kicker{font-size:2.9mm;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-3)}
.vc-rows{display:grid;gap:0}
.vc-row{display:grid;grid-template-columns:44mm 12mm 1fr;align-items:baseline;
  gap:0 3mm;padding:2.6mm 0;border-top:.3mm solid var(--line)}
.vc-row:first-child{border-top:0}
.vc-name{font-size:4.2mm;font-weight:700;letter-spacing:-.02em}
.vc-count{font-size:3.1mm;color:var(--ink-3);text-align:right;
  font-variant-numeric:tabular-nums}
.vc-spec{font-size:3.1mm;line-height:1.35;color:var(--ink-2)}
.vc-facts{display:grid;grid-template-columns:repeat(3,1fr);gap:6mm}
.vc-fact-v{font-size:14mm;font-weight:900;letter-spacing:-.04em;line-height:.9;
  font-variant-numeric:tabular-nums}
.vc-fact-u{font-size:4mm;font-weight:700;color:var(--ink-3);letter-spacing:0;margin-left:1.8mm;display:inline-block}
.vc-fact-l{margin-top:1.6mm;font-size:3.1mm;line-height:1.3;color:var(--ink-2)}
.vc-phone{font-size:12mm;font-weight:900;letter-spacing:-.03em;line-height:1;
  color:var(--ink);text-decoration:none;display:block}
.vc-addr{margin-top:2.5mm;font-size:3.8mm;line-height:1.4;max-width:95mm}
.vc-legal{font-size:2.7mm;line-height:1.5;color:var(--ink-3)}
.vc-legal b{font-weight:400;color:var(--ink-2)}
.vc-photo{display:block;width:100%;height:100%;object-fit:cover}
.vc-rule{height:.3mm;background:var(--line)}

@media print{
  @page{size:210mm 297mm;margin:0}
  html,body{margin:0!important;padding:0!important;background:#fff!important}
  .vc{box-shadow:none!important;page-break-after:avoid;break-after:avoid}
}
`;

function rows(dark = false) {
  return `<div class="vc-rows">` + ROWS.map((r) =>
    `<div class="vc-row"><div class="vc-name">${r.name}</div>`
    + `<div class="vc-count tnum">${r.count === null ? '' : r.count}</div>`
    + `<div class="vc-spec">${r.spec}</div></div>`).join('') + `</div>`;
}

function facts() {
  return `<div class="vc-facts">` + FACTS.map((f) =>
    `<div><div class="vc-fact-v tnum">${f.value}<span class="vc-fact-u">${f.unit}</span></div>`
    + `<div class="vc-fact-l">${f.label}</div></div>`).join('') + `</div>`;
}

function legal() {
  /* tnum висит на самом числе, а не на строке: внутри .tnum обычных
     пробелов быть не должно, иначе межсловный интервал уезжает втрое. */
  return `<p class="vc-legal">${LEGAL_NAME} &nbsp; `
    + LEGAL.map(([k, v]) => `<b>${k}</b>&nbsp;<span class="tnum">${v}</span>`)
      .join(' &nbsp; ') + `</p>`;
}

/** 1. Фотографический: крупный кадр во всю ширину, типографика под ним. */
function photoCard() {
  const src = asset('/img/park-1920.webp');
  return `<div class="vc">`
    + `<div style="height:88mm;position:relative;background:var(--ink)">`
    + `<img class="vc-photo" src="${src}" alt=""/>`
    + `<div style="position:absolute;inset:auto 0 0 0;padding:0 14mm 7mm;`
    + `--c-bg:${'#f4f4f1'};--c-ink:${'#17191c'}">${logoSvg('o1', 13)}</div></div>`
    + `<div class="vc-pad" style="height:209mm;display:flex;flex-direction:column">`
    + `<h2 class="vc-offer" style="font-size:10mm;max-width:165mm">${OFFER}</h2>`
    + `<p class="vc-lead" style="margin-top:4mm;max-width:150mm">`
    + `${POSITIONS.total} позиций в ${POSITIONS.categories} категориях, `
    + `${POSITIONS.inStock} в наличии. ${SHIPPING}.</p>`
    + `<div style="margin-top:6mm">${rows()}</div>`
    + `<div style="margin-top:auto;padding-top:6mm">${facts()}</div>`
    + `<div class="vc-rule" style="margin:6mm 0 4.5mm"></div>`
    + `<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:8mm">`
    + `<div><a class="vc-phone" href="${CONTACTS.phoneHref}">${CONTACTS.phone}</a>`
    + `<p class="vc-addr">${CONTACTS.address}</p></div>`
    + `<p class="vc-kicker" style="text-align:right;max-width:50mm">${CONTACTS.hours}</p></div>`
    + `<div style="margin-top:4.5mm">${legal()}</div>`
    + `</div></div>`;
}

/** Пока пустой лист: второй и третий варианты приходят следующими коммитами. */
function blank(name: string) {
  return `<div class="vc vc-pad" style="display:flex;align-items:center;`
    + `justify-content:center;text-align:center">`
    + `<p class="vc-kicker">${name} — вариант собирается следующим коммитом</p></div>`;
}

export const CARDS = [
  { n: 1, name: 'Фотографический', html: photoCard,
    diff: 'Крупный кадр площадки во всю ширину, логотип на нём, вся типографика под ним.',
    weak: 'Кадр съедает треть высоты, и на строки характеристик остаётся меньше воздуха, чем в двух других.' },
  { n: 2, name: 'Типографический', html: () => blank('Типографический'), diff: '', weak: '' },
  { n: 3, name: 'Тёмный', html: () => blank('Тёмный'), diff: '', weak: '' },
];

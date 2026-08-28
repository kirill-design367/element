import { ART, type Art } from '../art';
import { PATHS } from '../art';
import { asset } from '@/lib/assets';
import { CALL, CONTACTS, FACTS, LEGAL, LEGAL_NAME, OFFER, QR, SHIPPING } from './data';

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
.vc-facts{display:grid;grid-template-columns:repeat(3,1fr);gap:8mm}
.vc-fact-v{font-size:22mm;font-weight:900;letter-spacing:-.045em;line-height:.86;
  font-variant-numeric:tabular-nums}
.vc-fact-u{font-size:5.5mm;font-weight:700;color:var(--ink-3);letter-spacing:0;
  margin-left:2.2mm;display:inline-block}
.vc-fact-l{margin-top:3mm;font-size:3.6mm;line-height:1.3;color:var(--ink-2);max-width:44mm}
.vc-call{font-size:5.2mm;font-weight:700;line-height:1.25;letter-spacing:-.015em;
  max-width:150mm}
.vc-contacts{display:flex;align-items:flex-end;justify-content:space-between;gap:8mm}
.vc-site{margin-top:1.8mm;font-size:4mm;color:var(--ink-2)}
.vc-qr{width:26mm;height:26mm;flex:none;color:var(--ink)}
.vc-hours{margin-top:6mm;font-size:4.2mm;font-weight:700;letter-spacing:-.01em}
.vc-phone{font-size:12mm;font-weight:900;letter-spacing:-.03em;line-height:1;
  color:var(--ink);text-decoration:none;display:block}
.vc-addr{margin-top:2.5mm;font-size:3.8mm;line-height:1.4;max-width:95mm}
.vc-legal{font-size:2.7mm;line-height:1.5;color:var(--ink-3)}
.vc-legal b{font-weight:400;color:var(--ink-2)}
.vc-photo{display:block;width:100%;height:100%;object-fit:cover}
.vc-rule{height:.3mm;background:var(--line)}

/* Тёмный вариант: те же токены, что у .inv на сайте. */
.vc-dark{background:var(--ink);color:var(--surface)}
.vc-dark .vc-lead,.vc-dark .vc-spec,.vc-dark .vc-fact-l{color:#b9bec6}
.vc-dark .vc-kicker,.vc-dark .vc-count,.vc-dark .vc-legal{color:#8b929c}
.vc-dark .vc-legal b{color:#b9bec6}
.vc-dark .vc-row{border-top-color:rgba(255,255,255,.14)}
.vc-dark .vc-rule{background:rgba(255,255,255,.14)}
.vc-dark .vc-phone{color:#9db4f2}
.vc-dark .vc-fact-v{color:#9db4f2}

@media print{
  @page{size:210mm 297mm;margin:0}
  html,body{margin:0!important;padding:0!important;background:#fff!important}
  .vc{box-shadow:none!important;page-break-after:avoid;break-after:avoid}
}
`;

function facts() {
  return `<div class="vc-facts">` + FACTS.map((f) =>
    `<div><div class="vc-fact-v tnum">${f.value}<span class="vc-fact-u">${f.unit}</span></div>`
    + `<div class="vc-fact-l">${f.label}</div></div>`).join('') + `</div>`;
}

/** Контакты: телефон, адрес, адрес сайта и QR-код — последние два только
 *  когда поле сайта заполнено. */
function contacts() {
  const site = CONTACTS.site
    ? `<p class="vc-site">${CONTACTS.site.replace(/^https?:\/\//, '')}</p>` : '';
  const qr = QR
    ? `<svg class="vc-qr" viewBox="0 0 ${QR.size} ${QR.size}" aria-hidden="true">`
      + `<path d="${QR.path}" fill="currentColor"/></svg>` : '';
  return `<div class="vc-contacts">`
    + `<div><a class="vc-phone" href="${CONTACTS.phoneHref}">${CONTACTS.phone}</a>`
    + `<p class="vc-addr">${CONTACTS.address}</p>${site}</div>${qr}</div>`;
}

function legal() {
  /* tnum висит на самом числе, а не на строке: внутри .tnum обычных
     пробелов быть не должно, иначе межсловный интервал уезжает втрое. */
  return `<p class="vc-legal">${LEGAL_NAME} &nbsp; `
    + LEGAL.map(([k, v]) => `<b>${k}</b>&nbsp;<span class="tnum">${v}</span>`)
      .join(' &nbsp; ') + `</p>`;
}

/** Фотографический: крупный кадр во всю ширину, типографика под ним. */
function photoCard() {
  const src = asset('/img/park-1920.webp');
  return `<div class="vc">`
    + `<div style="height:88mm;position:relative;background:var(--ink)">`
    + `<img class="vc-photo" src="${src}" alt=""/>`
    + `<div style="position:absolute;inset:auto 0 0 0;padding:0 14mm 7mm;`
    + `--c-bg:${'#f4f4f1'};--c-ink:${'#17191c'}">${logoSvg('o1', 13)}</div></div>`
    + `<div class="vc-pad" style="height:209mm;display:flex;flex-direction:column">`
    + `<h2 class="vc-offer" style="font-size:11mm;max-width:170mm">${OFFER}</h2>`
    + `<p class="vc-kicker" style="margin-top:7mm">${SHIPPING}</p>`
    + `<div style="margin-top:auto;padding-top:10mm">${facts()}</div>`
    + `<p class="vc-call" style="margin-top:9mm">${CALL}</p>`
    + `<div style="margin-top:auto;padding-top:10mm">${contacts()}</div>`
    + `<p class="vc-hours">${CONTACTS.hours}</p>`
    + `<div class="vc-rule" style="margin:5mm 0 4mm"></div>`
    + legal()
    + `</div></div>`;
}

export const CARDS = [
  { n: 1, name: 'Фотографический', html: photoCard,
    diff: 'Крупный кадр площадки во всю ширину, логотип на нём, вся типографика под ним.',
    weak: 'Кадр съедает треть высоты: всё, что ниже, живёт на оставшихся двух третях листа.' },
];

/**
 * ПРОВЕРИТЬ ДАННЫЕ CMS И ПОДСТАВИТЬ ИХ В ПРОЕКТ.
 *
 * ЭТОТ ШАГ ПАДАЕТ — И В ЭТОМ ЕГО СМЫСЛ. Предыдущий, cms-fetch.mjs, терпит
 * всё: нет сети, нет публикаций, не подошёл ключ — сборка идёт на данных из
 * репозитория. Здесь наоборот: данные пришли, и если они не сходятся с
 * типами, сборка ОБЯЗАНА остановиться. На сайте останется прежняя версия,
 * а это лучше, чем каталог с пустыми ценами или без половины позиций.
 *
 * Ошибка называет запись и поле по-русски: разбирать её будет тот, кто
 * правил данные, а не тот, кто писал этот файл.
 *
 * Что получается на выходе — `lib/data/*.data.ts`, ровно те файлы, что
 * лежат в репозитории запасным вариантом. Дальше обычная сборка Next.
 *
 * Запуск:  node scripts/cms-apply.mjs cms-data.json
 */
import { readFileSync, writeFileSync } from 'node:fs';

const file = process.argv[2] ?? 'cms-data.json';
const errors = [];

/* ── чтение ─────────────────────────────────────────────────────────── */
let data;
try {
  data = JSON.parse(readFileSync(file, 'utf8'));
} catch (e) {
  fail([`файл ${file} не читается как JSON: ${e instanceof Error ? e.message : String(e)}`]);
}

/* ── мелкие проверялки ──────────────────────────────────────────────── */
const isStr = (v) => typeof v === 'string';
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const optStr = (v) => v === null || isStr(v);

function need(cond, message) {
  if (!cond) errors.push(message);
  return cond;
}

/* ── категории ──────────────────────────────────────────────────────── */
const categories = Array.isArray(data?.categories) ? data.categories : null;
need(categories !== null, 'нет списка категорий');
need(categories === null || categories.length > 0,
  'список категорий пуст — сайт без категорий это пустой каталог');

const catIds = new Set();
(categories ?? []).forEach((c, i) => {
  const at = `категория №${i + 1}${isStr(c?.id) ? ` (${c.id})` : ''}`;
  if (!need(isStr(c?.id) && c.id !== '', `${at}: нет адреса`)) return;
  need(!catIds.has(c.id), `${at}: такой адрес уже занят другой категорией`);
  catIds.add(c.id);
  need(isStr(c.name) && c.name !== '', `${at}: нет названия`);
  need(isStr(c.summary), `${at}: описание должно быть строкой`);
  need(c.unit === 'm3' || c.unit === 't', `${at}: единица должна быть «m3» или «t», пришло «${c.unit}»`);
  need(optStr(c.groupLabel), `${at}: подпись фильтра по видам должна быть строкой или отсутствовать`);
});

/* ── группы ─────────────────────────────────────────────────────────── */
const groups = Array.isArray(data?.groups) ? data.groups : [];
need(Array.isArray(data?.groups), 'нет списка видов внутри категорий');
const groupById = new Map();
groups.forEach((g, i) => {
  const at = `вид проката №${i + 1}${isStr(g?.id) ? ` (${g.id})` : ''}`;
  if (!need(isStr(g?.id) && g.id !== '', `${at}: нет адреса`)) return;
  need(!groupById.has(g.id), `${at}: такой адрес уже занят`);
  need(isStr(g.name) && g.name !== '', `${at}: нет названия`);
  need(catIds.has(g.categoryId), `${at}: ссылается на категорию «${g.categoryId}», которой нет`);
  groupById.set(g.id, g.categoryId);
});

/* ── фракция ────────────────────────────────────────────────────────── */
function checkFraction(f, at) {
  if (typeof f !== 'object' || f === null) {
    errors.push(`${at}: нет зернового состава`);
    return;
  }
  switch (f.kind) {
    case 'mm':
    case 'mkr':
      need(isNum(f.from) && isNum(f.to), `${at}: границы фракции должны быть числами`);
      need(isNum(f.from) && isNum(f.to) && f.to > f.from,
        `${at}: верхняя граница фракции должна быть больше нижней`);
      break;
    case 'gravel':
      need(isNum(f.percent) && f.percent >= 0 && f.percent <= 100,
        `${at}: доля гравия должна быть числом от 0 до 100`);
      break;
    case 'none':
      need(isStr(f.label) && f.label !== '',
        `${at}: у позиции без фракции должно быть обозначение партии`);
      break;
    default:
      errors.push(`${at}: неизвестный вид зернового состава «${f.kind}»`);
  }
}

/* ── позиции ────────────────────────────────────────────────────────── */
const AVAIL = ['in-stock', 'on-order', 'out', 'unknown'];
const materials = Array.isArray(data?.materials) ? data.materials : null;
need(materials !== null, 'нет списка позиций');
need(materials === null || materials.length > 0,
  'список позиций пуст — такой каталог выкладывать нельзя');

const matIds = new Set();
let defaults = 0;
(materials ?? []).forEach((m, i) => {
  const at = `позиция №${i + 1}${isStr(m?.name) ? ` «${m.name}»` : ''}`;
  if (!need(isStr(m?.id) && m.id !== '', `${at}: нет адреса`)) return;
  need(!matIds.has(m.id), `${at}: адрес «${m.id}» уже занят другой позицией`);
  matIds.add(m.id);
  need(isStr(m.name) && m.name !== '', `${at}: нет названия`);
  need(isStr(m.kind) && m.kind !== '', `${at}: нет разновидности`);
  need(catIds.has(m.categoryId), `${at}: ссылается на категорию «${m.categoryId}», которой нет`);
  if (m.group !== null && m.group !== undefined) {
    if (need(groupById.has(m.group), `${at}: ссылается на вид «${m.group}», которого нет`)) {
      need(groupById.get(m.group) === m.categoryId,
        `${at}: вид «${m.group}» относится к другой категории`);
    }
  }
  checkFraction(m.fraction, at);
  need(optStr(m.gost), `${at}: ГОСТ должен быть строкой или отсутствовать`);
  need(optStr(m.strength), `${at}: марка прочности должна быть строкой или отсутствовать`);
  need(optStr(m.frost), `${at}: морозостойкость должна быть строкой или отсутствовать`);
  need(optStr(m.note), `${at}: примечание должно быть строкой или отсутствовать`);
  need(m.density === null || (isNum(m.density) && m.density > 0),
    `${at}: плотность должна быть положительным числом или отсутствовать`);
  /* ЦЕНА: null и ноль — РАЗНЫЕ ВЕЩИ, и обе допустимы. Проверяется только
     то, что это не строка и не отрицательное число. */
  need(m.pricePerTon === null || (isNum(m.pricePerTon) && m.pricePerTon >= 0),
    `${at}: цена должна быть числом или отсутствовать (пусто — «уточняйте у менеджера»)`);
  need(AVAIL.includes(m.availability), `${at}: непонятное наличие «${m.availability}»`);
  need(Array.isArray(m.uses) && m.uses.every(isStr), `${at}: применения должны быть списком строк`);
  if (m.isDefault === true) defaults += 1;
});
need(defaults <= 1,
  `позиций, помеченных «открывать в калькуляторе», ${defaults} — должна быть ровно одна`);

/* ── реквизиты ──────────────────────────────────────────────────────── */
const COMPANY_KEYS = [
  'legalName', 'phone', 'address', 'email', 'hoursOffice', 'hoursShippingShort',
  'inn', 'kpp', 'ogrn', 'bank', 'account', 'corr', 'bik',
];
const company = typeof data?.company === 'object' && data.company !== null ? data.company : null;
need(company !== null, 'нет реквизитов');
for (const k of COMPANY_KEYS) {
  need(company !== null && isStr(company[k]), `реквизиты: поле «${k}» отсутствует или не строка`);
}
if (company !== null && isStr(company.phone)) {
  need((company.phone.match(/\d/g) ?? []).length >= 11,
    'реквизиты: в телефоне меньше одиннадцати цифр');
}
if (company !== null && isStr(company.email)) {
  need(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(company.email),
    'реквизиты: почта не похожа на адрес — на неё уходят заявки с сайта');
}

/* ── объекты ────────────────────────────────────────────────────────── */
const objects = Array.isArray(data?.objects) ? data.objects : null;
need(objects !== null, 'нет списка объектов');
(objects ?? []).forEach((o, i) => {
  const at = `объект №${i + 1}${isStr(o?.name) ? ` «${o.name}»` : ''}`;
  need(isStr(o?.name) && o.name !== '', `${at}: нет названия`);
  need(isStr(o?.place), `${at}: район должен быть строкой`);
  need(isStr(o?.supplied), `${at}: «что поставляли» должно быть строкой`);
  need(isStr(o?.period), `${at}: период должен быть строкой`);
  need(isNum(o?.m3) && o.m3 >= 0, `${at}: объём должен быть числом`);
});

/* ── цифры парка ────────────────────────────────────────────────────── */
const fleet = Array.isArray(data?.fleet) ? data.fleet : null;
need(fleet !== null, 'нет цифр парка');
let leads = 0;
(fleet ?? []).forEach((f, i) => {
  const at = `цифра парка №${i + 1}${isStr(f?.label) ? ` «${f.label}»` : ''}`;
  need(isNum(f?.value), `${at}: значение должно быть числом`);
  need(isStr(f?.unit), `${at}: единица должна быть строкой`);
  need(isStr(f?.label) && f.label !== '', `${at}: нет подписи`);
  need(isStr(f?.note), `${at}: уточнение должно быть строкой`);
  need(f?.computed === null || f?.computed === 'positions' || f?.computed === 'years',
    `${at}: непонятный источник числа «${f?.computed}»`);
  if (f?.lead === true) leads += 1;
});
need(leads <= 1, `главных цифр парка ${leads} — должна быть не больше одной`);

if (errors.length) fail(errors);

/* ── ГЕНЕРАЦИЯ ──────────────────────────────────────────────────────── */
const HEAD = (what) => `/**
 * ${what}
 *
 * ⚙️ ФАЙЛ СОБРАН scripts/cms-apply.mjs ИЗ ДАННЫХ АДМИНКИ. Правка руками
 * проживёт до первой публикации из админки: следующая сборка перепишет его
 * целиком.
 *
 * ОН ЖЕ ЗАПАСНОЙ ВАРИАНТ: если хостинг с базой недоступен, сборка идёт на
 * том, что здесь лежит, и сайт выходит прежним, а не пустым. Поэтому файл
 * коммитится — это последняя опубликованная версия данных.
 */\n\n`;

/** Строка в TypeScript: одинарные кавычки, экранирование обратного слэша. */
const str = (v) => `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
/** Поле, которого может не быть: null не пишется вовсе. */
const opt = (name, v) => (v === null || v === undefined ? '' : `\n    ${name}: ${str(v)},`);

const fracTs = (f) => {
  switch (f.kind) {
    case 'mm': return `{ kind: 'mm', from: ${f.from}, to: ${f.to} }`;
    case 'mkr': return `{ kind: 'mkr', from: ${f.from}, to: ${f.to} }`;
    case 'gravel': return `{ kind: 'gravel', percent: ${f.percent} }`;
    default: return `{ kind: 'none', label: ${str(f.label)} }`;
  }
};

const catalogTs = HEAD('НОМЕНКЛАТУРА, ЦЕНЫ И КАТЕГОРИИ.')
  + "import type { Category, Group, Material } from './types';\n\n"
  + 'export const GROUPS: Group[] = [\n'
  + groups.map((g) => `  { id: ${str(g.id)}, categoryId: ${str(g.categoryId)}, name: ${str(g.name)} },`).join('\n')
  + '\n];\n\nexport const CATEGORIES: Category[] = [\n'
  + categories.map((c) => `  {
    id: ${str(c.id)},
    name: ${str(c.name)},
    summary: ${str(c.summary)},
    unit: ${str(c.unit)},${opt('groupLabel', c.groupLabel)}
  },`).join('\n')
  + '\n];\n\nexport const MATERIALS: Material[] = [\n'
  + materials.map((m) => `  {
    id: ${str(m.id)},
    categoryId: ${str(m.categoryId)},
    name: ${str(m.name)},${opt('group', m.group)}
    kind: ${str(m.kind)},
    fraction: ${fracTs(m.fraction)},${opt('gost', m.gost)}${opt('strength', m.strength)}${opt('frost', m.frost)}${
      m.density === null || m.density === undefined ? '' : `\n    density: ${m.density},`}
    pricePerTon: ${m.pricePerTon === null ? 'null' : m.pricePerTon},
    availability: ${str(m.availability)},${m.isDefault === true ? '\n    isDefault: true,' : ''}
    uses: [${m.uses.map(str).join(', ')}],${opt('note', m.note)}
  },`).join('\n')
  + '\n];\n';

const companyTs = HEAD('РЕКВИЗИТЫ И КОНТАКТЫ.')
  + "import type { CompanyData } from './types';\n\n"
  + 'export const COMPANY_DATA: CompanyData = {\n'
  + COMPANY_KEYS.map((k) => `  ${k}: ${str(company[k])},`).join('\n')
  + '\n};\n';

const objectsTs = HEAD('ОБЪЕКТЫ, НА КОТОРЫЕ ПОСТАВЛЯЛИ.')
  + "import type { Project } from './types';\n\n"
  + 'export const OBJECTS: Project[] = [\n'
  + objects.map((o) => `  {
    name: ${str(o.name)},
    place: ${str(o.place)},
    supplied: ${str(o.supplied)},
    m3: ${o.m3},
    period: ${str(o.period)},
  },`).join('\n')
  + '\n];\n';

const fleetTs = HEAD('ЦИФРЫ БЛОКА «ПАРК И ОБЪЁМЫ».')
  + "import type { FleetNumberData } from './types';\n\n"
  + 'export const FLEET_NUMBERS_DATA: FleetNumberData[] = [\n'
  + fleet.map((f) => `  {
    value: ${f.value},
    unit: ${str(f.unit)},
    label: ${str(f.label)},
    note: ${str(f.note)},${f.lead === true ? '\n    lead: true,' : ''}${
      f.computed ? `\n    computed: ${str(f.computed)},` : ''}
  },`).join('\n')
  + '\n];\n';

writeFileSync('lib/data/catalog.data.ts', catalogTs);
writeFileSync('lib/data/company.data.ts', companyTs);
writeFileSync('lib/data/objects.data.ts', objectsTs);
writeFileSync('lib/data/fleet.data.ts', fleetTs);

/* МЕТКА ВЕРСИИ ДАННЫХ В ВЫДАЧЕ.
 *
 * Файл уезжает на сервер вместе со статикой, и шаг «Проверка боем» после
 * выкладки сверяет то, что лежит НА БОЕВОМ АДРЕСЕ, с отпечатком снимка,
 * который взяла эта сборка. Совпало — данные доехали. Не совпало — выкладка
 * падает и говорит об этом.
 *
 * Без такой метки «правка не доехала» замечает только заказчик и только
 * случайно: все шаги при этом зелёные, потому что каждый по отдельности
 * отработал успешно. Именно так и вышло 30.08.
 */
let digest = '';
try {
  digest = readFileSync(file + '.digest', 'utf8').trim();
} catch {
  /* Отпечатка нет — значит данные пришли не из cms-fetch (например, из
     локального файла при проверке). Метку всё равно пишем, но пустую: врать
     про версию хуже, чем не знать её. */
}
writeFileSync(
  'public/cms-version.txt',
  `${digest}\n${new Date().toISOString()}\nпозиций: ${materials.length}\n`,
);

const priced = materials.filter((m) => m.pricePerTon !== null).length;
console.log(
  `CMS: подставлено — категорий ${categories.length}, видов ${groups.length}, `
    + `позиций ${materials.length} (с ценой ${priced}, без цены ${materials.length - priced}), `
    + `объектов ${objects.length}, цифр парка ${fleet.length}`,
);

function fail(list) {
  console.error('');
  console.error('CMS: ДАННЫЕ НЕ ПРОШЛИ ПРОВЕРКУ — СБОРКА ОСТАНОВЛЕНА.');
  console.error('На сайте осталась прежняя версия. Поправьте в админке и опубликуйте снова.');
  console.error('');
  for (const e of list.slice(0, 40)) console.error('  • ' + e);
  if (list.length > 40) console.error(`  … и ещё ${list.length - 40}`);
  console.error('');
  process.exit(1);
}

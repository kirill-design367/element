/**
 * ПЕРВОНАЧАЛЬНОЕ НАПОЛНЕНИЕ БАЗЫ — ИЗ ТЕХ ЖЕ ФАЙЛОВ, ЧТО ЧИТАЕТ САЙТ.
 *
 * Заказчик должен открыть админку и увидеть свой каталог, а не пустоту.
 * Набирать 46 позиций руками в SQL — верный способ разойтись с сайтом на
 * первой же опечатке, поэтому seed собирается из `lib/data/*.data.ts`
 * скриптом: источник один и тот же, и разойтись ему не с чем.
 *
 * КАК ЧИТАЮТСЯ TS-ФАЙЛЫ. Node не умеет импортировать TypeScript, а тащить
 * ради одного скрипта загрузчик незачем. Файлы прогоняются через tsc,
 * который в проекте и так стоит, в отдельный каталог, переименовываются в
 * .mjs (в package.json нет "type": "module", и .js читался бы как CommonJS)
 * и импортируются оттуда. Импорты типов при этом стираются сами — они
 * объявлены через `import type`.
 *
 * Пересобрать:  node scripts/build-cms-seed.mjs
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const OUT = 'public/admin/sql/seed.sql';

const dir = mkdtempSync(join(tmpdir(), 'element-seed-'));
try {
  execFileSync(
    'npx',
    [
      'tsc',
      'lib/data/catalog.data.ts',
      'lib/data/company.data.ts',
      'lib/data/objects.data.ts',
      'lib/data/fleet.data.ts',
      '--outDir', dir,
      '--rootDir', 'lib/data',
      '--target', 'es2022',
      '--module', 'esnext',
      '--moduleResolution', 'bundler',
    ],
    { stdio: 'inherit' },
  );
  for (const name of readdirSync(dir)) {
    if (name.endsWith('.js')) renameSync(join(dir, name), join(dir, name.replace(/\.js$/, '.mjs')));
  }

  const load = (name) => import(pathToFileURL(join(dir, name)).href);
  const { CATEGORIES, GROUPS, MATERIALS } = await load('catalog.data.mjs');
  const { COMPANY_DATA } = await load('company.data.mjs');
  const { OBJECTS } = await load('objects.data.mjs');
  const { FLEET_NUMBERS_DATA } = await load('fleet.data.mjs');

  /** Строка для SQL. Кавычка удваивается, обратный слэш экранируется. */
  const s = (v) =>
    v === null || v === undefined
      ? 'NULL'
      : `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
  /** Число или NULL. ВАЖНО: ноль это число, а не пустота. */
  const n = (v) => (v === null || v === undefined ? 'NULL' : String(v));

  const lines = [];
  lines.push('-- ПЕРВОНАЧАЛЬНОЕ НАПОЛНЕНИЕ. Собран scripts/build-cms-seed.mjs');
  lines.push('-- из lib/data/*.data.ts — руками не править, правка потеряется.');
  lines.push('--');
  lines.push('-- Загружается один раз, при установке админки. Повторный запуск');
  lines.push('-- ничего не испортит: install.php заливает seed только в пустую базу.');
  lines.push('');

  lines.push('-- Категории');
  CATEGORIES.forEach((c, i) => {
    lines.push(
      `INSERT INTO categories (id, name, summary, unit, group_label, sort) VALUES (${s(c.id)}, ${s(c.name)}, ${s(c.summary)}, ${s(c.unit)}, ${s(c.groupLabel ?? null)}, ${i});`,
    );
  });

  lines.push('');
  lines.push('-- Группы внутри категории (пока только виды проката)');
  GROUPS.forEach((g, i) => {
    lines.push(
      `INSERT INTO material_groups (id, category_id, name, sort) VALUES (${s(g.id)}, ${s(g.categoryId)}, ${s(g.name)}, ${i});`,
    );
  });

  lines.push('');
  lines.push(`-- Позиции каталога: ${MATERIALS.length}`);
  MATERIALS.forEach((m, i) => {
    const f = m.fraction;
    const cols = [
      s(m.id), s(m.categoryId), s(m.name), s(m.group ?? null), s(m.kind),
      s(f.kind),
      n(f.kind === 'mm' || f.kind === 'mkr' ? f.from : null),
      n(f.kind === 'mm' || f.kind === 'mkr' ? f.to : null),
      n(f.kind === 'gravel' ? f.percent : null),
      s(f.kind === 'none' ? f.label : null),
      s(m.gost ?? null), s(m.strength ?? null), s(m.frost ?? null),
      n(m.density ?? null),
      /* Цена: null остаётся NULL и не превращается в ноль. */
      n(m.pricePerTon),
      s(m.availability),
      m.isDefault ? 1 : 0,
      s(m.uses.join('\n')),
      s(m.note ?? null),
      i,
    ];
    lines.push(
      'INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, '
        + 'fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, '
        + `density, price_per_ton, availability, is_default, uses, note, sort) VALUES (${cols.join(', ')});`,
    );
  });

  lines.push('');
  lines.push('-- Реквизиты и контакты');
  for (const [k, v] of Object.entries(COMPANY_DATA)) {
    lines.push(`INSERT INTO company (k, v) VALUES (${s(k)}, ${s(v)});`);
  }

  lines.push('');
  lines.push('-- Объекты');
  OBJECTS.forEach((o, i) => {
    lines.push(
      `INSERT INTO objects (name, place, supplied, m3, period, sort) VALUES (${s(o.name)}, ${s(o.place)}, ${s(o.supplied)}, ${n(o.m3)}, ${s(o.period)}, ${i});`,
    );
  });

  lines.push('');
  lines.push('-- Цифры парка');
  FLEET_NUMBERS_DATA.forEach((f, i) => {
    lines.push(
      `INSERT INTO fleet_numbers (value, unit, label, note, is_lead, computed, sort) VALUES (${n(f.value)}, ${s(f.unit)}, ${s(f.label)}, ${s(f.note)}, ${f.lead ? 1 : 0}, ${s(f.computed ?? '')}, ${i});`,
    );
  });

  writeFileSync(OUT, lines.join('\n') + '\n');
  console.log(
    `${OUT}: категорий ${CATEGORIES.length}, групп ${GROUPS.length}, позиций ${MATERIALS.length}, `
      + `полей реквизитов ${Object.keys(COMPANY_DATA).length}, объектов ${OBJECTS.length}, цифр парка ${FLEET_NUMBERS_DATA.length}`,
  );
} finally {
  rmSync(dir, { recursive: true, force: true });
}

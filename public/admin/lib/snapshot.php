<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

/**
 * СНИМОК ДАННЫХ ДЛЯ СБОРКИ.
 *
 * Собирает всё, что правит заказчик, в один массив той формы, которую ждёт
 * сайт. Форма описана в lib/data/types.ts — это договор между базой и
 * сборкой, и проверяет его scripts/cms-apply.mjs перед тем, как что-либо
 * подставить.
 *
 * ЗАЧЕМ СНИМОК, А НЕ ЧТЕНИЕ БАЗЫ НАПРЯМУЮ. Сборка идёт полторы-две минуты.
 * Всё это время заказчик может продолжать править — и без снимка на сайт
 * уехала бы половина одной правки и половина другой. Снимок делается в
 * момент нажатия «Опубликовать» и дальше не меняется.
 *
 * ОТПЕЧАТОК СНИМКА отвечает на вопрос «есть ли несохранённые изменения»:
 * если отпечаток текущих данных не совпадает с отпечатком последнего
 * опубликованного, значит после публикации что-то правили.
 */

/** @return array<string,mixed> */
function snapshot_build(): array
{
    $categories = array_map(
        static fn(array $r): array => [
            'id' => (string) $r['id'],
            'name' => (string) $r['name'],
            'summary' => (string) $r['summary'],
            'unit' => (string) $r['unit'],
            /* Пустая строка и «нет значения» — разные вещи: у категории без
               групп подписи фильтра нет вовсе, и в типе это необязательное
               поле, а не пустая строка. */
            'groupLabel' => ($r['group_label'] === null || $r['group_label'] === '')
                ? null : (string) $r['group_label'],
        ],
        q('SELECT * FROM categories ORDER BY sort, id'),
    );

    $groups = array_map(
        static fn(array $r): array => [
            'id' => (string) $r['id'],
            'categoryId' => (string) $r['category_id'],
            'name' => (string) $r['name'],
        ],
        q('SELECT * FROM material_groups ORDER BY sort, id'),
    );

    $materials = array_map(
        static fn(array $r): array => [
            'id' => (string) $r['id'],
            'categoryId' => (string) $r['category_id'],
            'name' => (string) $r['name'],
            'group' => ($r['group_id'] === null || $r['group_id'] === '') ? null : (string) $r['group_id'],
            'kind' => (string) $r['kind'],
            'fraction' => snapshot_fraction($r),
            'gost' => snapshot_opt($r['gost']),
            'strength' => snapshot_opt($r['strength']),
            'frost' => snapshot_opt($r['frost']),
            /* Плотность: у металла её нет вовсе, и ноль тут был бы ложью —
               по нулевой плотности считается нулевой тоннаж. */
            'density' => $r['density'] === null ? null : (float) $r['density'],
            /* ЦЕНА: null остаётся null и не превращается в ноль. */
            'pricePerTon' => $r['price_per_ton'] === null ? null : (int) $r['price_per_ton'],
            'availability' => (string) $r['availability'],
            'isDefault' => ((int) $r['is_default']) === 1,
            'uses' => snapshot_lines((string) $r['uses']),
            'note' => snapshot_opt($r['note']),
        ],
        q('SELECT * FROM materials ORDER BY sort, id'),
    );

    $company = [];
    foreach (q('SELECT k, v FROM company') as $row) {
        $company[(string) $row['k']] = (string) $row['v'];
    }

    $objects = array_map(
        static fn(array $r): array => [
            'name' => (string) $r['name'],
            'place' => (string) $r['place'],
            'supplied' => (string) $r['supplied'],
            'm3' => (int) $r['m3'],
            'period' => (string) $r['period'],
        ],
        q('SELECT * FROM objects ORDER BY sort, id'),
    );

    $fleet = array_map(
        static fn(array $r): array => [
            'value' => (int) $r['value'],
            'unit' => (string) $r['unit'],
            'label' => (string) $r['label'],
            'note' => (string) $r['note'],
            'lead' => ((int) $r['is_lead']) === 1,
            'computed' => $r['computed'] === '' ? null : (string) $r['computed'],
        ],
        q('SELECT * FROM fleet_numbers ORDER BY sort, id'),
    );

    return [
        'version' => 1,
        'categories' => $categories,
        'groups' => $groups,
        'materials' => $materials,
        'company' => $company,
        'objects' => $objects,
        'fleet' => $fleet,
    ];
}

function snapshot_opt(mixed $v): ?string
{
    return ($v === null || $v === '') ? null : (string) $v;
}

/** Применения хранятся по одному в строке — так их и правят в форме. */
function snapshot_lines(string $text): array
{
    $out = [];
    foreach (explode("\n", $text) as $line) {
        $line = trim($line);
        if ($line !== '') {
            $out[] = $line;
        }
    }
    return $out;
}

/**
 * ФРАКЦИЯ СОБИРАЕТСЯ ИЗ ЧИСЕЛ, А ПОДПИСЬ НЕ ХРАНИТСЯ.
 *
 * Подпись «5–20 мм» выводит сайт из тех же чисел, по которым работает
 * фильтр, — хелпер fractionLabel(). Хранить её отдельно значило бы завести
 * вторую запись того же факта: правка одной не задевала бы другую, и
 * разойтись они могли молча. Исключение одно — вид «none»: там подпись это
 * не размер зерна, а обозначение партии («просеянный», «⌀ 10 мм»), и вывести
 * её не из чего.
 */
function snapshot_fraction(array $r): array
{
    return match ((string) $r['fraction_kind']) {
        'mm' => ['kind' => 'mm', 'from' => (float) $r['fraction_from'], 'to' => (float) $r['fraction_to']],
        'mkr' => ['kind' => 'mkr', 'from' => (float) $r['fraction_from'], 'to' => (float) $r['fraction_to']],
        'gravel' => ['kind' => 'gravel', 'percent' => (float) $r['fraction_percent']],
        default => ['kind' => 'none', 'label' => (string) $r['fraction_label']],
    };
}

/** Как снимок уезжает на сборку: одной строкой JSON без экранирования кириллицы. */
function snapshot_json(array $data): string
{
    return (string) json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

function snapshot_digest(array $data): string
{
    return hash('sha256', snapshot_json($data));
}

/** Последняя публикация или null. */
function snapshot_last(): ?array
{
    return q1('SELECT id, digest, created_at, dispatch FROM snapshots ORDER BY id DESC LIMIT 1');
}

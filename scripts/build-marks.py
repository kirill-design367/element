#!/usr/bin/env python3
"""Геометрия логотипа для служебной страницы /logo.

ГОТОВОГО ШРИФТА ЗДЕСЬ НЕТ. Все семь букв слова ЭЛЕМЕНТ нарисованы с нуля,
своей геометрией: каждая буква — многоугольник из прямоугольников, у
которого часть углов срезана фаской под 45°. CoFo Sans не участвует ни как
основа, ни как источник контуров, и fontTools этому скрипту больше не нужен.

Ни одной кривой: в файле нет ни одной команды, кроме M, L и Z.

Всё считается в МОДУЛЯХ. Модуль — единственная величина, от которой
берутся остальные; ниже они выведены из него, а не подобраны на глаз.

Пересобрать:  python3 scripts/build-marks.py
"""
import json
import math
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'app/logo/art.ts')

# ─── модульная сетка ──────────────────────────────────────────────────────

M = 40                     # модуль, единиц
CAP = 18 * M               # высота прописных — 720
STEM = 4 * M               # толщина штриха — 160, она же у скобы
GAP = 3 * M                # просвет внутри буквы и между буквами — 120
CHAMFER = 3 * M            # глубина наружной фаски — 120

# Внутренняя фаска — не второе число, а следствие первого. Внутренний контур
# идёт параллельно наружному на толщину штриха, поэтому его фаска мельче
# ровно на этот сдвиг: перпендикулярное расстояние между двумя срезами под
# 45° должно остаться равным толщине штриха.
#
#   c' = c − (2 − √2)·s
#
# При c = 3M и s = 4M это 0,657 модуля. Толщина скобы от этого постоянна по
# всей длине, включая углы, — а это и есть условие задания.
CHAMFER_IN = CHAMFER - (2 - math.sqrt(2)) * STEM


def facet(pts, flags):
    """Срезать помеченные углы фаской под 45°.

    Все рёбра букв и скобы осевые, поэтому равные катеты по обе стороны угла
    дают ровно 45°. Флаг 'o' — наружный угол, 'i' — внутренний, пусто — угол
    остаётся прямым.

    Если два среза на одном ребре не помещаются, оба ужимаются
    пропорционально. Ребро длиной ровно в два катета при этом схлопывается в
    точку — так и сделана вершина у М.
    """
    n = len(pts)
    leg = [CHAMFER if f == 'o' else CHAMFER_IN if f == 'i' else 0.0 for f in flags]
    for _ in range(4):
        for i in range(n):
            j = (i + 1) % n
            L = math.dist(pts[i], pts[j])
            t = leg[i] + leg[j]
            if t > L + 1e-9:
                k = L / t
                leg[i] *= k
                leg[j] *= k
    out = []
    for i in range(n):
        p, a, b = pts[i], pts[i - 1], pts[(i + 1) % n]
        if leg[i] < 1e-9:
            out.append(p)
            continue
        for q in (a, b):
            d = math.dist(p, q)
            out.append((p[0] + (q[0] - p[0]) * leg[i] / d,
                        p[1] + (q[1] - p[1]) * leg[i] / d))
    res = [out[0]]
    for p in out[1:]:
        if math.dist(p, res[-1]) > 1e-9:
            res.append(p)
    if math.dist(res[0], res[-1]) < 1e-9:
        res.pop()
    return res


def poly(width, verts):
    """Буква: ширина в модулях и обход против часовой с флагами углов."""
    pts = [(x * M, y * M) for x, y, _ in verts]
    return {'w': width * M, 'pts': facet(pts, [f for _, _, f in verts])}


# ─── семь букв, нарисованных с нуля ───────────────────────────────────────
#
# Обход против часовой, начало координат — левый край и базовая линия.
# Высота прописных 18 модулей, штрих 4, просветы 3 и 4.
#
# Правило срезов одно на всю гарнитуру: режется НАРУЖНЫЙ угол силуэта и
# внутренний угол стыка; торец штриха режется только со стороны силуэта, а
# со стороны просвета остаётся прямым. Иначе торец шириной в штрих, срезанный
# с двух сторон, схлопывается в остриё, и буква теряет опору.

LETTERS = {
    # Э — зеркальная Е с гранёным плечом справа: вместо дуги две фаски.
    'Э': poly(13, [
        (0, 0, 'o'), (13, 0, 'o'), (13, 18, 'o'), (0, 18, 'o'),
        (0, 14, ''), (9, 14, 'i'), (9, 11, 'i'), (4, 11, ''),
        (4, 7, ''), (9, 7, 'i'), (9, 4, 'i'), (0, 4, ''),
    ]),
    # Л — вертикальная стойка с лапой, уходящей влево: тем и отличается от П.
    'Л': poly(15, [
        (0, 0, 'o'), (8, 0, ''), (8, 14, 'i'), (11, 14, 'i'),
        (11, 0, ''), (15, 0, 'o'), (15, 18, 'o'), (4, 18, 'o'),
        (4, 4, 'i'), (0, 4, ''),
    ]),
    'Е': poly(11, [
        (0, 0, 'o'), (11, 0, 'o'), (11, 4, ''), (4, 4, 'i'),
        (4, 7, 'i'), (11, 7, ''), (11, 11, ''), (4, 11, 'i'),
        (4, 14, 'i'), (11, 14, ''), (11, 18, 'o'), (0, 18, 'o'),
    ]),
    # М — три стойки под общей перекладиной; средняя сходится в остриё,
    # потому что два среза по 3 модуля на торце шириной 4 не помещаются и
    # ужимаются до 2 каждый, встречаясь ровно посередине.
    'М': poly(18, [
        (0, 0, 'o'), (4, 0, ''), (4, 14, 'i'), (7, 14, 'i'),
        (7, 0, 'o'), (11, 0, 'o'), (11, 14, 'i'), (14, 14, 'i'),
        (14, 0, ''), (18, 0, 'o'), (18, 18, 'o'), (0, 18, 'o'),
    ]),
    'Н': poly(12, [
        (0, 0, 'o'), (4, 0, ''), (4, 7, 'i'), (8, 7, 'i'),
        (8, 0, ''), (12, 0, 'o'), (12, 18, 'o'), (8, 18, ''),
        (8, 11, 'i'), (4, 11, 'i'), (4, 18, ''), (0, 18, 'o'),
    ]),
    'Т': poly(12, [
        (4, 0, ''), (8, 0, ''), (8, 14, 'i'), (12, 14, ''),
        (12, 18, 'o'), (0, 18, 'o'), (0, 14, ''), (4, 14, 'i'),
    ]),
}

WORD = 'ЭЛЕМЕНТ'


def move(pts, dx, dy=0.0):
    return [(x + dx, y + dy) for x, y in pts]


def bbox(cs):
    xs = [p[0] for c in cs for p in c]
    ys = [p[1] for c in cs for p in c]
    return min(xs), min(ys), max(xs), max(ys)


def rect(x0, y0, x1, y1):
    return [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]


# ─── набор ────────────────────────────────────────────────────────────────
#
# Промежуток модульный — 3 модуля, — но у Л лапа уходит влево внизу, а у Э и
# Т силуэт срезан по углам, и на глаз просветы разъезжаются. Поэтому к
# модульному промежутку добавлена оптическая поправка, и она тоже модульная:
# считается по площади просвета между соседями и округляется до половины
# модуля. Числа поправок печатаются при сборке и записаны в отчёте.

STEP = M / 8            # шаг сканирования по вертикали
DEPTH = 2 * M           # глубже половины штриха выемку не считаем


def _edge(pts, y, side):
    xs = []
    n = len(pts)
    for i in range(n):
        (xa, ya), (xb, yb) = pts[i], pts[(i + 1) % n]
        if (ya <= y < yb) or (yb <= y < ya):
            xs.append(xa + (xb - xa) * (y - ya) / (yb - ya))
    if not xs:
        return None
    return min(xs) if side == 'l' else max(xs)


def _recess(pts, side):
    x0, y0, x1, y1 = bbox([pts])
    edge = x0 if side == 'l' else x1
    rows = [y0 + i * STEP for i in range(int((y1 - y0) / STEP) + 1)]
    s = 0.0
    for y in rows:
        x = _edge(pts, y, side)
        s += DEPTH if x is None else min(DEPTH, (x - edge) if side == 'l' else (edge - x))
    return s * STEP / CAP          # приведено к единицам длины


def word(text=WORD):
    """Слово: модульный промежуток плюс оптическая поправка до половины модуля."""
    gs = [LETTERS[ch]['pts'] for ch in text]
    if len(gs) < 2:                      # одну букву набирать нечем
        b = bbox([gs[0]])
        return [move(gs[0], -b[0])], []
    rr = [_recess(g, 'r') for g in gs]
    rl = [_recess(g, 'l') for g in gs]
    pairs = [rr[i] + rl[i + 1] for i in range(len(gs) - 1)]
    goal = sorted(pairs)[len(pairs) // 2]
    fix, out, x = [], [], 0.0
    for i, ch in enumerate(text):
        b = bbox([gs[i]])
        out += [move(gs[i], x - b[0])]
        if i < len(text) - 1:
            d = round((goal - pairs[i]) / (M / 2)) * (M / 2)
            d = max(-M, min(M, d))
            fix.append(round(d / M, 2))
            x += (b[2] - b[0]) + GAP + d
    return out, fix


# ─── скоба и плашка ───────────────────────────────────────────────────────
#
# Скоба — один контур: вертикаль у левого края и два плеча вправо, закрыта
# слева, открыта справа. Наружные углы срезаны фаской c, внутренние — фаской
# c', и это не два независимых среза, а параллельный контур: толщина скобы
# остаётся постоянной по всей длине, включая углы.
#
# Концы плеч обрезаны ровно. Срезан у них только наружный угол — тот, что
# смотрит в поле плашки; со стороны букв угол прямой, как и у торцов букв.


def brace(bx, yb0, yb1, s, x_top, x_bot):
    return facet(
        [(bx, yb0), (x_bot, yb0), (x_bot, yb0 + s),
         (bx + s, yb0 + s), (bx + s, yb1 - s),
         (x_top, yb1 - s), (x_top, yb1), (bx, yb1)],
        ['o', 'o', '', 'i', 'i', '', 'o', 'o'])


def mark(text=WORD, cover_top=4, cover_bot=2, pad=8, gy=4, gx=5, frac=None):
    """Логотип целиком. Все размеры — в модулях.

    cover_top — сколько букв накрывает верхнее плечо;
    cover_bot — то же для нижнего;
    pad       — поле плашки, gy — просвет скобы над буквами, gx — отступ
                вертикали скобы от первой буквы.
    """
    gs, fix = word(text)
    ends = [bbox([g])[2] for g in gs]
    x0, y0, x1, y1 = bbox(gs)
    s = STEM
    bx = -(gx * M + s)
    yb0 = -gy * M - s
    yb1 = yb0 + CAP + 2 * gy * M + 2 * s
    if frac:                                  # компактная форма: доля буквы
        x_top, x_bot = frac[0] * x1, frac[1] * x1
    else:
        x_top = ends[min(cover_top, len(ends)) - 1]
        x_bot = ends[min(cover_bot, len(ends)) - 1]
    shape = brace(bx, yb0, yb1, s, x_top, x_bot)
    p = pad * M
    px0, py0 = bx - p, yb0 - p
    px1, py1 = max(x1, max(ends)) + p, yb1 + p
    return {
        'plate': facet(rect(px0, py0, px1, py1), ['o'] * 4),
        'shape': shape,
        'word': gs,
        'box': (px0, py0, px1, py1),
        'fix': fix,
    }


def compact(pad=6, gy=4, gx=5, frac=(0.62, 0.30), square=True):
    """Квадратная форма: та же плашка, та же скоба, одна буква Э.

    Плечи здесь мерятся долей ширины буквы, а не числом букв: накрыв Э
    целиком, скоба замыкается в рамку и перестаёт быть скобой.
    """
    m = mark('Э', pad=pad, gy=gy, gx=gx, frac=frac)
    if not square:
        return m
    x0, y0, x1, y1 = m['box']
    side = max(x1 - x0, y1 - y0)
    dx, dy = (side - (x1 - x0)) / 2, (side - (y1 - y0)) / 2
    m['plate'] = facet(rect(x0 - dx, y0 - dy, x1 + dx, y1 + dy), ['o'] * 4)
    m['box'] = (x0 - dx, y0 - dy, x1 + dx, y1 + dy)
    return m


# ─── сборка ───────────────────────────────────────────────────────────────
#
# Два варианта, и отличаются они заметно, а не на волос: у просторного поле
# плашки вдвое шире, просвет скобы вдвое больше, а скоба накрывает четыре
# буквы из семи против двух у тесного.

MARKS = [
    ('v1', dict(cover_top=4, cover_bot=2, pad=8, gy=4)),
    ('v2', dict(cover_top=2, cover_bot=1, pad=4, gy=2)),
]

# Форма под 16 px: буква крупнее, поле и просвет ужаты. Числа выведены из
# пиксельного бюджета — см. отчёт, — а не подобраны.
SMALL = dict(pad=2, gy=3, gx=3, frac=(0.62, 0.30))


def _d(cs, x0, y1):
    return ''.join('M' + 'L'.join(f'{round(p[0]-x0)} {round(y1-p[1])}' for p in c) + 'Z'
                   for c in cs)


def main():
    arts, paths = {}, {}

    def art(key, box, parts):
        x0, y0, x1, y1 = box
        arts[key] = {'w': round(x1 - x0), 'h': round(y1 - y0),
                     'cap': CAP, 'parts': parts}

    def shared(key, cs):
        b = bbox(cs)
        if key not in paths:
            paths[key] = _d(cs, b[0], b[3])
        return b

    fix = None
    for name, kw in MARKS:
        m = mark(**kw)
        fix = m['fix']
        x0, y0, x1, y1 = m['box']
        wb = shared('w', m['word'])
        art(name, m['box'], [
            {'d': _d([m['plate']], x0, y1), 'role': 'ink'},
            {'d': _d([m['shape']], x0, y1), 'role': 'bg'},
            {'ref': 'w', 'role': 'bg',
             'x': round(wb[0] - x0), 'y': round(y1 - wb[3])},
        ])
        c = compact(pad=max(kw['pad'] - 2, 4), gy=max(kw['gy'] - 1, 2))
        x0, y0, x1, y1 = c['box']
        eb = shared('e', c['word'])
        art(f'{name}-c', c['box'], [
            {'d': _d([c['plate']], x0, y1), 'role': 'ink'},
            {'d': _d([c['shape']], x0, y1), 'role': 'bg'},
            {'ref': 'e', 'role': 'bg',
             'x': round(eb[0] - x0), 'y': round(y1 - eb[3])},
        ])

    s16 = compact(**SMALL)
    x0, y0, x1, y1 = s16['box']
    eb = shared('e16', s16['word'])
    art('small', s16['box'], [
        {'d': _d([s16['plate']], x0, y1), 'role': 'ink'},
        {'d': _d([s16['shape']], x0, y1), 'role': 'bg'},
        {'ref': 'e16', 'role': 'bg',
         'x': round(eb[0] - x0), 'y': round(y1 - eb[3])},
    ])

    # Показы рисовки: семь букв в ряд, Э отдельно, построение по сетке.
    gs, _ = word()
    b = bbox(gs)
    art('alphabet', (b[0], b[1], b[2], b[3]),
        [{'d': _d(gs, b[0], b[3]), 'role': 'ink'}])
    for key, ch in (('letter-э', 'Э'), ('letter-м', 'М'), ('letter-н', 'Н')):
        g = [LETTERS[ch]['pts']]
        bb = bbox(g)
        art(key, bb, [{'d': _d(g, bb[0], bb[3]), 'role': 'ink'}])

    head = (
        '/* Файл собран scripts/build-marks.py — руками не править.\n\n'
        '   ГОТОВОГО ШРИФТА ЗДЕСЬ НЕТ: все семь букв нарисованы с нуля, каждая —\n'
        '   многоугольник из прямоугольников со срезанными углами. Ни одной\n'
        '   кривой: в файле нет ни одной команды, кроме M, L и Z.\n\n'
        f'   Модуль {M} единиц. Высота прописных {CAP} = 18 модулей, толщина штриха\n'
        f'   {STEM} = 4, просвет {GAP} = 3, наружная фаска {CHAMFER} = 3.\n'
        f'   Внутренняя фаска {CHAMFER_IN:.1f} = {CHAMFER_IN/M:.3f} модуля — не отдельное\n'
        '   число, а параллельный контур: c − (2 − √2)·s.\n\n'
        f'   Оптические поправки к модульному промежутку, в модулях: {json.dumps(fix)}.\n\n'
        '   Пересобрать:  python3 scripts/build-marks.py\n*/\n\n'
    )
    body = (
        '/** Роль краски в палитре: фон и основная. */\n'
        "export type Role = 'bg' | 'ink';\n\n"
        '/** Кусок композиции: свой контур или ссылка на общий. */\n'
        'export type Part = { d?: string; ref?: string; x?: number; y?: number; role: Role };\n\n'
        '/** Композиция: коробка в единицах и куски по порядку отрисовки. */\n'
        'export type Art = { w: number; h: number; cap: number; parts: Part[] };\n\n'
        'export const METRICS = {\n'
        f'  module: {M}, cap: {CAP}, stem: {STEM}, gap: {GAP},\n'
        f'  chamfer: {CHAMFER}, chamferInner: {round(CHAMFER_IN, 1)},\n'
        '};\n\n'
        '/** Ширины букв в модулях. */\n'
        'export const WIDTHS: [string, number][] = '
        + json.dumps([[k, v['w'] // M] for k, v in LETTERS.items()], ensure_ascii=False)
        + ';\n\n'
        '/** Общие контуры: слово и буква Э объявлены по разу. */\n'
        f'export const PATHS: Record<string, string> = {json.dumps(paths, ensure_ascii=False)};\n\n'
        f'export const ART: Record<string, Art> = {json.dumps(arts, ensure_ascii=False)};\n'
    )
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write(head + body)
    print(f'{OUT}: композиций {len(arts)}, {os.path.getsize(OUT)} байт')
    print(f'  модуль {M}, прописные {CAP}, штрих {STEM}, фаска {CHAMFER}, '
          f'внутренняя {CHAMFER_IN:.1f} ({CHAMFER_IN/M:.3f} модуля)')
    print('  ширины букв, модулей:', {k: v['w'] // M for k, v in LETTERS.items()})
    print('  оптические поправки, модулей:', fix)
    for k in ('v1', 'v2'):
        a = arts[k]
        print(f'  {k}: {a["w"]}×{a["h"]}, отношение {a["w"]/a["h"]:.2f}')


if __name__ == '__main__':
    main()

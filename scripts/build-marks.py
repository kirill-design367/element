#!/usr/bin/env python3
"""Геометрия логотипа для служебной страницы /logo.

Слово набирается ГОТОВЫМ ШРИФТОМ — TT Octosquares Trial Expanded Black.
Буквы не перерисовываются и не правятся: контуры берутся из шрифта как есть,
руками правится только межбуквенный интервал. Гранёность даёт сам шрифт: у Э
срезано плечо, у Л и М скошены углы, и углы эти идут под 39, 40 и 65
градусами — под собственными углами гарнитуры, а не под 45.

Кривых в буквах нет вовсе, и это тоже свойство шрифта: все шесть глифов
слова нарисованы одними отрезками, перо отдаёт только moveTo, lineTo и
closePath.

Своя геометрия здесь ровно одна — скоба и плашка.

Пересобрать:  python3 scripts/build-marks.py
"""
import json
import math
import os

from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT = os.path.join(ROOT, 'assets/fonts/TT Octosquares Trial Expanded Black.ttf')
OUT = os.path.join(ROOT, 'lib/logo-art.ts')

_f = TTFont(FONT)
_cmap = _f.getBestCmap()
_gs = _f.getGlyphSet()
_hmtx = _f['hmtx']

UPEM = _f['head'].unitsPerEm          # 1000
CAP = _f['OS/2'].sCapHeight           # 700
XH = _f['OS/2'].sxHeight              # 510

# Штрих измерен по Н: горизонтальное сечение выше перекладины даёт 230.
STEM = 230

# Глубина фаски в углах скобы взята ИЗ ШРИФТА, а не назначена: у Э плечевая
# фаска уходит на 192 единицы по горизонтали, это же число берёт скоба.
#
# Ниже 0,586 штриха опускать её нельзя: внутренний срез угла — параллельный
# контур наружного и мельче ровно на сдвиг внутрь, c' = c − (2 − √2)·s, и при
# меньшей глубине он уходит в отрицательные числа, то есть внутреннего среза
# не получается вовсе, а толщина скобы в углу становится больше штриха.
CHAMFER = 192
CHAMFER_IN = CHAMFER - (2 - math.sqrt(2)) * STEM

WORD = 'ЭЛЕМЕНТ'


def glyph(ch):
    """Контуры знака как есть, в единицах шрифта, y вверх, базовая на нуле.

    Пен разбирающий: Е, М, Н и Т в этом шрифте составные и ссылаются на
    латинские E, M, H и T. Кривых нет — на всякий случай они всё же
    разбираются, чтобы буква с кривой не потерялась молча.
    """
    pen = DecomposingRecordingPen(_gs)
    _gs[_cmap[ord(ch)]].draw(pen)
    cs, cur = [], []
    for op, a in pen.value:
        if op == 'moveTo':
            cur = [a[0]]
        elif op == 'lineTo':
            cur.append(a[0])
        elif op == 'qCurveTo':
            pts = list(a)
            if pts[-1] is None:
                pts = pts[:-1] + [((pts[0][0] + pts[-2][0]) / 2, (pts[0][1] + pts[-2][1]) / 2)]
            prev = cur[-1]
            for i in range(len(pts) - 1):
                c0 = pts[i]
                nxt = pts[i + 1] if i + 1 == len(pts) - 1 else \
                    ((c0[0] + pts[i + 1][0]) / 2, (c0[1] + pts[i + 1][1]) / 2)
                n = 12
                cur += [((1 - t) ** 2 * prev[0] + 2 * (1 - t) * t * c0[0] + t * t * nxt[0],
                         (1 - t) ** 2 * prev[1] + 2 * (1 - t) * t * c0[1] + t * t * nxt[1])
                        for t in (k / n for k in range(1, n + 1))]
                prev = nxt
        elif op == 'curveTo':
            p0, (p1, p2, p3) = cur[-1], a
            n = 16
            cur += [((1 - t) ** 3 * p0[0] + 3 * (1 - t) ** 2 * t * p1[0]
                     + 3 * (1 - t) * t * t * p2[0] + t ** 3 * p3[0],
                     (1 - t) ** 3 * p0[1] + 3 * (1 - t) ** 2 * t * p1[1]
                     + 3 * (1 - t) * t * t * p2[1] + t ** 3 * p3[1])
                    for t in (k / n for k in range(1, n + 1))]
        elif op == 'closePath' and cur:
            cs.append(cur)
            cur = []
    if cur:
        cs.append(cur)
    return cs


def bbox(cs):
    xs = [p[0] for c in cs for p in c]
    ys = [p[1] for c in cs for p in c]
    return min(xs), min(ys), max(xs), max(ys)


def move(cs, dx, dy=0.0):
    return [[(x + dx, y + dy) for x, y in c] for c in cs]


def rect(x0, y0, x1, y1):
    return [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]


# ─── набор ────────────────────────────────────────────────────────────────
#
# Единственное, что правится в буквах, — расстояние между ними. Метрики
# шрифта не используются: у каждого знака с каждой стороны считается площадь
# выемки (насколько контур отступает внутрь от собственной крайней кромки на
# каждой высоте), и пары ставятся так, чтобы сумма двух выемок плюс
# расстояние между рамками была одинаковой у всех. Гранёная Э и косая Л от
# этого подтягиваются к соседям, прямая Н отодвигается.

STEP = 10                 # шаг сканирования по вертикали
DEPTH = 0.30 * CAP        # глубже этой доли выемку не считаем


def _profile(cs, rows):
    left, right = {}, {}
    for c in cs:
        n = len(c)
        for i in range(n):
            (xa, ya), (xb, yb) = c[i], c[(i + 1) % n]
            if ya == yb:
                continue
            lo, hi = (ya, yb) if ya < yb else (yb, ya)
            k = int(math.ceil(lo / STEP))
            while k * STEP < hi:
                y = k * STEP
                x = xa + (xb - xa) * (y - ya) / (yb - ya)
                left[y] = x if y not in left else min(left[y], x)
                right[y] = x if y not in right else max(right[y], x)
                k += 1
    return left, right


def place(gs, track=0.0):
    """Расставить знаки, выровняв оптическую площадь просвета.

    track — разрядка: добавляется к каждому просвету поровну, в единицах.
    """
    boxes = [bbox(g) for g in gs]
    y0, y1 = min(b[1] for b in boxes), max(b[3] for b in boxes)
    rows = [y0 + i * STEP for i in range(int((y1 - y0) / STEP) + 1)]
    band = len(rows) * STEP

    def recess(g, box, side):
        left, right = _profile(g, rows)
        edge = box[0] if side == 'l' else box[2]
        s = 0.0
        for y in rows:
            x = (left if side == 'l' else right).get(y)
            s += DEPTH if x is None else min(DEPTH, (x - edge) if side == 'l' else (edge - x))
        return s * STEP

    if len(gs) < 2:
        return [-boxes[0][0]], []
    rl = [recess(g, b, 'l') for g, b in zip(gs, boxes)]
    rr = [recess(g, b, 'r') for g, b in zip(gs, boxes)]
    advs = [_hmtx[_cmap[ord(ch)]][0] for ch in WORD]
    seps0 = [advs[i] - boxes[i][2] + boxes[i + 1][0] for i in range(len(gs) - 1)]
    totals = [seps0[i] * band + rr[i] + rl[i + 1] for i in range(len(seps0))]
    goal = sorted(totals)[len(totals) // 2]
    seps = [(goal - rr[i] - rl[i + 1]) / band + track for i in range(len(seps0))]
    xs, x = [], 0.0
    for i, b in enumerate(boxes):
        xs.append(x - b[0])
        if i < len(gs) - 1:
            x += (b[2] - b[0]) + seps[i]
    return xs, [round(seps[i] - seps0[i], 1) for i in range(len(seps))]


def word(track=0.0):
    gs = [glyph(ch) for ch in WORD]
    xs, fix = place(gs, track)
    out, ends = [], []
    for g, x in zip(gs, xs):
        m = move(g, x)
        out += m
        ends.append(bbox(m)[2])
    b = bbox(out)
    return move(out, -b[0]), [e - b[0] for e in ends], fix


# ─── скоба ────────────────────────────────────────────────────────────────
#
# Вертикальный штрих у левого края и два горизонтальных плеча вправо. Углы,
# где вертикаль встречается с плечами, срезаны под 45° снаружи и изнутри:
# внутренний срез — параллельный контур наружного, поэтому толщина скобы в
# углу остаётся равной штриху.
#
# Конец плеча — плоский вертикальный торец. Срезаны только два его угла,
# верхний и нижний, короткой фаской: длинных скосов и клиньев здесь нет,
# плоская часть занимает бо́льшую часть высоты торца.


def facet(pts, legs):
    """Срезать углы под 45°: у каждой вершины свой катет, ноль — не резать."""
    n = len(pts)
    legs = list(legs)
    for _ in range(4):
        for i in range(n):
            j = (i + 1) % n
            L = math.dist(pts[i], pts[j])
            t = legs[i] + legs[j]
            if t > L + 1e-9:
                k = L / t
                legs[i] *= k
                legs[j] *= k
    out = []
    for i in range(n):
        p, a, b = pts[i], pts[i - 1], pts[(i + 1) % n]
        if legs[i] < 1e-9:
            out.append(p)
            continue
        for q in (a, b):
            d = math.dist(p, q)
            out.append((p[0] + (q[0] - p[0]) * legs[i] / d,
                        p[1] + (q[1] - p[1]) * legs[i] / d))
    res = [out[0]]
    for p in out[1:]:
        if math.dist(p, res[-1]) > 1e-9:
            res.append(p)
    if math.dist(res[0], res[-1]) < 1e-9:
        res.pop()
    return res


def brace(bx, yb0, yb1, s, x_top, x_bot, end):
    c, ci = CHAMFER, max(CHAMFER_IN, 0.0)
    return facet(
        [(bx, yb0), (x_bot, yb0), (x_bot, yb0 + s),
         (bx + s, yb0 + s), (bx + s, yb1 - s),
         (x_top, yb1 - s), (x_top, yb1), (bx, yb1)],
        [c, end, end, ci, ci, end, end, c])


def mark(cover_top=4, cover_bot=2, track=0.0, pad=0.40, gy=0.22, gx=0.30,
         end=0.15, plate=True):
    """Логотип целиком. Доли — от высоты прописных, end — доля штриха."""
    w, ends, fix = word(track * CAP)
    x0, y0, x1, y1 = bbox(w)
    s = STEM
    bx = -(gx * CAP + s)
    yb0 = -gy * CAP - s
    yb1 = yb0 + CAP + 2 * gy * CAP + 2 * s
    shape = brace(bx, yb0, yb1, s,
                  ends[min(cover_top, len(ends)) - 1],
                  ends[min(cover_bot, len(ends)) - 1], end * s)
    p = pad * CAP
    sx0, sy0, sx1, sy1 = bbox([shape])
    if plate:
        box = (bx - p, yb0 - p, max(x1, sx1) + p, yb1 + p)
        pl = facet(rect(*box), [CHAMFER] * 4)
    else:
        box = (min(sx0, x0), min(sy0, y0), max(sx1, x1), max(sy1, y1))
        pl = None
    return {'plate': pl, 'shape': shape, 'word': w, 'box': box, 'fix': fix}


def compact(pad=0.28, gy=0.22, gx=0.30, end=0.15, frac=(0.62, 0.30), square=True):
    """Квадратная форма: та же плашка, та же скоба, одна буква Э."""
    g = glyph('Э')
    b = bbox(g)
    w = move(g, -b[0])
    x1 = bbox(w)[2]
    s = STEM
    bx = -(gx * CAP + s)
    yb0 = -gy * CAP - s
    yb1 = yb0 + CAP + 2 * gy * CAP + 2 * s
    shape = brace(bx, yb0, yb1, s, frac[0] * x1, frac[1] * x1, end * s)
    p = pad * CAP
    box = [bx - p, yb0 - p, x1 + p, yb1 + p]
    if square:
        side = max(box[2] - box[0], box[3] - box[1])
        dx, dy = (side - (box[2] - box[0])) / 2, (side - (box[3] - box[1])) / 2
        box = [box[0] - dx, box[1] - dy, box[2] + dx, box[3] + dy]
    return {'plate': facet(rect(*box), [CHAMFER] * 4), 'shape': shape,
            'word': w, 'box': tuple(box)}


# ─── вариации ─────────────────────────────────────────────────────────────
#
# Десять. Отличаются тремя вещами: длиной плеч, набором слова и глубиной
# фаски на торцах плеч.

MARKS = [
    ('o1',  dict()),
    ('o2',  dict(cover_top=1, cover_bot=1, gx=0.18)),
    ('o3',  dict(cover_top=6, cover_bot=5, gx=0.50)),
    ('o4',  dict(cover_top=3, cover_bot=3)),
    ('o5',  dict(cover_top=2, cover_bot=5)),
    ('o6',  dict(track=-0.05)),
    ('o7',  dict(track=0.10)),
    ('o8',  dict(pad=0.22, gy=0.14)),
    ('o9',  dict(end=0.08)),
    ('o10', dict(end=0.33)),
]

# Форма под 16 px: буква крупнее, поле и просвет ужаты.
SMALL = dict(pad=0.10, gy=0.14, gx=0.22, end=0.15)


def _d(cs, x0, y1):
    return ''.join('M' + 'L'.join(f'{round(p[0]-x0)} {round(y1-p[1])}' for p in c) + 'Z'
                   for c in cs)


def main():
    arts, paths, fixes = {}, {}, {}

    def art(key, box, parts):
        x0, y0, x1, y1 = box
        arts[key] = {'w': round(x1 - x0), 'h': round(y1 - y0),
                     'cap': CAP, 'parts': parts}

    def shared(key, cs):
        b = bbox(cs)
        if key not in paths:
            paths[key] = _d(cs, b[0], b[3])
        return b

    for name, kw in MARKS:
        track = kw.get('track', 0.0)
        wk = f'w{round(track * 100):+d}'
        for plate in (True, False):
            m = mark(plate=plate, **kw)
            fixes[name] = m['fix']
            x0, y0, x1, y1 = m['box']
            wb = shared(wk, m['word'])
            role = 'bg' if plate else 'ink'
            parts = []
            if m['plate']:
                parts.append({'d': _d([m['plate']], x0, y1), 'role': 'ink'})
            parts.append({'d': _d([m['shape']], x0, y1), 'role': role})
            parts.append({'ref': wk, 'role': role,
                          'x': round(wb[0] - x0), 'y': round(y1 - wb[3])})
            art(name if plate else f'{name}-n', m['box'], parts)

        c = compact(pad=min(kw.get('pad', 0.40) - 0.12, 0.28),
                    gy=kw.get('gy', 0.22), end=kw.get('end', 0.15))
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

    # Крупный показ конца плеча: кусок плеча с торцом, три глубины фаски.
    # Строится тем же facet(), что и сама скоба, — чтобы показ не разошёлся
    # с геометрией.
    for key, end in (('end-08', 0.08), ('end-15', 0.15), ('end-33', 0.33)):
        s = STEM
        e = end * s
        piece = facet(rect(0, 0, 2.6 * s, s), [0, e, e, 0])
        b = (0.0, -0.28 * s, 2.6 * s + 0.5 * s, s + 0.28 * s)
        art(key, b, [{'d': _d([piece], b[0], b[3]), 'role': 'ink'}])

    head = (
        '/* Файл собран scripts/build-marks.py — руками не править.\n\n'
        '   Слово набрано ГОТОВЫМ ШРИФТОМ TT Octosquares Trial Expanded Black.\n'
        '   Буквы не перерисованы и не правлены: контуры взяты как есть, руками\n'
        '   правится только межбуквенный интервал. Гранёность даёт сам шрифт —\n'
        '   у Э срезано плечо, у Л и М скошены углы, под 39, 40 и 65 градусами.\n\n'
        f'   Единицы шрифта при upem {UPEM}. Высота прописных {CAP}, строчных {XH},\n'
        f'   штрих {STEM} измерен по Н. Фаска скобы {CHAMFER} — размах плечевой\n'
        f'   фаски Э по горизонтали; внутренняя {CHAMFER_IN:.1f} = c − (2 − √2)·s.\n\n'
        f'   Поправки набора к метрикам шрифта: {json.dumps(fixes["o1"])}.\n\n'
        '   Пересобрать:  python3 scripts/build-marks.py\n*/\n\n'
    )
    body = (
        '/** Роль краски в палитре: фон и основная. */\n'
        "export type Role = 'bg' | 'ink';\n\n"
        '/** Кусок композиции: свой контур или ссылка на общий. */\n'
        'export type Part = { d?: string; ref?: string; x?: number; y?: number; role: Role };\n\n'
        '/** Композиция: коробка в единицах шрифта и куски по порядку отрисовки. */\n'
        'export type Art = { w: number; h: number; cap: number; parts: Part[] };\n\n'
        'export const METRICS = {\n'
        f'  upem: {UPEM}, cap: {CAP}, xh: {XH}, stem: {STEM},\n'
        f'  chamfer: {CHAMFER}, chamferInner: {round(CHAMFER_IN, 1)},\n'
        '};\n\n'
        f'export const PATHS: Record<string, string> = {json.dumps(paths, ensure_ascii=False)};\n\n'
        f'export const ART: Record<string, Art> = {json.dumps(arts, ensure_ascii=False)};\n'
    )
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write(head + body)
    print(f'{OUT}: композиций {len(arts)}, {os.path.getsize(OUT)} байт')
    print(f'  прописные {CAP}, штрих {STEM}, фаска {CHAMFER}, внутренняя {CHAMFER_IN:.1f}')
    print('  поправки набора (o1):', fixes['o1'])
    for k in ('o1', 'o2', 'o3'):
        a = arts[k]
        print(f'  {k}: {a["w"]}×{a["h"]}, отношение {a["w"]/a["h"]:.2f}')


if __name__ == '__main__':
    main()

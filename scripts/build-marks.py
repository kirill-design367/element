#!/usr/bin/env python3
"""Геометрия логотипа для служебной страницы /logo.

Устройство одно: тёмная плашка, внутри слева светлая скоба из вертикали и
двух плеч, слово вывороткой того же веса выходит вправо за открытый конец
скобы.

Всё в единицах шрифта при upem 1000; высота прописных 680 и высота
строчных 495 — из таблицы OS/2, ни одно число не подобрано на глаз.

Межбуквенные интервалы не метрические: они выровнены по ОПТИЧЕСКОЙ ПЛОЩАДИ
просвета между соседями, см. place().

Пересобрать:  python3 scripts/build-marks.py
"""
import json
import math
import os

from fontTools.pens.recordingPen import RecordingPen
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT = os.path.join(ROOT, 'assets/fonts/CoFoSans-Black-Trial.otf')
OUT = os.path.join(ROOT, 'app/logo/art.ts')

_f = TTFont(FONT)
UPEM = _f['head'].unitsPerEm       # 1000
CAP = _f['OS/2'].sCapHeight        # 680
XH = _f['OS/2'].sxHeight           # 495
_cmap = _f.getBestCmap()
_gs = _f.getGlyphSet()
_hmtx = _f['hmtx']

STEM = 176        # ширина штриха, измерена по Н
TOL = 3.5         # допуск разбиения кривых; при высоте прописных 104 px это 0,5 px
PHI = (1 + 5 ** 0.5) / 2


def _cubic(p0, p1, p2, p3):
    n = max(2, min(64, int(math.sqrt(
        sum(math.dist(a, b) for a, b in zip((p0, p1, p2), (p1, p2, p3))) / TOL)) + 2))
    return [((1-t)**3*p0[0] + 3*(1-t)**2*t*p1[0] + 3*(1-t)*t*t*p2[0] + t**3*p3[0],
             (1-t)**3*p0[1] + 3*(1-t)**2*t*p1[1] + 3*(1-t)*t*t*p2[1] + t**3*p3[1])
            for t in (i / n for i in range(1, n + 1))]


def glyph(ch):
    """Контуры знака в единицах шрифта, y вверх, базовая на нуле."""
    pen = RecordingPen()
    _gs[_cmap[ord(ch)]].draw(pen)
    out, cur = [], []
    for op, args in pen.value:
        if op == 'moveTo':
            if cur:
                out.append(cur)
            cur = [args[0]]
        elif op == 'lineTo':
            cur.append(args[0])
        elif op == 'curveTo':
            cur += _cubic(cur[-1], *args)
        elif op == 'closePath':
            if cur:
                out.append(cur)
            cur = []
    if cur:
        out.append(cur)
    return out


def bbox(cs):
    xs = [p[0] for c in cs for p in c]
    ys = [p[1] for c in cs for p in c]
    return (min(xs), min(ys), max(xs), max(ys))


def move(cs, dx=0.0, dy=0.0):
    return [[(x + dx, y + dy) for x, y in c] for c in cs]


# ─── оптический набор ─────────────────────────────────────────────────────

STEP = 8            # шаг сканирования по вертикали, единиц шрифта
DEPTH = 0.30        # глубже этой доли высоты прописных выемка не считается


def _profile(cs, rows):
    """Силуэт знака: на каждой высоте крайняя левая и крайняя правая точка."""
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


def place(gs, advs, target=None):
    """Расставить готовые контуры, выровняв ОПТИЧЕСКУЮ ПЛОЩАДЬ просвета.

    Классический приём, а не расстояние между рамками. У каждого знака с
    каждой стороны считается площадь выемки: насколько его контур отступает
    внутрь от собственной крайней кромки, на каждой высоте; глубже DEPTH не
    считаем. Просвет пары — сумма двух выемок плюс расстояние между рамками
    на всю высоту полосы. Пары ставятся так, чтобы сумма была одинаковой:
    круглая Э и косая Л подтягиваются, прямая Н отодвигается.
    """
    boxes = [bbox(g) for g in gs]
    y0, y1 = min(b[1] for b in boxes), max(b[3] for b in boxes)
    rows = [y0 + i * STEP for i in range(int((y1 - y0) / STEP) + 1)]
    band = len(rows) * STEP
    depth = DEPTH * CAP

    def recess(g, box, side):
        left, right = _profile(g, rows)
        edge = box[0] if side == 'l' else box[2]
        s = 0.0
        for y in rows:
            x = (left if side == 'l' else right).get(y)
            if x is None:
                s += depth
            else:
                s += min(depth, x - edge if side == 'l' else edge - x)
        return s * STEP

    rl = [recess(g, b, 'l') for g, b in zip(gs, boxes)]
    rr = [recess(g, b, 'r') for g, b in zip(gs, boxes)]
    if len(gs) < 2:                      # один знак набирать нечем
        return [-boxes[0][0]], [], target or 0.0
    seps0 = [advs[i] - boxes[i][2] + boxes[i + 1][0] for i in range(len(gs) - 1)]
    totals = [seps0[i] * band + rr[i] + rl[i + 1] for i in range(len(seps0))]
    goal = target if target is not None else sorted(totals)[len(totals) // 2]
    seps = [(goal - rr[i] - rl[i + 1]) / band for i in range(len(seps0))]

    xs, x = [], 0.0
    for i, b in enumerate(boxes):
        xs.append(x - b[0])
        if i < len(gs) - 1:
            x += (b[2] - b[0]) + seps[i]
    deltas = [round(seps[i] - seps0[i], 1) for i in range(len(seps))]
    return xs, deltas, goal


def optical(text, target=None):
    gs = [glyph(ch) for ch in text]
    advs = [_hmtx[_cmap[ord(ch)]][0] for ch in text]
    xs, deltas, goal = place(gs, advs, target)
    return gs, xs, deltas, goal


def word(text, target=None):
    """Слово, набранное по оптике; левый край и базовая линия в нуле."""
    gs, xs, deltas, goal = optical(text, target)
    out = []
    for g, x in zip(gs, xs):
        out += move(g, x)
    return out, deltas


def rect(x0, y0, x1, y1):
    """Прямоугольник против часовой при y вверх — как внешние контуры глифов."""
    return [[(x0, y0), (x1, y0), (x1, y1), (x0, y1)]]


# ─── устройство: слово в плашке со скобой ─────────────────────────────────
#
# Тёмный прямоугольник, внутри слева светлая скоба: вертикаль у левого края
# и два плеча вправо. Скоба закрыта слева, открыта справа; концы плеч
# обрезаны ровно, загибов и утолщений нет — их неоткуда взять, фигура
# собрана из отрезков. Верхний левый и нижний левый углы скобы срезаны той
# же фаской, что и у буквы Э.
#
# Слово того же веса, что штрих скобы, выходит вправо за открытый конец.


def brace(bx, yb0, yb1, s, x_top, x_bot):
    """Скоба одним контуром: вертикаль и два плеча, обход против часовой.

    x_top и x_bot — координаты, ДО которых доходят плечи, а не их длины:
    плечо задаётся тем, сколько слова оно накрывает, и мерить его от
    внешнего края вертикали нельзя — в компактной форме нижнее плечо тогда
    оказывается короче самой вертикали и пропадает.
    """
    return [[
        (bx, yb0), (x_bot, yb0), (x_bot, yb0 + s),
        (bx + s, yb0 + s), (bx + s, yb1 - s),
        (x_top, yb1 - s), (x_top, yb1), (bx, yb1),
    ]]


def mark(text, arm_top=0.62, arm_bot=0.30, sb=1.0,
         pad=0.42, gy=0.22, gx=0.30):
    """Логотип целиком. Все размеры — доли высоты прописных.

    arm_top  — какую долю слова накрывает верхнее плечо;
    arm_bot  — то же для нижнего;
    sb       — вес штриха скобы к штриху буквы (STEM);
    pad      — поле плашки вокруг композиции;
    gy       — просвет скобы над буквами и под ними;
    gx       — отступ вертикали скобы от первой буквы.
    """
    gs, xs, deltas, _ = optical(text)
    w = []
    for g, x in zip(gs, xs):
        w += move(g, x)
    x0, y0, x1, y1 = bbox(w)
    ww = x1 - x0
    wx = -x0
    w = move(w, wx)

    s = sb * STEM
    bx = -(gx * CAP + s)                       # вертикаль скобы левее слова
    yb0 = -gy * CAP - s
    yb1 = yb0 + CAP + 2 * gy * CAP + 2 * s
    shape = brace(bx, yb0, yb1, s, arm_top * ww, arm_bot * ww)

    p = pad * CAP
    px0, py0 = bx - p, yb0 - p
    px1 = max(ww, arm_top * ww, arm_bot * ww) + p
    py1 = yb1 + p
    return {
        'plate': rect(px0, py0, px1, py1),
        'shape': shape,
        'word': w,
        'box': (px0, py0, px1, py1),
        'deltas': deltas,
    }


# ─── сборка ───────────────────────────────────────────────────────────────

WORDS = {'caps': 'ЭЛЕМЕНТ', 'mixed': 'Элемент'}

# Восемь отрисовок. Отличаются пропорциями, не идеей: длина плеч (она же —
# сколько букв накрывает скоба), вес скобы, поля плашки и просвет. Глубина
# фаски войдёт сюда следующим коммитом.
MARKS = [
    ('l1', dict(arm_top=0.62, arm_bot=0.30, sb=1.00, pad=0.42, gy=0.22)),
    ('l2', dict(arm_top=0.62, arm_bot=0.30, sb=1.00, pad=0.42, gy=0.22)),
    ('l3', dict(arm_top=0.62, arm_bot=0.30, sb=1.00, pad=0.42, gy=0.22)),
    ('l4', dict(arm_top=0.44, arm_bot=0.44, sb=1.00, pad=0.42, gy=0.22)),
    ('l5', dict(arm_top=0.30, arm_bot=0.62, sb=1.00, pad=0.42, gy=0.22)),
    ('l6', dict(arm_top=0.28, arm_bot=0.14, sb=1.00, pad=0.42, gy=0.22)),
    ('l7', dict(arm_top=0.62, arm_bot=0.30, sb=0.86, pad=0.42, gy=0.22)),
    ('l8', dict(arm_top=0.62, arm_bot=0.30, sb=1.14, pad=0.24, gy=0.14)),
]

def _d(cs, x0, y1):
    return ''.join('M' + 'L'.join(f'{round(p[0]-x0)} {round(y1-p[1])}' for p in c) + 'Z'
                   for c in cs)


def main():
    arts, paths, corr = {}, {}, {}

    def art(key, box, parts):
        x0, y0, x1, y1 = box
        arts[key] = {'w': round(x1 - x0), 'h': round(y1 - y0),
                     'cap': CAP, 'parts': parts}

    def shared(key, cs):
        """Общий контур объявляется по разу: слово при одной глубине фаски у
        всех отрисовок одно и то же, и дублировать его в разметке незачем."""
        b = bbox(cs)
        if key not in paths:
            paths[key] = _d(cs, b[0], b[3])
        return b

    for name, kw in MARKS:
        for key, text in WORDS.items():
            m = mark(text, **kw)
            x0, y0, x1, y1 = m['box']
            corr[f'{name}-{key}'] = m['deltas']
            wk = f'w-{key}'
            wb = shared(wk, m['word'])
            art(f'{name}-{key}', m['box'], [
                {'d': _d(m['plate'], x0, y1), 'role': 'ink'},
                {'d': _d(m['shape'], x0, y1), 'role': 'bg'},
                {'ref': wk, 'role': 'bg',
                 'x': round(wb[0] - x0), 'y': round(y1 - wb[3])},
            ])

    head = (
        '/* Файл собран scripts/build-marks.py — руками не править.\n\n'
        '   Контуры вынуты из assets/fonts/CoFoSans-Black-Trial.otf. Набор НЕ\n'
        '   метрический: межбуквенные интервалы выровнены по оптической площади\n'
        '   просвета, см. place() в скрипте. Поправки к метрике шрифта в единицах\n'
        f'   шрифта: {json.dumps(corr["l1-caps"], ensure_ascii=False)} для ЭЛЕМЕНТ и\n'
        f'   {json.dumps(corr["l1-mixed"], ensure_ascii=False)} для Элемент.\n\n'
        f'   Единицы — единицы шрифта при upem 1000. Высота прописных {CAP} и высота\n'
        f'   строчных {XH} из таблицы OS/2, ширина штриха {STEM} измерена по Н. Кривые\n'
        f'   разбиты с допуском {TOL} единицы и округлены до целых.\n\n'
        '   Пересобрать:  python3 scripts/build-marks.py\n*/\n\n'
    )
    body = (
        '/** Роль краски в палитре: фон, основная, акцентная. */\n'
        "export type Role = 'bg' | 'ink' | 'accent';\n\n"
        '/** Кусок композиции: свой контур или ссылка на общий. */\n'
        'export type Part = { d?: string; ref?: string; x?: number; y?: number; role: Role };\n\n'
        '/** Композиция: коробка в единицах шрифта и куски по порядку отрисовки. */\n'
        'export type Art = { w: number; h: number; cap: number; parts: Part[] };\n\n'
        f'export const METRICS = {{ upem: {UPEM}, cap: {CAP}, xh: {XH}, stem: {STEM} }};\n\n'
        '/** Общие контуры: слово объявляется по разу. */\n'
        f'export const PATHS: Record<string, string> = {json.dumps(paths, ensure_ascii=False)};\n\n'
        f'export const ART: Record<string, Art> = {json.dumps(arts, ensure_ascii=False)};\n'
    )
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write(head + body)
    print(f'{OUT}: композиций {len(arts)}, {os.path.getsize(OUT)} байт')
    for k in ('l1-caps', 'l1-mixed'):
        if k in arts:
            a = arts[k]
            print(f'  {k}: {a["w"]}×{a["h"]}, отношение {a["w"]/a["h"]:.2f}')
    print('  поправки набора:', json.dumps(corr['l1-caps'], ensure_ascii=False))


if __name__ == '__main__':
    main()

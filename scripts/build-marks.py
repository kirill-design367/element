#!/usr/bin/env python3
"""Геометрия логотипа для служебной страницы /logo.

Устройство одно: тёмная плашка, внутри слева светлая скоба из вертикали и
двух плеч, слово вывороткой того же веса выходит вправо за открытый конец
скобы. Верхние левые и нижние левые углы скобы и буквы Э срезаны одной и
той же фаской под 45°.

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


# ─── сборка ───────────────────────────────────────────────────────────────
#
# Три прошлых направления убраны целиком: насыпь из слоёв, силуэт слова и
# лок-апы на знаке «Скол». Направление выбрано, устройство одно, и строится
# оно следующим коммитом. Здесь остаются метрики шрифта и оптический набор —
# они не зависят от того, что именно из слова собирают.


def main():
    print('геометрия ещё не собрана: устройство строится следующим коммитом')


if __name__ == '__main__':
    main()

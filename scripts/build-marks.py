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
OUT = os.path.join(ROOT, 'app/logo/art.ts')

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


# ─── сборка ───────────────────────────────────────────────────────────────
#
# Пока собирается одно: слово, набранное по оптике. Скоба, плашка и вариации
# приходят следующим коммитом.


def _d(cs, x0, y1):
    return ''.join('M' + 'L'.join(f'{round(p[0]-x0)} {round(y1-p[1])}' for p in c) + 'Z'
                   for c in cs)


def main():
    arts, paths = {}, {}
    w, ends, fix = word()
    b = bbox(w)
    paths['w+0'] = _d(w, b[0], b[3])
    arts['word'] = {'w': round(b[2] - b[0]), 'h': round(b[3] - b[1]), 'cap': CAP,
                    'parts': [{'ref': 'w+0', 'role': 'ink'}]}
    head = (
        '/* Файл собран scripts/build-marks.py — руками не править.\n\n'
        '   Слово набрано ГОТОВЫМ ШРИФТОМ TT Octosquares Trial Expanded Black.\n'
        '   Буквы не перерисованы и не правлены: контуры взяты как есть, руками\n'
        '   правится только межбуквенный интервал.\n\n'
        f'   Единицы шрифта при upem {UPEM}. Высота прописных {CAP}, строчных {XH},\n'
        f'   штрих {STEM} измерен по Н.\n\n'
        f'   Поправки набора к метрикам шрифта: {json.dumps(fix)}.\n\n'
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
    print(f'  прописные {CAP}, штрих {STEM}')
    print('  поправки набора:', fix)


if __name__ == '__main__':
    main()

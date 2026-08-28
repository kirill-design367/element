#!/usr/bin/env python3
"""Геометрия логотипов для служебной страницы /logo.

Кривые нужны не всем вариантам, и это принципиально: где слово просто стоит
рядом со знаком, оно остаётся живым текстом в CoFo Sans Black — тем же, что
набирает шапку сайта. Контуры вынимаются только там, где буквы правятся или
выворачиваются из плашки: иначе разметка страницы выбора распухает впустую.

Всё считается в единицах шрифта при upem 1000. Высота прописных 680 и высота
строчных 495 взяты из таблицы OS/2, ни одно число не подобрано на глаз.

Пересобрать:  python3 scripts/build-logos.py
"""
import json
import math
import os

from fontTools.pens.recordingPen import RecordingPen
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT = os.path.join(ROOT, 'assets/fonts/CoFoSans-Black-Trial.otf')
OUT = os.path.join(ROOT, 'app/logo/logos.ts')

_f = TTFont(FONT)
UPEM = _f['head'].unitsPerEm
CAP = _f['OS/2'].sCapHeight          # 680
XH = _f['OS/2'].sxHeight             # 495
_cmap = _f.getBestCmap()
_gs = _f.getGlyphSet()
_hmtx = _f['hmtx']

TRACKING = -0.02      # трекинг шапки сайта, tracking-[-.02em]
# Допуск разбиения кривых. Самый крупный показ на странице — высота прописных
# 104 px, то есть единица шрифта это 0,15 px: 3,5 единицы дают 0,5 px и вдвое
# укорачивают путь против прежних двух единиц.
TOL = 3.5
STEM = 176            # ширина штриха Н в этом начертании, 0,259 высоты прописных


# ─── шрифт ────────────────────────────────────────────────────────────────

def _kern():
    """Пары кернинга из GPOS. У CoFo Sans они спрятаны под ExtensionPos."""
    out, gpos, lookups = {}, _f['GPOS'].table, []
    for fr in gpos.FeatureList.FeatureRecord:
        if fr.FeatureTag == 'kern':
            lookups += fr.Feature.LookupListIndex
    for li in set(lookups):
        for st in (s.ExtSubTable if s.__class__.__name__ == 'ExtensionPos' else s
                   for s in gpos.LookupList.Lookup[li].SubTable):
            fmt = getattr(st, 'Format', None)
            if fmt == 1 and hasattr(st, 'PairSet'):
                for first, ps in zip(st.Coverage.glyphs, st.PairSet):
                    for r in ps.PairValueRecord:
                        v = getattr(r.Value1, 'XAdvance', 0) if r.Value1 else 0
                        if v:
                            out[(first, r.SecondGlyph)] = v
            elif fmt == 2:
                c1, c2 = st.ClassDef1.classDefs, st.ClassDef2.classDefs
                for g1 in st.Coverage.glyphs:
                    k1 = c1.get(g1, 0)
                    for g2 in set(c2) | set(st.Coverage.glyphs):
                        try:
                            rec = st.Class1Record[k1].Class2Record[c2.get(g2, 0)]
                        except IndexError:
                            continue
                        v = getattr(rec.Value1, 'XAdvance', 0) if rec.Value1 else 0
                        if v:
                            out[(g1, g2)] = v
    return out


KERN = _kern()


def _cubic(p0, p1, p2, p3):
    n = max(2, min(64, int(math.sqrt(
        sum(math.dist(a, b) for a, b in zip((p0, p1, p2), (p1, p2, p3))) / TOL)) + 2))
    return [((1-t)**3*p0[0] + 3*(1-t)**2*t*p1[0] + 3*(1-t)*t*t*p2[0] + t**3*p3[0],
             (1-t)**3*p0[1] + 3*(1-t)**2*t*p1[1] + 3*(1-t)*t*t*p2[1] + t**3*p3[1])
            for t in (i / n for i in range(1, n + 1))]


def glyph(ch):
    """Контуры знака в единицах шрифта (y вверх, базовая на нуле) и его ширина."""
    name = _cmap[ord(ch)]
    pen = RecordingPen()
    _gs[name].draw(pen)
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
    return out, _hmtx[name][0], name


def word(text, tracking=TRACKING):
    """Слово целиком. Набор повторяет браузер: ширина, кернинг, потом трекинг.

    Проверено замером: чернильная ширина ЭЛЕМЕНТ при кегле 200 выходит
    975,6 px против 976 у браузера.
    """
    out, x, prev = [], 0.0, None
    track = tracking * UPEM
    for ch in text:
        cs, adv, name = glyph(ch)
        if prev is not None:
            x += KERN.get((prev, name), 0)
        out += [[(px + x, py) for px, py in c] for c in cs]
        x += adv + track
        prev = name
    return out


def bbox(cs):
    xs = [p[0] for c in cs for p in c]
    ys = [p[1] for c in cs for p in c]
    return (min(xs), min(ys), max(xs), max(ys))


def move(cs, dx, dy=0.0):
    return [[(x + dx, y + dy) for x, y in c] for c in cs]


# ─── операции по контуру ──────────────────────────────────────────────────

def clip(cs, a, b, c):
    """Оставить то, где a·x + b·y ≤ c. Одна секущая, Сатерленд—Ходжмен.

    Стык, если он появится, ложится ровно на линию среза — туда, где и должна
    проходить граница.
    """
    out = []
    for poly in cs:
        res, n = [], len(poly)
        for i in range(n):
            p, q = poly[i], poly[(i + 1) % n]
            dp = a * p[0] + b * p[1] - c
            dq = a * q[0] + b * q[1] - c
            if dp <= 0:
                res.append(p)
            if (dp < 0 < dq) or (dq < 0 < dp):
                t = dp / (dp - dq)
                res.append((p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])))
        if len(res) >= 3:
            out.append(res)
    return out


def rect(x0, y0, x1, y1):
    """Прямоугольник против часовой стрелки при y вверх: то же направление
    обхода, что у внешних контуров глифов. Для правила ненулевого счёта это
    условие — иначе наложение вычло бы фигуру вместо сложения."""
    return [[(x0, y0), (x1, y0), (x1, y1), (x0, y1)]]


# ─── вывод ────────────────────────────────────────────────────────────────

def art(cs, rule='evenodd'):
    """Контуры → путь SVG с плоской рамкой. Здесь же переворот y.

    cap — высота прописных внутри рамки: по ней логотип масштабируется к
    любому кеглю, в том числе к кеглю шапки.
    """
    x0, y0, x1, y1 = bbox(cs)
    parts = []
    for poly in cs:
        # Координаты округляются до целых единиц шрифта: при самом крупном
        # показе это 0,15 px, глазом не видно, а путь короче на шестую часть.
        parts.append('M' + 'L'.join(
            f'{round(p[0]-x0)} {round(y1-p[1])}' for p in poly) + 'Z')
    out = {'d': ''.join(parts), 'w': round(x1 - x0, 1), 'h': round(y1 - y0, 1),
           'cap': CAP, 'top': round(y1 - CAP, 1)}
    if rule != 'evenodd':
        out['rule'] = rule
    return out


# ─── варианты, которым нужны кривые ───────────────────────────────────────
#
# Все размеры — доли высоты прописных. Ни одного подобранного числа.


# ─── сборка ───────────────────────────────────────────────────────────────

WORDS = {'caps': 'ЭЛЕМЕНТ', 'mixed': 'Элемент'}

# Варианты, зависящие от набора слова.
BY_SET = {
}


# Формы, от набора не зависящие: монограммы и компактные формы контейнеров.
SOLO = {
}


def main():
    by_set = {k: {s: art(fn(t), rule) for s, t in WORDS.items()}
              for k, (fn, rule) in BY_SET.items()}
    solo = {k: art(fn()) for k, fn in SOLO.items()}
    ink = {}
    for t in ('ЭЛЕМЕНТ', 'Элемент', 'Э', 'ЛЕМЕНТ', 'лемент'):
        x0, y0, x1, y1 = bbox(word(t))
        ink[t] = {'w': round(x1 - x0, 1), 'h': round(y1 - y0, 1)}
    with open(OUT, 'w', encoding='utf-8') as fh:
        fh.write(f'''/* Файл собран scripts/build-logos.py — руками не править.

   Контуры букв вынуты из assets/fonts/CoFoSans-Black-Trial.otf: кернинг из
   GPOS, трекинг −0,02 em как в шапке. Кривые разбиты на отрезки с допуском
   {TOL} единицы шрифта. Здесь лежат ТОЛЬКО те варианты, где буквы правятся или
   выворачиваются из плашки: где слово просто стоит рядом со знаком, оно
   остаётся живым текстом и в этот файл не попадает.

   Единицы — единицы шрифта при upem {UPEM}. Высота прописных {CAP} и высота
   строчных {XH} взяты из таблицы OS/2, ширина штриха {STEM} измерена по Н.

   Пересобрать:  python3 scripts/build-logos.py
*/

/** Готовый путь с плоской рамкой. cap — высота прописных внутри рамки: по ней
 *  логотип масштабируется к любому кеглю, в том числе к кеглю шапки. */
export type Art = {{
  d: string;
  w: number;
  h: number;
  cap: number;
  /** Расстояние от верха рамки до линии прописных. */
  top: number;
  /** По умолчанию evenodd — выворотка. nonzero там, где фигуры складываются. */
  rule?: 'nonzero';
}};

/** Метрики гарнитуры, по которым всё построено. */
export const METRICS = {{
  upem: {UPEM},
  cap: {CAP},
  xHeight: {XH},
  stem: {STEM},
  tracking: {TRACKING},
}};

/** Чернильные рамки кусков слова в единицах шрифта. По ним считаются
 *  пропорции вариантов, где слово остаётся живым текстом: измерять в браузере
 *  ничего не нужно, набор и так повторяет его до десятой доли пикселя. */
export const INK: Record<string, {{ w: number; h: number }}> = {json.dumps(ink, ensure_ascii=False, separators=(",", ":"))};

/** Варианты, у которых форма зависит от набора слова. */
export const ART: Record<string, {{ caps: Art; mixed: Art }}> =
{json.dumps(by_set, ensure_ascii=False, separators=(',', ':'))};

/** Формы, от набора не зависящие: монограммы и компактные формы контейнеров. */
export const SOLO: Record<string, Art> =
{json.dumps(solo, ensure_ascii=False, separators=(',', ':'))};
''')
    total = sum(len(v[s]['d']) for v in by_set.values() for s in WORDS) + \
        sum(len(v['d']) for v in solo.values())
    print(f'путей {len(by_set)*2 + len(solo)}, байт путей {total}')
    for k, v in by_set.items():
        print(f"  {k:13} {v['caps']['w']:.0f}×{v['caps']['h']:.0f}  {len(v['caps']['d'])} б")
    for k, v in solo.items():
        print(f"  {k:13} {v['w']:.0f}×{v['h']:.0f}  {len(v['d'])} б")


if __name__ == '__main__':
    main()

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


def arc(cx, cy, r, a0, a1):
    """Дуга ломаной. Число шагов — из допуска: стрелка прогиба r·θ²/8 ≤ TOL."""
    span = abs(a1 - a0)
    n = max(4, int(span / (2 * math.sqrt(2 * TOL / r))) + 1)
    return [(cx + r * math.cos(a0 + (a1 - a0) * i / n),
             cy + r * math.sin(a0 + (a1 - a0) * i / n)) for i in range(n + 1)]


def pill(x0, y0, x1, y1):
    """Пилюля: радиус равен половине высоты, скругления — настоящие дуги."""
    r = (y1 - y0) / 2
    cy = (y0 + y1) / 2
    return [arc(x1 - r, cy, r, -math.pi / 2, math.pi / 2)
            + arc(x0 + r, cy, r, math.pi / 2, 3 * math.pi / 2)]


def slant(x0, y0, x1, y1):
    """Параллелограмм с рёбрами под 45°: сдвиг верха равен высоте."""
    d = y1 - y0
    return [[(x0, y0), (x1, y0), (x1 + d, y1), (x0 + d, y1)]]


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

SLOT = 0.14 * CAP          # 4. толщина сквозной прорези
SREZ = 0.42 * CAP          # 5. глубина среза блока по 45°
BASE = 0.22 * CAP          # 6. толщина сплошного основания
PAD_PILL = 0.80 * CAP      # 10. поле пилюли по горизонтали
PAD_V = 0.34 * CAP         # 10. поле пилюли по вертикали
PAD_SLANT = 0.26 * CAP     # 12. поле косой плашки по вертикали
CLEAR_SLANT = 0.30 * CAP   # 12. просвет от буквы до косого ребра
BADGE = 1.60 * CAP         # 7. диаметр круга монограммы
BADGE_FILL = 0.55          # 7. доля буквы в круге
TILE = 1.70 * CAP          # 9. сторона квадрата двухбуквенной монограммы
TILE_FILL = 0.78           # 9. доля пары букв по ширине квадрата


def prorez(text):
    """4. Сквозная горизонтальная щель через все буквы на середине прописных."""
    cs = word(text)
    lo, hi = CAP / 2 - SLOT / 2, CAP / 2 + SLOT / 2
    return clip(cs, 0, 1, lo) + clip(cs, 0, -1, -hi)


def srez(text):
    """5. Одна линия под 45° срезает верхний правый угол СЛОВА ЦЕЛИКОМ.

    Не по фаске на каждой букве: линия одна, и буквы попадают под неё
    настолько, насколько высовываются в угол блока.
    """
    cs = word(text)
    x1 = bbox(cs)[2]
    return clip(cs, 1, 1, x1 + CAP - SREZ)


def osnovanie(text):
    """6. Низ букв слит в сплошную полосу во всю ширину слова."""
    cs = word(text)
    x0, y0, x1, _ = bbox(cs)
    return cs + rect(x0, y0, x1, y0 + BASE)


def _fit(cs, height=None, width=None):
    x0, y0, x1, y1 = bbox(cs)
    s = height / (y1 - y0) if height else width / (x1 - x0)
    return [[((x - (x0 + x1) / 2) * s, (y - (y0 + y1) / 2) * s) for x, y in c] for c in cs]


def badge(letters=('Э',)):
    """7. Круг с буквой вывороткой. Буква — дырка, заливка одна."""
    r = BADGE / 2
    letter = _fit(word(''.join(letters)), height=BADGE * BADGE_FILL)
    return [arc(0, 0, r, 0, 2 * math.pi)] + letter


def tile():
    """9. Квадрат с двухбуквенной монограммой ЭЛ вывороткой."""
    h = TILE / 2
    letters = _fit(word('ЭЛ'), width=TILE * TILE_FILL)
    return rect(-h, -h, h, h) + letters


def _plated(cs, shape):
    """Слово вывороткой в плашке: одна заливка, буквы — дырки."""
    return shape + cs


def plate_pill(text):
    """10. Слово вывороткой в скруглённой пилюле."""
    cs = word(text)
    x0, _, x1, _ = bbox(cs)
    return _plated(cs, pill(x0 - PAD_PILL, -PAD_V, x1 + PAD_PILL, CAP + PAD_V))


def plate_tag(text):
    """11. Слово вывороткой в прямоугольнике. Поле равно ширине штриха."""
    cs = word(text)
    x0, _, x1, _ = bbox(cs)
    return _plated(cs, rect(x0 - STEM, -STEM, x1 + STEM, CAP + STEM))


def plate_slant(text):
    """12. Слово вывороткой в параллелограмме с рёбрами под 45°.

    Поле считается от косого ребра, а не от прямоугольной рамки: самая тесная
    точка слева — верх слова, справа — его низ.
    """
    cs = word(text)
    x0, _, x1, _ = bbox(cs)
    y0, y1 = -PAD_SLANT, CAP + PAD_SLANT
    # Просвет меряется на середине высоты слова: если мерить по самой тесной
    # точке, косое ребро уводит противоположный угол на целую высоту прописных
    # и плашка выходит с пустым треугольником в полслова.
    mid = CAP / 2 - y0
    bx0 = x0 - CLEAR_SLANT - mid
    bx1 = x1 + CLEAR_SLANT - mid
    return _plated(cs, slant(bx0, y0, bx1, y1))


# ─── сборка ───────────────────────────────────────────────────────────────

WORDS = {'caps': 'ЭЛЕМЕНТ', 'mixed': 'Элемент'}

# Варианты, зависящие от набора слова.
BY_SET = {
    'prorez': (prorez, 'evenodd'),                 # группа: чистый вордмарк
    'srez': (srez, 'evenodd'),                     # группа: чистый вордмарк
    'osnovanie': (osnovanie, 'nonzero'),           # группа: чистый вордмарк
    'plate-pill': (plate_pill, 'evenodd'),         # группа: слово в контейнере
    'plate-tag': (plate_tag, 'evenodd'),           # группа: слово в контейнере
    'plate-slant': (plate_slant, 'evenodd'),       # группа: слово в контейнере
}


def _e_in(shape):
    """Компактная форма контейнера: та же плашка под одну букву."""
    e = word('Э')
    x0, _, x1, _ = bbox(e)
    return _plated(e, shape(x0, x1))


# Формы, от набора не зависящие: монограммы и компактные формы контейнеров.
SOLO = {
    'badge-e': badge,                                                            # монограмма
    'tile-el': tile,                                                             # монограмма
    # У компактной формы поле по горизонтали своё: с полем целого слова пилюля
    # под одну букву выходит втрое шире нужного и перестаёт быть компактной.
    'pill-e': lambda: _e_in(lambda a, b: pill(a - PAD_V, -PAD_V, b + PAD_V, CAP + PAD_V)),  # контейнер
    'tag-e': lambda: _e_in(lambda a, b: rect(a - STEM, -STEM, b + STEM, CAP + STEM)),       # контейнер
    'slant-e': lambda: plate_slant('Э'),                                         # контейнер
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

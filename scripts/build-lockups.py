#!/usr/bin/env python3
"""Геометрия лок-апов для служебной страницы /logo.

Слово переводится в кривые прямо из бинарника CoFo Sans Black: контуры
глифов, кернинг из GPOS, трекинг как у шапки сайта. Дальше по контурам идут
срезы — не накладки поверх букв, а правка самих контуров.

Один срез — одна полуплоскость под 45°. Чамфер прямого угла и срез круглого
плеча у Э — это одна и та же операция с разной линией, поэтому угол среза
физически не может разойтись между буквами: он записан один раз.

Результат кладётся в app/logo/lockups.ts. Запускать из корня проекта:
    python3 scripts/build-lockups.py
"""
import json
import math
import os

from fontTools.pens.recordingPen import RecordingPen
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT = os.path.join(ROOT, 'assets/fonts/CoFoSans-Black-Trial.otf')
OUT = os.path.join(ROOT, 'app/logo/lockups.ts')

_f = TTFont(FONT)
UPEM = _f['head'].unitsPerEm          # 1000
CAP = _f['OS/2'].sCapHeight           # 680 — высота прописных
XH = _f['OS/2'].sxHeight              # 495 — высота строчных
_cmap = _f.getBestCmap()
_gs = _f.getGlyphSet()
_hmtx = _f['hmtx']

# Трекинг шапки сайта: tracking-[-.02em] у слова «Элемент» в Header.tsx.
TRACKING = -0.02
# Допуск разбиения кривых. При самом крупном показе (слово ~900 px по ширине)
# единица шрифта это 0,18 px, то есть 2 единицы — 0,37 px.
TOL = 2.0

# Знак «Скол» — единственное место, где он объявлен. Квадрат 48 × 48, y вниз,
# фигура вписана в 4…44, то есть по 4 единицы поля с каждой стороны.
#
# Восьмигранник, у которого одна фаска срезана вдвое глубже: шесть фасок по 10,
# седьмая — 20. Все до одного углы кратны 45°, поэтому отбитая грань лежит в
# той же сетке, что и целые, и та же полуплоскость режет потом буквы.
#
# V-образная выемка на верхней грани пробовалась и отвергнута: на любой глубине
# силуэт читался надкусанным яблоком, а не сколом. Проверено пятью построениями.
SKOL = [(14, 4), (24, 4), (44, 24), (44, 34), (34, 44), (14, 44), (4, 34), (4, 14)]
SKOL_BOX = 48.0
SKOL_FIG = 40.0   # сторона фигуры внутри квадрата


# ─── шрифт ────────────────────────────────────────────────────────────────

def _kern_pairs():
    """Пары кернинга из GPOS. У CoFo Sans они спрятаны под ExtensionPos."""
    out = {}
    gpos = _f['GPOS'].table
    lookups = []
    for fr in gpos.FeatureList.FeatureRecord:
        if fr.FeatureTag == 'kern':
            lookups += fr.Feature.LookupListIndex

    def subtables(lk):
        for st in lk.SubTable:
            yield st.ExtSubTable if st.__class__.__name__ == 'ExtensionPos' else st

    for li in set(lookups):
        for st in subtables(gpos.LookupList.Lookup[li]):
            fmt = getattr(st, 'Format', None)
            if fmt == 1 and hasattr(st, 'PairSet'):
                for first, ps in zip(st.Coverage.glyphs, st.PairSet):
                    for pvr in ps.PairValueRecord:
                        v = getattr(pvr.Value1, 'XAdvance', 0) if pvr.Value1 else 0
                        if v:
                            out[(first, pvr.SecondGlyph)] = v
            elif fmt == 2:
                c1, c2 = st.ClassDef1.classDefs, st.ClassDef2.classDefs
                all2 = set(c2) | set(st.Coverage.glyphs)
                for g1 in st.Coverage.glyphs:
                    k1 = c1.get(g1, 0)
                    for g2 in all2:
                        try:
                            rec = st.Class1Record[k1].Class2Record[c2.get(g2, 0)]
                        except IndexError:
                            continue
                        v = getattr(rec.Value1, 'XAdvance', 0) if rec.Value1 else 0
                        if v:
                            out[(g1, g2)] = v
    return out


KERN = _kern_pairs()


def _cubic(p0, p1, p2, p3, tol):
    """Разбиение кубической кривой: число шагов от длины контрольной ломаной."""
    L = sum(math.dist(a, b) for a, b in zip((p0, p1, p2), (p1, p2, p3)))
    n = max(2, min(64, int(math.sqrt(L / max(tol, .01))) + 2))
    return [(
        (1-t)**3*p0[0] + 3*(1-t)**2*t*p1[0] + 3*(1-t)*t*t*p2[0] + t**3*p3[0],
        (1-t)**3*p0[1] + 3*(1-t)**2*t*p1[1] + 3*(1-t)*t*t*p2[1] + t**3*p3[1],
    ) for t in (i / n for i in range(1, n + 1))]


def glyph(ch):
    """Контуры знака в единицах шрифта (y вверх, базовая на нуле) и ширина."""
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
            cur += _cubic(cur[-1], args[0], args[1], args[2], TOL)
        elif op == 'qCurveTo':
            p0 = cur[-1]
            for c, e in zip(args, args[1:]):
                c1 = (p0[0] + 2/3*(c[0]-p0[0]), p0[1] + 2/3*(c[1]-p0[1]))
                c2 = (e[0] + 2/3*(c[0]-e[0]), e[1] + 2/3*(c[1]-e[1]))
                cur += _cubic(p0, c1, c2, e, TOL)
                p0 = e
        elif op == 'closePath':
            if cur:
                out.append(cur)
            cur = []
    if cur:
        out.append(cur)
    return out, _hmtx[name][0], name


def word(text, x0=0.0, y0=0.0):
    """Слово: список букв [{ch, contours, box}] и полная ширина набора.

    Позиционирование повторяет браузер: ширина глифа, кернинг из GPOS, следом
    трекинг. Проверено замером — 975,6 против 976 px при кегле 200.
    """
    letters, x, prev = [], x0, None
    track = TRACKING * UPEM
    for ch in text:
        cs, adv, name = glyph(ch)
        if prev is not None:
            x += KERN.get((prev, name), 0)
        moved = [[(px + x, py + y0) for px, py in c] for c in cs]
        letters.append({'ch': ch, 'cs': moved, 'adv': adv, 'x': x, 'box': bbox(moved)})
        x += adv + track
        prev = name
    return letters, x - track - x0


def bbox(contours):
    xs = [p[0] for c in contours for p in c]
    ys = [p[1] for c in contours for p in c]
    return (min(xs), min(ys), max(xs), max(ys))


# ─── срез ─────────────────────────────────────────────────────────────────

def clip(contours, a, b, c):
    """Оставить то, что удовлетворяет a·x + b·y ≤ c. Одна полуплоскость.

    Сатерленд—Ходжмен по одной секущей: для замкнутого контура он даёт
    замкнутый контур, а стык, если он появится, ложится ровно на линию среза,
    то есть туда, где и должна проходить граница.
    """
    out = []
    for poly in contours:
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


# Четыре угла и полуплоскость среза под 45° на глубину d от этого угла.
# Угол везде один — коэффициенты ±1 при x и y; меняется только знак.
CUTS = {
    'tr': lambda x0, y0, x1, y1, d: (1, 1, x1 + y1 - d),
    'tl': lambda x0, y0, x1, y1, d: (-1, 1, y1 - x0 - d),
    'br': lambda x0, y0, x1, y1, d: (1, -1, x1 - y0 - d),
    'bl': lambda x0, y0, x1, y1, d: (-1, -1, -x0 - y0 - d),
}


def facet(letter, corner, depth):
    """Срез угла буквы: линия ставится по её собственной чернильной рамке."""
    x0, y0, x1, y1 = letter['box']
    a, b, c = CUTS[corner](x0, y0, x1, y1, depth)
    letter['cs'] = clip(letter['cs'], a, b, c)
    letter['box'] = bbox(letter['cs'])
    return letter


def depth_for(ch, k):
    """Глубина среза = доля от высоты знака его регистра.

    Оба числа — из таблицы OS/2 шрифта: 680 у прописных, 495 у строчных.
    Ни одно не подобрано на глаз.
    """
    return (XH if ch.islower() else CAP) * k


# ─── знак ─────────────────────────────────────────────────────────────────

def skol(height, x=0.0, y=0.0):
    """«Скол» в единицах шрифта: фигура высотой height, левый низ в (x, y).

    Внутри знака y идёт вниз, здесь — вверх, поэтому 44 минус.
    """
    s = height / SKOL_FIG
    return [[(x + (mx - 4) * s, y + (44 - my) * s) for mx, my in SKOL]]


# ─── вывод ────────────────────────────────────────────────────────────────

def art(contours, cap=None, pad=0.0):
    """Контуры → путь SVG с плоской рамкой. Здесь же переворот y."""
    x0, y0, x1, y1 = bbox(contours)
    x0 -= pad; y0 -= pad; x1 += pad; y1 += pad
    w, h = x1 - x0, y1 - y0
    parts = []
    for poly in contours:
        pts = [f'{round(p[0]-x0,1):g} {round(y1-p[1],1):g}' for p in poly]
        parts.append('M' + 'L'.join(pts) + 'Z')
    return {
        'd': ''.join(parts),
        'w': round(w, 1),
        'h': round(h, 1),
        # Мера, по которой лок-ап масштабируется: высота прописных внутри рамки.
        'cap': round(cap if cap is not None else h, 1),
    }


def collect(letters, extra=()):
    out = []
    for l in letters:
        out += l['cs']
    for e in extra:
        out += e
    return out


# ─── направление 1: общая фаска ───────────────────────────────────────────

GAP = 0.30 * CAP        # отбивка от фигуры знака до чернильного края слова


def d1(text, cuts, k):
    """Знак слева, слово справа; у названных букв срезан угол под 45°.

    Мера отбивки и глубины — доли высоты знака, а не подобранные числа.
    """
    letters, _ = word(text, x0=0)
    for idx, corner in cuts(text):
        facet(letters[idx], corner, depth_for(text[idx], k))
    wx0 = bbox(collect(letters))[0]
    mark = skol(CAP, x=0, y=0)
    shift = bbox(mark)[2] + GAP - wx0
    for l in letters:
        l['cs'] = [[(x + shift, y) for x, y in c] for c in l['cs']]
    return collect(letters, [mark])


def cuts_edges(text):
    return [(0, 'tl'), (len(text) - 1, 'tr')]


def cuts_with_e(text):
    out = [(0, 'tl'), (len(text) - 1, 'tr')]
    out += [(i, 'tr') for i, ch in enumerate(text) if ch in 'Ее' ]
    return out


ANGULAR = set('ЛЕМНТлмнт')   # буквы с прямым углом справа сверху; Э и е круглые


def cuts_all(text):
    return [(i, 'tr') for i, ch in enumerate(text) if ch in ANGULAR]


# ─── направление 2: скол как контейнер ────────────────────────────────────

def monogram(kind):
    """Плашка «Скола» с вывороткой Э. Буква — дырка, заливка одна."""
    plate = skol(CAP, x=0, y=0)
    px0, py0, px1, py1 = bbox(plate)
    e, _, _ = glyph('Э')
    ex0, ey0, ex1, ey1 = bbox(e)

    def placed(f, cx, cy):
        s = f * CAP / (ey1 - ey0)
        return [[(cx + (x - (ex0 + ex1) / 2) * s, cy + (y - (ey0 + ey1) / 2) * s)
                 for x, y in c] for c in e]

    if kind == 'centr':
        # Буква в геометрическом центре фигуры.
        letter = placed(0.52, (px0 + px1) / 2, (py0 + py1) / 2)
    elif kind == 'gran':
        # Буква прижата к срезанной грани. Линия глубокой фаски в этих
        # координатах — x + y = 1,5 · CAP; буква ставится так, чтобы её самая
        # дальняя точка отстояла от линии ровно на MARGIN по нормали.
        cut = 1.5 * CAP
        margin = 0.10 * CAP
        letter = placed(0.52, (px0 + px1) / 2, (py0 + py1) / 2)
        far = max(x + y for c in letter for x, y in c)
        step = (cut - margin * math.sqrt(2) - far) / 2
        letter = [[(x + step, y + step) for x, y in c] for c in letter]
    else:
        # naskvoz — буква режет плашку насквозь: её левый край выходит за
        # вертикальную грань фигуры на OVER, сверху и снизу она остаётся внутри.
        over = 0.09 * CAP
        letter = placed(0.72, (px0 + px1) / 2, (py0 + py1) / 2)
        lx0 = min(x for c in letter for x, _ in c)
        step = px0 - over - lx0
        letter = [[(x + step, y) for x, y in c] for c in letter]

    return plate + letter


def d2(text, kind):
    mono = monogram(kind)
    letters, _ = word(text, x0=0)
    wx0 = bbox(collect(letters))[0]
    shift = bbox(mono)[2] + GAP - wx0
    for l in letters:
        l['cs'] = [[(x + shift, y) for x, y in c] for c in l['cs']]
    return collect(letters, [mono])


# ─── направление 3: скол на месте буквы ───────────────────────────────────

def d3(text, fit):
    """Первая Е заменяется знаком. Масштаб равномерный: иначе уедет угол 45°.

    Неравномерная подгонка «под ширину И высоту» отвергнута сразу: она
    превращает 45° в произвольный угол, а угол на всём логотипе один.
    """
    i = next(i for i, ch in enumerate(text) if ch in 'Ее')
    letters, _ = word(text, x0=0)
    tgt = letters[i]
    tx0, ty0, tx1, ty1 = tgt['box']
    if fit == 'height':
        # По высоте знака: он занимает весь блок буквы, от базовой до верха.
        h, base = ty1 - ty0, ty0
    else:
        # По ширине знака: он уже и ниже, и садится на базовую линию, а не
        # висит по центру — иначе читается точкой-разделителем, а не буквой.
        h, base = tx1 - tx0, ty0
    mark = skol(h, x=0, y=base)
    mx0, my0, mx1, my1 = bbox(mark)
    dx = (tx0 + tx1) / 2 - (mx0 + mx1) / 2
    mark = [[(x + dx, y) for x, y in c] for c in mark]
    # Соседи раздвигаются на разницу ширин, чтобы набор не слипся.
    grow = (bbox(mark)[2] - bbox(mark)[0]) - (tx1 - tx0)
    out = []
    for j, l in enumerate(letters):
        if j == i:
            continue
        d = grow / 2 * (-1 if j < i else 1)
        out += [[(x + d, y) for x, y in c] for c in l['cs']]
    return out + mark


# ─── направление 4: скол как разрыв ───────────────────────────────────────

# Просвет между строками, зазор от строк до знака и высота знака связаны:
# знак заполняет разлом, но не касается ни верхней, ни нижней строки. Ровно
# по просвету он уже стоял — и слипался с М нижней строки в одно пятно.
SEAM = 0.60 * CAP
CLEAR = 0.08 * CAP
MARK4 = SEAM - 2 * CLEAR


def d4(text, kind):
    """Слово в две строки, знак на стыке."""
    cut = 3                                   # ЭЛЕ | МЕНТ и Эле | мент
    seam = 0.18 * CAP if kind == 'hvost' else SEAM
    top, wtop = word(text[:cut], x0=0, y0=CAP + seam)
    bot, wbot = word(text[cut:], x0=0, y0=0)
    tb, bb = bbox(collect(top)), bbox(collect(bot))
    if kind == 'left':
        dx = tb[0] - bb[0]
    elif kind == 'centr':
        dx = (tb[0] + tb[2]) / 2 - (bb[0] + bb[2]) / 2
    else:                                      # сдвиг строк по линии разлома
        dx = tb[0] - bb[0] + 0.42 * CAP
    for l in bot:
        l['cs'] = [[(x + dx, y) for x, y in c] for c in l['cs']]
    all_c = collect(top) + collect(bot)
    ax0, _, ax1, _ = bbox(all_c)
    if kind == 'hvost':
        # Знак — хвост первой строки: та короче второй, и место справа от неё
        # уже пустует. Он стоит на её базовой линии и упирается в разлом снизу.
        mx = bbox(collect(top))[2] + 0.22 * CAP
        return all_c + skol(CAP, x=mx, y=CAP + seam)
    my = CAP + seam / 2 - MARK4 / 2           # знак по центру просвета
    if kind == 'left':
        mx = ax0
    elif kind == 'centr':
        mx = (ax0 + ax1) / 2 - MARK4 / 2
    else:
        # Знак стоит в точке сдвига: между левыми краями разъехавшихся строк.
        mx = (bbox(collect(top))[0] + bbox(collect(bot))[0]) / 2 - MARK4 / 2
    return all_c + skol(MARK4, x=mx, y=my)


# ─── сборка ───────────────────────────────────────────────────────────────

WORDS = {'caps': 'ЭЛЕМЕНТ', 'mixed': 'Элемент'}

BUILD = [
    ('faska-krajnie', lambda t: d1(t, cuts_edges, 0.25), None),
    ('faska-s-e',     lambda t: d1(t, cuts_with_e, 1 / 6), None),
    ('faska-vse',     lambda t: d1(t, cuts_all, 0.125), None),
    ('mono-centr',    lambda t: d2(t, 'centr'),    lambda t: monogram('centr')),
    ('mono-gran',     lambda t: d2(t, 'gran'),     lambda t: monogram('gran')),
    ('mono-naskvoz',  lambda t: d2(t, 'naskvoz'),  lambda t: monogram('naskvoz')),
    ('bukva-vysota',  lambda t: d3(t, 'height'), None),
    ('bukva-shirina', lambda t: d3(t, 'width'),  None),
    ('razryv-shov',   lambda t: d4(t, 'left'),   None),
    ('razryv-hvost',  lambda t: d4(t, 'hvost'),  None),
    ('razryv-sdvig',  lambda t: d4(t, 'sdvig'),  None),
]


def main():
    data = {}
    for name, full, compact in BUILD:
        data[name] = {}
        for setname, text in WORDS.items():
            entry = {'full': art(full(text), cap=CAP)}
            entry['compact'] = art(compact(text), cap=CAP) if compact else None
            data[name][setname] = entry
    mark = art(skol(CAP, 0, 0), cap=CAP)

    body = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
    with open(OUT, 'w', encoding='utf-8') as fh:
        fh.write(f'''/* Файл собран scripts/build-lockups.py — руками не править.

   Контуры букв вынуты из assets/fonts/CoFoSans-Black-Trial.otf: кернинг из
   GPOS, трекинг −0,02 em как в шапке сайта. Кривые разбиты на отрезки с
   допуском {TOL} единицы шрифта. Срезы сделаны по самим контурам —
   полуплоскостью под 45°, а не накладками поверх букв.

   Высота прописных {CAP} и высота строчных {XH} взяты из таблицы OS/2, глубина
   срезов считается от них. Единицы всюду — единицы шрифта при upem {UPEM}.

   Пересобрать:  python3 scripts/build-lockups.py
*/

/** Готовый путь с плоской рамкой. cap — высота прописных внутри рамки:
 *  по ней лок-ап масштабируется к кеглю шапки. */
export type Art = {{ d: string; w: number; h: number; cap: number }};

export type Lockup = {{
  /** Логотип целиком. */
  full: Art;
  /** Компактная форма, если она у варианта есть. */
  compact: Art | null;
}};

export type LockupSets = {{ caps: Lockup; mixed: Lockup }};

/** Метрики гарнитуры, по которым всё построено. */
export const METRICS = {{ upem: {UPEM}, cap: {CAP}, xHeight: {XH}, tracking: {TRACKING} }};

/** Сам знак, отдельно от слова. */
export const MARK: Art = {json.dumps(mark, ensure_ascii=False)};

export const LOCKUPS: Record<string, LockupSets> = {body};
''')
    total = sum(len(v[s][k]['d']) for v in data.values() for s in WORDS
                for k in ('full',) )
    print(f'вариантов {len(data)}, путей {len(data)*2}, байт путей {total}')
    for name in data:
        a = data[name]['caps']['full']
        print(f"  {name:15} рамка {a['w']:.0f}×{a['h']:.0f}  путь {len(a['d'])} б")


if __name__ == '__main__':
    main()

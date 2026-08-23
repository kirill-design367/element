#!/usr/bin/env python3
"""Проверка шрифтов по бинарнику: кириллица в cmap, табличные цифры, служебные знаки.

Запуск: python3 scripts/verify-fonts.py <файл.ttf|woff2> [...]
Кладём сюда же, чтобы проверку можно было повторить при замене шрифта.
"""
import json
import sys
from fontTools.ttLib import TTFont

RU_UPPER = [chr(c) for c in range(0x0410, 0x0430)] + ["Ё"]
RU_LOWER = [chr(c) for c in range(0x0430, 0x0450)] + ["ё"]
DIGITS = list("0123456789")
SERVICE = ["₽", "№", "×", "—", "–", "·", "«", "»", "→", "≈", "…"]

def inspect(path):
    f = TTFont(path, fontNumber=0, lazy=True)
    cmap = f.getBestCmap()
    have = lambda ch: ord(ch) in cmap

    miss_up = [c for c in RU_UPPER if not have(c)]
    miss_lo = [c for c in RU_LOWER if not have(c)]
    miss_dg = [c for c in DIGITS if not have(c)]
    miss_sv = [c for c in SERVICE if not have(c)]

    # ширины цифр по умолчанию
    hmtx = f["hmtx"]
    widths = {d: hmtx[cmap[ord(d)]][0] for d in DIGITS if have(d)}
    uniform = len(set(widths.values())) == 1 if widths else False

    # фичи GSUB
    feats = set()
    if "GSUB" in f:
        for fr in f["GSUB"].table.FeatureList.FeatureRecord:
            feats.add(fr.FeatureTag)

    axes = []
    if "fvar" in f:
        axes = [(a.axisTag, a.minValue, a.maxValue) for a in f["fvar"].axes]

    family = f["name"].getDebugName(16) or f["name"].getDebugName(1) or path
    return {
        "file": path.split("/")[-1],
        "family": family,
        "glyphs": len(cmap),
        "cyrillicUpper": not miss_up,
        "cyrillicLower": not miss_lo,
        "digits": not miss_dg,
        "missingService": miss_sv,
        "uniformDigitWidths": uniform,
        "digitWidths": sorted(set(widths.values())),
        "numericFeatures": sorted(t for t in ("tnum", "pnum", "lnum", "onum", "zero", "case", "ss01") if t in feats),
        "axes": [{"tag": t, "min": lo, "max": hi} for t, lo, hi in axes],
        "verdict": bool(not (miss_up or miss_lo or miss_dg) and (uniform or "tnum" in feats)),
    }


def check(path):
    r = inspect(path)
    name = r["family"]
    miss_up = [] if r["cyrillicUpper"] else ["…"]
    miss_lo = [] if r["cyrillicLower"] else ["…"]
    miss_dg = [] if r["digits"] else ["…"]
    miss_sv = r["missingService"]
    cmap = {i: 1 for i in range(r["glyphs"])}
    widths = {str(i): w for i, w in enumerate(r["digitWidths"])}
    uniform = r["uniformDigitWidths"]
    feats = set(r["numericFeatures"])
    axes = [(a["tag"], a["min"], a["max"]) for a in r["axes"]]
    print(f"\n=== {name}  ({path.split('/')[-1]}) ===")
    print(f"  глифов в cmap: {len(cmap)}")
    print(f"  кириллица прописные А–Я+Ё: {'ПОЛНАЯ' if not miss_up else 'НЕТ ' + ''.join(miss_up)}")
    print(f"  кириллица строчные а–я+ё:  {'ПОЛНАЯ' if not miss_lo else 'НЕТ ' + ''.join(miss_lo)}")
    print(f"  цифры 0–9: {'есть' if not miss_dg else 'НЕТ ' + ''.join(miss_dg)}")
    print(f"  служебные {' '.join(SERVICE)}: {'все есть' if not miss_sv else 'НЕТ ' + ' '.join(miss_sv)}")
    print(f"  ширины цифр по умолчанию: {'ТАБЛИЧНЫЕ (одинаковые, ' + str(list(widths.values())[0]) + ')' if uniform else 'РАЗНЫЕ ' + str(sorted(set(widths.values())))}")
    tab = [t for t in ("tnum", "pnum", "lnum", "onum", "ss01", "case", "zero") if t in feats]
    print(f"  фичи цифр/регистра в GSUB: {', '.join(tab) if tab else '—'}")
    if axes:
        print(f"  оси variable: {', '.join(f'{t} {lo}..{hi}' for t, lo, hi in axes)}")
    ok = not (miss_up or miss_lo or miss_dg) and (uniform or "tnum" in feats)
    print(f"  ВЕРДИКТ: {'годен' if ok else 'НЕ ГОДЕН'}")
    return ok

if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if a != "--json"]
    if "--json" in sys.argv:
        print(json.dumps([inspect(p) for p in args], ensure_ascii=False, indent=2))
    else:
        results = [check(p) for p in args]
        print(f"\nИтого годных: {sum(results)} из {len(results)}")

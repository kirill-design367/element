#!/usr/bin/env python3
"""Собирает woff2-подмножества из variable-исходников Google Fonts.

Оставляем только кириллицу, латиницу и служебные знаки, которые реально
встречаются на сайте, и только ось начертания. Остальные оси прибиваем к
значению по умолчанию — файл худеет вдвое, а рисунок не меняется.

Запуск: python3 scripts/build-fonts.py <папка-с-ttf> assets/fonts
"""
import os, sys, subprocess, tempfile
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

# Что реально набирается на сайте: кириллица, латиница (единицы, ГОСТ, коды),
# знаки рубля и номера, тире, кавычки-ёлочки, умножение, градус.
UNICODES = ",".join([
    "U+0020-007E", "U+00A0", "U+00AB", "U+00BB", "U+00B0", "U+00B7", "U+00D7",
    "U+00AD", "U+0400-045F", "U+0490-0491",
    "U+2009", "U+200B", "U+2011", "U+2013", "U+2014", "U+2018-201F",
    "U+2026", "U+2039", "U+203A", "U+2116", "U+2192", "U+2212", "U+2248", "U+20BD",
])

FEATURES = "kern,liga,calt,tnum,pnum,case,ss01,locl,frac,zero"

# Какие оси оставляем живыми; всё прочее пинуем в значение по умолчанию.
KEEP_AXES = {"wght", "wdth"}

SOURCES = [
    # (файл, имя на выходе, {ось: значение или диапазон})
    ("Geologica.ttf",   "Geologica",       {"wght": (200, 800)}),
    ("Onest.ttf",       "Onest",           {"wght": (300, 800)}),
    ("IBMPlexSans.ttf", "IBMPlexSans",     {"wght": (400, 700), "wdth": 100}),
    ("IBMPlexSans.ttf", "IBMPlexSansCond", {"wght": (400, 700), "wdth": 75}),
    ("GolosText.ttf",   "GolosText",       {"wght": (400, 900)}),
    ("Manrope.ttf",     "Manrope",         {"wght": (400, 800)}),
    ("InterTight.ttf",  "InterTight",      {"wght": (400, 800)}),
    # Маркировка партии: фракции, ГОСТы, марки прочности. Статические
    # начертания — оси нет, инстансер их просто пропускает.
    ("IBMPlexMono.ttf",       "IBMPlexMono",       {}),
    ("IBMPlexMonoMedium.ttf", "IBMPlexMonoMedium", {}),
]


def build(src_dir, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    for fname, out_name, axes in SOURCES:
        src = os.path.join(src_dir, fname)
        if not os.path.exists(src):
            print(f"пропуск {fname}: нет исходника")
            continue
        font = TTFont(src)
        limits = {}
        if "fvar" in font:
            for a in font["fvar"].axes:
                if a.axisTag in axes:
                    limits[a.axisTag] = axes[a.axisTag]
                elif a.axisTag not in KEEP_AXES:
                    limits[a.axisTag] = a.defaultValue  # прибиваем CRSV/SHRP/slnt
            font = instancer.instantiateVariableFont(font, limits, updateFontNames=False)
        with tempfile.NamedTemporaryFile(suffix=".ttf", delete=False) as tmp:
            font.save(tmp.name)
            tmp_path = tmp.name
        dst = os.path.join(out_dir, f"{out_name}.woff2")
        subprocess.run([
            sys.executable, "-m", "fontTools.subset", tmp_path,
            f"--unicodes={UNICODES}",
            f"--layout-features={FEATURES}",
            "--flavor=woff2", "--with-zopfli",
            "--no-hinting", "--desubroutinize",
            "--name-IDs=*", "--name-legacy", "--notdef-outline",
            f"--output-file={dst}",
        ], check=True)
        os.unlink(tmp_path)
        print(f"{out_name}.woff2  {os.path.getsize(dst) / 1024:.1f} КБ")


if __name__ == "__main__":
    build(sys.argv[1], sys.argv[2])

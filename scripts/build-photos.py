#!/usr/bin/env python3
"""
Сборка кадров под вёрстку.

Мастер-файлы лежат в assets/photos/ и в выдачу не идут: они большие, а браузеру
нужен ровно тот размер, который он покажет. Скрипт делает из каждого мастера по
три ширины в двух форматах — WebP и запасной JPEG — и кладёт их в public/img/.
Плюс миниатюру 24 px шириной, которая уходит в lib/photo-lqip.json и потом
инлайнится в разметку как размытая подложка на время загрузки.

Кадр, кроп и цвет не меняются: только масштаб и кодек. Ретуши нет.

    python3 scripts/build-photos.py
"""
import base64
import json
import pathlib

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets' / 'photos'
OUT = ROOT / 'public' / 'img'
LQIP_JSON = ROOT / 'lib' / 'photo-lqip.json'

# Ширины подобраны под то, как кадр реально показан на странице:
#   на весь экран      — 1280 / 1920 / 2560
#   половина экрана    — 560 / 840 / 1120
#   карточка в ленте   — 440 / 720 / 1000
#   вертикальный hero  — 640 / 828 / 1080 (390 px при dpr 2 и 3)
PLAN = {
    'hero-desktop': [1280, 1920, 2560],
    'hero-mobile': [480, 640, 720],
    'park': [1280, 1920, 2200],
    'objects': [560, 840, 1120],
    'cat-shcheben': [440, 720, 1000],
    'cat-pesok': [440, 720, 1000],
    'cat-pgs': [440, 720, 1000],
    'cat-otsev': [440, 720, 1000],
    'cat-grunt': [440, 720, 1000],
}

WEBP_Q = 74
JPEG_Q = 78

# Вертикальный кадр первого экрана — единственный LCP-элемент сайта, и на
# телефоне с dpr 2–3 браузер берёт из srcset самый широкий подходящий файл.
# При общем качестве и ширинах до 1080 это 240–320 КБ на мобильном канале,
# то есть три лишние секунды ожидания на замере. Кадр лежит под стеклянными
# панелями и общим затемнением; на телефоне он фон, а не иллюстрация,
# поэтому у него и качество своё, и ширины кончаются на 720: при dpr 2 это
# 0,92 от точного размера, на глаз неотличимо, а весит вдвое меньше.
QUALITY = {'hero-mobile': (60, 66)}
LQIP_W = 24


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    lqip: dict[str, str] = {}
    total = 0

    for name, widths in PLAN.items():
        path = SRC / f'{name}.jpg'
        if not path.exists():
            raise SystemExit(f'нет мастер-файла: {path}')
        master = Image.open(path).convert('RGB')

        for w in widths:
            # Апскейл запрещён: если мастер уже, отдаём его ширину как есть.
            w = min(w, master.width)
            h = round(master.height * w / master.width)
            frame = master.resize((w, h), Image.LANCZOS)
            webp = OUT / f'{name}-{w}.webp'
            jpg = OUT / f'{name}-{w}.jpg'
            wq, jq = QUALITY.get(name, (WEBP_Q, JPEG_Q))
            frame.save(webp, quality=wq, method=6)
            frame.save(jpg, quality=jq, optimize=True, progressive=True, subsampling=1)
            total += webp.stat().st_size + jpg.stat().st_size
            print(f'{name}-{w}: webp {webp.stat().st_size // 1024} КБ · jpg {jpg.stat().st_size // 1024} КБ')

        # Миниатюра под размытую подложку. 24 px хватает на пятна цвета —
        # именно они и нужны, пока кадр в пути.
        th = round(master.height * LQIP_W / master.width)
        thumb = master.resize((LQIP_W, th), Image.LANCZOS)
        buf = OUT / f'.{name}-lqip.webp'
        thumb.save(buf, quality=42, method=6)
        raw = buf.read_bytes()
        buf.unlink()
        lqip[name] = 'data:image/webp;base64,' + base64.b64encode(raw).decode()
        print(f'{name}: подложка {len(raw)} байт')

    LQIP_JSON.write_text(json.dumps(lqip, indent=1, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'\nвсего в public/img: {total // 1024} КБ, подложек {len(lqip)}')


if __name__ == '__main__':
    main()

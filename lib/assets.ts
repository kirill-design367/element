/**
 * МЕСТА ПОД БУДУЩИЕ ФОТОГРАФИИ.
 *
 * Снимков нет. Стоки не ставим — сайт держится типографикой и цветом.
 * Пока значение null, компонент рисует типографическую заглушку; как только
 * сюда попадёт путь, на том же месте появится кадр, вёрстку менять не нужно.
 *
 * Класть файлы в public/photo/. Пути пишутся от корня сайта, basePath
 * подставляется автоматически хелпером asset().
 */

export interface PhotoSlot {
  /** null = снимка ещё нет. */
  src: string | null;
  /** Что должно быть в кадре. Это же уходит в alt, когда фото появится. */
  brief: string;
  /** Требуемое соотношение сторон, чтобы вёрстка не поехала. */
  ratio: string;
  /** Минимальный размер по длинной стороне, px. */
  minWidth: number;
}

/** TODO: заменить null на путь, когда придёт съёмка с объектов. */
export const PHOTO: Record<string, PhotoSlot> = {
  hero: {
    src: null, // TODO: '/photo/hero.jpg' — разгрузка самосвала на объекте или карьер, горизонт
    brief: 'Разгрузка самосвала на объекте либо общий план карьера, дневной свет',
    ratio: '16 / 7',
    minWidth: 2400,
  },
  categoryShcheben: {
    src: null, // TODO: '/photo/shcheben.jpg' — фактура щебня крупным планом
    brief: 'Фактура гранитного щебня фракции 20–40, съёмка сверху',
    ratio: '4 / 3',
    minWidth: 1200,
  },
  categoryPesok: {
    src: null, // TODO: '/photo/pesok.jpg'
    brief: 'Фактура мытого песка, борозда от ковша',
    ratio: '4 / 3',
    minWidth: 1200,
  },
  categoryPgs: {
    src: null, // TODO: '/photo/pgs.jpg'
    brief: 'Фактура ПГС, видно и песок, и гравий',
    ratio: '4 / 3',
    minWidth: 1200,
  },
  categoryOtsev: {
    src: null, // TODO: '/photo/otsev.jpg'
    brief: 'Фактура отсева, мелкая крошка',
    ratio: '4 / 3',
    minWidth: 1200,
  },
  categoryGrunt: {
    src: null, // TODO: '/photo/grunt.jpg'
    brief: 'Фактура просеянного чернозёма',
    ratio: '4 / 3',
    minWidth: 1200,
  },
  fleet: {
    src: null, // TODO: '/photo/fleet.jpg' — парк самосвалов на площадке
    brief: 'Парк самосвалов на площадке, утро',
    ratio: '16 / 9',
    minWidth: 1800,
  },
  map: {
    src: null, // TODO: '/photo/map.jpg' или встроенная карта — см. открытые вопросы в CLAUDE.md
    brief: 'Карта проезда к площадке либо статичный снимок карты',
    ratio: '16 / 9',
    minWidth: 1600,
  },
};

/** Путь к статике с учётом basePath GitHub Pages. */
export function asset(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  return `${base}${path}`;
}

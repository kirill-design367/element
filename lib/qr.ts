/**
 * QR-код: свой кодировщик, без библиотеки.
 *
 * Нужен ровно для одного — ссылки на сайт в углу визитки. Ставить ради этого
 * пакет в зависимости проекта незачем: код считается ОДИН РАЗ ПРИ СБОРКЕ,
 * потому что сайт статический и адрес известен заранее. В бандл не уезжает
 * ничего: серверный компонент зовёт эту функцию, а в разметку попадают уже
 * готовые прямоугольники.
 *
 * Режим байтовый, уровень коррекции M, версия подбирается наименьшая из
 * первых десяти — под адрес сайта этого с запасом.
 *
 * Проверено сверкой матриц с эталонной реализацией: на десятке разных
 * строк, включая кириллицу в UTF-8, совпадение до модуля, включая выбранную
 * маску. См. отчёт захода.
 */

/* Уровень M: как данные бьются на блоки.
   [байт коррекции на блок, блоков в первой группе, байт данных в блоке
    первой группы, блоков во второй, байт во второй]

   Числа кодовых слов и ёмкость в символах отсюда ВЫВОДЯТСЯ, а не хранятся
   рядом: держать их третьим столбцом — верный способ однажды перепутать
   ёмкость в символах с числом кодовых слов, что тут и случилось. */
const SPEC: [number, number, number, number, number][] = [
  [10, 1, 16, 0, 0],
  [16, 1, 28, 0, 0],
  [26, 1, 44, 0, 0],
  [18, 2, 32, 0, 0],
  [24, 2, 43, 0, 0],
  [16, 4, 27, 0, 0],
  [18, 4, 31, 0, 0],
  [22, 2, 38, 2, 39],
  [22, 3, 36, 2, 37],
  [26, 4, 43, 1, 44],
];

/** Сколько кодовых слов данных держит версия. */
const dataWords = (v: number) => SPEC[v - 1][1] * SPEC[v - 1][2] + SPEC[v - 1][3] * SPEC[v - 1][4];

/** Сколько байт полезной нагрузки влезает: минус режим и счётчик длины. */
const capacity = (v: number) => Math.floor((dataWords(v) * 8 - 4 - (v <= 9 ? 8 : 16)) / 8);

/** Центры совмещающих узоров по версиям. */
const ALIGN: number[][] = [
  [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
  [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50],
];

// ─── арифметика Галуа GF(256) ─────────────────────────────────────────────

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
for (let i = 0, x = 1; i < 255; i += 1) {
  EXP[i] = x;
  LOG[x] = i;
  x <<= 1;
  if (x & 0x100) x ^= 0x11d;
}
for (let i = 255; i < 512; i += 1) EXP[i] = EXP[i - 255];

const mul = (a: number, b: number) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);

/** Порождающий многочлен кода Рида — Соломона на n проверочных байт. */
function generator(n: number): number[] {
  let g = [1];
  for (let i = 0; i < n; i += 1) {
    const next = new Array(g.length + 1).fill(0);
    for (let j = 0; j < g.length; j += 1) {
      next[j] ^= g[j];
      next[j + 1] ^= mul(g[j], EXP[i]);
    }
    g = next;
  }
  return g;
}

/** Проверочные байты блока. */
function ecc(data: number[], n: number): number[] {
  const g = generator(n);
  const rem = new Array(n).fill(0);
  for (const byte of data) {
    const factor = byte ^ rem[0];
    rem.shift();
    rem.push(0);
    if (factor !== 0) {
      for (let i = 0; i < n; i += 1) rem[i] ^= mul(g[i + 1], factor);
    }
  }
  return rem;
}

// ─── сборка ───────────────────────────────────────────────────────────────

const BCH_FORMAT = (data: number) => {
  let v = data << 10;
  for (let i = 4; i >= 0; i -= 1) if (v & (1 << (i + 10))) v ^= 0x537 << i;
  return ((data << 10) | v) ^ 0x5412;
};

const BCH_VERSION = (v: number) => {
  let r = v << 12;
  for (let i = 5; i >= 0; i -= 1) if (r & (1 << (i + 12))) r ^= 0x1f25 << i;
  return (v << 12) | r;
};

const MASK = [
  (r: number, c: number) => (r + c) % 2 === 0,
  (r: number) => r % 2 === 0,
  (_r: number, c: number) => c % 3 === 0,
  (r: number, c: number) => (r + c) % 3 === 0,
  (r: number, c: number) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r: number, c: number) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r: number, c: number) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r: number, c: number) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

/** Штраф маски по четырём правилам стандарта. */
function penalty(m: boolean[][]): number {
  const n = m.length;
  let score = 0;
  const line = (get: (i: number, j: number) => boolean) => {
    for (let i = 0; i < n; i += 1) {
      let run = 1;
      for (let j = 1; j < n; j += 1) {
        if (get(i, j) === get(i, j - 1)) {
          run += 1;
        } else {
          if (run >= 5) score += run - 2;
          run = 1;
        }
      }
      if (run >= 5) score += run - 2;
      // Правило 3: 1011101 с четырьмя светлыми модулями с любой стороны.
      for (let j = 0; j + 11 <= n; j += 1) {
        const s = [];
        for (let k = 0; k < 11; k += 1) s.push(get(i, j + k) ? 1 : 0);
        const p = s.join('');
        if (p === '10111010000' || p === '00001011101') score += 40;
      }
    }
  };
  line((i, j) => m[i][j]);
  line((i, j) => m[j][i]);
  for (let i = 0; i + 1 < n; i += 1) {
    for (let j = 0; j + 1 < n; j += 1) {
      const a = m[i][j];
      if (a === m[i][j + 1] && a === m[i + 1][j] && a === m[i + 1][j + 1]) score += 3;
    }
  }
  let dark = 0;
  for (const row of m) for (const v of row) if (v) dark += 1;
  score += Math.floor(Math.abs((dark * 100) / (n * n) - 50) / 5) * 10;
  return score;
}

/**
 * Матрица QR-кода: true — тёмный модуль.
 *
 * Пустая строка даёт пустую матрицу: на визитке это значит, что кода нет и
 * рисовать нечего.
 */
export function qrMatrix(text: string): boolean[][] {
  if (!text) return [];
  const bytes = Array.from(new TextEncoder().encode(text));

  let version = 0;
  for (let v = 1; v <= 10; v += 1) {
    if (bytes.length <= capacity(v)) { version = v; break; }
  }
  if (!version) throw new Error('строка длиннее, чем помещается в версию 10');

  const [ecLen, g1, d1, g2, d2] = SPEC[version - 1];
  const cap = dataWords(version);
  const countBits = version <= 9 ? 8 : 16;

  // Битовый поток: режим 0100, длина, данные, ограничитель, добивка.
  const bits: number[] = [];
  const push = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i -= 1) bits.push((val >> i) & 1);
  };
  push(0b0100, 4);
  push(bytes.length, countBits);
  for (const b of bytes) push(b, 8);
  for (let i = 0; i < 4 && bits.length < cap * 8; i += 1) bits.push(0);
  while (bits.length % 8) bits.push(0);
  const pad = [0xec, 0x11];
  for (let i = 0; bits.length < cap * 8; i += 1) push(pad[i % 2], 8);

  const codewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    codewords.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));
  }

  // Блоки и чередование.
  const blocks: number[][] = [];
  const eccs: number[][] = [];
  let at = 0;
  for (let i = 0; i < g1 + g2; i += 1) {
    const len = i < g1 ? d1 : d2;
    const block = codewords.slice(at, at + len);
    at += len;
    blocks.push(block);
    eccs.push(ecc(block, ecLen));
  }
  const out: number[] = [];
  for (let i = 0; i < Math.max(d1, d2); i += 1) {
    for (const b of blocks) if (i < b.length) out.push(b[i]);
  }
  for (let i = 0; i < ecLen; i += 1) for (const e of eccs) out.push(e[i]);

  // Поле и служебные узоры.
  const n = version * 4 + 17;
  const m: boolean[][] = Array.from({ length: n }, () => new Array(n).fill(false));
  const reserved: boolean[][] = Array.from({ length: n }, () => new Array(n).fill(false));
  const set = (r: number, c: number, v: boolean) => { m[r][c] = v; reserved[r][c] = true; };

  const finder = (r0: number, c0: number) => {
    for (let r = -1; r <= 7; r += 1) {
      for (let c = -1; c <= 7; c += 1) {
        const r1 = r0 + r;
        const c1 = c0 + c;
        if (r1 < 0 || c1 < 0 || r1 >= n || c1 >= n) continue;
        const inner = r >= 0 && r <= 6 && c >= 0 && c <= 6
          && (r === 0 || r === 6 || c === 0 || c === 6
            || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
        set(r1, c1, inner);
      }
    }
  };
  finder(0, 0);
  finder(0, n - 7);
  finder(n - 7, 0);

  for (let i = 8; i < n - 8; i += 1) {
    set(6, i, i % 2 === 0);
    set(i, 6, i % 2 === 0);
  }

  /* Совмещающие узоры стоят на всех пересечениях координат, КРОМЕ трёх
     углов с поисковыми узорами. Проверять «занята ли клетка» здесь нельзя:
     центры на строке и столбце синхронизации уже заняты ими, и узор в этих
     местах молча пропадал — у версий от седьмой это меняло матрицу целиком. */
  const ax = ALIGN[version - 1];
  const last = ax[ax.length - 1];
  for (const r of ax) {
    for (const c of ax) {
      const corner = (r === 6 && c === 6) || (r === 6 && c === last)
        || (r === last && c === 6);
      if (corner) continue;
      for (let dr = -2; dr <= 2; dr += 1) {
        for (let dc = -2; dc <= 2; dc += 1) {
          set(r + dr, c + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
        }
      }
    }
  }

  // Место под всегда тёмный модуль; значение ставится вместе с форматом.
  set(n - 8, 8, false);

  // Места под сведения о формате резервируются, значение ставится после маски.
  for (let i = 0; i < 9; i += 1) {
    if (!reserved[8][i]) set(8, i, false);
    if (!reserved[i][8]) set(i, 8, false);
  }
  for (let i = 0; i < 8; i += 1) {
    if (!reserved[8][n - 1 - i]) set(8, n - 1 - i, false);
    if (!reserved[n - 1 - i][8]) set(n - 1 - i, 8, false);
  }

  /* Сведения о версии тоже резервируются пустыми: эталонная реализация
     гасит их на время подсчёта штрафа, как и формат, и без этого выбор
     маски у версий от седьмой расходится. */
  if (version >= 7) {
    for (let i = 0; i < 18; i += 1) {
      set(Math.floor(i / 3), n - 11 + (i % 3), false);
      set(n - 11 + (i % 3), Math.floor(i / 3), false);
    }
  }

  // Укладка данных зигзагом снизу вверх, справа налево.
  let bi = 0;
  const dataBits: number[] = [];
  for (const cw of out) for (let i = 7; i >= 0; i -= 1) dataBits.push((cw >> i) & 1);
  let up = true;
  for (let col = n - 1; col > 0; col -= 2) {
    if (col === 6) col -= 1;
    for (let k = 0; k < n; k += 1) {
      const row = up ? n - 1 - k : k;
      for (const c of [col, col - 1]) {
        if (reserved[row][c]) continue;
        m[row][c] = bi < dataBits.length ? dataBits[bi] === 1 : false;
        bi += 1;
      }
    }
    up = !up;
  }

  /* Выбор маски по наименьшему штрафу. Штраф считается по матрице, где
     сведения о формате и всегда тёмный модуль ЕЩЁ НЕ ЗАПИСАНЫ: так делает
     эталонная реализация, и только при этом условии выбор маски совпадает с
     ней знак в знак. На читаемость кода это не влияет — тридцать один модуль
     из нескольких сотен, — но проверяемость даёт полную. */
  let best = 0;
  let bestScore = Infinity;
  let bestM: boolean[][] = m;
  for (let k = 0; k < 8; k += 1) {
    const t = m.map((row, r) => row.map((v, c) => (reserved[r][c] ? v : v !== MASK[k](r, c))));
    const score = penalty(t);
    if (score < bestScore) { bestScore = score; best = k; bestM = t; }
  }

  /* Сведения о формате: 15 бит, СТАРШИЙ ПЕРВЫМ. Раскладка выведена из
     эталонной матрицы, а не по памяти: копия у левого верхнего угла идёт
     подряд, вторая делится 7 + 8, а не 8 + 7. */
  const fb = BCH_FORMAT((0b00 << 3) | best);
  for (let j = 0; j < 15; j += 1) {
    const bit = ((fb >> (14 - j)) & 1) === 1;
    if (j < 6) bestM[8][j] = bit;
    else if (j === 6) bestM[8][7] = bit;
    else if (j === 7) bestM[8][8] = bit;
    else if (j === 8) bestM[7][8] = bit;
    else bestM[14 - j][8] = bit;
    if (j < 7) bestM[n - 1 - j][8] = bit;
    else bestM[8][n - 8 + (j - 7)] = bit;
  }
  bestM[n - 8][8] = true;

  if (version >= 7) {
    const vb = BCH_VERSION(version);
    for (let i = 0; i < 18; i += 1) {
      const bit = ((vb >> i) & 1) === 1;
      bestM[Math.floor(i / 3)][n - 11 + (i % 3)] = bit;
      bestM[n - 11 + (i % 3)][Math.floor(i / 3)] = bit;
    }
  }

  return bestM;
}

/** Путь SVG из матрицы: один контур на весь код, модуль — квадрат 1×1. */
export function qrPath(matrix: boolean[][]): string {
  let d = '';
  for (let r = 0; r < matrix.length; r += 1) {
    for (let c = 0; c < matrix.length; c += 1) {
      if (matrix[r][c]) d += `M${c} ${r}h1v1h-1Z`;
    }
  }
  return d;
}

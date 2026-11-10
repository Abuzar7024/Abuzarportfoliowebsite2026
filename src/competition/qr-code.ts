/**
 * Self-contained ISO/IEC 18004 QR Code matrix generator (Byte mode, ECC Level L).
 * Supports URLs up to 134 bytes (Versions 1–6) so badge QR codes render offline
 * onto both SVG and HTML5 Canvas (for PNG & PDF export) with zero external APIs.
 */

interface VersionSpec {
  version: number;
  size: number;
  dataCodewords: number;
  ecCodewords: number;
  alignment: number[];
}

const VERSIONS: VersionSpec[] = [
  { version: 1, size: 21, dataCodewords: 19, ecCodewords: 7, alignment: [] },
  { version: 2, size: 25, dataCodewords: 34, ecCodewords: 10, alignment: [6, 18] },
  { version: 3, size: 29, dataCodewords: 55, ecCodewords: 15, alignment: [6, 22] },
  { version: 4, size: 33, dataCodewords: 80, ecCodewords: 20, alignment: [6, 26] },
  { version: 5, size: 37, dataCodewords: 108, ecCodewords: 26, alignment: [6, 30] },
  { version: 6, size: 41, dataCodewords: 136, ecCodewords: 36, alignment: [6, 34] }, // 2 blocks of 68 data + 18 ec
];

// GF(256) log/exp tables with primitive polynomial 0x11d
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

function reedSolomonGenerator(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    const root = EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], root);
    }
    poly = next;
  }
  return poly;
}

function reedSolomonRemainder(data: Uint8Array, ecLen: number): Uint8Array {
  const gen = reedSolomonGenerator(ecLen);
  const rem = new Uint8Array(ecLen);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ rem[0];
    rem.copyWithin(0, 1);
    rem[ecLen - 1] = 0;
    if (factor !== 0) {
      for (let j = 0; j < ecLen; j++) {
        rem[j] ^= gfMul(gen[j + 1], factor);
      }
    }
  }
  return rem;
}

function encodeDataCodewords(bytes: Uint8Array, totalCodewords: number): Uint8Array {
  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1);
  };

  // Byte mode indicator (0100)
  pushBits(0b0100, 4);
  // Character count (8 bits for versions 1-9)
  pushBits(bytes.length, 8);
  for (const b of bytes) pushBits(b, 8);

  const maxBits = totalCodewords * 8;
  const terminator = Math.min(4, maxBits - bits.length);
  pushBits(0, terminator);
  while (bits.length % 8 !== 0) bits.push(0);

  const out = new Uint8Array(totalCodewords);
  const byteLen = bits.length / 8;
  for (let i = 0; i < byteLen; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i * 8 + j];
    out[i] = b;
  }
  const pads = [0xec, 0x11];
  for (let i = byteLen; i < totalCodewords; i++) {
    out[i] = pads[(i - byteLen) % 2];
  }
  return out;
}

function bchFormatBits(mask: number): number {
  // ECC level L = 01
  const data = (0b01 << 3) | mask;
  let rem = data << 10;
  for (let i = 14; i >= 10; i--) {
    if ((rem >>> i) & 1) rem ^= 0x537 << (i - 10);
  }
  return ((data << 10) | rem) ^ 0x5412;
}

/**
 * Generates a 2D boolean matrix representing the QR code modules for `text`.
 */
export function generateQrMatrix(text: string): boolean[][] {
  const bytes = new TextEncoder().encode(text);
  const spec =
    VERSIONS.find((v) => bytes.length + 2 <= v.dataCodewords) ||
    VERSIONS[VERSIONS.length - 1];
  const trimmed = bytes.slice(0, spec.dataCodewords - 2);
  const dataCw = encodeDataCodewords(trimmed, spec.dataCodewords);

  let finalCodewords: Uint8Array;
  if (spec.version === 6) {
    // Version 6-L uses 2 blocks of (68 data, 18 ec)
    const b1 = dataCw.slice(0, 68);
    const b2 = dataCw.slice(68, 136);
    const ec1 = reedSolomonRemainder(b1, 18);
    const ec2 = reedSolomonRemainder(b2, 18);
    finalCodewords = new Uint8Array(136 + 36);
    let idx = 0;
    for (let i = 0; i < 68; i++) {
      finalCodewords[idx++] = b1[i];
      finalCodewords[idx++] = b2[i];
    }
    for (let i = 0; i < 18; i++) {
      finalCodewords[idx++] = ec1[i];
      finalCodewords[idx++] = ec2[i];
    }
  } else {
    const ec = reedSolomonRemainder(dataCw, spec.ecCodewords);
    finalCodewords = new Uint8Array(dataCw.length + ec.length);
    finalCodewords.set(dataCw, 0);
    finalCodewords.set(ec, dataCw.length);
  }

  const N = spec.size;
  const modules: boolean[][] = Array.from({ length: N }, () => Array(N).fill(false));
  const isFunc: boolean[][] = Array.from({ length: N }, () => Array(N).fill(false));

  const setFunctionModule = (r: number, c: number, dark: boolean) => {
    if (r < 0 || r >= N || c < 0 || c >= N) return;
    modules[r][c] = dark;
    isFunc[r][c] = true;
  };

  // Finder patterns + separators
  const drawFinder = (r0: number, c0: number) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const r = r0 + dr;
        const c = c0 + dc;
        const inOuter = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        const onBorder = dr === 0 || dr === 6 || dc === 0 || dc === 6;
        const inInner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        setFunctionModule(r, c, inOuter && (onBorder || inInner));
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(0, N - 7);
  drawFinder(N - 7, 0);

  // Timing patterns
  for (let i = 8; i < N - 8; i++) {
    setFunctionModule(6, i, i % 2 === 0);
    setFunctionModule(i, 6, i % 2 === 0);
  }

  // Alignment patterns
  const align = spec.alignment;
  for (const r of align) {
    for (const c of align) {
      if ((r === 6 && c === 6) || (r === 6 && c === N - 7) || (r === N - 7 && c === 6)) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const dark = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
          setFunctionModule(r + dr, c + dc, dark);
        }
      }
    }
  }

  // Reserve format info & dark module
  for (let i = 0; i <= 8; i++) {
    if (i !== 6) {
      isFunc[8][i] = true;
      isFunc[i][8] = true;
    }
  }
  for (let i = 0; i < 8; i++) {
    isFunc[8][N - 1 - i] = true;
    isFunc[N - 1 - i][8] = true;
  }
  setFunctionModule(N - 8, 8, true);

  // Place data bits in upward/downward 2-column zig-zags
  let bitIdx = 0;
  const totalBits = finalCodewords.length * 8;
  let upward = true;
  for (let right = N - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < N; vert++) {
      const r = upward ? N - 1 - vert : vert;
      for (let j = 0; j < 2; j++) {
        const c = right - j;
        if (!isFunc[r][c]) {
          let dark = false;
          if (bitIdx < totalBits) {
            dark = ((finalCodewords[bitIdx >>> 3] >>> (7 - (bitIdx & 7))) & 1) === 1;
            bitIdx++;
          }
          modules[r][c] = dark;
        }
      }
    }
    upward = !upward;
  }

  // Apply mask 0: (r + c) % 2 === 0
  const mask = 0;
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (!isFunc[r][c] && (r + c) % 2 === 0) {
        modules[r][c] = !modules[r][c];
      }
    }
  }

  // Write format bits for mask 0
  const fmt = bchFormatBits(mask);
  for (let i = 0; i <= 5; i++) modules[8][i] = ((fmt >>> i) & 1) === 1;
  modules[8][7] = ((fmt >>> 6) & 1) === 1;
  modules[8][8] = ((fmt >>> 7) & 1) === 1;
  modules[7][8] = ((fmt >>> 8) & 1) === 1;
  for (let i = 9; i < 15; i++) modules[14 - i][8] = ((fmt >>> i) & 1) === 1;

  for (let i = 0; i < 8; i++) modules[N - 1 - i][8] = ((fmt >>> i) & 1) === 1;
  for (let i = 8; i < 15; i++) modules[8][N - 15 + i] = ((fmt >>> i) & 1) === 1;

  return modules;
}

const SIZE = 25;
const DATA_CODEWORDS = 34;
const ECC_CODEWORDS = 10;
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
let value = 1;
for (let i = 0; i < 255; i += 1) {
  EXP[i] = value;
  LOG[value] = i;
  value <<= 1;
  if (value & 0x100) value ^= 0x11d;
}
for (let i = 255; i < EXP.length; i += 1) EXP[i] = EXP[i - 255];

const multiply = (a, b) => (!a || !b ? 0 : EXP[LOG[a] + LOG[b]]);

function errorCorrection(data) {
  let generator = [1];
  for (let i = 0; i < ECC_CODEWORDS; i += 1) {
    const next = Array(generator.length + 1).fill(0);
    generator.forEach((coefficient, index) => {
      next[index] ^= coefficient;
      next[index + 1] ^= multiply(coefficient, EXP[i]);
    });
    generator = next;
  }
  const remainder = [...data, ...Array(ECC_CODEWORDS).fill(0)];
  for (let i = 0; i < data.length; i += 1) {
    const factor = remainder[i];
    if (factor) generator.forEach((coefficient, j) => { remainder[i + j] ^= multiply(coefficient, factor); });
  }
  return remainder.slice(data.length);
}

function makeCodewords(text) {
  const bytes = [...new TextEncoder().encode(text)];
  if (bytes.length > 32) throw new Error('Ticket QR payload is too long.');
  const bits = [];
  const append = (number, length) => {
    for (let i = length - 1; i >= 0; i -= 1) bits.push((number >>> i) & 1);
  };
  append(0b0100, 4);
  append(bytes.length, 8);
  bytes.forEach(byte => append(byte, 8));
  for (let i = 0; i < Math.min(4, DATA_CODEWORDS * 8 - bits.length); i += 1) bits.push(0);
  while (bits.length % 8) bits.push(0);
  const data = [];
  for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((number, bit) => (number << 1) | bit, 0));
  for (let pad = 0; data.length < DATA_CODEWORDS; pad += 1) data.push(pad % 2 ? 0x11 : 0xec);
  return [...data, ...errorCorrection(data)];
}

function createMatrix(text) {
  const matrix = Array.from({ length: SIZE }, () => Array(SIZE).fill(false));
  const reserved = Array.from({ length: SIZE }, () => Array(SIZE).fill(false));
  const set = (x, y, dark) => {
    if (x >= 0 && y >= 0 && x < SIZE && y < SIZE) {
      matrix[y][x] = Boolean(dark);
      reserved[y][x] = true;
    }
  };
  const finder = (left, top) => {
    for (let y = -1; y <= 7; y += 1) for (let x = -1; x <= 7; x += 1) {
      const edge = x === 0 || x === 6 || y === 0 || y === 6;
      const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
      set(left + x, top + y, edge || core);
    }
  };
  finder(0, 0);
  finder(SIZE - 7, 0);
  finder(0, SIZE - 7);
  for (let i = 8; i < SIZE - 8; i += 1) {
    set(i, 6, i % 2 === 0);
    set(6, i, i % 2 === 0);
  }
  for (let y = -2; y <= 2; y += 1) for (let x = -2; x <= 2; x += 1) {
    const ring = Math.max(Math.abs(x), Math.abs(y));
    set(18 + x, 18 + y, ring === 2 || ring === 0);
  }

  const formatData = 0b01000; // Low error correction, mask pattern 0.
  let remainder = formatData;
  for (let i = 0; i < 10; i += 1) remainder = (remainder << 1) ^ ((remainder >>> 9) * 0x537);
  const format = ((formatData << 10) | remainder) ^ 0x5412;
  const firstFormat = [[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]];
  const secondFormat = [[SIZE-1,8],[SIZE-2,8],[SIZE-3,8],[SIZE-4,8],[SIZE-5,8],[SIZE-6,8],[SIZE-7,8],[SIZE-8,8],[8,SIZE-7],[8,SIZE-6],[8,SIZE-5],[8,SIZE-4],[8,SIZE-3],[8,SIZE-2],[8,SIZE-1]];
  firstFormat.forEach(([x,y], bit) => set(x, y, (format >>> bit) & 1));
  secondFormat.forEach(([x,y], bit) => set(x, y, (format >>> bit) & 1));
  set(8, SIZE - 8, true);

  const stream = makeCodewords(text).flatMap(byte => Array.from({ length: 8 }, (_, bit) => (byte >>> (7 - bit)) & 1));
  let bit = 0;
  let upward = true;
  for (let right = SIZE - 1; right >= 1; right -= 2) {
    if (right === 6) right -= 1;
    for (let step = 0; step < SIZE; step += 1) {
      const y = upward ? SIZE - 1 - step : step;
      for (let offset = 0; offset < 2; offset += 1) {
        const x = right - offset;
        if (reserved[y][x]) continue;
        const dataBit = bit < stream.length ? stream[bit] : 0;
        matrix[y][x] = Boolean(dataBit ^ ((x + y) % 2 === 0));
        bit += 1;
      }
    }
    upward = !upward;
  }
  return matrix;
}

export function qrSvgDataUrl(value) {
  const matrix = createMatrix(String(value));
  const quiet = 4;
  const cells = [];
  matrix.forEach((row, y) => row.forEach((dark, x) => {
    if (dark) cells.push(`M${x + quiet},${y + quiet}h1v1h-1z`);
  }));
  const dimension = SIZE + quiet * 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dimension} ${dimension}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${cells.join('')}" fill="#17151a"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

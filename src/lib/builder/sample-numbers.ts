import type { MatrixLayout, NumberRuleConfig, TemplateLayout } from "./template-layout";

type NumberGrid = (number | null)[][];
type NextRandom = () => number;

function createSeededRandom(seed: number): NextRandom {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function pickDistinct(nextRandom: NextRandom, minimum: number, maximum: number, count: number): number[] {
  const candidates = Array.from({ length: maximum - minimum + 1 }, (_, offset) => minimum + offset);
  for (let position = 0; position < Math.min(count, candidates.length); position++) {
    const swapPosition = position + Math.floor(nextRandom() * (candidates.length - position));
    [candidates[position], candidates[swapPosition]] = [candidates[swapPosition], candidates[position]];
  }
  return candidates.slice(0, count);
}

function isCenterCell(matrix: MatrixLayout, row: number, col: number): boolean {
  return (
    matrix.rows % 2 === 1 &&
    matrix.cols % 2 === 1 &&
    row === Math.floor(matrix.rows / 2) &&
    col === Math.floor(matrix.cols / 2)
  );
}

function bingo75Sample(matrix: MatrixLayout, nextRandom: NextRandom): NumberGrid {
  const columns = Array.from({ length: matrix.cols }, (_, col) =>
    pickDistinct(nextRandom, col * 15 + 1, col * 15 + 15, matrix.rows),
  );
  return Array.from({ length: matrix.rows }, (_, row) =>
    Array.from({ length: matrix.cols }, (_, col) =>
      matrix.freeCenter && isCenterCell(matrix, row, col) ? null : (columns[col]?.[row] ?? null),
    ),
  );
}

function bingo90Sample(matrix: MatrixLayout, nextRandom: NextRandom): NumberGrid {
  const numbersPerRow = Math.min(5, matrix.cols);
  return Array.from({ length: matrix.rows }, () => {
    const filledColumns = new Set(pickDistinct(nextRandom, 0, matrix.cols - 1, numbersPerRow));
    return Array.from({ length: matrix.cols }, (_, col) => {
      if (!filledColumns.has(col)) return null;
      const first = col === 0 ? 1 : col * 10;
      return first + Math.floor(nextRandom() * 10);
    });
  });
}

function rangeSample(matrix: MatrixLayout, minimum: number, maximum: number, nextRandom: NextRandom): NumberGrid {
  const numbers = maximum >= minimum ? pickDistinct(nextRandom, minimum, maximum, matrix.rows * matrix.cols) : [];
  let nextIndex = 0;
  return Array.from({ length: matrix.rows }, (_, row) =>
    Array.from({ length: matrix.cols }, (_, col) =>
      matrix.freeCenter && isCenterCell(matrix, row, col) ? null : (numbers[nextIndex++] ?? null),
    ),
  );
}

export function generateSampleNumbers(matrix: MatrixLayout, numberRule: NumberRuleConfig, seed: number): NumberGrid {
  const nextRandom = createSeededRandom(seed);
  switch (numberRule.kind) {
    case "bingo75":
      return bingo75Sample(matrix, nextRandom);
    case "bingo90":
      return bingo90Sample(matrix, nextRandom);
    case "range":
      return rangeSample(matrix, numberRule.min, numberRule.max, nextRandom);
  }
}

const SEED_SPACING_PER_MATRIX = 7919;

export function generateSampleTicket(layout: TemplateLayout, numberRule: NumberRuleConfig, seed: number): NumberGrid[] {
  return layout.matrices.map((matrix, matrixIndex) =>
    generateSampleNumbers(matrix, numberRule, seed + matrixIndex * SEED_SPACING_PER_MATRIX),
  );
}

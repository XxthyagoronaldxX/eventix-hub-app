import type { MatrixLayout, RelativeBox, TextAlignment, TextStyle } from "./template-layout";

export interface PixelRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface TextPlacement {
  x: number;
  y: number;
  fontSizePx: number;
  anchor: "start" | "middle" | "end";
}

export interface ImageSize {
  width: number;
  height: number;
}

const HORIZONTAL_INSET_RATIO = 0.08;
const BASELINE_OFFSET_RATIO = 0.35;

const ANCHOR_BY_ALIGNMENT: Record<TextAlignment, TextPlacement["anchor"]> = {
  left: "start",
  center: "middle",
  right: "end",
};

export function toPixelRect(box: RelativeBox, image: ImageSize): PixelRect {
  return {
    left: box.x * image.width,
    top: box.y * image.height,
    width: box.width * image.width,
    height: box.height * image.height,
  };
}

export function computeCellRects(matrix: MatrixLayout, image: ImageSize): PixelRect[][] {
  const cellWidth = (matrix.width - matrix.gapX * (matrix.cols - 1)) / matrix.cols;
  const cellHeight = (matrix.height - matrix.gapY * (matrix.rows - 1)) / matrix.rows;
  return Array.from({ length: matrix.rows }, (_, row) =>
    Array.from({ length: matrix.cols }, (_, col) =>
      toPixelRect(
        {
          x: matrix.x + col * (cellWidth + matrix.gapX),
          y: matrix.y + row * (cellHeight + matrix.gapY),
          width: cellWidth,
          height: cellHeight,
        },
        image,
      ),
    ),
  );
}

export function placeTextInRect(rect: PixelRect, style: TextStyle, image: ImageSize): TextPlacement {
  const fontSizePx = style.size * image.height;
  const horizontalInset = rect.width * HORIZONTAL_INSET_RATIO;
  const xByAlignment: Record<TextAlignment, number> = {
    left: rect.left + horizontalInset,
    center: rect.left + rect.width / 2,
    right: rect.left + rect.width - horizontalInset,
  };
  return {
    x: xByAlignment[style.align],
    y: rect.top + rect.height / 2 + fontSizePx * BASELINE_OFFSET_RATIO,
    fontSizePx,
    anchor: ANCHOR_BY_ALIGNMENT[style.align],
  };
}

const MINIMUM_BOX_SIZE = 0.01;

export function clampBox(box: RelativeBox): RelativeBox {
  const width = Math.min(Math.max(box.width, MINIMUM_BOX_SIZE), 1);
  const height = Math.min(Math.max(box.height, MINIMUM_BOX_SIZE), 1);
  return {
    x: Math.min(Math.max(box.x, 0), 1 - width),
    y: Math.min(Math.max(box.y, 0), 1 - height),
    width,
    height,
  };
}

export function boxBetweenPoints(start: { x: number; y: number }, end: { x: number; y: number }): RelativeBox {
  return clampBox({
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  });
}

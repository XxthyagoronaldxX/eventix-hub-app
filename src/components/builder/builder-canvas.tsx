"use client";

import { type PointerEvent, useRef } from "react";
import {
  boxBetweenPoints,
  clampBox,
  computeCellRects,
  type ImageSize,
  placeTextInRect,
  toPixelRect,
} from "@/lib/builder/layout-geometry";
import type { MatrixLayout, RelativeBox, TemplateLayout, TextStyle } from "@/lib/builder/template-layout";
import { type BuilderElementKey, findElementBox, matrixElementKey } from "./builder-elements";
import { QrCodePreview } from "./qr-code-preview";

type ResizeCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

interface RelativePoint {
  x: number;
  y: number;
}

type Interaction =
  | { mode: "move"; elementKey: BuilderElementKey; origin: RelativePoint; startBox: RelativeBox }
  | { mode: "resize"; elementKey: BuilderElementKey; anchor: RelativePoint }
  | { mode: "draw"; elementKey: BuilderElementKey; origin: RelativePoint };

interface BuilderCanvasProps {
  imageUrl: string;
  image: ImageSize;
  layout: TemplateLayout;
  sampleNumbers: (number | null)[][][];
  sampleTicketCode: string;
  selectedElement: BuilderElementKey;
  zoomPercent: number;
  onSelectElement: (elementKey: BuilderElementKey) => void;
  onChangeElementBox: (elementKey: BuilderElementKey, box: RelativeBox) => void;
}

const RESIZE_CORNERS: ResizeCorner[] = ["top-left", "top-right", "bottom-left", "bottom-right"];
const RESIZE_CURSOR_CLASS: Record<ResizeCorner, string> = {
  "top-left": "cursor-nwse-resize",
  "bottom-right": "cursor-nwse-resize",
  "top-right": "cursor-nesw-resize",
  "bottom-left": "cursor-nesw-resize",
};
const SELECTION_COLOR = "#4b3fd8";
const IDLE_COLOR = "#f5a524";

function cornerPoint(box: RelativeBox, corner: ResizeCorner): RelativePoint {
  return {
    x: corner.endsWith("left") ? box.x : box.x + box.width,
    y: corner.startsWith("top") ? box.y : box.y + box.height,
  };
}

function oppositeCorner(corner: ResizeCorner): ResizeCorner {
  const vertical = corner.startsWith("top") ? "bottom" : "top";
  const horizontal = corner.endsWith("left") ? "right" : "left";
  return `${vertical}-${horizontal}` as ResizeCorner;
}

function fittedWidth(image: ImageSize, zoomPercent: number): string {
  const aspectRatio = image.width / image.height;
  return `calc(min(100cqw, 100cqh * ${aspectRatio.toFixed(4)}) * ${zoomPercent / 100})`;
}

function clampToUnit(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

export function BuilderCanvas({
  imageUrl,
  image,
  layout,
  sampleNumbers,
  sampleTicketCode,
  selectedElement,
  zoomPercent,
  onSelectElement,
  onChangeElementBox,
}: BuilderCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const interactionRef = useRef<Interaction | null>(null);
  const handleRadius = Math.max(image.width, image.height) * 0.008;

  function readRelativePoint(event: PointerEvent): RelativePoint {
    const bounds = svgRef.current?.getBoundingClientRect();
    if (!bounds) return { x: 0, y: 0 };
    return {
      x: clampToUnit((event.clientX - bounds.left) / bounds.width),
      y: clampToUnit((event.clientY - bounds.top) / bounds.height),
    };
  }

  function beginInteraction(event: PointerEvent, interaction: Interaction) {
    event.stopPropagation();
    svgRef.current?.setPointerCapture(event.pointerId);
    interactionRef.current = interaction;
  }

  function startMoving(event: PointerEvent, elementKey: BuilderElementKey) {
    const startBox = findElementBox(layout, elementKey);
    if (!startBox) return;
    onSelectElement(elementKey);
    beginInteraction(event, { mode: "move", elementKey, origin: readRelativePoint(event), startBox });
  }

  function startResizing(event: PointerEvent, corner: ResizeCorner) {
    const box = findElementBox(layout, selectedElement);
    if (!box) return;
    beginInteraction(event, {
      mode: "resize",
      elementKey: selectedElement,
      anchor: cornerPoint(box, oppositeCorner(corner)),
    });
  }

  function startDrawing(event: PointerEvent) {
    if (!findElementBox(layout, selectedElement)) return;
    beginInteraction(event, { mode: "draw", elementKey: selectedElement, origin: readRelativePoint(event) });
  }

  function continueInteraction(event: PointerEvent) {
    const interaction = interactionRef.current;
    if (!interaction) return;
    const point = readRelativePoint(event);
    if (interaction.mode === "move") {
      onChangeElementBox(
        interaction.elementKey,
        clampBox({
          ...interaction.startBox,
          x: interaction.startBox.x + point.x - interaction.origin.x,
          y: interaction.startBox.y + point.y - interaction.origin.y,
        }),
      );
    } else if (interaction.mode === "resize") {
      onChangeElementBox(interaction.elementKey, boxBetweenPoints(interaction.anchor, point));
    } else {
      onChangeElementBox(interaction.elementKey, boxBetweenPoints(interaction.origin, point));
    }
  }

  function endInteraction(event: PointerEvent) {
    if (svgRef.current?.hasPointerCapture(event.pointerId)) {
      svgRef.current.releasePointerCapture(event.pointerId);
    }
    interactionRef.current = null;
  }

  function outlineColor(elementKey: BuilderElementKey) {
    return elementKey === selectedElement ? SELECTION_COLOR : IDLE_COLOR;
  }

  function renderText(text: string, box: RelativeBox, style: TextStyle, key: string) {
    const placement = placeTextInRect(toPixelRect(box, image), style, image);
    return (
      <text
        key={key}
        x={placement.x}
        y={placement.y}
        fontFamily={style.family}
        fontSize={placement.fontSizePx}
        fontWeight={style.weight}
        fill={style.color}
        textAnchor={placement.anchor}
        pointerEvents="none"
      >
        {text}
      </text>
    );
  }

  const selectedBox = findElementBox(layout, selectedElement);

  function renderMatrix(matrix: MatrixLayout, matrixIndex: number) {
    const elementKey = matrixElementKey(matrixIndex);
    const matrixRect = toPixelRect(matrix, image);
    const cellRects = computeCellRects(matrix, image);
    const matrixNumbers = sampleNumbers[matrixIndex] ?? [];
    const labelSize = Math.max(image.width, image.height) * 0.016;
    return (
      <g key={elementKey} onPointerDown={(event) => startMoving(event, elementKey)} className="cursor-move">
        <rect
          x={matrixRect.left}
          y={matrixRect.top}
          width={matrixRect.width}
          height={matrixRect.height}
          fill="rgb(75 63 216 / 6%)"
          stroke={outlineColor(elementKey)}
          strokeWidth={2}
          strokeDasharray="8 6"
          vectorEffect="non-scaling-stroke"
        />
        {cellRects.flatMap((rowRects, row) =>
          rowRects.map((cellRect, col) => (
            <rect
              key={`cell-${row}-${col}`}
              x={cellRect.left}
              y={cellRect.top}
              width={cellRect.width}
              height={cellRect.height}
              fill="none"
              stroke={outlineColor(elementKey)}
              strokeOpacity={0.35}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          )),
        )}
        {cellRects.flatMap((rowRects, row) =>
          rowRects.flatMap((cellRect, col) => {
            const value = matrixNumbers[row]?.[col];
            if (value === null || value === undefined) return [];
            const cellBox = {
              x: cellRect.left / image.width,
              y: cellRect.top / image.height,
              width: cellRect.width / image.width,
              height: cellRect.height / image.height,
            };
            return [renderText(String(value), cellBox, matrix.font, `number-${row}-${col}`)];
          }),
        )}
        {layout.matrices.length > 1 && (
          <g pointerEvents="none">
            <rect
              x={matrixRect.left}
              y={matrixRect.top - labelSize * 1.6}
              width={labelSize * 2.2}
              height={labelSize * 1.5}
              rx={labelSize * 0.3}
              fill={outlineColor(elementKey)}
            />
            <text
              x={matrixRect.left + labelSize * 1.1}
              y={matrixRect.top - labelSize * 0.45}
              fontFamily="Arial"
              fontSize={labelSize}
              fontWeight={700}
              fill="#ffffff"
              textAnchor="middle"
            >
              {matrixIndex + 1}
            </text>
          </g>
        )}
      </g>
    );
  }

  return (
    <div className="checkerboard flex min-h-0 flex-1 overflow-auto overscroll-contain rounded-lg border p-4 [container-type:size]">
      <div className="m-auto shrink-0" style={{ width: fittedWidth(image, zoomPercent) }}>
        <svg
          ref={svgRef}
          className="block h-auto w-full cursor-crosshair touch-none select-none"
          viewBox={`0 0 ${image.width} ${image.height}`}
          style={{ aspectRatio: `${image.width} / ${image.height}` }}
          onPointerDown={startDrawing}
          onPointerMove={continueInteraction}
          onPointerUp={endInteraction}
          onPointerCancel={endInteraction}
          role="img"
          aria-label="Pré-visualização da cartela"
        >
          <image href={imageUrl} x={0} y={0} width={image.width} height={image.height} />

          {layout.matrices.map(renderMatrix)}

          {layout.fields.map((field) => {
            const fieldRect = toPixelRect(field, image);
            return (
              <g key={field.type} onPointerDown={(event) => startMoving(event, field.type)} className="cursor-move">
                <rect
                  x={fieldRect.left}
                  y={fieldRect.top}
                  width={fieldRect.width}
                  height={fieldRect.height}
                  fill={field.type === "qrCode" ? "rgb(29 27 22 / 12%)" : "rgb(245 165 36 / 8%)"}
                  stroke={outlineColor(field.type)}
                  strokeWidth={2}
                  strokeDasharray="8 6"
                  vectorEffect="non-scaling-stroke"
                />
                {field.type === "ticketCode" ? (
                  renderText(sampleTicketCode, field, field.font, "ticket-code")
                ) : (
                  <QrCodePreview text={sampleTicketCode} rect={fieldRect} />
                )}
              </g>
            );
          })}

          {selectedBox &&
            RESIZE_CORNERS.map((corner) => {
              const point = cornerPoint(selectedBox, corner);
              return (
                <circle
                  key={corner}
                  className={RESIZE_CURSOR_CLASS[corner]}
                  cx={point.x * image.width}
                  cy={point.y * image.height}
                  r={handleRadius}
                  fill="#ffffff"
                  stroke={SELECTION_COLOR}
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                  onPointerDown={(event) => startResizing(event, corner)}
                />
              );
            })}
        </svg>
      </div>
    </div>
  );
}

import { matrixLabel } from "@/lib/builder/layout-problems";
import type { LayoutFieldType, RelativeBox, TemplateLayout } from "@/lib/builder/template-layout";

export type MatrixElementKey = `matrix-${number}`;
export type BuilderElementKey = MatrixElementKey | LayoutFieldType;

const FIELD_LABELS: Record<LayoutFieldType, string> = {
  ticketCode: "Código do ticket",
  qrCode: "QR Code",
};

export function matrixElementKey(matrixIndex: number): MatrixElementKey {
  return `matrix-${matrixIndex}`;
}

export function matrixIndexOf(elementKey: BuilderElementKey): number | null {
  return elementKey.startsWith("matrix-") ? Number(elementKey.slice("matrix-".length)) : null;
}

export function elementLabel(elementKey: BuilderElementKey): string {
  const matrixIndex = matrixIndexOf(elementKey);
  return matrixIndex === null ? FIELD_LABELS[elementKey as LayoutFieldType] : matrixLabel(matrixIndex);
}

export function listElementKeys(layout: TemplateLayout): BuilderElementKey[] {
  return [
    ...layout.matrices.map((_, matrixIndex) => matrixElementKey(matrixIndex)),
    ...layout.fields.map((field) => field.type),
  ];
}

export function findElementBox(layout: TemplateLayout, elementKey: BuilderElementKey): RelativeBox | null {
  const matrixIndex = matrixIndexOf(elementKey);
  if (matrixIndex !== null) {
    return layout.matrices[matrixIndex] ?? null;
  }
  return layout.fields.find((field) => field.type === elementKey) ?? null;
}

export function withElementBox(
  layout: TemplateLayout,
  elementKey: BuilderElementKey,
  box: RelativeBox,
): TemplateLayout {
  const matrixIndex = matrixIndexOf(elementKey);
  if (matrixIndex !== null) {
    return {
      ...layout,
      matrices: layout.matrices.map((matrix, index) => (index === matrixIndex ? { ...matrix, ...box } : matrix)),
    };
  }
  return {
    ...layout,
    fields: layout.fields.map((field) => (field.type === elementKey ? { ...field, ...box } : field)),
  };
}

export const FONT_FAMILIES = ["Arial", "Verdana", "Georgia", "Times New Roman", "Courier New", "Trebuchet MS"] as const;

export type FontFamily = (typeof FONT_FAMILIES)[number];

export const FONT_WEIGHTS = [400, 500, 600, 700] as const;
export type FontWeight = (typeof FONT_WEIGHTS)[number];

export const TEXT_ALIGNMENTS = ["left", "center", "right"] as const;
export type TextAlignment = (typeof TEXT_ALIGNMENTS)[number];

export interface TextStyle {
  family: FontFamily;
  size: number;
  weight: FontWeight;
  color: string;
  align: TextAlignment;
}

export interface RelativeBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MatrixLayout extends RelativeBox {
  rows: number;
  cols: number;
  gapX: number;
  gapY: number;
  freeCenter: boolean;
  font: TextStyle;
}

export type TicketCodeField = RelativeBox & { type: "ticketCode"; font: TextStyle };
export type QrCodeField = RelativeBox & { type: "qrCode" };
export type LayoutField = TicketCodeField | QrCodeField;
export type LayoutFieldType = LayoutField["type"];

export const MAXIMUM_MATRICES_PER_TEMPLATE = 12;

export interface TemplateLayout {
  matrices: MatrixLayout[];
  fields: LayoutField[];
}

export type NumberRuleKind = "bingo75" | "bingo90" | "range";

export type NumberRuleConfig = { kind: "bingo75" } | { kind: "bingo90" } | { kind: "range"; min: number; max: number };

export interface MatrixShapePreset {
  rows: number;
  cols: number;
  freeCenter: boolean;
}

export const MATRIX_SHAPE_BY_RULE: Partial<Record<NumberRuleKind, MatrixShapePreset>> = {
  bingo75: { rows: 5, cols: 5, freeCenter: true },
  bingo90: { rows: 3, cols: 9, freeCenter: false },
};

export const NUMBER_RULE_LABELS: Record<NumberRuleKind, string> = {
  bingo75: "Bingo 75 (5×5, B-I-N-G-O)",
  bingo90: "Bingo 90 (3×9)",
  range: "Faixa livre",
};

const DEFAULT_TEXT_STYLE: TextStyle = {
  family: "Arial",
  size: 0.045,
  weight: 700,
  color: "#1a1a1a",
  align: "center",
};

export const DEFAULT_TICKET_CODE_FIELD: TicketCodeField = {
  type: "ticketCode",
  x: 0.55,
  y: 0.9,
  width: 0.35,
  height: 0.04,
  font: { ...DEFAULT_TEXT_STYLE, size: 0.02, weight: 600, align: "right" },
};

export const DEFAULT_QR_CODE_FIELD: QrCodeField = {
  type: "qrCode",
  x: 0.08,
  y: 0.84,
  width: 0.12,
  height: 0.12,
};

export const DEFAULT_MATRIX: MatrixLayout = {
  x: 0.1,
  y: 0.28,
  width: 0.8,
  height: 0.52,
  rows: 5,
  cols: 5,
  gapX: 0.01,
  gapY: 0.01,
  freeCenter: true,
  font: DEFAULT_TEXT_STYLE,
};

export const DEFAULT_TEMPLATE_LAYOUT: TemplateLayout = {
  matrices: [DEFAULT_MATRIX],
  fields: [DEFAULT_TICKET_CODE_FIELD],
};

export const DEFAULT_NUMBER_RULE: NumberRuleConfig = { kind: "bingo75" };

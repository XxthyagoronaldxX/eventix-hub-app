import type { TemplateKind } from "@/lib/api/types";
import { z } from "@/lib/validation/zod";
import {
  FONT_FAMILIES,
  FONT_WEIGHTS,
  MATRIX_SHAPE_BY_RULE,
  MAXIMUM_MATRICES_PER_TEMPLATE,
  type MatrixLayout,
  type NumberRuleConfig,
  type TemplateLayout,
  TEXT_ALIGNMENTS,
} from "./template-layout";

const BOUNDARY_TOLERANCE = 0.0001;
const MAXIMUM_RANGE_SIZE = 10_000;

export function matrixLabel(matrixIndex: number): string {
  return `Matriz ${matrixIndex + 1}`;
}

const relativeBoxSchema = z
  .object({
    x: z.number().min(0),
    y: z.number().min(0),
    width: z.number().min(0.001),
    height: z.number().min(0.001),
  })
  .refine((box) => box.x + box.width <= 1 + BOUNDARY_TOLERANCE && box.y + box.height <= 1 + BOUNDARY_TOLERANCE, {
    error: "precisa ficar inteira dentro da imagem.",
  });

const textStyleSchema = z.object({
  family: z.enum(FONT_FAMILIES),
  size: z.number().min(0.002, { error: "o tamanho da fonte é pequeno demais." }).max(0.5),
  weight: z.union(FONT_WEIGHTS.map((weight) => z.literal(weight))),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, { error: "use uma cor no formato #RRGGBB." }),
  align: z.enum(TEXT_ALIGNMENTS),
});

const matrixSchema = z
  .object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    rows: z.int().min(1).max(20),
    cols: z.int().min(1).max(20),
    gapX: z.number().min(0).max(0.2),
    gapY: z.number().min(0).max(0.2),
    freeCenter: z.boolean(),
    font: textStyleSchema,
  })
  .superRefine((matrix, context) => {
    if (!relativeBoxSchema.safeParse(matrix).success) {
      context.addIssue({ code: "custom", message: "a matriz precisa ficar inteira dentro da imagem." });
    }
    if (matrix.gapX * (matrix.cols - 1) >= matrix.width || matrix.gapY * (matrix.rows - 1) >= matrix.height) {
      context.addIssue({ code: "custom", message: "o espaçamento entre as células é maior que a própria matriz." });
    }
  });

const numberRuleSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("bingo75") }),
  z.object({ kind: z.literal("bingo90") }),
  z
    .object({ kind: z.literal("range"), min: z.int().min(0), max: z.int() })
    .refine((rule) => rule.max >= rule.min, { error: "O número máximo precisa ser maior que o mínimo." })
    .refine((rule) => rule.max - rule.min + 1 <= MAXIMUM_RANGE_SIZE, {
      error: `A faixa de números pode ter no máximo ${MAXIMUM_RANGE_SIZE} valores.`,
    }),
]);

const fieldSchema = z
  .union([
    z.object({
      type: z.literal("ticketCode"),
      font: textStyleSchema,
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    }),
    z.object({ type: z.literal("qrCode"), x: z.number(), y: z.number(), width: z.number(), height: z.number() }),
  ])
  .refine((field) => relativeBoxSchema.safeParse(field).success, {
    error: "os campos extras precisam ficar inteiros dentro da imagem.",
  });

function hasCenterCell(matrix: MatrixLayout): boolean {
  return matrix.rows % 2 === 1 && matrix.cols % 2 === 1;
}

function findRuleShapeProblem(matrix: MatrixLayout, numberRule: NumberRuleConfig): string | null {
  const preset = MATRIX_SHAPE_BY_RULE[numberRule.kind];
  if (numberRule.kind === "bingo75" && (matrix.rows !== preset?.rows || matrix.cols !== preset?.cols)) {
    return "o Bingo 75 usa uma matriz de 5 linhas por 5 colunas.";
  }
  if (
    numberRule.kind === "bingo90" &&
    (matrix.rows !== preset?.rows || matrix.cols !== preset?.cols || matrix.freeCenter)
  ) {
    return "o Bingo 90 usa uma matriz de 3 linhas por 9 colunas, sem centro livre.";
  }
  if (numberRule.kind === "range") {
    if (matrix.freeCenter && !hasCenterCell(matrix)) {
      return "a célula central livre exige número ímpar de linhas e colunas.";
    }
    const numberedCells = matrix.rows * matrix.cols - (matrix.freeCenter ? 1 : 0);
    if (numberRule.max - numberRule.min + 1 < numberedCells) {
      return "a faixa de números é menor que a quantidade de células da matriz.";
    }
  }
  return null;
}

export const templateDesignSchema = z
  .object({
    layout: z.object({
      matrices: z
        .array(matrixSchema)
        .max(MAXIMUM_MATRICES_PER_TEMPLATE, { error: `Use no máximo ${MAXIMUM_MATRICES_PER_TEMPLATE} matrizes.` }),
      fields: z
        .array(fieldSchema)
        .refine((fields) => new Set(fields.map((field) => field.type)).size === fields.length, {
          error: "Cada campo extra pode aparecer apenas uma vez.",
        }),
    }),
    numberRule: numberRuleSchema,
  })
  .superRefine((design, context) => {
    design.layout.matrices.forEach((matrix, matrixIndex) => {
      const problem = findRuleShapeProblem(matrix as MatrixLayout, design.numberRule as NumberRuleConfig);
      if (problem) {
        context.addIssue({ code: "custom", message: problem, path: ["layout", "matrices", matrixIndex] });
      }
    });
  });

function describeIssue(issue: z.core.$ZodIssue): string {
  const [section, collection, index] = issue.path;
  if (section === "layout" && collection === "matrices" && typeof index === "number") {
    return `${matrixLabel(index)}: ${issue.message}`;
  }
  if (section === "layout" && collection === "fields") {
    return `Campos extras: ${issue.message}`;
  }
  return issue.message;
}

function findKindProblems(layout: TemplateLayout, kind: TemplateKind): string[] {
  if (kind === "bingo") {
    return layout.matrices.length === 0 ? ["Adicione pelo menos uma matriz de números."] : [];
  }
  return layout.fields.length === 0 ? ["Adicione o código do ticket ou o QR Code."] : [];
}

export function findLayoutProblems(
  layout: TemplateLayout,
  numberRule: NumberRuleConfig,
  kind: TemplateKind = "bingo",
): string[] {
  const result = templateDesignSchema.safeParse({ layout, numberRule });
  const designProblems = result.success ? [] : result.error.issues.map(describeIssue);
  return [...new Set([...findKindProblems(layout, kind), ...designProblems])];
}

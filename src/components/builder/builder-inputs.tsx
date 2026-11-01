"use client";

import { ColorFormField } from "@/components/form/color-form-field";
import { NumberFormField } from "@/components/form/number-form-field";
import { SelectFormField } from "@/components/form/select-form-field";
import {
  FONT_FAMILIES,
  FONT_WEIGHTS,
  type FontFamily,
  type FontWeight,
  type RelativeBox,
  TEXT_ALIGNMENTS,
  type TextAlignment,
  type TextStyle,
} from "@/lib/builder/template-layout";

const PERCENT = 100;

const ALIGNMENT_LABELS: Record<TextAlignment, string> = {
  left: "Esquerda",
  center: "Centro",
  right: "Direita",
};

const FONT_FAMILY_OPTIONS = FONT_FAMILIES.map((family) => ({ value: family, label: family }));
const FONT_WEIGHT_OPTIONS = FONT_WEIGHTS.map((weight) => ({ value: String(weight), label: String(weight) }));
const ALIGNMENT_OPTIONS = TEXT_ALIGNMENTS.map((alignment) => ({
  value: alignment,
  label: ALIGNMENT_LABELS[alignment],
}));

interface PercentInputProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number | "any";
  min?: number;
  max?: number;
}

export function PercentInput({ id, label, value, onChange, step = "any", min = 0, max = 100 }: PercentInputProps) {
  return (
    <NumberFormField
      id={id}
      label={label}
      unit="%"
      compact
      step={step}
      min={min}
      max={max}
      value={Number((value * PERCENT).toFixed(2))}
      onValueChange={(percentValue) => onChange(percentValue / PERCENT)}
    />
  );
}

interface BoxInputsProps {
  idPrefix: string;
  box: RelativeBox;
  onChange: (box: RelativeBox) => void;
}

export function BoxInputs({ idPrefix, box, onChange }: BoxInputsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <PercentInput id={`${idPrefix}-x`} label="X" value={box.x} onChange={(x) => onChange({ ...box, x })} />
      <PercentInput id={`${idPrefix}-y`} label="Y" value={box.y} onChange={(y) => onChange({ ...box, y })} />
      <PercentInput
        id={`${idPrefix}-width`}
        label="Largura"
        value={box.width}
        min={1}
        onChange={(width) => onChange({ ...box, width })}
      />
      <PercentInput
        id={`${idPrefix}-height`}
        label="Altura"
        value={box.height}
        min={1}
        onChange={(height) => onChange({ ...box, height })}
      />
    </div>
  );
}

interface TextStyleInputsProps {
  idPrefix: string;
  style: TextStyle;
  onChange: (style: TextStyle) => void;
}

export function TextStyleInputs({ idPrefix, style, onChange }: TextStyleInputsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <SelectFormField
        id={`${idPrefix}-font-family`}
        label="Fonte"
        compact
        options={FONT_FAMILY_OPTIONS}
        value={style.family}
        onValueChange={(family) => onChange({ ...style, family: family as FontFamily })}
      />
      <PercentInput
        id={`${idPrefix}-font-size`}
        label="Tamanho (altura)"
        value={style.size}
        min={0.2}
        max={50}
        onChange={(size) => onChange({ ...style, size })}
      />
      <SelectFormField
        id={`${idPrefix}-font-weight`}
        label="Peso"
        compact
        options={FONT_WEIGHT_OPTIONS}
        value={String(style.weight)}
        onValueChange={(weight) => onChange({ ...style, weight: Number(weight) as FontWeight })}
      />
      <SelectFormField
        id={`${idPrefix}-font-align`}
        label="Alinhamento"
        compact
        options={ALIGNMENT_OPTIONS}
        value={style.align}
        onValueChange={(align) => onChange({ ...style, align: align as TextAlignment })}
      />
      <ColorFormField
        id={`${idPrefix}-font-color`}
        label="Cor"
        compact
        value={style.color}
        onValueChange={(color) => onChange({ ...style, color })}
      />
    </div>
  );
}

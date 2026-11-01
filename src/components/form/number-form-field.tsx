import type { ChangeEvent, ComponentProps, ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { errorAttributes, FieldShell, fieldIdFor } from "./field-shell";

export interface NumberFormFieldProps extends Omit<ComponentProps<typeof Input>, "type" | "onChange" | "value"> {
  label: string;
  hint?: ReactNode;
  error?: string;
  unit?: string;
  compact?: boolean;
  fieldClassName?: string;
  value?: number;
  onValueChange?: (value: number) => void;
}

export function NumberFormField({
  label,
  hint,
  error,
  unit,
  compact,
  fieldClassName,
  id,
  name,
  value,
  onValueChange,
  step = "any",
  className,
  ...inputProps
}: NumberFormFieldProps) {
  const fieldId = fieldIdFor(id, name, label);
  const controlledProps =
    onValueChange === undefined
      ? {}
      : {
          value: Number.isFinite(value) ? value : "",
          onChange: (event: ChangeEvent<HTMLInputElement>) => {
            const parsedValue = Number.parseFloat(event.target.value.replace(",", "."));
            if (Number.isFinite(parsedValue)) onValueChange(parsedValue);
          },
        };
  return (
    <FieldShell label={label} htmlFor={fieldId} hint={hint} error={error} compact={compact} className={fieldClassName}>
      <div className="relative">
        <Input
          id={fieldId}
          name={name}
          type="number"
          inputMode="decimal"
          step={step}
          className={cn("tabular-nums", compact && "h-8", unit && "pr-9", className)}
          {...errorAttributes(fieldId, error)}
          {...controlledProps}
          {...inputProps}
        />
        {unit && (
          <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
    </FieldShell>
  );
}

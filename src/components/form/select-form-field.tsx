import type { ReactNode } from "react";
import { errorAttributes, FieldShell, fieldIdFor } from "./field-shell";
import { SelectInput, type SelectInputProps } from "./select-input";

export type { SelectOption } from "./select-input";

export interface SelectFormFieldProps extends SelectInputProps {
  label: string;
  hint?: ReactNode;
  error?: string;
  compact?: boolean;
  fieldClassName?: string;
}

export function SelectFormField({
  label,
  hint,
  error,
  compact,
  fieldClassName,
  id,
  name,
  ...selectProps
}: SelectFormFieldProps) {
  const fieldId = fieldIdFor(id, name, label);
  return (
    <FieldShell label={label} htmlFor={fieldId} hint={hint} error={error} compact={compact} className={fieldClassName}>
      <SelectInput
        id={fieldId}
        name={name}
        size={compact ? "sm" : "default"}
        {...errorAttributes(fieldId, error)}
        {...selectProps}
      />
    </FieldShell>
  );
}

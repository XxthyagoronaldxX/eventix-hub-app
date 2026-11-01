import type { ComponentProps, ReactNode } from "react";
import { Textarea } from "@/components/ui/textarea";
import { errorAttributes, FieldShell, fieldIdFor } from "./field-shell";

export interface TextareaFormFieldProps extends ComponentProps<typeof Textarea> {
  label: string;
  hint?: ReactNode;
  error?: string;
  fieldClassName?: string;
}

export function TextareaFormField({
  label,
  hint,
  error,
  fieldClassName,
  id,
  name,
  ...textareaProps
}: TextareaFormFieldProps) {
  const fieldId = fieldIdFor(id, name, label);
  return (
    <FieldShell label={label} htmlFor={fieldId} hint={hint} error={error} className={fieldClassName}>
      <Textarea id={fieldId} name={name} {...errorAttributes(fieldId, error)} {...textareaProps} />
    </FieldShell>
  );
}

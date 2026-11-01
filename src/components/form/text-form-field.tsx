import type { ComponentProps, ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { errorAttributes, FieldShell, fieldIdFor } from "./field-shell";

type TextInputType = "text" | "email" | "password" | "search" | "url";

export interface TextFormFieldProps extends Omit<ComponentProps<typeof Input>, "type"> {
  label: string;
  type?: TextInputType;
  hint?: ReactNode;
  error?: string;
  compact?: boolean;
  fieldClassName?: string;
}

export function TextFormField({
  label,
  hint,
  error,
  compact,
  fieldClassName,
  id,
  name,
  type = "text",
  className,
  ...inputProps
}: TextFormFieldProps) {
  const fieldId = fieldIdFor(id, name, label);
  return (
    <FieldShell label={label} htmlFor={fieldId} hint={hint} error={error} compact={compact} className={fieldClassName}>
      <Input
        id={fieldId}
        name={name}
        type={type}
        className={cn(compact && "h-8", className)}
        {...errorAttributes(fieldId, error)}
        {...inputProps}
      />
    </FieldShell>
  );
}

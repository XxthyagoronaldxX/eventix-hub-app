import { Upload } from "lucide-react";
import type { ReactNode } from "react";
import { FieldShell, fieldIdFor } from "./field-shell";

interface FileFormFieldProps {
  label: string;
  name: string;
  accept: string;
  prompt: string;
  hint?: ReactNode;
  required?: boolean;
  id?: string;
}

export function FileFormField({ label, name, accept, prompt, hint, required, id }: FileFormFieldProps) {
  const fieldId = fieldIdFor(id, name, label);
  return (
    <FieldShell label={label} htmlFor={fieldId} hint={hint}>
      <label
        htmlFor={fieldId}
        className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed bg-muted/40 px-6 py-8 text-center transition-colors hover:border-primary/50 hover:bg-accent/40"
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Upload className="size-5" aria-hidden="true" />
        </span>
        <span className="text-sm font-medium">{prompt}</span>
        <input id={fieldId} type="file" name={name} accept={accept} required={required} className="max-w-full" />
      </label>
    </FieldShell>
  );
}

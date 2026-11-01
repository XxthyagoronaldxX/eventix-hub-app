import { FieldShell, fieldIdFor } from "./field-shell";

interface ColorFormFieldProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  id?: string;
  compact?: boolean;
}

export function ColorFormField({ label, value, onValueChange, id, compact }: ColorFormFieldProps) {
  const fieldId = fieldIdFor(id, undefined, label);
  return (
    <FieldShell label={label} htmlFor={fieldId} compact={compact}>
      <label
        htmlFor={fieldId}
        className="relative flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-input bg-transparent px-2 transition-colors hover:bg-muted/50 dark:bg-input/30"
      >
        <span
          className="size-4 shrink-0 rounded border shadow-xs"
          style={{ backgroundColor: value }}
          aria-hidden="true"
        />
        <span className="font-mono text-xs uppercase">{value}</span>
        <input
          id={fieldId}
          type="color"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          className="sr-only"
        />
      </label>
    </FieldShell>
  );
}

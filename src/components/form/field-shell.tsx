import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface FieldShellProps {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  error?: string;
  compact?: boolean;
  className?: string;
  children: ReactNode;
}

export function FieldShell({ label, htmlFor, hint, error, compact = false, className, children }: FieldShellProps) {
  return (
    <div className={cn("grid content-start", compact ? "gap-1.5" : "gap-2", className)}>
      <Label htmlFor={htmlFor} className={cn(compact && "text-xs font-medium text-muted-foreground")}>
        {label}
      </Label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

export function fieldIdFor(id: string | undefined, name: string | undefined, label: string): string {
  return (
    id ??
    `field-${
      name ??
      label
        .toLowerCase()
        .normalize("NFD")
        .replace(/[^a-z0-9]+/g, "-")
    }`
  );
}

export function errorAttributes(fieldId: string, error: string | undefined) {
  return error ? { "aria-invalid": true, "aria-describedby": `${fieldId}-error` } : {};
}

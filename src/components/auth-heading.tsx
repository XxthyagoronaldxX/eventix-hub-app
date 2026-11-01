import type { ReactNode } from "react";

export function AuthHeading({ title, description }: { title: string; description?: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

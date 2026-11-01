import * as React from "react";
import { cn } from "@/lib/utils";

function Progress({ className, value = 0, ...props }: React.ComponentProps<"div"> & { value?: number }) {
  const boundedValue = Math.min(Math.max(value, 0), 100);
  return (
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={boundedValue}
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${boundedValue}%` }}
      />
    </div>
  );
}

export { Progress };

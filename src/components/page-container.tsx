import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageContainer({ wide = false, children }: { wide?: boolean; children: ReactNode }) {
  return <div className={cn("mx-auto flex flex-col gap-6", wide ? "max-w-[1600px]" : "max-w-6xl")}>{children}</div>;
}

"use client";

import { toast } from "sonner";
import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const COPIED_FEEDBACK_MS = 1500;

export function CopyableCode({ value, className }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    return () => clearTimeout(timeout);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`Código ${value} copiado.`, { id: "copied-code" });
    } catch {
      setCopied(false);
      toast.error("Não foi possível copiar o código.");
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={copied ? "Copiado!" : "Clique para copiar"}
      aria-label={copied ? `${value} copiado` : `Copiar ${value}`}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 font-mono text-xs font-medium transition-colors",
        copied ? "bg-success/15 text-success" : "bg-muted hover:bg-primary/15 hover:text-primary",
        className,
      )}
    >
      {value}
      {copied ? (
        <Check className="size-3" aria-hidden="true" />
      ) : (
        <Copy className="size-3 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
      )}
      <span aria-live="polite" className="sr-only">
        {copied ? "Código copiado" : ""}
      </span>
    </button>
  );
}

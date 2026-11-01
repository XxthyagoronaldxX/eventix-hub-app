"use client";

import { Check, Grid3x3, Search } from "lucide-react";
import { type KeyboardEvent, useState } from "react";
import { Input } from "@/components/ui/input";
import type { TemplateSummary } from "@/lib/api/types";
import { NUMBER_RULE_LABELS } from "@/lib/builder/template-layout";
import { cn } from "@/lib/utils";

interface TemplatePickerProps {
  templates: TemplateSummary[];
  name: string;
  defaultTemplateId?: string;
  lastUsedTemplateId?: string;
}

const SEARCH_THRESHOLD = 6;

function matrixLabel(count: number): string {
  return count === 1 ? "1 matriz" : `${count} matrizes`;
}

export function TemplatePicker({ templates, name, defaultTemplateId, lastUsedTemplateId }: TemplatePickerProps) {
  const [selectedId, setSelectedId] = useState(defaultTemplateId ?? templates[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  const visibleTemplates = normalizedQuery ? templates.filter((template) => template.name.toLocaleLowerCase("pt-BR").includes(normalizedQuery)) : templates;

  function moveSelection(event: KeyboardEvent<HTMLDivElement>) {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step || visibleTemplates.length === 0) return;
    event.preventDefault();
    const currentIndex = visibleTemplates.findIndex((template) => template.id === selectedId);
    const nextIndex = (currentIndex + step + visibleTemplates.length) % visibleTemplates.length;
    setSelectedId(visibleTemplates[nextIndex].id);
    document.getElementById(`template-option-${visibleTemplates[nextIndex].id}`)?.focus();
  }

  return (
    <div className="grid gap-3">
      <input type="hidden" name={name} value={selectedId} />
      {templates.length > SEARCH_THRESHOLD && (
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar template pelo nome"
            aria-label="Buscar template"
            className="pl-8"
          />
        </div>
      )}
      <div
        role="radiogroup"
        aria-label="Template da cartela"
        onKeyDown={moveSelection}
        className="grid max-h-96 grid-cols-2 gap-3 overflow-y-auto p-0.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      >
        {visibleTemplates.map((template) => {
          const isSelected = template.id === selectedId;
          return (
            <button
              key={template.id}
              id={`template-option-${template.id}`}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => setSelectedId(template.id)}
              className={cn(
                "group relative flex h-full flex-col overflow-hidden rounded-xl border bg-card text-left transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                isSelected ? "border-primary ring-2 ring-primary/40" : "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
              )}
            >
              <span className="relative flex aspect-4/3 w-full shrink-0 items-center justify-center bg-[repeating-conic-gradient(var(--muted)_0_25%,transparent_0_50%)] bg-[length:16px_16px] p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/assets/${template.imageAssetId}`}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 size-full object-contain p-2 drop-shadow-sm transition-transform group-hover:scale-[1.03]"
                />
                {isSelected && (
                  <span className="absolute top-2 right-2 flex size-6 animate-in items-center justify-center rounded-full bg-primary text-primary-foreground shadow zoom-in-50">
                    <Check className="size-3.5" aria-hidden="true" />
                  </span>
                )}
                {template.id === lastUsedTemplateId && (
                  <span className="absolute top-2 left-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold shadow">Último usado</span>
                )}
              </span>
              <span className="mt-auto grid gap-0.5 border-t p-2.5">
                <span className={cn("truncate text-sm font-medium", isSelected && "text-primary")}>{template.name}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Grid3x3 className="size-3" aria-hidden="true" />v{template.latestVersion} · {matrixLabel(template.matrixCount)}
                </span>
                <span className="truncate text-[11px] text-muted-foreground">{NUMBER_RULE_LABELS[template.numberRuleKind]}</span>
              </span>
            </button>
          );
        })}
        {visibleTemplates.length === 0 && <p className="col-span-full py-6 text-center text-sm text-muted-foreground">Nenhum template com esse nome.</p>}
      </div>
    </div>
  );
}

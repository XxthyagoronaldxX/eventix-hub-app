"use client";

import { CalendarDays, Loader2, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { SelectInput, type SelectOption } from "@/components/form/select-input";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface TicketFilterParamNames {
  code: string;
  status: string;
  payment: string;
  event?: string;
  page: string;
}

export interface TicketFilterValues {
  code: string;
  status: string;
  payment: string;
  event?: string;
}

interface TicketFilterBarProps {
  paramNames: TicketFilterParamNames;
  values: TicketFilterValues;
  total: number;
  eventOptions?: SelectOption[];
  anchor?: string;
}

interface QuickOption {
  value: string;
  label: string;
  tone?: string;
}

const STATUS_OPTIONS: QuickOption[] = [
  { value: "", label: "Todos" },
  { value: "active", label: "Ativos", tone: "bg-emerald-500" },
  { value: "void", label: "Cancelados", tone: "bg-rose-500" },
];

const PAYMENT_OPTIONS: QuickOption[] = [
  { value: "", label: "Todos" },
  { value: "paid", label: "Pagos", tone: "bg-emerald-500" },
  { value: "unpaid", label: "Pendentes", tone: "bg-amber-500" },
];

const SEARCH_DEBOUNCE_MS = 450;

function QuickFilter({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: QuickOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex rounded-lg border bg-muted/40 p-0.5">
        {options.map((option) => {
          const isActive = option.value === value;
          return (
            <button
              key={option.value || "all"}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onChange(option.value)}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
                isActive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.tone && <span className={cn("size-1.5 rounded-full", option.tone)} aria-hidden="true" />}
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TicketFilterBar({ paramNames, values, total, eventOptions, anchor }: TicketFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [code, setCode] = useState(values.code);
  const [isPending, startTransition] = useTransition();
  const lastAppliedCode = useRef(values.code);

  function apply(changes: Partial<Record<keyof TicketFilterValues, string>>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      const paramName = paramNames[key as keyof TicketFilterValues];
      if (!paramName) continue;
      if (value) params.set(paramName, value);
      else params.delete(paramName);
    }
    params.delete(paramNames.page);
    const queryString = params.toString();
    startTransition(() => {
      router.push(`${pathname}${queryString ? `?${queryString}` : ""}${anchor ? `#${anchor}` : ""}`, { scroll: false });
    });
  }

  useEffect(() => {
    const normalizedCode = code.trim();
    if (normalizedCode === lastAppliedCode.current) return;
    const timeout = setTimeout(() => {
      lastAppliedCode.current = normalizedCode;
      apply({ code: normalizedCode });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
    // apply reads the latest URL on each call
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const eventLabel = eventOptions?.find((option) => option.value === values.event)?.label;
  const activeChips = [
    values.code && { key: "code" as const, label: `Código: ${values.code}` },
    values.event && eventLabel && { key: "event" as const, label: eventLabel },
    values.status && {
      key: "status" as const,
      label: STATUS_OPTIONS.find((option) => option.value === values.status)?.label ?? values.status,
    },
    values.payment && {
      key: "payment" as const,
      label: PAYMENT_OPTIONS.find((option) => option.value === values.payment)?.label ?? values.payment,
    },
  ].filter((chip): chip is { key: keyof TicketFilterValues; label: string } => Boolean(chip));

  function clearAll() {
    setCode("");
    lastAppliedCode.current = "";
    apply({ code: "", event: "", status: "", payment: "" });
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              lastAppliedCode.current = code.trim();
              apply({ code: code.trim() });
            }}
            placeholder="Buscar pelo código, ex.: EVX-7K4P-92QD"
            aria-label="Buscar pelo código"
            className="pr-9 pl-8 font-mono tracking-wide placeholder:font-sans placeholder:tracking-normal"
          />
          {isPending ? (
            <Loader2 className="absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          ) : (
            code && (
              <button
                type="button"
                onClick={() => setCode("")}
                aria-label="Limpar busca"
                className="absolute top-1/2 right-2 flex size-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )
          )}
        </div>
        {eventOptions && (
          <div className="relative lg:w-64">
            <CalendarDays className="pointer-events-none absolute top-1/2 left-2.5 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
            <SelectInput
              value={values.event ?? ""}
              onValueChange={(event) => apply({ event })}
              aria-label="Evento"
              className="pl-8"
              options={eventOptions}
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <QuickFilter
          label="Situação"
          options={STATUS_OPTIONS}
          value={values.status}
          onChange={(status) => apply({ status })}
        />
        <QuickFilter
          label="Pagamento"
          options={PAYMENT_OPTIONS}
          value={values.payment}
          onChange={(payment) => apply({ payment })}
        />
        <span className="ml-auto text-sm text-muted-foreground tabular-nums">
          {total === 1 ? "1 ticket" : `${total.toLocaleString("pt-BR")} tickets`}
        </span>
      </div>

      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeChips.map((chip) => (
            <span
              key={chip.key}
              className="flex animate-in items-center gap-1 rounded-full bg-primary/10 py-0.5 pr-1 pl-2.5 text-xs font-medium text-primary fade-in"
            >
              {chip.label}
              <button
                type="button"
                onClick={() => {
                  if (chip.key === "code") {
                    setCode("");
                    lastAppliedCode.current = "";
                  }
                  apply({ [chip.key]: "" });
                }}
                aria-label={`Remover filtro ${chip.label}`}
                className="flex size-4 items-center justify-center rounded-full hover:bg-primary/20"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="ml-1 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Limpar filtros
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { CalendarDays, Clock, X } from "lucide-react";
import { useState } from "react";
import { ptBR } from "react-day-picker/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { FieldShell, fieldIdFor } from "./field-shell";

export interface DateFormFieldProps {
  label: string;
  name: string;
  id?: string;
  defaultValue?: string;
  withTime?: boolean;
  required?: boolean;
  min?: string;
  max?: string;
  placeholder?: string;
  hint?: string;
  error?: string;
  compact?: boolean;
  fieldClassName?: string;
}

const DEFAULT_TIME = "19:00";
const DISPLAY_DATE = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

function parseDateInput(value: string | undefined): Date | undefined {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : undefined;
}

function toDateInput(date: Date): string {
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function DateFormField({
  label,
  name,
  id,
  defaultValue,
  withTime = false,
  required,
  min,
  max,
  placeholder = "Escolha uma data",
  hint,
  error,
  compact,
  fieldClassName,
}: DateFormFieldProps) {
  const fieldId = fieldIdFor(id, name, label);
  const [date, setDate] = useState(() => parseDateInput(defaultValue));
  const [time, setTime] = useState(() => defaultValue?.match(/T(\d{2}:\d{2})/)?.[1] ?? DEFAULT_TIME);
  const [open, setOpen] = useState(false);
  const minimumDate = parseDateInput(min);
  const maximumDate = parseDateInput(max);
  const submittedValue = date ? `${toDateInput(date)}${withTime ? `T${time}` : ""}` : "";

  return (
    <FieldShell label={label} htmlFor={fieldId} hint={hint} error={error} compact={compact} className={fieldClassName}>
      <input type="hidden" name={name} value={submittedValue} />
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id={fieldId}
              type="button"
              variant="outline"
              aria-invalid={error ? true : undefined}
              aria-required={required}
              className={cn(
                "min-w-0 flex-1 justify-start font-normal",
                compact ? "h-8" : "h-9",
                !date && "text-muted-foreground",
              )}
            >
              <CalendarDays className="text-muted-foreground" />
              <span className="truncate">{date ? DISPLAY_DATE.format(date) : placeholder}</span>
              {date && !required && (
                <span
                  role="button"
                  tabIndex={-1}
                  aria-label="Limpar data"
                  className="ml-auto rounded-sm p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={(event) => {
                    event.stopPropagation();
                    setDate(undefined);
                  }}
                >
                  <X className="size-3.5" />
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              locale={ptBR}
              selected={date}
              defaultMonth={date ?? maximumDate ?? undefined}
              captionLayout="dropdown"
              disabled={[
                ...(minimumDate ? [{ before: minimumDate }] : []),
                ...(maximumDate ? [{ after: maximumDate }] : []),
              ]}
              onSelect={(selectedDate) => {
                setDate(selectedDate);
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
        {withTime && (
          <div className="relative w-28 shrink-0">
            <Clock className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="time"
              aria-label={`${label} (hora)`}
              value={time}
              onChange={(event) => setTime(event.target.value || DEFAULT_TIME)}
              className={cn("pl-8 [&::-webkit-calendar-picker-indicator]:hidden", compact ? "h-8" : "h-9")}
            />
          </div>
        )}
      </div>
    </FieldShell>
  );
}

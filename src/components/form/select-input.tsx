"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  indicatorClassName?: string;
}

const EMPTY_OPTION_VALUE = "__empty__";

function toItemValue(value: string): string {
  return value === "" ? EMPTY_OPTION_VALUE : value;
}

function fromItemValue(itemValue: string): string {
  return itemValue === EMPTY_OPTION_VALUE ? "" : itemValue;
}

export interface SelectInputProps {
  options: readonly SelectOption[];
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  size?: "sm" | "default";
  className?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

export function SelectInput({
  options,
  id,
  name,
  value,
  defaultValue,
  onValueChange,
  placeholder = "Selecione",
  disabled,
  size = "default",
  className,
  ...ariaProps
}: SelectInputProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? options[0]?.value ?? "");
  const currentValue = value ?? uncontrolledValue;

  function changeValue(itemValue: string) {
    const nextValue = fromItemValue(itemValue);
    if (value === undefined) {
      setUncontrolledValue(nextValue);
    }
    onValueChange?.(nextValue);
  }

  return (
    <>
      <Select value={toItemValue(currentValue)} onValueChange={changeValue} disabled={disabled}>
        <SelectTrigger id={id} size={size} className={cn("w-full", className)} {...ariaProps}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent
          position="popper"
          align="start"
          className={cn(options.some((option) => option.description) && "min-w-72")}
        >
          {options.map((option) => (
            <SelectItem key={option.value} value={toItemValue(option.value)} description={option.description}>
              <span className="flex items-center gap-2">
                {option.indicatorClassName && (
                  <span className={cn("size-2 shrink-0 rounded-full", option.indicatorClassName)} aria-hidden="true" />
                )}
                {option.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {name && <input type="hidden" name={name} value={currentValue} />}
    </>
  );
}

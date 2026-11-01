interface SwitchFormFieldProps {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  description?: string;
}

export function SwitchFormField({ label, checked, onCheckedChange, disabled, description }: SwitchFormFieldProps) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 has-disabled:cursor-not-allowed has-disabled:opacity-50">
      <span className="grid gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        {description && <span className="text-xs text-muted-foreground">{description}</span>}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onCheckedChange(event.target.checked)}
        className="relative h-5 w-9 shrink-0 cursor-pointer appearance-none rounded-full bg-input transition-colors outline-none before:absolute before:top-0.5 before:left-0.5 before:size-4 before:rounded-full before:bg-background before:shadow-sm before:transition-transform checked:bg-primary checked:before:translate-x-4 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed"
      />
    </label>
  );
}

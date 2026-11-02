import type { EventKind } from "@/lib/api/types";
import { EVENT_KIND_DETAILS, EVENT_KINDS } from "@/lib/event-kinds";
import { cn } from "@/lib/utils";

interface EventKindPickerProps {
  defaultKind?: EventKind;
  note?: string;
}

export function EventKindPicker({
  defaultKind = "bingo",
  note = "Dá para mudar o tipo enquanto nenhum ticket for gerado.",
}: EventKindPickerProps) {
  return (
    <fieldset className="grid min-w-0 gap-2">
      <legend className="mb-2 text-sm font-medium">Tipo do evento</legend>
      <div className="grid gap-3 sm:grid-cols-3">
        {EVENT_KINDS.map((kind) => {
          const { label, description, icon: Icon, tone } = EVENT_KIND_DETAILS[kind];
          return (
            <label
              key={kind}
              className="flex cursor-pointer flex-col gap-2 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:ring-2 has-[:checked]:ring-primary/30 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50"
            >
              <input type="radio" name="kind" value={kind} defaultChecked={kind === defaultKind} className="sr-only" />
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-md bg-gradient-to-br text-white shadow-sm",
                  tone,
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span className="font-medium">{label}</span>
              <span className="text-xs text-muted-foreground">{description}</span>
            </label>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">{note}</p>
    </fieldset>
  );
}

export function EventKindBadge({ kind }: { kind: EventKind }) {
  const { label, icon: Icon } = EVENT_KIND_DETAILS[kind];
  return (
    <span className="inline-flex items-center gap-1 rounded-full border bg-muted/60 px-2 py-0.5 text-xs font-medium text-muted-foreground">
      <Icon className="size-3" aria-hidden="true" /> {label}
    </span>
  );
}

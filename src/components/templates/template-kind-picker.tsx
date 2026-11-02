import type { TemplateKind } from "@/lib/api/types";
import { TEMPLATE_KIND_DETAILS, TEMPLATE_KINDS } from "@/lib/event-kinds";

export function TemplateKindPicker({ defaultKind = "bingo" }: { defaultKind?: TemplateKind }) {
  return (
    <fieldset className="grid min-w-0 gap-2">
      <legend className="mb-2 text-sm font-medium">Tipo do template</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {TEMPLATE_KINDS.map((kind) => {
          const { label, description, icon: Icon } = TEMPLATE_KIND_DETAILS[kind];
          return (
            <label
              key={kind}
              className="flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:ring-2 has-[:checked]:ring-primary/30 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50"
            >
              <input type="radio" name="kind" value={kind} defaultChecked={kind === defaultKind} className="sr-only" />
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span className="grid gap-0.5">
                <span className="font-medium">{label}</span>
                <span className="text-xs text-muted-foreground">{description}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

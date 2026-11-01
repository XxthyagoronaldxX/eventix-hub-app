import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConfirmActionProps {
  triggerLabel: string;
  confirmLabel: string;
  question: string;
  action: (formData: FormData) => Promise<void>;
  hiddenFields: Record<string, string>;
  tone?: "danger" | "primary";
}

export function ConfirmAction({
  triggerLabel,
  confirmLabel,
  question,
  action,
  hiddenFields,
  tone = "danger",
}: ConfirmActionProps) {
  return (
    <details className="group inline-flex items-center gap-2 open:rounded-lg open:bg-muted/60 open:p-1">
      <summary
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "group-open:border-transparent group-open:bg-transparent",
        )}
      >
        <span className="group-open:hidden">{triggerLabel}</span>
        <span className="hidden group-open:inline">Cancelar</span>
      </summary>
      <form action={action} className="inline-flex">
        {Object.entries(hiddenFields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <Button type="submit" size="sm" variant={tone === "danger" ? "destructive" : "default"} title={question}>
          {confirmLabel}
          <span className="sr-only">: {question}</span>
        </Button>
      </form>
    </details>
  );
}

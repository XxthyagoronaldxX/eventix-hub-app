import { Badge } from "@/components/ui/badge";
import type { JobStatus } from "@/lib/api/types";
import { JOB_STATUS_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";

export type StatusTone = "neutral" | "success" | "danger" | "info" | "warning";

const TONE_CLASSES: Record<StatusTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  success: "bg-success/12 text-success",
  danger: "bg-destructive/10 text-destructive",
  info: "bg-primary/10 text-primary",
  warning: "bg-warning/15 text-amber-700 dark:text-warning",
};

export function StatusBadge({ tone = "neutral", children }: { tone?: StatusTone; children: string }) {
  return (
    <Badge variant="secondary" className={cn("gap-1.5 font-medium", TONE_CLASSES[tone])}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {children}
    </Badge>
  );
}

const JOB_STATUS_TONE: Record<JobStatus, StatusTone> = {
  queued: "warning",
  processing: "info",
  done: "success",
  failed: "danger",
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return <StatusBadge tone={JOB_STATUS_TONE[status]}>{JOB_STATUS_LABELS[status]}</StatusBadge>;
}

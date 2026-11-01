import { StatusBadge, type StatusTone } from "@/components/status-badge";
import type { EventStatus } from "@/lib/api/types";
import { EVENT_STATUS_LABELS } from "@/lib/format";

const EVENT_STATUS_TONE: Record<EventStatus, StatusTone> = {
  draft: "warning",
  active: "success",
  archived: "neutral",
};

export function EventStatusBadge({ status }: { status: EventStatus }) {
  return <StatusBadge tone={EVENT_STATUS_TONE[status]}>{EVENT_STATUS_LABELS[status]}</StatusBadge>;
}

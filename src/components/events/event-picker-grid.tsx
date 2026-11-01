import { ArrowRight, CalendarDays, type LucideIcon, MapPin } from "lucide-react";
import Link from "next/link";
import { EventStatusBadge } from "@/components/events/event-status-badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { OrganizationEvent } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface EventPickerGridProps {
  events: OrganizationEvent[];
  hrefFor: (event: OrganizationEvent) => string;
  icon: LucideIcon;
  iconClassName: string;
  actionLabel: string;
}

export function EventPickerGrid({ events, hrefFor, icon: Icon, iconClassName, actionLabel }: EventPickerGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {events.map((event) => (
        <Link
          key={event.id}
          href={hrefFor(event)}
          className="group rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-md group-hover:ring-primary/30">
            <CardContent className="flex flex-1 flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <span
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
                    iconClassName,
                  )}
                >
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <EventStatusBadge status={event.status} />
              </div>
              <div className="space-y-1.5">
                <p className="truncate text-lg font-semibold group-hover:text-primary">{event.name}</p>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CalendarDays className="size-3.5" aria-hidden="true" /> {formatDateTime(event.startsAt)}
                </p>
                {event.location && (
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="size-3.5" aria-hidden="true" /> {event.location}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="justify-between text-sm font-medium text-primary">
              {actionLabel}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  );
}

import { ArrowLeft, CalendarDays, Check, ChevronsUpDown } from "lucide-react";
import Link from "next/link";
import { EventStatusBadge } from "@/components/events/event-status-badge";
import type { OrganizationEvent } from "@/lib/api/types";
import { eventRoutes } from "@/lib/event-routes";
import { formatDateTime } from "@/lib/format";

interface EventSwitcherProps {
  currentEvent: OrganizationEvent;
  events: OrganizationEvent[];
}

export function EventSwitcher({ currentEvent, events }: EventSwitcherProps) {
  const otherEvents = events.filter((event) => event.id !== currentEvent.id && event.status !== "archived");

  return (
    <div className="grid gap-2">
      <Link
        href="/events"
        title="Voltar para todos os eventos"
        className="flex items-center gap-1.5 px-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground lg:group-data-[sidebar-collapsed=true]/shell:justify-center"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        <span className="lg:group-data-[sidebar-collapsed=true]/shell:sr-only">Todos os eventos</span>
      </Link>

      <details className="relative">
        <summary
          title={currentEvent.name}
          className="flex w-full items-center gap-3 rounded-lg border bg-card px-2.5 py-2 text-left transition-colors hover:bg-sidebar-accent lg:group-data-[sidebar-collapsed=true]/shell:justify-center lg:group-data-[sidebar-collapsed=true]/shell:border-0 lg:group-data-[sidebar-collapsed=true]/shell:bg-transparent lg:group-data-[sidebar-collapsed=true]/shell:p-0"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-fuchsia-600 text-white">
            <CalendarDays className="size-4" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1 lg:group-data-[sidebar-collapsed=true]/shell:sr-only">
            <span className="block truncate text-sm font-medium">{currentEvent.name}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {formatDateTime(currentEvent.startsAt)}
            </span>
          </span>
          <ChevronsUpDown
            className="size-4 shrink-0 text-muted-foreground lg:group-data-[sidebar-collapsed=true]/shell:hidden"
            aria-hidden="true"
          />
        </summary>
        <div className="absolute inset-x-0 z-30 mt-2 max-h-80 overflow-y-auto rounded-xl border bg-popover p-1.5 shadow-lg lg:group-data-[sidebar-collapsed=true]/shell:right-auto lg:group-data-[sidebar-collapsed=true]/shell:w-64">
          <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Trocar de evento</p>
          <span className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm">
            <span className="min-w-0 flex-1 truncate font-medium">{currentEvent.name}</span>
            <Check className="size-4 text-primary" aria-hidden="true" />
          </span>
          {otherEvents.map((event) => (
            <Link
              key={event.id}
              href={eventRoutes.overview(event.id)}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
            >
              <span className="min-w-0 flex-1 truncate">{event.name}</span>
              <EventStatusBadge status={event.status} />
            </Link>
          ))}
          {otherEvents.length === 0 && (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">Nenhum outro evento aberto.</p>
          )}
        </div>
      </details>
    </div>
  );
}

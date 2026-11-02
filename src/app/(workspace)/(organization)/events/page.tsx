import { CalendarDays, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { NewEventDialog } from "@/components/events/new-event-dialog";
import { EmptyState } from "@/components/empty-state";
import { EventStatusBadge } from "@/components/events/event-status-badge";
import { EVENT_KIND_DETAILS } from "@/lib/event-kinds";
import { cn } from "@/lib/utils";
import { FlashNotices } from "@/components/flash-notices";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/api/api-client";
import type { OrganizationEvent } from "@/lib/api/types";
import { eventRoutes } from "@/lib/event-routes";
import { readFlash } from "@/lib/flash";
import { formatDateTime } from "@/lib/format";
import { hasScope, requireScope } from "@/lib/workspace";

export const metadata: Metadata = { title: "Eventos" };

export default async function EventsPage({ searchParams }: PageProps<"/events">) {
  const organization = await requireScope("org:events:read");
  const query = await searchParams;
  const events = await apiRequest<OrganizationEvent[]>("/org/events", { organizationId: organization.id });
  const canCreateEvents = hasScope(organization, "org:events:write");
  const createEventButton = canCreateEvents && <NewEventDialog defaultOpen={query.new === "1"} />;

  return (
    <PageContainer>
      <PageHeader
        title="Eventos"
        description="Bingos, festas e qualquer evento que precise de tickets."
        actions={createEventButton}
      />
      <FlashNotices flash={readFlash(query)} />
      {events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Nenhum evento por aqui ainda"
          description="Crie o primeiro evento para montar cartelas e gerar tickets."
          action={createEventButton}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => {
            const kind = EVENT_KIND_DETAILS[event.kind];
            return (
              <Link
                key={event.id}
                href={eventRoutes.overview(event.id)}
                className="group rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <Card className="h-full transition-shadow group-hover:shadow-md group-hover:ring-primary/30">
                  <CardContent className="flex h-full flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm",
                          kind.tone,
                        )}
                      >
                        <kind.icon className="size-5" aria-hidden="true" />
                      </span>
                      <EventStatusBadge status={event.status} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{kind.label}</p>
                      <p className="font-semibold tracking-tight group-hover:text-primary">{event.name}</p>
                      <p className="text-sm text-muted-foreground">{formatDateTime(event.startsAt)}</p>
                    </div>
                    {event.location && (
                      <p className="mt-auto flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="size-3.5" aria-hidden="true" /> {event.location}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}

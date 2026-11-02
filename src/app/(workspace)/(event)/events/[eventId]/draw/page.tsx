import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DrawStation } from "@/components/draws/draw-station";
import { RaffleStation } from "@/components/draws/raffle-station";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { apiRequest } from "@/lib/api/api-client";
import type { DrawState, OrganizationEvent, RaffleState } from "@/lib/api/types";
import { EVENT_KIND_DETAILS } from "@/lib/event-kinds";
import { eventRoutes } from "@/lib/event-routes";
import { requireEventWorkspace } from "@/lib/event-workspace";
import { withFlash } from "@/lib/flash";

export const metadata: Metadata = { title: "Sorteio do evento" };

async function renderStation(event: OrganizationEvent, organizationId: string) {
  if (event.kind === "raffle") {
    const initialState = await apiRequest<RaffleState>(`/org/events/${event.id}/raffle?onlyCheckedIn=false`, {
      organizationId,
    });
    return <RaffleStation eventId={event.id} initialState={initialState} />;
  }
  const initialState = await apiRequest<DrawState>(`/org/events/${event.id}/draws/current?onlyCheckedIn=false`, {
    organizationId,
  });
  return <DrawStation eventId={event.id} initialState={initialState} />;
}

export default async function EventDrawPage({ params }: PageProps<"/events/[eventId]/draw">) {
  const { eventId } = await params;
  const { organization, event } = await requireEventWorkspace(eventId, "org:draws:run");
  const drawDescription = EVENT_KIND_DETAILS[event.kind].drawDescription;
  if (!drawDescription) {
    redirect(withFlash(eventRoutes.overview(event.id), { error: "Eventos de ingressos não têm sorteio." }));
  }

  return (
    <PageContainer wide>
      <PageHeader
        title="Sorteio"
        breadcrumbs={[{ label: event.name, href: eventRoutes.overview(event.id) }]}
        description={drawDescription}
      />
      {await renderStation(event, organization.id)}
    </PageContainer>
  );
}

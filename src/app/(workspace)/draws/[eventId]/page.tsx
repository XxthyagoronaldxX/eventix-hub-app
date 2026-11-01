import type { Metadata } from "next";
import { DrawStation } from "@/components/draws/draw-station";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { apiRequest } from "@/lib/api/api-client";
import type { DrawState, OrganizationEvent } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { requireScope } from "@/lib/workspace";

export const metadata: Metadata = { title: "Sorteio do evento" };

export default async function EventDrawPage({ params }: PageProps<"/draws/[eventId]">) {
  const organization = await requireScope("org:draws:run");
  const { eventId } = await params;
  const [event, initialState] = await Promise.all([
    apiRequest<OrganizationEvent>(`/org/events/${eventId}`, { organizationId: organization.id }),
    apiRequest<DrawState>(`/org/events/${eventId}/draws/current?onlyCheckedIn=false`, {
      organizationId: organization.id,
    }),
  ]);

  return (
    <PageContainer wide>
      <PageHeader
        title={event.name}
        breadcrumbs={[{ label: "Sorteio", href: "/draws" }]}
        description={`${formatDateTime(event.startsAt)}${event.location ? ` · ${event.location}` : ""}`}
      />
      <DrawStation eventId={event.id} initialState={initialState} />
    </PageContainer>
  );
}

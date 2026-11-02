import type { Metadata } from "next";
import { CheckInStation } from "@/components/check-in/check-in-station";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { apiRequest } from "@/lib/api/api-client";
import type { CheckInSummary } from "@/lib/api/types";
import { eventRoutes } from "@/lib/event-routes";
import { requireEventWorkspace } from "@/lib/event-workspace";

export const metadata: Metadata = { title: "Check-in do evento" };

export default async function EventCheckInPage({ params }: PageProps<"/events/[eventId]/check-in">) {
  const { eventId } = await params;
  const { organization, event } = await requireEventWorkspace(eventId, "org:tickets:check-in");
  const summary = await apiRequest<CheckInSummary>(`/org/events/${event.id}/check-ins/summary`, {
    organizationId: organization.id,
  });

  return (
    <PageContainer>
      <PageHeader
        title="Check-in"
        breadcrumbs={[{ label: event.name, href: eventRoutes.overview(event.id) }]}
        description="Leia o QR Code do ticket ou digite o código para liberar a entrada."
      />
      <CheckInStation eventId={event.id} initialSummary={summary} />
    </PageContainer>
  );
}

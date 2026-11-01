import type { Metadata } from "next";
import { CheckInStation } from "@/components/check-in/check-in-station";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { apiRequest } from "@/lib/api/api-client";
import type { CheckInSummary, OrganizationEvent } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { requireScope } from "@/lib/workspace";

export const metadata: Metadata = { title: "Check-in do evento" };

export default async function EventCheckInPage({ params }: PageProps<"/check-in/[eventId]">) {
  const organization = await requireScope("org:tickets:check-in");
  const { eventId } = await params;
  const [event, summary] = await Promise.all([
    apiRequest<OrganizationEvent>(`/org/events/${eventId}`, { organizationId: organization.id }),
    apiRequest<CheckInSummary>(`/org/events/${eventId}/check-ins/summary`, { organizationId: organization.id }),
  ]);

  return (
    <PageContainer>
      <PageHeader
        title={event.name}
        breadcrumbs={[{ label: "Check-in", href: "/check-in" }]}
        description={`${formatDateTime(event.startsAt)}${event.location ? ` · ${event.location}` : ""}`}
      />
      <CheckInStation eventId={event.id} initialSummary={summary} />
    </PageContainer>
  );
}

import type { Metadata } from "next";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { PaymentStation } from "@/components/payments/payment-station";
import { apiRequest } from "@/lib/api/api-client";
import type { OrganizationEvent, PaymentSummary } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { requireScope } from "@/lib/workspace";

export const metadata: Metadata = { title: "Caixa do evento" };

export default async function EventPaymentsPage({ params }: PageProps<"/payments/[eventId]">) {
  const organization = await requireScope("org:tickets:payment");
  const { eventId } = await params;
  const [event, summary] = await Promise.all([
    apiRequest<OrganizationEvent>(`/org/events/${eventId}`, { organizationId: organization.id }),
    apiRequest<PaymentSummary>(`/org/events/${eventId}/payments/summary`, { organizationId: organization.id }),
  ]);

  return (
    <PageContainer wide>
      <PageHeader
        title={event.name}
        breadcrumbs={[{ label: "Pagamentos", href: "/payments" }]}
        description={`${formatDateTime(event.startsAt)}${event.location ? ` · ${event.location}` : ""}`}
      />
      <PaymentStation
        eventId={event.id}
        ticketPriceCents={event.ticketPriceCents}
        paymentSettings={event}
        initialSummary={summary}
      />
    </PageContainer>
  );
}

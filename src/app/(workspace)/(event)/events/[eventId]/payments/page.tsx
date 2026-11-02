import type { Metadata } from "next";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { PaymentStation } from "@/components/payments/payment-station";
import { apiRequest } from "@/lib/api/api-client";
import type { PaymentSummary } from "@/lib/api/types";
import { eventRoutes } from "@/lib/event-routes";
import { requireEventWorkspace } from "@/lib/event-workspace";

export const metadata: Metadata = { title: "Caixa do evento" };

export default async function EventPaymentsPage({ params }: PageProps<"/events/[eventId]/payments">) {
  const { eventId } = await params;
  const { organization, event } = await requireEventWorkspace(eventId, "org:tickets:payment");
  const summary = await apiRequest<PaymentSummary>(`/org/events/${event.id}/payments/summary`, {
    organizationId: organization.id,
  });

  return (
    <PageContainer wide>
      <PageHeader
        title="Caixa"
        breadcrumbs={[{ label: event.name, href: eventRoutes.overview(event.id) }]}
        description="Receba pagamentos dos tickets em Pix, dinheiro ou cartão."
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

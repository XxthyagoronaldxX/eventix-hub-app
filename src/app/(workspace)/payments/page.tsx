import { Wallet } from "lucide-react";
import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
import { EventPickerGrid } from "@/components/events/event-picker-grid";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { apiRequest } from "@/lib/api/api-client";
import type { OrganizationEvent } from "@/lib/api/types";
import { requireScope } from "@/lib/workspace";

export const metadata: Metadata = { title: "Pagamentos" };

export default async function PaymentEventsPage() {
  const organization = await requireScope("org:tickets:payment");
  const events = await apiRequest<OrganizationEvent[]>("/org/events", { organizationId: organization.id });
  const openEvents = events.filter((event) => event.status !== "archived");

  return (
    <PageContainer>
      <PageHeader
        title="Pagamentos"
        description="Escolha o evento para receber o pagamento dos tickets em Pix, dinheiro ou cartão."
      />
      {openEvents.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Nenhum evento disponível"
          description="Eventos arquivados não aparecem aqui."
        />
      ) : (
        <EventPickerGrid
          events={openEvents}
          hrefFor={(event) => `/payments/${event.id}`}
          icon={Wallet}
          iconClassName="bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md"
          actionLabel="Abrir caixa"
        />
      )}
    </PageContainer>
  );
}

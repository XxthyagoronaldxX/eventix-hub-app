import { Dices } from "lucide-react";
import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
import { EventPickerGrid } from "@/components/events/event-picker-grid";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { apiRequest } from "@/lib/api/api-client";
import type { OrganizationEvent } from "@/lib/api/types";
import { requireScope } from "@/lib/workspace";

export const metadata: Metadata = { title: "Sorteio" };

export default async function DrawEventsPage() {
  const organization = await requireScope("org:draws:run");
  const events = await apiRequest<OrganizationEvent[]>("/org/events", { organizationId: organization.id });
  const openEvents = events.filter((event) => event.status !== "archived");

  return (
    <PageContainer>
      <PageHeader
        title="Sorteio"
        description="Escolha o evento para conduzir o bingo: sorteie os números e acompanhe quem está perto de bater."
      />
      {openEvents.length === 0 ? (
        <EmptyState icon={Dices} title="Nenhum evento disponível" description="Eventos arquivados não aparecem aqui." />
      ) : (
        <EventPickerGrid
          events={openEvents}
          hrefFor={(event) => `/draws/${event.id}`}
          icon={Dices}
          iconClassName="bg-gradient-to-br from-indigo-500 to-fuchsia-600 text-white shadow-md"
          actionLabel="Conduzir sorteio"
        />
      )}
    </PageContainer>
  );
}

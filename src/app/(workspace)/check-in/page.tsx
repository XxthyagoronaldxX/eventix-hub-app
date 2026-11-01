import { ScanLine } from "lucide-react";
import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
import { EventPickerGrid } from "@/components/events/event-picker-grid";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { apiRequest } from "@/lib/api/api-client";
import type { OrganizationEvent } from "@/lib/api/types";
import { requireScope } from "@/lib/workspace";

export const metadata: Metadata = { title: "Check-in" };

export default async function CheckInEventsPage() {
  const organization = await requireScope("org:tickets:check-in");
  const events = await apiRequest<OrganizationEvent[]>("/org/events", { organizationId: organization.id });
  const openEvents = events.filter((event) => event.status !== "archived");

  return (
    <PageContainer>
      <PageHeader
        title="Check-in"
        description="Escolha o evento para validar os tickets na entrada, pelo QR Code ou pelo código."
      />
      {openEvents.length === 0 ? (
        <EmptyState
          icon={ScanLine}
          title="Nenhum evento disponível"
          description="Eventos arquivados não aparecem aqui."
        />
      ) : (
        <EventPickerGrid
          events={openEvents}
          hrefFor={(event) => `/check-in/${event.id}`}
          icon={ScanLine}
          iconClassName="bg-accent text-accent-foreground"
          actionLabel="Abrir check-in"
        />
      )}
    </PageContainer>
  );
}

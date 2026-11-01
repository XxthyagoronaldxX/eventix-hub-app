import { Ticket as TicketIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { FlashNotices } from "@/components/flash-notices";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { buildQueryHref, Pagination } from "@/components/pagination";
import { TicketTable } from "@/components/tickets/ticket-table";
import { TicketFilterBar } from "@/components/tickets/ticket-filter-bar";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/api/api-client";
import type { OrganizationEvent, Page, Ticket } from "@/lib/api/types";
import { readFlash, readSearchParam } from "@/lib/flash";

import { hasScope, requireScope } from "@/lib/workspace";

export const metadata: Metadata = { title: "Tickets" };

const PAGE_SIZE = 25;

export default async function TicketsPage({ searchParams }: PageProps<"/tickets">) {
  const organization = await requireScope("org:tickets:read");
  const query = await searchParams;
  const filters = {
    code: readSearchParam(query, "code") ?? "",
    eventId: readSearchParam(query, "eventId") ?? "",
    batchId: readSearchParam(query, "batchId") ?? "",
    status: readSearchParam(query, "status") ?? "",
    payment: readSearchParam(query, "payment") ?? "",
  };
  const page = Number(readSearchParam(query, "page") ?? 1) || 1;
  const [ticketsPage, events] = await Promise.all([
    apiRequest<Page<Ticket>>(buildQueryHref("/org/tickets", { ...filters, page, pageSize: PAGE_SIZE }), {
      organizationId: organization.id,
    }),
    apiRequest<OrganizationEvent[]>("/org/events", { organizationId: organization.id }),
  ]);
  const eventNameById = new Map(events.map((event) => [event.id, event.name]));
  const eventFilterOptions = [
    { value: "", label: "Todos os eventos" },
    ...events.map((event) => ({ value: event.id, label: event.name })),
  ];
  const canVoidTickets = hasScope(organization, "org:tickets:void");
  const currentPath = buildQueryHref("/tickets", { ...filters, page });

  return (
    <PageContainer>
      <PageHeader title="Tickets" description="Busque um ticket pelo código ou filtre por evento e status." />
      <FlashNotices flash={readFlash(query)} />

      <Card>
        <CardContent className="grid gap-4">
          <TicketFilterBar
            paramNames={{ code: "code", status: "status", payment: "payment", event: "eventId", page: "page" }}
            values={{ code: filters.code, status: filters.status, payment: filters.payment, event: filters.eventId }}
            total={ticketsPage.total}
            eventOptions={eventFilterOptions}
          />
          {filters.batchId && (
            <p className="text-sm text-muted-foreground">
              Mostrando os tickets de um lote.{" "}
              <Link href={`/batches/${filters.batchId}`} className="font-medium text-primary hover:underline">
                Ver lote
              </Link>
            </p>
          )}

          {ticketsPage.items.length === 0 ? (
            <EmptyState icon={TicketIcon} title="Nenhum ticket encontrado" />
          ) : (
            <TicketTable
              tickets={ticketsPage.items}
              eventNameById={eventNameById}
              canVoidTickets={canVoidTickets}
              canChangePayment={hasScope(organization, "org:tickets:payment")}
              paymentSettingsByEvent={new Map(events.map((event) => [event.id, event]))}
              returnPath={currentPath}
            />
          )}
          <Pagination
            page={ticketsPage.page}
            pageSize={ticketsPage.pageSize}
            total={ticketsPage.total}
            buildHref={(targetPage) => buildQueryHref("/tickets", { ...filters, page: targetPage })}
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}

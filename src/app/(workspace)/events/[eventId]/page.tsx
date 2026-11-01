import { CalendarDays, Layers, MapPin, Sparkles, Ticket as TicketIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { updateEvent } from "@/actions/event-actions";
import { createTicketBatch } from "@/actions/ticket-actions";
import { EmptyState } from "@/components/empty-state";
import { EventFields } from "@/components/events/event-fields";
import { EventStatusBadge } from "@/components/events/event-status-badge";
import { FlashNotices } from "@/components/flash-notices";
import { NumberFormField } from "@/components/form/number-form-field";
import { NewTemplateDialog } from "@/components/templates/new-template-dialog";
import { TemplatePicker } from "@/components/templates/template-picker";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { buildQueryHref, Pagination } from "@/components/pagination";
import { TicketFilterBar } from "@/components/tickets/ticket-filter-bar";
import { TicketTable } from "@/components/tickets/ticket-table";
import { JobStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from "@/lib/api/api-client";
import type { OrganizationEvent, Page, TemplateSummary, Ticket, TicketBatch } from "@/lib/api/types";
import { readFlash, readSearchParam } from "@/lib/flash";
import { formatDateTime, formatNumber } from "@/lib/format";
import { MAXIMUM_TICKETS_PER_BATCH } from "@/lib/validation/form-schemas";
import { hasScope, requireScope } from "@/lib/workspace";

export const metadata: Metadata = { title: "Evento" };

const TICKETS_PAGE_SIZE = 20;

export default async function EventPage({ params, searchParams }: PageProps<"/events/[eventId]">) {
  const organization = await requireScope("org:events:read");
  const { eventId } = await params;
  const [event, templates, batches] = await Promise.all([
    apiRequest<OrganizationEvent>(`/org/events/${eventId}`, { organizationId: organization.id }),
    apiRequest<TemplateSummary[]>("/org/templates", { organizationId: organization.id }),
    apiRequest<TicketBatch[]>(`/org/events/${eventId}/batches`, { organizationId: organization.id }),
  ]);
  const lastUsedTemplateId = batches.find((batch) =>
    templates.some((template) => template.id === batch.templateId),
  )?.templateId;
  const templateNameById = new Map(templates.map((template) => [template.id, template.name]));
  const canEditEvent = hasScope(organization, "org:events:write");
  const canGenerateTickets = hasScope(organization, "org:tickets:generate");
  const canReadTickets = hasScope(organization, "org:tickets:read");
  const query = await searchParams;
  const ticketFilters = {
    ticketCode: readSearchParam(query, "ticketCode") ?? "",
    ticketStatus: readSearchParam(query, "ticketStatus") ?? "",
    ticketPayment: readSearchParam(query, "ticketPayment") ?? "",
  };
  const ticketPageNumber = Number(readSearchParam(query, "ticketPage") ?? 1) || 1;
  const ticketsPage = canReadTickets
    ? await apiRequest<Page<Ticket>>(
        buildQueryHref("/org/tickets", {
          eventId,
          code: ticketFilters.ticketCode,
          status: ticketFilters.ticketStatus,
          payment: ticketFilters.ticketPayment,
          page: ticketPageNumber,
          pageSize: TICKETS_PAGE_SIZE,
        }),
        { organizationId: organization.id },
      )
    : null;
  const eventPath = `/events/${eventId}`;
  const ticketsHref = (page: number) => `${buildQueryHref(eventPath, { ...ticketFilters, ticketPage: page })}#tickets`;

  return (
    <PageContainer>
      <PageHeader
        title={event.name}
        breadcrumbs={[{ label: "Eventos", href: "/events" }]}
        description={
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-4" aria-hidden="true" /> {formatDateTime(event.startsAt)}
            </span>
            {event.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden="true" /> {event.location}
              </span>
            )}
            <EventStatusBadge status={event.status} />
          </span>
        }
      />
      <FlashNotices flash={readFlash(query)} />

      <Card>
        <CardHeader>
          <CardTitle>Gerar tickets</CardTitle>
          <CardDescription>Cada ticket recebe um código único e números sem repetição no evento.</CardDescription>
        </CardHeader>
        {templates.length === 0 ? (
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Nenhum template na organização.</p>
            <NewTemplateDialog />
          </CardContent>
        ) : canGenerateTickets ? (
          <form action={createTicketBatch} className="contents">
            <input type="hidden" name="eventId" value={event.id} />
            <CardContent className="grid gap-5">
              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">Template</span>
                  <NewTemplateDialog triggerVariant="outline" />
                </div>
                <TemplatePicker
                  templates={templates}
                  name="templateId"
                  defaultTemplateId={lastUsedTemplateId}
                  lastUsedTemplateId={lastUsedTemplateId}
                />
              </div>
              <NumberFormField
                label="Quantidade"
                id="batch-quantity"
                hint="A versão atual do template fica bloqueada. Edições futuras criam uma nova versão."
                name="quantity"
                min={1}
                max={MAXIMUM_TICKETS_PER_BATCH}
                defaultValue={100}
                required
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full">
                <Sparkles /> Gerar lote
              </Button>
            </CardFooter>
          </form>
        ) : (
          <CardContent>
            <p className="text-sm text-muted-foreground">Você não tem permissão para gerar tickets.</p>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lotes</CardTitle>
          <CardDescription>Histórico de gerações deste evento.</CardDescription>
        </CardHeader>
        <CardContent>
          {batches.length === 0 ? (
            <EmptyState icon={Layers} title="Nenhum lote gerado para este evento" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead className="w-56">Progresso</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell>
                      <Link href={`/batches/${batch.id}`} className="font-medium text-primary hover:underline">
                        {formatDateTime(batch.createdAt)}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {templateNameById.get(batch.templateId) ?? "Template"} · v{batch.templateVersion}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Progress value={(batch.generatedCount / batch.quantity) * 100} />
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                          {formatNumber(batch.generatedCount)}/{formatNumber(batch.quantity)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <JobStatusBadge status={batch.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {canEditEvent && (
        <Card>
          <form action={updateEvent} className="contents">
            <input type="hidden" name="eventId" value={event.id} />
            <CardHeader>
              <CardTitle>Dados do evento</CardTitle>
              <CardDescription>Nome, data, local e status.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <EventFields event={event} />
            </CardContent>
            <CardFooter className="justify-end">
              <Button type="submit">Salvar alterações</Button>
            </CardFooter>
          </form>
        </Card>
      )}
      {ticketsPage && (
        <Card id="tickets" className="scroll-mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Tickets
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
                {formatNumber(ticketsPage.total)}
              </span>
            </CardTitle>
            <CardDescription>Todos os tickets gerados para este evento.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <TicketFilterBar
              paramNames={{ code: "ticketCode", status: "ticketStatus", payment: "ticketPayment", page: "ticketPage" }}
              values={{
                code: ticketFilters.ticketCode,
                status: ticketFilters.ticketStatus,
                payment: ticketFilters.ticketPayment,
              }}
              total={ticketsPage.total}
              anchor="tickets"
            />
            {ticketsPage.items.length === 0 ? (
              <EmptyState icon={TicketIcon} title="Nenhum ticket encontrado" />
            ) : (
              <TicketTable
                tickets={ticketsPage.items}
                canVoidTickets={hasScope(organization, "org:tickets:void")}
                canChangePayment={hasScope(organization, "org:tickets:payment")}
                paymentSettingsByEvent={new Map([[event.id, event]])}
                returnPath={ticketsHref(ticketsPage.page)}
              />
            )}
            <Pagination
              page={ticketsPage.page}
              pageSize={ticketsPage.pageSize}
              total={ticketsPage.total}
              buildHref={ticketsHref}
            />
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}

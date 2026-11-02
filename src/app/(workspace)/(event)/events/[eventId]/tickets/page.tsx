import { Layers, Sparkles, Ticket as TicketIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { createTicketBatch } from "@/actions/ticket-actions";
import { EmptyState } from "@/components/empty-state";
import { FlashNotices } from "@/components/flash-notices";
import { NumberFormField } from "@/components/form/number-form-field";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { buildQueryHref, Pagination } from "@/components/pagination";
import { JobStatusBadge } from "@/components/status-badge";
import { NewTemplateDialog } from "@/components/templates/new-template-dialog";
import { TemplatePicker } from "@/components/templates/template-picker";
import { TicketFilterBar } from "@/components/tickets/ticket-filter-bar";
import { TicketTable } from "@/components/tickets/ticket-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from "@/lib/api/api-client";
import type { Page, TemplateSummary, Ticket, TicketBatch } from "@/lib/api/types";
import { eventHasNumberedTickets, TEMPLATE_KIND_DETAILS, templateKindForEvent } from "@/lib/event-kinds";
import { eventRoutes } from "@/lib/event-routes";
import { requireEventWorkspace } from "@/lib/event-workspace";
import { readFlash, readSearchParam } from "@/lib/flash";
import { formatDateTime, formatNumber } from "@/lib/format";
import { MAXIMUM_TICKETS_PER_BATCH } from "@/lib/validation/form-schemas";
import { hasScope } from "@/lib/workspace";

export const metadata: Metadata = { title: "Tickets do evento" };

const TICKETS_PAGE_SIZE = 20;

export default async function EventTicketsPage({ params, searchParams }: PageProps<"/events/[eventId]/tickets">) {
  const { eventId } = await params;
  const { organization, event } = await requireEventWorkspace(eventId, "org:tickets:read");
  const query = await searchParams;
  const ticketFilters = {
    ticketCode: readSearchParam(query, "ticketCode") ?? "",
    ticketStatus: readSearchParam(query, "ticketStatus") ?? "",
    ticketPayment: readSearchParam(query, "ticketPayment") ?? "",
    batchId: readSearchParam(query, "batchId") ?? "",
  };
  const ticketPageNumber = Number(readSearchParam(query, "ticketPage") ?? 1) || 1;
  const [templates, batches, ticketsPage] = await Promise.all([
    apiRequest<TemplateSummary[]>("/org/templates", { organizationId: organization.id }),
    apiRequest<TicketBatch[]>(`/org/events/${event.id}/batches`, { organizationId: organization.id }),
    apiRequest<Page<Ticket>>(
      buildQueryHref("/org/tickets", {
        eventId: event.id,
        batchId: ticketFilters.batchId,
        code: ticketFilters.ticketCode,
        status: ticketFilters.ticketStatus,
        payment: ticketFilters.ticketPayment,
        page: ticketPageNumber,
        pageSize: TICKETS_PAGE_SIZE,
      }),
      { organizationId: organization.id },
    ),
  ]);
  const templateKind = templateKindForEvent(event);
  const compatibleTemplates = templates.filter((template) => template.kind === templateKind);
  const lastUsedTemplateId = batches.find((batch) =>
    compatibleTemplates.some((template) => template.id === batch.templateId),
  )?.templateId;
  const templateNameById = new Map(templates.map((template) => [template.id, template.name]));
  const canGenerateTickets = hasScope(organization, "org:tickets:generate");
  const hasNumbers = eventHasNumberedTickets(event);
  const ticketsPath = eventRoutes.tickets(event.id);
  const ticketsHref = (page: number) =>
    `${buildQueryHref(ticketsPath, { ...ticketFilters, ticketPage: page })}#tickets`;

  return (
    <PageContainer>
      <PageHeader
        title="Tickets"
        breadcrumbs={[{ label: event.name, href: eventRoutes.overview(event.id) }]}
        description="Gere lotes de cartelas, exporte para impressão e acompanhe cada ticket."
      />
      <FlashNotices flash={readFlash(query)} />

      {canGenerateTickets && (
        <Card>
          <CardHeader>
            <CardTitle>Gerar tickets</CardTitle>
            <CardDescription>
              {hasNumbers
                ? "Cada ticket recebe um código único e números sem repetição no evento."
                : "Cada ticket recebe um código único, impresso no template com o QR Code."}
            </CardDescription>
          </CardHeader>
          {compatibleTemplates.length === 0 ? (
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Nenhum template do tipo {TEMPLATE_KIND_DETAILS[templateKind].label.toLowerCase()} na organização.
              </p>
              <NewTemplateDialog defaultKind={templateKind} />
            </CardContent>
          ) : (
            <form action={createTicketBatch} className="contents">
              <input type="hidden" name="eventId" value={event.id} />
              <CardContent className="grid gap-5">
                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                      Template · {TEMPLATE_KIND_DETAILS[templateKind].label.toLowerCase()}
                    </span>
                    <NewTemplateDialog triggerVariant="outline" defaultKind={templateKind} />
                  </div>
                  <TemplatePicker
                    templates={compatibleTemplates}
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
          )}
        </Card>
      )}

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
                      <Link
                        href={eventRoutes.batch(event.id, batch.id)}
                        className="font-medium text-primary hover:underline"
                      >
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
          {ticketFilters.batchId && (
            <p className="text-sm text-muted-foreground">
              Mostrando os tickets de um lote.{" "}
              <Link href={`${ticketsPath}#tickets`} className="font-medium text-primary hover:underline">
                Ver todos
              </Link>
            </p>
          )}
          {ticketsPage.items.length === 0 ? (
            <EmptyState icon={TicketIcon} title="Nenhum ticket encontrado" />
          ) : (
            <TicketTable
              tickets={ticketsPage.items}
              canVoidTickets={hasScope(organization, "org:tickets:void")}
              canChangePayment={hasScope(organization, "org:tickets:payment")}
              paymentSettingsByEvent={new Map([[event.id, event]])}
              showNumbers={hasNumbers}
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
    </PageContainer>
  );
}

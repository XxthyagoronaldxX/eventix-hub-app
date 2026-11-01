import { Download, FileArchive, FileText, ListChecks, RefreshCw, Wallet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { markBatchAsPaid, requestExport } from "@/actions/ticket-actions";
import { SelectInput } from "@/components/form/select-input";
import { AutoRefresh } from "@/components/auto-refresh";
import { FlashNotices } from "@/components/flash-notices";
import { SelectFormField } from "@/components/form/select-form-field";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { JobStatusBadge } from "@/components/status-badge";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/api/api-client";
import type { OrganizationEvent, TicketBatch, TicketExport } from "@/lib/api/types";
import { readFlash } from "@/lib/flash";
import { formatBytes, formatDateTime, formatNumber, isJobRunning, PAYMENT_METHOD_OPTIONS } from "@/lib/format";
import { hasScope, requireScope } from "@/lib/workspace";

export const metadata: Metadata = { title: "Lote de tickets" };

const EXPORT_FORMAT_LABELS = { pdf: "PDF (A4)", zip: "ZIP com PNGs" } as const;
const EXPORT_FORMAT_OPTIONS = Object.entries(EXPORT_FORMAT_LABELS).map(([value, label]) => ({ value, label }));
const TICKETS_PER_PAGE_OPTIONS = [1, 2, 4].map((count) => ({ value: String(count), label: `${count} por folha` }));

function percentage(done: number, total: number): number {
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

export default async function BatchPage({ params, searchParams }: PageProps<"/batches/[batchId]">) {
  const organization = await requireScope("org:tickets:read");
  const { batchId } = await params;
  const batch = await apiRequest<TicketBatch>(`/org/batches/${batchId}`, { organizationId: organization.id });
  const [event, exports] = await Promise.all([
    apiRequest<OrganizationEvent>(`/org/events/${batch.eventId}`, { organizationId: organization.id }),
    apiRequest<TicketExport[]>(`/org/batches/${batchId}/exports`, { organizationId: organization.id }),
  ]);
  const hasRunningWork =
    isJobRunning(batch.status) || exports.some((ticketExport) => isJobRunning(ticketExport.status));
  const generationPercentage = percentage(batch.generatedCount, batch.quantity);

  return (
    <PageContainer>
      {hasRunningWork && <AutoRefresh />}
      <PageHeader
        title={`Lote de ${formatNumber(batch.quantity)} tickets`}
        breadcrumbs={[
          { label: "Eventos", href: "/events" },
          { label: event.name, href: `/events/${event.id}` },
        ]}
        description={`Criado em ${formatDateTime(batch.createdAt)} · template versão ${batch.templateVersion}`}
        actions={
          batch.status === "done" && (
            <>
              <Button variant="outline" asChild>
                <Link href={`/tickets?batchId=${batch.id}`}>
                  <ListChecks /> Ver tickets
                </Link>
              </Button>
              {hasScope(organization, "org:tickets:payment") && (
                <form action={markBatchAsPaid} className="flex items-center gap-2">
                  <input type="hidden" name="batchId" value={batch.id} />
                  <SelectInput
                    name="method"
                    defaultValue="pix"
                    aria-label="Forma de pagamento do lote"
                    className="w-32"
                    options={PAYMENT_METHOD_OPTIONS}
                  />
                  <Button type="submit">
                    <Wallet /> Marcar todos como pagos
                  </Button>
                </form>
              )}
            </>
          )
        }
      />
      <FlashNotices flash={readFlash(await searchParams)} />

      <Card>
        <CardHeader>
          <CardTitle>Geração</CardTitle>
          <CardDescription>
            {hasRunningWork ? (
              <span className="flex items-center gap-1.5">
                <RefreshCw className="size-3.5 animate-spin" aria-hidden="true" /> Atualizando automaticamente
              </span>
            ) : (
              "Códigos únicos e combinações de números sem repetição no evento."
            )}
          </CardDescription>
          <CardAction>
            <JobStatusBadge status={batch.status} />
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="flex items-end justify-between">
            <span className="text-3xl font-semibold tracking-tight tabular-nums">{generationPercentage}%</span>
            <span className="text-sm text-muted-foreground tabular-nums">
              {formatNumber(batch.generatedCount)} de {formatNumber(batch.quantity)}
            </span>
          </div>
          <Progress value={generationPercentage} />
          {batch.failureReason && (
            <Alert variant="destructive">
              <AlertTitle>{batch.failureReason}</AlertTitle>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exportar</CardTitle>
          <CardDescription>
            Gere o arquivo para impressão ou distribuição. Tickets cancelados ficam de fora.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          {batch.status === "done" ? (
            <form action={requestExport} className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <input type="hidden" name="batchId" value={batch.id} />
              <SelectFormField
                label="Formato"
                id="export-format"
                name="format"
                defaultValue="pdf"
                options={EXPORT_FORMAT_OPTIONS}
              />
              <SelectFormField
                label="Cartelas por folha (PDF)"
                id="export-per-page"
                name="ticketsPerPage"
                defaultValue="1"
                options={TICKETS_PER_PAGE_OPTIONS}
              />
              <Button type="submit">Gerar arquivo</Button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">A exportação fica disponível quando o lote terminar.</p>
          )}

          {exports.length > 0 && (
            <ul className="grid gap-2">
              {exports.map((ticketExport) => {
                const FormatIcon = ticketExport.format === "pdf" ? FileText : FileArchive;
                return (
                  <li key={ticketExport.id} className="flex flex-wrap items-center gap-4 rounded-lg border p-3">
                    <span className="flex size-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
                      <FormatIcon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">
                        {EXPORT_FORMAT_LABELS[ticketExport.format]}
                        {ticketExport.format === "pdf" && ` · ${ticketExport.ticketsPerPage} por folha`}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(ticketExport.createdAt)} · {formatNumber(ticketExport.renderedCount)}/
                        {formatNumber(ticketExport.totalCount)} cartelas
                        {ticketExport.failureReason && ` · ${ticketExport.failureReason}`}
                      </span>
                    </span>
                    <JobStatusBadge status={ticketExport.status} />
                    {ticketExport.status === "done" && (
                      <Button size="sm" asChild>
                        <a href={`/api/exports/${ticketExport.id}/download`}>
                          <Download /> Baixar · {formatBytes(ticketExport.sizeBytes)}
                        </a>
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}

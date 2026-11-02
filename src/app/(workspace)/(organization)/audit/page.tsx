import { Filter, ScrollText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { SelectFormField } from "@/components/form/select-form-field";
import { DateFormField } from "@/components/form/date-form-field";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { buildQueryHref, Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/api/api-client";
import type { AuditActor, AuditEntry, Page } from "@/lib/api/types";
import {
  AUDIT_ACTION_OPTIONS,
  type AuditTone,
  endOfDayIso,
  groupAuditEntriesByDay,
  presentAuditEntry,
  startOfDayIso,
} from "@/lib/audit-presenter";
import { readSearchParam } from "@/lib/flash";
import { cn } from "@/lib/utils";
import { requireScope } from "@/lib/workspace";

export const metadata: Metadata = { title: "Auditoria" };

const PAGE_SIZE = 40;

const TONE_CLASSES: Record<AuditTone, string> = {
  info: "bg-primary/10 text-primary",
  success: "bg-success/12 text-success",
  warning: "bg-warning/15 text-amber-700 dark:text-warning",
  danger: "bg-destructive/10 text-destructive",
  neutral: "bg-muted text-muted-foreground",
};

const timeFormatter = new Intl.DateTimeFormat("pt-BR", { timeStyle: "short", timeZone: "America/Sao_Paulo" });

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

export default async function AuditPage({ searchParams }: PageProps<"/audit">) {
  const organization = await requireScope("org:audit:read");
  const query = await searchParams;
  const filters = {
    from: readSearchParam(query, "from") ?? "",
    to: readSearchParam(query, "to") ?? "",
    actorId: readSearchParam(query, "actorId") ?? "",
    action: readSearchParam(query, "action") ?? "",
  };
  const page = Number(readSearchParam(query, "page") ?? 1) || 1;
  const [auditPage, actors] = await Promise.all([
    apiRequest<Page<AuditEntry>>(
      buildQueryHref("/org/audit-logs", {
        from: startOfDayIso(filters.from),
        to: endOfDayIso(filters.to),
        actorId: filters.actorId,
        action: filters.action,
        page,
        pageSize: PAGE_SIZE,
      }),
      { organizationId: organization.id },
    ),
    apiRequest<AuditActor[]>("/org/audit-logs/actors", { organizationId: organization.id }),
  ]);
  const hasFilters = Object.values(filters).some(Boolean);
  const auditDays = groupAuditEntriesByDay(auditPage.items);

  return (
    <PageContainer>
      <PageHeader
        title="Auditoria"
        description="Quem fez o quê e quando nas ações sensíveis da organização."
        actions={
          hasFilters && (
            <Button variant="ghost" asChild>
              <Link href="/audit">Limpar filtros</Link>
            </Button>
          )
        }
      />

      <Card>
        <CardContent>
          <form
            method="get"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[180px_180px_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end"
          >
            <DateFormField
              label="De"
              id="audit-from"
              name="from"
              defaultValue={filters.from}
              max={filters.to || undefined}
              placeholder="Início"
            />
            <DateFormField
              label="Até"
              id="audit-to"
              name="to"
              defaultValue={filters.to}
              min={filters.from || undefined}
              placeholder="Fim"
            />
            <SelectFormField
              label="Pessoa"
              id="audit-actor"
              name="actorId"
              defaultValue={filters.actorId}
              options={[
                { value: "", label: "Todas as pessoas" },
                ...actors.map((actor) => ({ value: actor.id, label: actor.name })),
              ]}
            />
            <SelectFormField
              label="Ação"
              id="audit-action"
              name="action"
              defaultValue={filters.action}
              options={[{ value: "", label: "Todas as ações" }, ...AUDIT_ACTION_OPTIONS]}
            />
            <Button type="submit">
              <Filter /> Filtrar
            </Button>
          </form>
        </CardContent>
      </Card>

      {auditDays.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title={hasFilters ? "Nenhuma ação encontrada com esses filtros" : "Nenhuma ação registrada ainda"}
          description={hasFilters ? "Ajuste o período, a pessoa ou a ação." : undefined}
        />
      ) : (
        <div className="grid gap-6">
          <p className="text-sm text-muted-foreground">
            {auditPage.total === 1 ? "1 registro" : `${auditPage.total} registros`}
          </p>
          {auditDays.map((day) => (
            <section key={day.dayKey} className="grid gap-2">
              <h2 className="sticky top-0 z-10 bg-background/90 py-1 text-sm font-semibold text-muted-foreground backdrop-blur">
                {day.label}
              </h2>
              <Card className="gap-0 py-0">
                <ol className="divide-y">
                  {day.entries.map((entry) => {
                    const { icon: ActionIcon, tone, summary } = presentAuditEntry(entry);
                    const actorName = entry.actor?.name ?? "Alguém";
                    return (
                      <li key={entry.id} className="flex items-start gap-3 px-4 py-3">
                        <span
                          className={cn(
                            "flex size-9 shrink-0 items-center justify-center rounded-full",
                            TONE_CLASSES[tone],
                          )}
                        >
                          <ActionIcon className="size-4" aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm">
                            <span className="font-medium">{actorName}</span>{" "}
                            <span className="text-foreground/80">{summary}</span>
                          </p>
                          {entry.actor && (
                            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <span className="flex size-4 items-center justify-center rounded-full bg-muted text-[9px] font-semibold">
                                {initialsOf(entry.actor.name)}
                              </span>
                              {entry.actor.email}
                            </p>
                          )}
                        </div>
                        <time
                          dateTime={entry.createdAt}
                          className="shrink-0 pt-0.5 text-xs text-muted-foreground tabular-nums"
                        >
                          {timeFormatter.format(new Date(entry.createdAt))}
                        </time>
                      </li>
                    );
                  })}
                </ol>
              </Card>
            </section>
          ))}
        </div>
      )}

      <Pagination
        page={auditPage.page}
        pageSize={auditPage.pageSize}
        total={auditPage.total}
        buildHref={(targetPage) => buildQueryHref("/audit", { ...filters, page: targetPage })}
      />
    </PageContainer>
  );
}

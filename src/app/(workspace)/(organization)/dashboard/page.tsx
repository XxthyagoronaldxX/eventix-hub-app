import {
  ArrowRight,
  CalendarDays,
  CircleDollarSign,
  Dices,
  DoorOpen,
  Layers,
  MapPin,
  Plus,
  ScanLine,
  Sparkles,
  Ticket,
  Wallet,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { EventStatusBadge } from "@/components/events/event-status-badge";
import { FlashNotices } from "@/components/flash-notices";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { JobStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/api/api-client";
import type { OrganizationEvent, Scope, TicketBatch } from "@/lib/api/types";
import { type EventOverview, loadEventOverviews, percentageOf } from "@/lib/dashboard";
import { eventHasDraw } from "@/lib/event-kinds";
import { eventRoutes } from "@/lib/event-routes";
import { readFlash } from "@/lib/flash";
import { formatCurrencyFromCents, formatDateTime, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { hasScope, requireOrganization } from "@/lib/workspace";

export const metadata: Metadata = { title: "Painel" };

const GREETING_HOUR_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  hour: "numeric",
  hourCycle: "h23",
  timeZone: "America/Sao_Paulo",
});

function greetingForNow(): string {
  const hour = Number(GREETING_HOUR_FORMATTER.format(new Date()));
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

interface QuickAction {
  label: string;
  href: (event: OrganizationEvent) => string;
  icon: typeof Wallet;
  scope: Scope;
  isAvailable?: (event: OrganizationEvent) => boolean;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Abrir caixa", href: (event) => eventRoutes.payments(event.id), icon: Wallet, scope: "org:tickets:payment" },
  { label: "Check-in", href: (event) => eventRoutes.checkIn(event.id), icon: ScanLine, scope: "org:tickets:check-in" },
  {
    label: "Sorteio",
    href: (event) => eventRoutes.draw(event.id),
    icon: Dices,
    scope: "org:draws:run",
    isAvailable: eventHasDraw,
  },
];

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const organization = await requireOrganization();
  const [events, recentBatches] = await Promise.all([
    apiRequest<OrganizationEvent[]>("/org/events", { organizationId: organization.id }),
    hasScope(organization, "org:tickets:read")
      ? apiRequest<TicketBatch[]>("/org/batches/recent", { organizationId: organization.id })
      : Promise.resolve([]),
  ]);
  const overviews = await loadEventOverviews(organization, events);
  const eventNameById = new Map(events.map((event) => [event.id, event.name]));
  const featured = overviews[0] ?? null;

  const totals = overviews.reduce(
    (sum, overview) => ({
      tickets: sum.tickets + overview.ticketCount,
      paid: sum.paid + (overview.paidCount ?? 0),
      checkedIn: sum.checkedIn + (overview.checkedInCount ?? 0),
      revenueCents: sum.revenueCents + (overview.revenueCents ?? 0),
    }),
    { tickets: 0, paid: 0, checkedIn: 0, revenueCents: 0 },
  );
  const canSeePayments = hasScope(organization, "org:tickets:payment");
  const canSeeCheckIns = hasScope(organization, "org:tickets:check-in");
  const activeEventCount = events.filter((event) => event.status === "active").length;

  return (
    <PageContainer>
      <PageHeader
        title={`${greetingForNow()}! 👋`}
        description={`Este é o resumo de ${organization.name}.`}
        actions={
          hasScope(organization, "org:events:write") && (
            <Button asChild>
              <Link href="/events?new=1">
                <Plus /> Novo evento
              </Link>
            </Button>
          )
        }
      />
      <FlashNotices flash={readFlash(await searchParams)} />

      {featured ? (
        <FeaturedEvent
          overview={featured}
          quickActions={QUICK_ACTIONS.filter((action) => hasScope(organization, action.scope))}
        />
      ) : (
        <Card>
          <CardContent>
            <EmptyState
              icon={Sparkles}
              title="Nenhum evento em andamento"
              description="Crie um evento para começar a vender tickets."
            />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Eventos"
          value={formatNumber(events.length)}
          icon={CalendarDays}
          hint={`${activeEventCount} ativo(s) · ${events.length - activeEventCount} em rascunho ou arquivado(s)`}
        />
        <StatCard
          label="Tickets em circulação"
          value={formatNumber(totals.tickets)}
          icon={Ticket}
          hint="Nos próximos eventos"
        />
        {canSeePayments && (
          <StatCard
            label="Arrecadado"
            value={formatCurrencyFromCents(totals.revenueCents)}
            icon={CircleDollarSign}
            hint={`${formatNumber(totals.paid)} tickets pagos (${percentageOf(totals.paid, totals.tickets)}%)`}
          />
        )}
        {canSeeCheckIns && (
          <StatCard
            label="Entradas"
            value={formatNumber(totals.checkedIn)}
            icon={DoorOpen}
            hint={`${percentageOf(totals.checkedIn, totals.tickets)}% dos tickets já entraram`}
          />
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Progresso dos eventos</CardTitle>
            <CardDescription>Pagamentos e entradas dos próximos eventos.</CardDescription>
            <CardAction>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/events">
                  Ver todos <ArrowRight />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {overviews.length === 0 ? (
              <EmptyState icon={CalendarDays} title="Nenhum evento ainda" description="Crie um evento para começar." />
            ) : (
              <ul className="grid gap-1">
                {overviews.map((overview) => (
                  <EventProgressRow key={overview.event.id} overview={overview} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimos lotes</CardTitle>
            <CardDescription>Gerações de tickets mais recentes.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentBatches.length === 0 ? (
              <EmptyState
                icon={Layers}
                title="Nenhum lote gerado"
                description="Os lotes aparecem aqui após a geração."
              />
            ) : (
              <ol className="relative grid gap-4 border-l pl-5">
                {recentBatches.map((batch) => (
                  <li key={batch.id} className="relative">
                    <span className="absolute top-1.5 -left-[25px] size-2.5 rounded-full bg-primary ring-4 ring-card" />
                    <Link
                      href={eventRoutes.batch(batch.eventId, batch.id)}
                      className="group flex items-start justify-between gap-3"
                    >
                      <span className="min-w-0">
                        <span className="block font-medium group-hover:text-primary">
                          {formatNumber(batch.quantity)} tickets
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {eventNameById.get(batch.eventId) ?? "Evento"} · {formatDateTime(batch.createdAt)}
                        </span>
                      </span>
                      <JobStatusBadge status={batch.status} />
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

function FeaturedEvent({ overview, quickActions }: { overview: EventOverview; quickActions: QuickAction[] }) {
  const { event } = overview;
  return (
    <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-lg sm:p-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgb(255_255_255/0.22),transparent_40%),radial-gradient(circle_at_10%_90%,rgb(255_255_255/0.12),transparent_45%)]"
      />
      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide uppercase backdrop-blur">
            <Sparkles className="size-3.5" aria-hidden="true" /> Próximo evento · {overview.countdown}
          </span>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{event.name}</h2>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/85">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-4" aria-hidden="true" /> {formatDateTime(event.startsAt)}
            </span>
            {event.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden="true" /> {event.location}
              </span>
            )}
            {event.ticketPriceCents > 0 && (
              <span className="flex items-center gap-1.5">
                <Ticket className="size-4" aria-hidden="true" /> {formatCurrencyFromCents(event.ticketPriceCents)}
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            {quickActions
              .filter((action) => action.isAvailable?.(event) ?? true)
              .map((action) => (
                <Button
                  key={action.label}
                  asChild
                  variant="secondary"
                  className="bg-white/15 text-white hover:bg-white/25"
                >
                  <Link href={action.href(event)}>
                    <action.icon /> {action.label}
                  </Link>
                </Button>
              ))}
            <Button asChild variant="ghost" className="text-white hover:bg-white/15 hover:text-white">
              <Link href={eventRoutes.overview(event.id)}>
                Ver evento <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>

        <dl className="grid grid-cols-3 gap-3 rounded-xl bg-white/10 p-4 text-center backdrop-blur lg:min-w-80">
          <FeaturedMetric label="Tickets" value={formatNumber(overview.ticketCount)} />
          <FeaturedMetric
            label="Pagos"
            value={overview.paidCount === null ? "—" : `${percentageOf(overview.paidCount, overview.ticketCount)}%`}
          />
          <FeaturedMetric
            label="Entraram"
            value={overview.checkedInCount === null ? "—" : formatNumber(overview.checkedInCount)}
          />
        </dl>
      </div>
    </section>
  );
}

function FeaturedMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dd className="text-2xl font-semibold tabular-nums">{value}</dd>
      <dt className="text-xs text-white/75">{label}</dt>
    </div>
  );
}

function EventProgressRow({ overview }: { overview: EventOverview }) {
  const { event } = overview;
  return (
    <li>
      <Link
        href={eventRoutes.overview(event.id)}
        className="-mx-2 grid gap-2.5 rounded-lg px-2 py-3 transition-colors hover:bg-muted/60 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] sm:items-center sm:gap-6"
      >
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="truncate font-medium">{event.name}</span>
            <EventStatusBadge status={event.status} />
          </span>
          <span className={cn("text-xs", overview.isPast ? "text-muted-foreground/70" : "text-muted-foreground")}>
            {formatDateTime(event.startsAt)} · {overview.countdown} · {formatNumber(overview.ticketCount)} tickets
          </span>
        </span>
        <span className="grid gap-1.5">
          {overview.paidCount !== null && (
            <ProgressLine
              label="Pagos"
              tone="bg-emerald-500"
              percentage={percentageOf(overview.paidCount, overview.ticketCount)}
            />
          )}
          {overview.checkedInCount !== null && (
            <ProgressLine
              label="Entradas"
              tone="bg-sky-500"
              percentage={percentageOf(overview.checkedInCount, overview.ticketCount)}
            />
          )}
        </span>
      </Link>
    </li>
  );
}

function ProgressLine({ label, tone, percentage }: { label: string; tone: string; percentage: number }) {
  return (
    <span className="grid grid-cols-[4.5rem_minmax(0,1fr)_2.5rem] items-center gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="h-1.5 overflow-hidden rounded-full bg-muted">
        <span className={cn("block h-full rounded-full", tone)} style={{ width: `${percentage}%` }} />
      </span>
      <span className="text-right font-medium tabular-nums">{percentage}%</span>
    </span>
  );
}

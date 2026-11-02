import {
  ArrowRight,
  CalendarDays,
  CircleDollarSign,
  Dices,
  DoorOpen,
  Layers,
  type LucideIcon,
  MapPin,
  ScanLine,
  Ticket,
  Wallet,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { EventKindBadge } from "@/components/events/event-kind-picker";
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
import { loadEventOverview, percentageOf } from "@/lib/dashboard";
import { EVENT_KIND_DETAILS, eventHasDraw } from "@/lib/event-kinds";
import { eventRoutes } from "@/lib/event-routes";
import { requireEventWorkspace } from "@/lib/event-workspace";
import { readFlash } from "@/lib/flash";
import { formatCurrencyFromCents, formatDateTime, formatNumber } from "@/lib/format";
import { hasScope } from "@/lib/workspace";

export const metadata: Metadata = { title: "Visão geral do evento" };

const RECENT_BATCH_LIMIT = 5;

interface Shortcut {
  title: string;
  description: (event: OrganizationEvent) => string;
  href: (eventId: string) => string;
  isAvailable?: (event: OrganizationEvent) => boolean;
  icon: LucideIcon;
  tone: string;
  scope: Scope;
}

const SHORTCUTS: Shortcut[] = [
  {
    title: "Caixa",
    description: () => "Receba pagamentos em Pix, dinheiro ou cartão.",
    href: eventRoutes.payments,
    icon: Wallet,
    tone: "from-emerald-500 to-teal-600",
    scope: "org:tickets:payment",
  },
  {
    title: "Check-in",
    description: () => "Leia o QR Code ou digite o código na entrada.",
    href: eventRoutes.checkIn,
    icon: ScanLine,
    tone: "from-sky-500 to-blue-600",
    scope: "org:tickets:check-in",
  },
  {
    title: "Sorteio",
    description: (event) => EVENT_KIND_DETAILS[event.kind].drawDescription ?? "",
    href: eventRoutes.draw,
    isAvailable: eventHasDraw,
    icon: Dices,
    tone: "from-indigo-500 to-fuchsia-600",
    scope: "org:draws:run",
  },
  {
    title: "Tickets",
    description: () => "Gere lotes, exporte para impressão e busque tickets.",
    href: eventRoutes.tickets,
    icon: Ticket,
    tone: "from-amber-500 to-orange-600",
    scope: "org:tickets:read",
  },
];

export default async function EventOverviewPage({ params, searchParams }: PageProps<"/events/[eventId]">) {
  const { eventId } = await params;
  const { organization, event } = await requireEventWorkspace(eventId);
  const canReadTickets = hasScope(organization, "org:tickets:read");
  const [overview, batches] = await Promise.all([
    loadEventOverview(organization, event),
    canReadTickets
      ? apiRequest<TicketBatch[]>(`/org/events/${event.id}/batches`, { organizationId: organization.id })
      : Promise.resolve([]),
  ]);
  const shortcuts = SHORTCUTS.filter(
    (shortcut) => hasScope(organization, shortcut.scope) && (shortcut.isAvailable?.(event) ?? true),
  );

  return (
    <PageContainer>
      <PageHeader
        title={event.name}
        description={
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-4" aria-hidden="true" /> {formatDateTime(event.startsAt)} ·{" "}
              {overview.countdown}
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
            <EventKindBadge kind={event.kind} />
            <EventStatusBadge status={event.status} />
          </span>
        }
      />
      <FlashNotices flash={readFlash(await searchParams)} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tickets" value={formatNumber(overview.ticketCount)} icon={Ticket} hint="Ativos no evento" />
        {overview.paidCount !== null && (
          <StatCard
            label="Pagos"
            value={formatNumber(overview.paidCount)}
            icon={Wallet}
            hint={`${percentageOf(overview.paidCount, overview.ticketCount)}% dos tickets`}
          />
        )}
        {overview.revenueCents !== null && (
          <StatCard
            label="Arrecadado"
            value={formatCurrencyFromCents(overview.revenueCents)}
            icon={CircleDollarSign}
            hint="Tickets pagos × valor do ticket"
          />
        )}
        {overview.checkedInCount !== null && (
          <StatCard
            label="Entradas"
            value={formatNumber(overview.checkedInCount)}
            icon={DoorOpen}
            hint={`${percentageOf(overview.checkedInCount, overview.ticketCount)}% já entraram`}
          />
        )}
      </div>

      {shortcuts.length > 0 && (
        <section aria-label="Atalhos do evento" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {shortcuts.map((shortcut) => (
            <Link
              key={shortcut.title}
              href={shortcut.href(event.id)}
              className="group rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Card className="h-full transition-shadow group-hover:shadow-md group-hover:ring-primary/30">
                <CardContent className="flex h-full flex-col gap-3">
                  <span
                    className={`flex size-10 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-md ${shortcut.tone}`}
                  >
                    <shortcut.icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="space-y-1">
                    <span className="flex items-center gap-1 font-semibold group-hover:text-primary">
                      {shortcut.title}
                      <ArrowRight
                        className="size-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                        aria-hidden="true"
                      />
                    </span>
                    <span className="block text-sm text-muted-foreground">{shortcut.description(event)}</span>
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>
      )}

      {canReadTickets && (
        <Card>
          <CardHeader>
            <CardTitle>Últimos lotes</CardTitle>
            <CardDescription>Gerações de tickets deste evento.</CardDescription>
            <CardAction>
              <Button variant="ghost" size="sm" asChild>
                <Link href={eventRoutes.tickets(event.id)}>
                  Ver tickets <ArrowRight />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {batches.length === 0 ? (
              <EmptyState
                icon={Layers}
                title="Nenhum lote gerado"
                description="Gere o primeiro lote na página de tickets."
              />
            ) : (
              <ul className="grid gap-1">
                {batches.slice(0, RECENT_BATCH_LIMIT).map((batch) => (
                  <li key={batch.id}>
                    <Link
                      href={eventRoutes.batch(event.id, batch.id)}
                      className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/60"
                    >
                      <span className="min-w-0">
                        <span className="block font-medium">{formatNumber(batch.quantity)} tickets</span>
                        <span className="block text-xs text-muted-foreground">
                          {formatDateTime(batch.createdAt)} · template v{batch.templateVersion}
                        </span>
                      </span>
                      <JobStatusBadge status={batch.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}

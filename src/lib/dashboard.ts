import { apiRequest, attempt } from "@/lib/api/api-client";
import type { ActiveOrganization, CheckInSummary, OrganizationEvent, PaymentSummary } from "@/lib/api/types";
import { hasScope } from "@/lib/workspace";

export interface EventOverview {
  event: OrganizationEvent;
  ticketCount: number;
  paidCount: number | null;
  checkedInCount: number | null;
  revenueCents: number | null;
  isPast: boolean;
  countdown: string;
}

const TRACKED_EVENT_LIMIT = 6;
const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;

function byUpcomingFirst(now: number) {
  return (first: OrganizationEvent, second: OrganizationEvent) => {
    const firstTime = Date.parse(first.startsAt);
    const secondTime = Date.parse(second.startsAt);
    const firstIsPast = firstTime < now - DAY_MILLISECONDS;
    const secondIsPast = secondTime < now - DAY_MILLISECONDS;
    if (firstIsPast !== secondIsPast) return firstIsPast ? 1 : -1;
    return firstIsPast ? secondTime - firstTime : firstTime - secondTime;
  };
}

export async function loadEventOverviews(
  organization: ActiveOrganization,
  events: OrganizationEvent[],
): Promise<EventOverview[]> {
  const now = Date.now();
  const canSeePayments = hasScope(organization, "org:tickets:payment");
  const canSeeCheckIns = hasScope(organization, "org:tickets:check-in");
  const trackedEvents = events
    .filter((event) => event.status !== "archived")
    .sort(byUpcomingFirst(now))
    .slice(0, TRACKED_EVENT_LIMIT);

  return Promise.all(
    trackedEvents.map(async (event) => {
      const [payments, checkIns] = await Promise.all([
        canSeePayments
          ? attempt(() =>
              apiRequest<PaymentSummary>(`/org/events/${event.id}/payments/summary`, {
                organizationId: organization.id,
              }),
            )
          : null,
        canSeeCheckIns
          ? attempt(() =>
              apiRequest<CheckInSummary>(`/org/events/${event.id}/check-ins/summary`, {
                organizationId: organization.id,
              }),
            )
          : null,
      ]);
      const paymentSummary = payments?.ok ? payments.value : null;
      const checkInSummary = checkIns?.ok ? checkIns.value : null;
      return {
        event,
        ticketCount: paymentSummary?.activeTicketCount ?? checkInSummary?.activeTicketCount ?? 0,
        paidCount: paymentSummary?.paidCount ?? null,
        checkedInCount: checkInSummary?.checkedInCount ?? null,
        revenueCents: paymentSummary ? paymentSummary.paidCount * event.ticketPriceCents : null,
        isPast: Date.parse(event.startsAt) < now,
        countdown: describeCountdown(event.startsAt, now),
      };
    }),
  );
}

export function describeCountdown(startsAt: string, now = Date.now()): string {
  const days = Math.round((Date.parse(startsAt) - now) / DAY_MILLISECONDS);
  if (days === 0) return "É hoje!";
  if (days === 1) return "Amanhã";
  if (days > 1) return `Em ${days} dias`;
  if (days === -1) return "Foi ontem";
  return `Há ${Math.abs(days)} dias`;
}

export function percentageOf(part: number | null, total: number): number {
  return part === null || total === 0 ? 0 : Math.round((part / total) * 100);
}

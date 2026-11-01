"use server";

import { apiRequest, attempt } from "@/lib/api/api-client";
import type { Page, PaymentMethod, PaymentSummary, Ticket } from "@/lib/api/types";
import { objectIdSchema } from "@/lib/validation/common-schemas";
import { firstIssueMessage, z } from "@/lib/validation/zod";
import { requireScope } from "@/lib/workspace";

export interface TicketBuyerPayload {
  name?: string;
  phone?: string;
  document?: string;
}

export type PaymentLookup = { ok: true; ticket: Ticket } | { ok: false; message: string };

export type PaymentConfirmation =
  { ok: true; ticket: Ticket; summary: PaymentSummary } | { ok: false; message: string };

const ticketLookupSchema = z.object({
  eventId: objectIdSchema,
  code: z.string().trim().min(1, { error: "Informe o código do ticket." }).max(64),
});

const manualPaymentSchema = z.object({
  eventId: objectIdSchema,
  ticketId: objectIdSchema,
  method: z.enum(["pix", "cash", "card"], { error: "Escolha a forma de pagamento." }),
});

function summaryPath(eventId: string): string {
  return `/org/events/${eventId}/payments/summary`;
}

export async function findTicketForPayment(eventId: string, code: string): Promise<PaymentLookup> {
  const organization = await requireScope("org:tickets:payment");
  const input = ticketLookupSchema.safeParse({ eventId, code });
  if (!input.success) {
    return { ok: false, message: firstIssueMessage(input.error) };
  }
  const query = new URLSearchParams({ code: input.data.code, pageSize: "1" });
  const result = await attempt(() =>
    apiRequest<Page<Ticket>>(`/org/tickets?${query}`, { organizationId: organization.id }),
  );
  if (!result.ok) {
    return { ok: false, message: result.message };
  }
  const ticket = result.value.items[0];
  if (!ticket) {
    return { ok: false, message: `Nenhum ticket com o código ${input.data.code.toUpperCase()}.` };
  }
  if (ticket.eventId !== input.data.eventId) {
    return { ok: false, message: `O ticket ${ticket.code} é de outro evento.` };
  }
  return { ok: true, ticket };
}

export async function refreshTicketPayment(eventId: string, ticketId: string): Promise<PaymentConfirmation> {
  const organization = await requireScope("org:tickets:payment");
  if (!objectIdSchema.safeParse(eventId).success || !objectIdSchema.safeParse(ticketId).success) {
    return { ok: false, message: "Ticket inválido." };
  }
  const [ticket, summary] = await Promise.all([
    attempt(() => apiRequest<Ticket>(`/org/tickets/${ticketId}`, { organizationId: organization.id })),
    attempt(() => apiRequest<PaymentSummary>(summaryPath(eventId), { organizationId: organization.id })),
  ]);
  if (!ticket.ok) return { ok: false, message: ticket.message };
  if (!summary.ok) return { ok: false, message: summary.message };
  return { ok: true, ticket: ticket.value, summary: summary.value };
}

export async function confirmManualPayment(
  eventId: string,
  ticketId: string,
  method: PaymentMethod,
  buyer: TicketBuyerPayload = {},
): Promise<PaymentConfirmation> {
  const organization = await requireScope("org:tickets:payment");
  const input = manualPaymentSchema.safeParse({ eventId, ticketId, method });
  if (!input.success) {
    return { ok: false, message: firstIssueMessage(input.error) };
  }
  const result = await attempt(() =>
    apiRequest<Ticket>(`/org/tickets/${input.data.ticketId}/payment`, {
      method: "POST",
      organizationId: organization.id,
      body: { paid: true, method: input.data.method, buyer },
    }),
  );
  if (!result.ok) {
    return { ok: false, message: result.message };
  }
  const summary = await apiRequest<PaymentSummary>(summaryPath(input.data.eventId), {
    organizationId: organization.id,
  });
  return { ok: true, ticket: result.value, summary };
}

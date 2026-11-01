"use server";

import type { TicketBuyerPayload } from "@/actions/payment-actions";
import { apiRequest, attempt } from "@/lib/api/api-client";
import { objectIdSchema } from "@/lib/validation/common-schemas";
import { z } from "@/lib/validation/zod";
import { requireScope } from "@/lib/workspace";

export type OnlinePaymentMethod = "pix" | "card";

export interface StripeCheckout {
  sessionId: string;
  url: string;
  amountCents: number;
  method: OnlinePaymentMethod;
  expiresAt: string;
}

export interface StripeCheckoutStatus {
  sessionId: string;
  status: "open" | "paid" | "expired";
  ticketPaid: boolean;
}

type ActionResult<TValue> = { ok: true; value: TValue } | { ok: false; message: string };

const onlinePaymentMethodSchema = z.enum(["pix", "card"]);
const checkoutSessionIdSchema = z.string().regex(/^cs_[\w]+$/);

export async function createStripeCheckout(
  ticketId: string,
  method: OnlinePaymentMethod,
  buyer: TicketBuyerPayload = {},
): Promise<ActionResult<StripeCheckout>> {
  if (!objectIdSchema.safeParse(ticketId).success || !onlinePaymentMethodSchema.safeParse(method).success) {
    return { ok: false, message: "Cobrança inválida." };
  }
  const organization = await requireScope("org:tickets:payment");
  const result = await attempt(() =>
    apiRequest<StripeCheckout>(`/org/tickets/${ticketId}/stripe-checkout`, {
      method: "POST",
      organizationId: organization.id,
      body: { method, buyer },
    }),
  );
  return result.ok ? { ok: true, value: result.value } : { ok: false, message: result.message };
}

export async function readStripeCheckoutStatus(
  ticketId: string,
  sessionId: string,
): Promise<ActionResult<StripeCheckoutStatus>> {
  if (!objectIdSchema.safeParse(ticketId).success || !checkoutSessionIdSchema.safeParse(sessionId).success) {
    return { ok: false, message: "Cobrança inválida." };
  }
  const organization = await requireScope("org:tickets:payment");
  const result = await attempt(() =>
    apiRequest<StripeCheckoutStatus>(`/org/tickets/${ticketId}/stripe-checkout/${sessionId}`, {
      organizationId: organization.id,
    }),
  );
  return result.ok ? { ok: true, value: result.value } : { ok: false, message: result.message };
}

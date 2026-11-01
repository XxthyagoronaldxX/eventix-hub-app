"use server";

import { apiRequest, attempt } from "@/lib/api/api-client";
import type { PublicDrawView, TrackedTicket } from "@/lib/api/types";
import { z } from "@/lib/validation/zod";

const MAXIMUM_TRACKED_TICKETS = 20;

const shareTokenSchema = z.string().regex(/^[\w-]{8,64}$/);
const ticketCodesSchema = z.array(z.string().trim().min(1).max(40)).min(1).max(MAXIMUM_TRACKED_TICKETS);

export type PublicDrawSnapshot =
  { ok: true; view: PublicDrawView; tickets: TrackedTicket[] } | { ok: false; message: string };

export async function loadPublicDrawSnapshot(token: string, ticketCodes: string[]): Promise<PublicDrawSnapshot> {
  if (!shareTokenSchema.safeParse(token).success) {
    return { ok: false, message: "Link de sorteio inválido." };
  }
  const view = await attempt(() => apiRequest<PublicDrawView>(`/public/draws/${token}`, { authenticated: false }));
  if (!view.ok) return { ok: false, message: view.message };

  const parsedCodes = ticketCodesSchema.safeParse(ticketCodes);
  if (!view.value.allowTicketTracking || !parsedCodes.success) {
    return { ok: true, view: view.value, tickets: [] };
  }
  const tickets = await attempt(() =>
    apiRequest<TrackedTicket[]>(`/public/draws/${token}/tickets`, {
      method: "POST",
      authenticated: false,
      body: { codes: parsedCodes.data },
    }),
  );
  if (!tickets.ok) return { ok: false, message: tickets.message };
  return { ok: true, view: view.value, tickets: tickets.value };
}

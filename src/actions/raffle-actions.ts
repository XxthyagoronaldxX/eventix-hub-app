"use server";

import { buildQueryHref } from "@/components/pagination";
import { apiRequest, attempt } from "@/lib/api/api-client";
import type { RaffleState, RaffleWinner } from "@/lib/api/types";
import { objectIdSchema } from "@/lib/validation/common-schemas";
import { requireScope } from "@/lib/workspace";

export type RaffleActionResult =
  { ok: true; state: RaffleState; winner?: RaffleWinner } | { ok: false; message: string };

async function callRaffleApi(
  eventId: string,
  path: string,
  onlyCheckedIn: boolean,
  method: "GET" | "POST",
): Promise<RaffleActionResult> {
  if (!objectIdSchema.safeParse(eventId).success) {
    return { ok: false, message: "Identificador inválido." };
  }
  const organization = await requireScope("org:draws:run");
  const result = await attempt(() =>
    apiRequest<RaffleState & { winner?: RaffleWinner }>(
      buildQueryHref(`/org/events/${eventId}/raffle${path}`, { onlyCheckedIn: String(onlyCheckedIn) }),
      { method, organizationId: organization.id },
    ),
  );
  if (!result.ok) {
    return { ok: false, message: result.message };
  }
  const { winner, ...state } = result.value;
  return { ok: true, state, winner };
}

export async function loadRaffleState(eventId: string, onlyCheckedIn: boolean): Promise<RaffleActionResult> {
  return callRaffleApi(eventId, "", onlyCheckedIn, "GET");
}

export async function drawRaffleTicket(eventId: string, onlyCheckedIn: boolean): Promise<RaffleActionResult> {
  return callRaffleApi(eventId, "/draws", onlyCheckedIn, "POST");
}

export async function discardRaffleWinner(
  eventId: string,
  winnerId: string,
  onlyCheckedIn: boolean,
): Promise<RaffleActionResult> {
  if (!objectIdSchema.safeParse(winnerId).success) {
    return { ok: false, message: "Identificador inválido." };
  }
  return callRaffleApi(eventId, `/winners/${winnerId}/discard`, onlyCheckedIn, "POST");
}

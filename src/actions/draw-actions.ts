"use server";

import { apiRequest, attempt } from "@/lib/api/api-client";
import type { DrawState, WinningPattern } from "@/lib/api/types";
import { buildQueryHref } from "@/components/pagination";
import { objectIdSchema } from "@/lib/validation/common-schemas";
import { firstIssueMessage, z } from "@/lib/validation/zod";
import { requireScope } from "@/lib/workspace";

export type DrawActionResult = { ok: true; state: DrawState; drawnNumber?: number } | { ok: false; message: string };

const winningPatternSchema = z.enum(["line", "full_card"], { error: "Escolha o tipo de vitória." });
const drawnNumberSchema = z.int({ error: "Informe um número inteiro." }).min(0).max(100_000).optional();

async function callDrawApi(
  path: string,
  onlyCheckedIn: boolean,
  options: { method?: "GET" | "POST"; body?: unknown } = {},
): Promise<DrawActionResult> {
  const organization = await requireScope("org:draws:run");
  const result = await attempt(() =>
    apiRequest<DrawState & { drawnNumber?: number }>(buildQueryHref(path, { onlyCheckedIn: String(onlyCheckedIn) }), {
      method: options.method ?? "POST",
      organizationId: organization.id,
      body: options.body,
    }),
  );
  if (!result.ok) {
    return { ok: false, message: result.message };
  }
  const { drawnNumber, ...state } = result.value;
  return { ok: true, state, drawnNumber };
}

function validateId(id: string): string | null {
  return objectIdSchema.safeParse(id).success ? null : "Identificador inválido.";
}

export async function loadDrawState(eventId: string, onlyCheckedIn: boolean): Promise<DrawActionResult> {
  const idProblem = validateId(eventId);
  if (idProblem) return { ok: false, message: idProblem };
  return callDrawApi(`/org/events/${eventId}/draws/current`, onlyCheckedIn, { method: "GET" });
}

export async function startDrawRound(
  eventId: string,
  pattern: WinningPattern,
  onlyCheckedIn: boolean,
): Promise<DrawActionResult> {
  const idProblem = validateId(eventId);
  if (idProblem) return { ok: false, message: idProblem };
  const parsedPattern = winningPatternSchema.safeParse(pattern);
  if (!parsedPattern.success) return { ok: false, message: firstIssueMessage(parsedPattern.error) };
  return callDrawApi(`/org/events/${eventId}/draws`, onlyCheckedIn, { body: { pattern: parsedPattern.data } });
}

export async function drawBingoNumber(
  drawId: string,
  requestedNumber: number | undefined,
  onlyCheckedIn: boolean,
): Promise<DrawActionResult> {
  const idProblem = validateId(drawId);
  if (idProblem) return { ok: false, message: idProblem };
  const parsedNumber = drawnNumberSchema.safeParse(requestedNumber);
  if (!parsedNumber.success) return { ok: false, message: firstIssueMessage(parsedNumber.error) };
  return callDrawApi(`/org/draws/${drawId}/numbers`, onlyCheckedIn, {
    body: parsedNumber.data === undefined ? {} : { number: parsedNumber.data },
  });
}

export async function undoBingoNumber(drawId: string, onlyCheckedIn: boolean): Promise<DrawActionResult> {
  const idProblem = validateId(drawId);
  if (idProblem) return { ok: false, message: idProblem };
  return callDrawApi(`/org/draws/${drawId}/undo`, onlyCheckedIn);
}

export async function finishDrawRound(drawId: string, onlyCheckedIn: boolean): Promise<DrawActionResult> {
  const idProblem = validateId(drawId);
  if (idProblem) return { ok: false, message: idProblem };
  return callDrawApi(`/org/draws/${drawId}/finish`, onlyCheckedIn);
}

export async function changeDrawPattern(
  drawId: string,
  pattern: WinningPattern,
  onlyCheckedIn: boolean,
): Promise<DrawActionResult> {
  const idProblem = validateId(drawId);
  if (idProblem) return { ok: false, message: idProblem };
  const parsedPattern = winningPatternSchema.safeParse(pattern);
  if (!parsedPattern.success) return { ok: false, message: firstIssueMessage(parsedPattern.error) };
  return callDrawApi(`/org/draws/${drawId}/pattern`, onlyCheckedIn, { body: { pattern: parsedPattern.data } });
}

export type ShareDrawResult =
  { ok: true; token: string; allowTicketTracking: boolean } | { ok: false; message: string };

export async function shareDrawLink(eventId: string, allowTicketTracking?: boolean): Promise<ShareDrawResult> {
  const idProblem = validateId(eventId);
  if (idProblem) return { ok: false, message: idProblem };
  const organization = await requireScope("org:draws:run");
  const result = await attempt(() =>
    apiRequest<{ token: string; allowTicketTracking: boolean }>(`/org/events/${eventId}/draw-share`, {
      method: "POST",
      organizationId: organization.id,
      body: allowTicketTracking === undefined ? {} : { allowTicketTracking },
    }),
  );
  return result.ok ? { ok: true, ...result.value } : { ok: false, message: result.message };
}

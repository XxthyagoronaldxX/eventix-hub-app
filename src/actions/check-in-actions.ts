"use server";

import { apiRequest, attempt } from "@/lib/api/api-client";
import type { CheckInResult, CheckInSummary } from "@/lib/api/types";
import { objectIdSchema } from "@/lib/validation/common-schemas";
import { firstIssueMessage, z } from "@/lib/validation/zod";
import { requireScope } from "@/lib/workspace";

export type CheckInAttempt =
  { ok: true; result: CheckInResult; summary: CheckInSummary } | { ok: false; message: string };

const checkInSchema = z.object({
  eventId: objectIdSchema,
  code: z.string().trim().min(1, { error: "Informe o código do ticket." }).max(64),
});

export async function checkInTicket(eventId: string, code: string): Promise<CheckInAttempt> {
  const organization = await requireScope("org:tickets:check-in");
  const input = checkInSchema.safeParse({ eventId, code });
  if (!input.success) {
    return { ok: false, message: firstIssueMessage(input.error) };
  }
  const result = await attempt(() =>
    apiRequest<CheckInResult>(`/org/events/${input.data.eventId}/check-ins`, {
      method: "POST",
      organizationId: organization.id,
      body: { code: input.data.code },
    }),
  );
  if (!result.ok) {
    return { ok: false, message: result.message };
  }
  const summary = await apiRequest<CheckInSummary>(`/org/events/${input.data.eventId}/check-ins/summary`, {
    organizationId: organization.id,
  });
  return { ok: true, result: result.value, summary };
}

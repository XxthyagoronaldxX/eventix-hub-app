"use server";

import { redirect } from "next/navigation";
import { apiRequest, attempt } from "@/lib/api/api-client";
import type { OrganizationEvent } from "@/lib/api/types";
import { eventRoutes } from "@/lib/event-routes";
import { withFlash } from "@/lib/flash";
import { readText } from "@/lib/form-data";
import { createEventSchema, updateEventSchema } from "@/lib/validation/form-schemas";
import { firstIssueMessage, parseFormData, z } from "@/lib/validation/zod";
import { requireOrganization } from "@/lib/workspace";

const paymentSettingsSchema = z.object({
  allowedPaymentMethods: z
    .array(z.enum(["pix", "cash", "card"]))
    .min(1, { error: "Permita pelo menos uma forma de pagamento." }),
  onlinePaymentsEnabled: z.boolean(),
  requireBuyerIdentification: z.boolean(),
});

function readPaymentSettings(formData: FormData) {
  return paymentSettingsSchema.safeParse({
    allowedPaymentMethods: formData.getAll("allowedPaymentMethods").map(String),
    onlinePaymentsEnabled: formData.get("onlinePaymentsEnabled") === "on",
    requireBuyerIdentification: formData.get("requireBuyerIdentification") === "on",
  });
}

function toEventPayload<TFields extends { ticketPrice: number }>(
  { ticketPrice, ...fields }: TFields,
  paymentSettings: z.output<typeof paymentSettingsSchema>,
) {
  return { ...fields, ...paymentSettings, ticketPriceCents: Math.round(ticketPrice * 100) };
}

export interface CreateEventState {
  error?: string;
}

export async function createEvent(_previousState: CreateEventState, formData: FormData): Promise<CreateEventState> {
  const organization = await requireOrganization();
  const form = parseFormData(createEventSchema, formData);
  if (!form.ok) {
    return { error: form.message };
  }
  const paymentSettings = readPaymentSettings(formData);
  if (!paymentSettings.success) {
    return { error: firstIssueMessage(paymentSettings.error) };
  }
  const result = await attempt(() =>
    apiRequest<OrganizationEvent>("/org/events", {
      method: "POST",
      organizationId: organization.id,
      body: toEventPayload(form.data, paymentSettings.data),
    }),
  );
  if (!result.ok) {
    return { error: result.message };
  }
  redirect(withFlash(eventRoutes.overview(result.value.id), { notice: "Evento criado." }));
}

export async function updateEvent(formData: FormData) {
  const organization = await requireOrganization();
  const eventPath = eventRoutes.settings(readText(formData, "eventId"));
  const form = parseFormData(updateEventSchema, formData);
  if (!form.ok) {
    redirect(withFlash(eventPath, { error: form.message }));
  }
  const paymentSettings = readPaymentSettings(formData);
  if (!paymentSettings.success) {
    redirect(withFlash(eventPath, { error: firstIssueMessage(paymentSettings.error) }));
  }
  const { eventId, ...changes } = form.data;
  const result = await attempt(() =>
    apiRequest(`/org/events/${eventId}`, {
      method: "PATCH",
      organizationId: organization.id,
      body: toEventPayload(changes, paymentSettings.data),
    }),
  );
  redirect(withFlash(eventPath, result.ok ? { notice: "Evento atualizado." } : { error: result.message }));
}

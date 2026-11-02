"use server";

import { redirect } from "next/navigation";
import { apiRequest, attempt } from "@/lib/api/api-client";
import type { TicketBatch } from "@/lib/api/types";
import { eventRoutes } from "@/lib/event-routes";
import { withFlash } from "@/lib/flash";
import { readText, safeInternalPath } from "@/lib/form-data";
import { objectIdSchema } from "@/lib/validation/common-schemas";
import { createTicketBatchSchema, requestExportSchema } from "@/lib/validation/form-schemas";
import { parseFormData, z } from "@/lib/validation/zod";
import { requireOrganization } from "@/lib/workspace";

const voidTicketSchema = z.object({ ticketId: objectIdSchema });
const paymentMethodSchema = z.enum(["pix", "cash", "card"], { error: "Escolha a forma de pagamento." });
const ticketPaymentSchema = z.object({
  ticketId: objectIdSchema,
  paid: z.enum(["true", "false"]),
  method: paymentMethodSchema.optional(),
});
const batchPaymentSchema = z.object({ batchId: objectIdSchema, method: paymentMethodSchema });

export async function changeTicketPayment(formData: FormData) {
  const organization = await requireOrganization();
  const returnPath = safeInternalPath(readText(formData, "returnPath"), "/events");
  const form = parseFormData(ticketPaymentSchema, formData);
  if (!form.ok) {
    redirect(withFlash(returnPath, { error: form.message }));
  }
  const paid = form.data.paid === "true";
  const result = await attempt(() =>
    apiRequest(`/org/tickets/${form.data.ticketId}/payment`, {
      method: "POST",
      organizationId: organization.id,
      body: paid ? { paid, method: form.data.method } : { paid },
    }),
  );
  redirect(
    withFlash(
      returnPath,
      result.ok ? { notice: paid ? "Pagamento confirmado." : "Pagamento desfeito." } : { error: result.message },
    ),
  );
}

export async function markBatchAsPaid(formData: FormData) {
  const organization = await requireOrganization();
  const form = parseFormData(batchPaymentSchema, formData);
  if (!form.ok) {
    redirect(withFlash("/events", { error: form.message }));
  }
  const batchPath = eventRoutes.batch(readText(formData, "eventId"), form.data.batchId);
  const result = await attempt(() =>
    apiRequest<{ updatedCount: number }>(`/org/batches/${form.data.batchId}/payment`, {
      method: "POST",
      organizationId: organization.id,
      body: { method: form.data.method },
    }),
  );
  redirect(
    withFlash(
      batchPath,
      result.ok ? { notice: `${result.value.updatedCount} tickets marcados como pagos.` } : { error: result.message },
    ),
  );
}

export async function createTicketBatch(formData: FormData) {
  const organization = await requireOrganization();
  const eventPath = eventRoutes.tickets(readText(formData, "eventId"));
  const form = parseFormData(createTicketBatchSchema, formData);
  if (!form.ok) {
    redirect(withFlash(eventPath, { error: form.message }));
  }
  const result = await attempt(() =>
    apiRequest<TicketBatch>(`/org/events/${form.data.eventId}/batches`, {
      method: "POST",
      organizationId: organization.id,
      body: { templateId: form.data.templateId, quantity: form.data.quantity },
    }),
  );
  if (!result.ok) {
    redirect(withFlash(eventPath, { error: result.message }));
  }
  redirect(
    withFlash(eventRoutes.batch(result.value.eventId, result.value.id), { notice: "Lote enviado para geração." }),
  );
}

export async function requestExport(formData: FormData) {
  const organization = await requireOrganization();
  const batchPath = eventRoutes.batch(readText(formData, "eventId"), readText(formData, "batchId"));
  const form = parseFormData(requestExportSchema, formData);
  if (!form.ok) {
    redirect(withFlash(batchPath, { error: form.message }));
  }
  const result = await attempt(() =>
    apiRequest(`/org/batches/${form.data.batchId}/exports`, {
      method: "POST",
      organizationId: organization.id,
      body: { format: form.data.format, ticketsPerPage: form.data.ticketsPerPage },
    }),
  );
  redirect(withFlash(batchPath, result.ok ? { notice: "Exportação iniciada." } : { error: result.message }));
}

export async function voidTicket(formData: FormData) {
  const organization = await requireOrganization();
  const returnPath = safeInternalPath(readText(formData, "returnPath"), "/events");
  const form = parseFormData(voidTicketSchema, formData);
  if (!form.ok) {
    redirect(withFlash(returnPath, { error: form.message }));
  }
  const result = await attempt(() =>
    apiRequest(`/org/tickets/${form.data.ticketId}/void`, { method: "POST", organizationId: organization.id }),
  );
  redirect(withFlash(returnPath, result.ok ? { notice: "Ticket cancelado." } : { error: result.message }));
}

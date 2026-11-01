"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiRequest, attempt } from "@/lib/api/api-client";
import type { Invitation, Organization } from "@/lib/api/types";
import { withFlash } from "@/lib/flash";
import { readText, safeInternalPath } from "@/lib/form-data";
import { writeActiveOrganizationCookie } from "@/lib/session/session-cookies";
import { objectIdSchema } from "@/lib/validation/common-schemas";
import { createOrganizationSchema, updateOrganizationSchema } from "@/lib/validation/form-schemas";
import { parseFormData, z } from "@/lib/validation/zod";
import { requireSuperAdmin } from "@/lib/workspace";

const NEW_ORGANIZATION_PATH = "/platform/organizations/new";

const organizationTransitionSchema = z.object({
  organizationId: objectIdSchema,
  transition: z.enum(["suspend", "reactivate"]),
});

const userTransitionSchema = z.object({
  userId: objectIdSchema,
  transition: z.enum(["block", "unblock"]),
});

function organizationPath(organizationId: string): string {
  return `/platform/organizations/${encodeURIComponent(organizationId)}`;
}

export async function createOrganization(formData: FormData) {
  await requireSuperAdmin();
  const form = parseFormData(createOrganizationSchema, formData);
  if (!form.ok) {
    redirect(withFlash(NEW_ORGANIZATION_PATH, { error: form.message }));
  }
  const result = await attempt(() =>
    apiRequest<{ organization: Organization; adminInvitation: Invitation }>("/platform/organizations", {
      method: "POST",
      body: form.data,
    }),
  );
  if (!result.ok) {
    redirect(withFlash(NEW_ORGANIZATION_PATH, { error: result.message }));
  }
  redirect(
    withFlash(organizationPath(result.value.organization.id), {
      notice: `Organização criada. Convite enviado para ${result.value.adminInvitation.email}.`,
      link: result.value.adminInvitation.acceptUrl,
    }),
  );
}

export async function updateOrganization(formData: FormData) {
  await requireSuperAdmin();
  const returnPath = organizationPath(readText(formData, "organizationId"));
  const form = parseFormData(updateOrganizationSchema, formData);
  if (!form.ok) {
    redirect(withFlash(returnPath, { error: form.message }));
  }
  const { organizationId, ...changes } = form.data;
  const result = await attempt(() =>
    apiRequest(`/platform/organizations/${organizationId}`, { method: "PATCH", body: changes }),
  );
  redirect(withFlash(returnPath, result.ok ? { notice: "Organização atualizada." } : { error: result.message }));
}

export async function changeOrganizationStatus(formData: FormData) {
  await requireSuperAdmin();
  const returnPath = organizationPath(readText(formData, "organizationId"));
  const form = parseFormData(organizationTransitionSchema, formData);
  if (!form.ok) {
    redirect(withFlash(returnPath, { error: form.message }));
  }
  const result = await attempt(() =>
    apiRequest(`/platform/organizations/${form.data.organizationId}/${form.data.transition}`, { method: "POST" }),
  );
  const notice = form.data.transition === "suspend" ? "Organização suspensa." : "Organização reativada.";
  redirect(withFlash(returnPath, result.ok ? { notice } : { error: result.message }));
}

export async function enterOrganizationAsSupport(formData: FormData) {
  await requireSuperAdmin();
  const organizationId = objectIdSchema.safeParse(readText(formData, "organizationId"));
  if (!organizationId.success) {
    redirect(withFlash("/platform/organizations", { error: "Organização inválida." }));
  }
  writeActiveOrganizationCookie(await cookies(), organizationId.data);
  redirect(withFlash("/dashboard", { notice: "Você está acessando esta organização em modo suporte." }));
}

export async function changeUserStatus(formData: FormData) {
  await requireSuperAdmin();
  const returnPath = safeInternalPath(readText(formData, "returnPath"), "/platform/users");
  const form = parseFormData(userTransitionSchema, formData);
  if (!form.ok) {
    redirect(withFlash(returnPath, { error: form.message }));
  }
  const result = await attempt(() =>
    apiRequest(`/platform/users/${form.data.userId}/${form.data.transition}`, { method: "POST" }),
  );
  const notice = form.data.transition === "block" ? "Usuário bloqueado." : "Usuário desbloqueado.";
  redirect(withFlash(returnPath, result.ok ? { notice } : { error: result.message }));
}

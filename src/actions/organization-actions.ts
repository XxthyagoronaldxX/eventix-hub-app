"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiRequest, attempt } from "@/lib/api/api-client";
import type { Invitation } from "@/lib/api/types";
import { withFlash } from "@/lib/flash";
import { readText } from "@/lib/form-data";
import { writeActiveOrganizationCookie } from "@/lib/session/session-cookies";
import { objectIdSchema } from "@/lib/validation/common-schemas";
import { changeMemberRoleSchema, inviteMemberSchema, organizationSettingsSchema } from "@/lib/validation/form-schemas";
import { parseFormData, z } from "@/lib/validation/zod";
import { requireOrganization } from "@/lib/workspace";

const MEMBERS_PATH = "/members";
const invitationIdSchema = z.object({ invitationId: objectIdSchema });
const membershipIdSchema = z.object({ membershipId: objectIdSchema });

export async function switchOrganization(formData: FormData) {
  const organizationId = objectIdSchema.safeParse(readText(formData, "organizationId"));
  if (organizationId.success) {
    writeActiveOrganizationCookie(await cookies(), organizationId.data);
  }
  redirect("/dashboard");
}

export async function updateOrganizationSettings(formData: FormData) {
  const organization = await requireOrganization();
  const form = parseFormData(organizationSettingsSchema, formData);
  if (!form.ok) {
    redirect(withFlash("/settings", { error: form.message }));
  }
  const result = await attempt(() =>
    apiRequest("/org", { method: "PATCH", organizationId: organization.id, body: form.data }),
  );
  redirect(withFlash("/settings", result.ok ? { notice: "Organização atualizada." } : { error: result.message }));
}

export async function inviteMember(formData: FormData) {
  const organization = await requireOrganization();
  const form = parseFormData(inviteMemberSchema, formData);
  if (!form.ok) {
    redirect(withFlash(MEMBERS_PATH, { error: form.message }));
  }
  const result = await attempt(() =>
    apiRequest<Invitation>("/org/invitations", { method: "POST", organizationId: organization.id, body: form.data }),
  );
  if (!result.ok) {
    redirect(withFlash(MEMBERS_PATH, { error: result.message }));
  }
  redirect(
    withFlash(MEMBERS_PATH, { notice: `Convite enviado para ${result.value.email}.`, link: result.value.acceptUrl }),
  );
}

export async function resendInvitation(formData: FormData) {
  const organization = await requireOrganization();
  const form = parseFormData(invitationIdSchema, formData);
  if (!form.ok) {
    redirect(withFlash(MEMBERS_PATH, { error: form.message }));
  }
  const result = await attempt(() =>
    apiRequest<Invitation>(`/org/invitations/${form.data.invitationId}/resend`, {
      method: "POST",
      organizationId: organization.id,
    }),
  );
  if (!result.ok) {
    redirect(withFlash(MEMBERS_PATH, { error: result.message }));
  }
  redirect(withFlash(MEMBERS_PATH, { notice: "Convite reenviado.", link: result.value.acceptUrl }));
}

export async function cancelInvitation(formData: FormData) {
  const organization = await requireOrganization();
  const form = parseFormData(invitationIdSchema, formData);
  if (!form.ok) {
    redirect(withFlash(MEMBERS_PATH, { error: form.message }));
  }
  const result = await attempt(() =>
    apiRequest(`/org/invitations/${form.data.invitationId}`, { method: "DELETE", organizationId: organization.id }),
  );
  redirect(withFlash(MEMBERS_PATH, result.ok ? { notice: "Convite cancelado." } : { error: result.message }));
}

export async function changeMemberRole(formData: FormData) {
  const organization = await requireOrganization();
  const form = parseFormData(changeMemberRoleSchema, formData);
  if (!form.ok) {
    redirect(withFlash(MEMBERS_PATH, { error: form.message }));
  }
  const result = await attempt(() =>
    apiRequest(`/org/members/${form.data.membershipId}`, {
      method: "PATCH",
      organizationId: organization.id,
      body: { role: form.data.role },
    }),
  );
  redirect(withFlash(MEMBERS_PATH, result.ok ? { notice: "Papel atualizado." } : { error: result.message }));
}

export async function removeMember(formData: FormData) {
  const organization = await requireOrganization();
  const form = parseFormData(membershipIdSchema, formData);
  if (!form.ok) {
    redirect(withFlash(MEMBERS_PATH, { error: form.message }));
  }
  const result = await attempt(() =>
    apiRequest(`/org/members/${form.data.membershipId}`, { method: "DELETE", organizationId: organization.id }),
  );
  redirect(withFlash(MEMBERS_PATH, result.ok ? { notice: "Membro removido." } : { error: result.message }));
}

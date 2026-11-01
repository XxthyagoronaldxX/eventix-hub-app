"use server";

import { redirect } from "next/navigation";
import { apiRequest, attempt } from "@/lib/api/api-client";
import type { Scope } from "@/lib/api/types";
import { withFlash } from "@/lib/flash";
import { readText } from "@/lib/form-data";
import { ASSIGNABLE_SCOPES } from "@/lib/permissions";
import { objectIdSchema } from "@/lib/validation/common-schemas";
import { firstIssueMessage, z } from "@/lib/validation/zod";
import { requireScope } from "@/lib/workspace";

const PERMISSIONS_PATH = "/permissions";
const MEMBERS_PATH = "/members";

export interface SavePermissionGroupState {
  error?: string;
}

const permissionGroupSchema = z.object({
  groupId: objectIdSchema.optional(),
  name: z.string().trim().min(1, { error: "Informe o nome do grupo." }).max(60),
  description: z.string().trim().max(240).optional(),
  isDefault: z.boolean(),
  scopes: z.array(z.enum(ASSIGNABLE_SCOPES as [Scope, ...Scope[]])),
});

export async function savePermissionGroup(
  _previousState: SavePermissionGroupState,
  formData: FormData,
): Promise<SavePermissionGroupState> {
  const organization = await requireScope("org:members:write");
  const parsed = permissionGroupSchema.safeParse({
    groupId: readText(formData, "groupId") || undefined,
    name: readText(formData, "name"),
    description: readText(formData, "description"),
    isDefault: formData.get("isDefault") === "on",
    scopes: formData.getAll("scopes").map(String),
  });
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }
  const { groupId, ...group } = parsed.data;
  const result = await attempt(() =>
    apiRequest(groupId ? `/org/permission-groups/${groupId}` : "/org/permission-groups", {
      method: groupId ? "PUT" : "POST",
      organizationId: organization.id,
      body: group,
    }),
  );
  if (!result.ok) {
    return { error: result.message };
  }
  redirect(withFlash(PERMISSIONS_PATH, { notice: groupId ? "Grupo atualizado." : "Grupo criado." }));
}

export async function deletePermissionGroup(formData: FormData) {
  const organization = await requireScope("org:members:write");
  const groupId = objectIdSchema.safeParse(readText(formData, "groupId"));
  if (!groupId.success) {
    redirect(withFlash(PERMISSIONS_PATH, { error: "Grupo inválido." }));
  }
  const result = await attempt(() =>
    apiRequest(`/org/permission-groups/${groupId.data}`, { method: "DELETE", organizationId: organization.id }),
  );
  redirect(withFlash(PERMISSIONS_PATH, result.ok ? { notice: "Grupo removido." } : { error: result.message }));
}

export async function changeMemberGroups(formData: FormData) {
  const organization = await requireScope("org:members:write");
  const parsed = z
    .object({ membershipId: objectIdSchema, groupIds: z.array(objectIdSchema).max(30) })
    .safeParse({ membershipId: readText(formData, "membershipId"), groupIds: formData.getAll("groupIds").map(String) });
  if (!parsed.success) {
    redirect(withFlash(MEMBERS_PATH, { error: firstIssueMessage(parsed.error) }));
  }
  const result = await attempt(() =>
    apiRequest(`/org/members/${parsed.data.membershipId}/permission-groups`, {
      method: "PUT",
      organizationId: organization.id,
      body: { groupIds: parsed.data.groupIds },
    }),
  );
  redirect(
    withFlash(MEMBERS_PATH, result.ok ? { notice: "Grupos do membro atualizados." } : { error: result.message }),
  );
}

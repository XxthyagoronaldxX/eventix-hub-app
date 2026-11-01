import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { apiRequest, attempt } from "@/lib/api/api-client";
import type { ActiveOrganization, CurrentUser, Scope } from "@/lib/api/types";
import { withFlash } from "@/lib/flash";
import { ACTIVE_ORGANIZATION_COOKIE } from "@/lib/session/session-cookies";

export const getCurrentUser = cache(() => apiRequest<CurrentUser>("/me"));

export const getActiveOrganization = cache(async (): Promise<ActiveOrganization | null> => {
  const currentUser = await getCurrentUser();
  const preferredOrganizationId = (await cookies()).get(ACTIVE_ORGANIZATION_COOKIE)?.value;
  const candidateOrganizationIds = [
    preferredOrganizationId,
    ...currentUser.memberships.map((membership) => membership.organizationId),
  ].filter((organizationId): organizationId is string => Boolean(organizationId));

  for (const organizationId of new Set(candidateOrganizationIds)) {
    const result = await attempt(() => apiRequest<ActiveOrganization>("/org", { organizationId }));
    if (result.ok) {
      return result.value;
    }
  }
  return null;
});

export async function requireOrganization(): Promise<ActiveOrganization> {
  const organization = await getActiveOrganization();
  if (organization) {
    return organization;
  }
  const currentUser = await getCurrentUser();
  redirect(currentUser.user.isSuperAdmin ? "/platform/organizations" : "/no-organization");
}

export function hasScope(organization: ActiveOrganization, scope: Scope): boolean {
  return organization.scopes.includes(scope);
}

export async function requireScope(scope: Scope): Promise<ActiveOrganization> {
  const organization = await requireOrganization();
  if (!hasScope(organization, scope)) {
    redirect(withFlash("/dashboard", { error: "Você não tem permissão para acessar essa página." }));
  }
  return organization;
}

export async function requireSuperAdmin(): Promise<CurrentUser> {
  const currentUser = await getCurrentUser();
  if (!currentUser.user.isSuperAdmin) {
    redirect(withFlash("/dashboard", { error: "Área restrita ao SuperAdmin." }));
  }
  return currentUser;
}

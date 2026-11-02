import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { apiRequest } from "@/lib/api/api-client";
import type { ActiveOrganization, OrganizationEvent, Scope } from "@/lib/api/types";
import { eventRoutes } from "@/lib/event-routes";
import { withFlash } from "@/lib/flash";
import { hasScope, requireScope } from "@/lib/workspace";

export interface EventWorkspace {
  organization: ActiveOrganization;
  event: OrganizationEvent;
}

const loadEvent = cache((organizationId: string, eventId: string) =>
  apiRequest<OrganizationEvent>(`/org/events/${encodeURIComponent(eventId)}`, { organizationId }),
);

export async function requireEventWorkspace(eventId: string, sectionScope?: Scope): Promise<EventWorkspace> {
  const organization = await requireScope("org:events:read");
  if (sectionScope && !hasScope(organization, sectionScope)) {
    redirect(
      withFlash(eventRoutes.overview(eventId), { error: "Você não tem permissão para acessar essa área do evento." }),
    );
  }
  return { organization, event: await loadEvent(organization.id, eventId) };
}

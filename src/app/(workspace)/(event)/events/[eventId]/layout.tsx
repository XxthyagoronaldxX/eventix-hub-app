import { cookies } from "next/headers";
import { OnboardingTour } from "@/components/onboarding/onboarding-tour";
import { EventSidebar } from "@/components/workspace/event-sidebar";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { apiRequest } from "@/lib/api/api-client";
import type { OrganizationEvent } from "@/lib/api/types";
import { requireEventWorkspace } from "@/lib/event-workspace";
import { isSidebarCollapsedValue, SIDEBAR_COLLAPSED_COOKIE } from "@/lib/sidebar-preference";
import { getCurrentUser } from "@/lib/workspace";

export default async function EventLayout({ children, params }: LayoutProps<"/events/[eventId]">) {
  const { eventId } = await params;
  const { organization, event } = await requireEventWorkspace(eventId);
  const [currentUser, events, cookieStore] = await Promise.all([
    getCurrentUser(),
    apiRequest<OrganizationEvent[]>("/org/events", { organizationId: organization.id }),
    cookies(),
  ]);

  return (
    <WorkspaceShell
      initiallyCollapsed={isSidebarCollapsedValue(cookieStore.get(SIDEBAR_COLLAPSED_COOKIE)?.value)}
      sidebar={<EventSidebar currentUser={currentUser} organization={organization} event={event} events={events} />}
    >
      <OnboardingTour userId={currentUser.user.id} canCreateEvents={organization.scopes.includes("org:events:write")} />
      {children}
    </WorkspaceShell>
  );
}

import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { OnboardingTour } from "@/components/onboarding/onboarding-tour";
import { OrganizationSidebar } from "@/components/workspace/organization-sidebar";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { isSidebarCollapsedValue, SIDEBAR_COLLAPSED_COOKIE } from "@/lib/sidebar-preference";
import { getActiveOrganization, getCurrentUser } from "@/lib/workspace";

export default async function OrganizationLayout({ children }: { children: ReactNode }) {
  const [currentUser, activeOrganization, cookieStore] = await Promise.all([
    getCurrentUser(),
    getActiveOrganization(),
    cookies(),
  ]);
  return (
    <WorkspaceShell
      initiallyCollapsed={isSidebarCollapsedValue(cookieStore.get(SIDEBAR_COLLAPSED_COOKIE)?.value)}
      sidebar={<OrganizationSidebar currentUser={currentUser} activeOrganization={activeOrganization} />}
    >
      <OnboardingTour
        userId={currentUser.user.id}
        canCreateEvents={activeOrganization?.scopes.includes("org:events:write") ?? false}
      />
      {children}
    </WorkspaceShell>
  );
}

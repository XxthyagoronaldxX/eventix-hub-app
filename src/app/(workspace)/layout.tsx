import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { Sidebar } from "@/components/workspace/sidebar";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { isSidebarCollapsedValue, SIDEBAR_COLLAPSED_COOKIE } from "@/lib/sidebar-preference";
import { getActiveOrganization, getCurrentUser } from "@/lib/workspace";

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  const [currentUser, activeOrganization, cookieStore] = await Promise.all([
    getCurrentUser(),
    getActiveOrganization(),
    cookies(),
  ]);
  return (
    <WorkspaceShell
      initiallyCollapsed={isSidebarCollapsedValue(cookieStore.get(SIDEBAR_COLLAPSED_COOKIE)?.value)}
      sidebar={<Sidebar currentUser={currentUser} activeOrganization={activeOrganization} />}
    >
      {children}
    </WorkspaceShell>
  );
}

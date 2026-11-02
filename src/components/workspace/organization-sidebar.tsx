import { CalendarDays, LayoutDashboard, LayoutTemplate, ScrollText, Settings, ShieldCheck, Users } from "lucide-react";
import type { ActiveOrganization, CurrentUser } from "@/lib/api/types";
import { OrganizationSwitcher } from "./organization-switcher";
import { groupsAllowedFor, type NavigationGroup, Sidebar } from "./sidebar";

const ORGANIZATION_GROUPS: NavigationGroup[] = [
  {
    title: "Visão geral",
    links: [{ href: "/dashboard", label: "Painel", icon: LayoutDashboard }],
  },
  {
    title: "Eventos",
    links: [
      { href: "/events", label: "Eventos", icon: CalendarDays, requiredScope: "org:events:read" },
      {
        href: "/templates",
        label: "Templates",
        icon: LayoutTemplate,
        requiredScope: "org:templates:read",
      },
    ],
  },
  {
    title: "Gestão",
    links: [
      { href: "/members", label: "Membros", icon: Users, requiredScope: "org:members:read" },
      { href: "/permissions", label: "Permissões", icon: ShieldCheck, requiredScope: "org:members:read" },
      { href: "/audit", label: "Auditoria", icon: ScrollText, requiredScope: "org:audit:read" },
      { href: "/settings", label: "Configurações", icon: Settings, requiredScope: "org:settings:write" },
    ],
  },
];

interface OrganizationSidebarProps {
  currentUser: CurrentUser;
  activeOrganization: ActiveOrganization | null;
}

export function OrganizationSidebar({ currentUser, activeOrganization }: OrganizationSidebarProps) {
  const hasOrganizationChoice = activeOrganization !== null || currentUser.memberships.length > 0;
  return (
    <Sidebar
      currentUser={currentUser}
      showPlatform
      header={
        hasOrganizationChoice && (
          <OrganizationSwitcher activeOrganization={activeOrganization} memberships={currentUser.memberships} />
        )
      }
      groups={activeOrganization ? groupsAllowedFor(ORGANIZATION_GROUPS, activeOrganization.scopes) : []}
    />
  );
}

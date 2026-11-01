import {
  Building,
  CalendarDays,
  Dices,
  Wallet,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  type LucideIcon,
  Menu,
  ScanLine,
  ScrollText,
  Settings,
  ShieldCheck,
  Ticket,
  UserCog,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { logout } from "@/actions/auth-actions";
import { Brand } from "@/components/brand";
import type { ActiveOrganization, CurrentUser, Scope } from "@/lib/api/types";
import { NavLink } from "./nav-link";
import { OrganizationSwitcher } from "./organization-switcher";
import { SidebarCollapseButton } from "./workspace-shell";

interface NavigationLink {
  href: string;
  label: string;
  icon: LucideIcon;
  requiredScope?: Scope;
}

interface NavigationGroup {
  title: string;
  links: NavigationLink[];
}

const ORGANIZATION_GROUPS: NavigationGroup[] = [
  {
    title: "Visão geral",
    links: [{ href: "/dashboard", label: "Painel", icon: LayoutDashboard }],
  },
  {
    title: "Preparação",
    links: [
      { href: "/events", label: "Eventos", icon: CalendarDays, requiredScope: "org:events:read" },
      { href: "/templates", label: "Templates", icon: LayoutTemplate, requiredScope: "org:templates:read" },
      { href: "/tickets", label: "Tickets", icon: Ticket, requiredScope: "org:tickets:read" },
    ],
  },
  {
    title: "Operadores",
    links: [
      { href: "/payments", label: "Pagamentos", icon: Wallet, requiredScope: "org:tickets:payment" },
      { href: "/check-in", label: "Check-in", icon: ScanLine, requiredScope: "org:tickets:check-in" },
      { href: "/draws", label: "Sorteio", icon: Dices, requiredScope: "org:draws:run" },
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

const PLATFORM_LINKS: NavigationLink[] = [
  { href: "/platform/organizations", label: "Organizações", icon: Building },
  { href: "/platform/users", label: "Usuários", icon: UserCog },
];

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

function NavigationSection({ title, links }: { title: string; links: NavigationLink[] }) {
  return (
    <nav aria-label={title} className="grid gap-0.5">
      <p className="flex items-center gap-1.5 px-2.5 pb-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase lg:group-data-[sidebar-collapsed=true]/shell:sr-only">
        {title}
      </p>
      {links.map(({ href, label, icon: Icon }) => (
        <NavLink
          key={href}
          href={href}
          label={label}
          icon={
            <Icon
              className="size-4 shrink-0 text-muted-foreground group-aria-[current=page]/nav:text-primary"
              aria-hidden="true"
            />
          }
        />
      ))}
    </nav>
  );
}

interface SidebarProps {
  currentUser: CurrentUser;
  activeOrganization: ActiveOrganization | null;
}

function SidebarContent({ currentUser, activeOrganization }: SidebarProps) {
  const visibleGroups = activeOrganization
    ? ORGANIZATION_GROUPS.map((group) => ({
        ...group,
        links: group.links.filter(
          (link) => !link.requiredScope || activeOrganization.scopes.includes(link.requiredScope),
        ),
      })).filter((group) => group.links.length > 0)
    : [];

  return (
    <>
      {(activeOrganization || currentUser.memberships.length > 0) && (
        <OrganizationSwitcher activeOrganization={activeOrganization} memberships={currentUser.memberships} />
      )}

      <div className="grid gap-5">
        {visibleGroups.map((group) => (
          <NavigationSection key={group.title} title={group.title} links={group.links} />
        ))}
        {currentUser.user.isSuperAdmin && (
          <div className="grid gap-5 border-t border-dashed pt-5">
            <NavigationSection title="Plataforma" links={PLATFORM_LINKS} />
          </div>
        )}
      </div>

      <div className="mt-auto flex items-center gap-3 rounded-lg border bg-card p-2.5 lg:group-data-[sidebar-collapsed=true]/shell:flex-col lg:group-data-[sidebar-collapsed=true]/shell:border-0 lg:group-data-[sidebar-collapsed=true]/shell:bg-transparent lg:group-data-[sidebar-collapsed=true]/shell:p-0">
        <span
          title={`${currentUser.user.name} · ${currentUser.user.email}`}
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-violet-500/80 text-xs font-semibold text-primary-foreground"
        >
          {initialsOf(currentUser.user.name)}
        </span>
        <span className="min-w-0 flex-1 lg:group-data-[sidebar-collapsed=true]/shell:sr-only">
          <span className="block truncate text-sm font-medium">{currentUser.user.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{currentUser.user.email}</span>
        </span>
        <form action={logout}>
          <button
            type="submit"
            title="Sair"
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-4" aria-hidden="true" />
            <span className="sr-only">Sair</span>
          </button>
        </form>
      </div>
    </>
  );
}

export function Sidebar(props: SidebarProps) {
  return (
    <>
      <aside className="hidden flex-col gap-6 overflow-x-hidden border-r bg-sidebar px-4 py-5 lg:sticky lg:top-0 lg:flex lg:h-screen lg:overflow-y-auto lg:group-data-[sidebar-collapsed=true]/shell:px-3">
        <div className="flex items-center justify-between gap-2 lg:group-data-[sidebar-collapsed=true]/shell:flex-col">
          <Link href="/dashboard" className="min-w-0 px-1 lg:group-data-[sidebar-collapsed=true]/shell:px-0">
            <Brand className="lg:group-data-[sidebar-collapsed=true]/shell:[&>span:last-child]:sr-only" />
          </Link>
          <SidebarCollapseButton />
        </div>
        <SidebarContent {...props} />
      </aside>

      <details className="group sticky top-0 z-40 border-b bg-sidebar/95 backdrop-blur lg:hidden">
        <summary className="flex items-center justify-between px-4 py-3">
          <Brand />
          <span className="flex size-9 items-center justify-center rounded-md border bg-card">
            <Menu className="size-4 group-open:hidden" aria-hidden="true" />
            <X className="hidden size-4 group-open:block" aria-hidden="true" />
            <span className="sr-only">Abrir menu</span>
          </span>
        </summary>
        <div className="flex max-h-[calc(100vh-4rem)] flex-col gap-6 overflow-y-auto px-4 pt-2 pb-5">
          <SidebarContent {...props} />
        </div>
      </details>
    </>
  );
}

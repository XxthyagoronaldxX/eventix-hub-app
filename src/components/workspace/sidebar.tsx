import { Building, LogOut, type LucideIcon, Menu, UserCog, X } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { logout } from "@/actions/auth-actions";
import { Brand } from "@/components/brand";
import type { CurrentUser, Scope } from "@/lib/api/types";
import { HelpButton } from "@/components/onboarding/onboarding-tour";
import { NavLink } from "./nav-link";
import { SidebarCollapseButton } from "./workspace-shell";

export interface NavigationLink {
  href: string;
  label: string;
  icon: LucideIcon;
  requiredScope?: Scope;
  exact?: boolean;
  activePrefixes?: string[];
}

export interface NavigationGroup {
  title: string;
  links: NavigationLink[];
}

const PLATFORM_GROUP: NavigationGroup = {
  title: "Plataforma",
  links: [
    { href: "/platform/organizations", label: "Organizações", icon: Building },
    { href: "/platform/users", label: "Usuários", icon: UserCog },
  ],
};

export function groupsAllowedFor(groups: NavigationGroup[], scopes: readonly Scope[]): NavigationGroup[] {
  return groups
    .map((group) => ({
      ...group,
      links: group.links.filter((link) => !link.requiredScope || scopes.includes(link.requiredScope)),
    }))
    .filter((group) => group.links.length > 0);
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

function NavigationSection({ title, links }: NavigationGroup) {
  return (
    <nav aria-label={title} className="grid gap-0.5">
      <p className="flex items-center gap-1.5 px-2.5 pb-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase lg:group-data-[sidebar-collapsed=true]/shell:sr-only">
        {title}
      </p>
      {links.map(({ href, label, icon: Icon, exact, activePrefixes }) => (
        <NavLink
          key={href}
          href={href}
          label={label}
          exact={exact}
          activePrefixes={activePrefixes}
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

function UserCard({ currentUser }: { currentUser: CurrentUser }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-2.5 lg:group-data-[sidebar-collapsed=true]/shell:flex-col lg:group-data-[sidebar-collapsed=true]/shell:border-0 lg:group-data-[sidebar-collapsed=true]/shell:bg-transparent lg:group-data-[sidebar-collapsed=true]/shell:p-0">
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
  );
}

interface SidebarProps {
  currentUser: CurrentUser;
  header?: ReactNode;
  groups: NavigationGroup[];
  showPlatform?: boolean;
}

function SidebarContent({ currentUser, header, groups, showPlatform = false }: SidebarProps) {
  return (
    <>
      {header}
      <div className="grid gap-5">
        {groups.map((group) => (
          <NavigationSection key={group.title} {...group} />
        ))}
        {showPlatform && currentUser.user.isSuperAdmin && (
          <div className="grid gap-5 border-t border-dashed pt-5">
            <NavigationSection {...PLATFORM_GROUP} />
          </div>
        )}
      </div>
      <div className="mt-auto flex min-w-0 flex-col gap-2">
        <HelpButton />
        <UserCard currentUser={currentUser} />
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

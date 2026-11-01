import { Building2, Check, ChevronsUpDown } from "lucide-react";
import { switchOrganization } from "@/actions/organization-actions";
import type { ActiveOrganization, MembershipSummary } from "@/lib/api/types";
import { ROLE_LABELS } from "@/lib/format";

interface OrganizationSwitcherProps {
  activeOrganization: ActiveOrganization | null;
  memberships: MembershipSummary[];
}

function describeAccess(organization: ActiveOrganization | null): string {
  if (!organization) return "Escolha uma organização";
  if (organization.isSupportAccess) return "Modo suporte";
  return organization.role ? ROLE_LABELS[organization.role] : "";
}

export function OrganizationSwitcher({ activeOrganization, memberships }: OrganizationSwitcherProps) {
  const hasOtherOrganizations = memberships.some((membership) => membership.organizationId !== activeOrganization?.id);

  const summary = (
    <span
      title={activeOrganization?.name}
      className="flex w-full items-center gap-3 rounded-lg border bg-card px-2.5 py-2 text-left transition-colors hover:bg-sidebar-accent lg:group-data-[sidebar-collapsed=true]/shell:justify-center lg:group-data-[sidebar-collapsed=true]/shell:border-0 lg:group-data-[sidebar-collapsed=true]/shell:bg-transparent lg:group-data-[sidebar-collapsed=true]/shell:p-0"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
        <Building2 className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 lg:group-data-[sidebar-collapsed=true]/shell:sr-only">
        <span className="block truncate text-sm font-medium">{activeOrganization?.name ?? "Sem organização"}</span>
        <span className="block truncate text-xs text-muted-foreground">{describeAccess(activeOrganization)}</span>
      </span>
      {hasOtherOrganizations && (
        <ChevronsUpDown
          className="size-4 shrink-0 text-muted-foreground lg:group-data-[sidebar-collapsed=true]/shell:hidden"
          aria-hidden="true"
        />
      )}
    </span>
  );

  if (!hasOtherOrganizations) {
    return summary;
  }

  return (
    <details className="relative">
      <summary>{summary}</summary>
      <div className="absolute inset-x-0 z-30 lg:group-data-[sidebar-collapsed=true]/shell:right-auto lg:group-data-[sidebar-collapsed=true]/shell:w-64 mt-2 rounded-xl border bg-popover p-1.5 shadow-lg">
        <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Organizações</p>
        {memberships.map((membership) => {
          const isActive = membership.organizationId === activeOrganization?.id;
          return (
            <form key={membership.organizationId} action={switchOrganization}>
              <input type="hidden" name="organizationId" value={membership.organizationId} />
              <button
                type="submit"
                disabled={isActive}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent disabled:cursor-default disabled:hover:bg-transparent"
              >
                <span className="min-w-0 flex-1 truncate">{membership.organizationName}</span>
                <span className="text-xs text-muted-foreground">{ROLE_LABELS[membership.role]}</span>
                {isActive && <Check className="size-4 text-primary" aria-hidden="true" />}
              </button>
            </form>
          );
        })}
      </div>
    </details>
  );
}

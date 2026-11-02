import { ShieldCheck, Star, Users } from "lucide-react";
import type { Metadata } from "next";
import { deletePermissionGroup } from "@/actions/permission-group-actions";
import { ConfirmAction } from "@/components/confirm-action";
import { FlashNotices } from "@/components/flash-notices";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { PermissionGroupDialog } from "@/components/permissions/permission-group-dialog";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/api/api-client";
import type { PermissionGroup } from "@/lib/api/types";
import { readFlash } from "@/lib/flash";
import { PERMISSION_AREAS } from "@/lib/permissions";
import { hasScope, requireScope } from "@/lib/workspace";

export const metadata: Metadata = { title: "Permissões" };

export default async function PermissionsPage({ searchParams }: PageProps<"/permissions">) {
  const organization = await requireScope("org:members:read");
  const groups = await apiRequest<PermissionGroup[]>("/org/permission-groups", { organizationId: organization.id });
  const canManageGroups = hasScope(organization, "org:members:write");

  return (
    <PageContainer>
      <PageHeader
        title="Grupos de permissão"
        description="Defina o que cada membro pode fazer. Um membro soma as permissões de todos os grupos dele; admins têm acesso total."
        actions={canManageGroups && <PermissionGroupDialog />}
      />
      <FlashNotices flash={readFlash(await searchParams)} />

      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map((group) => (
          <Card key={group.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
                {group.name}
                {group.isDefault && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                    <Star className="size-3" aria-hidden="true" /> Padrão
                  </span>
                )}
              </CardTitle>
              <CardDescription className="flex items-center gap-1.5">
                <Users className="size-3.5" aria-hidden="true" />
                {group.memberCount === 1 ? "1 membro" : `${group.memberCount} membros`}
                {group.description && ` · ${group.description}`}
              </CardDescription>
              {canManageGroups && (
                <CardAction className="flex gap-2">
                  <PermissionGroupDialog group={group} />
                  {!group.isDefault && (
                    <ConfirmAction
                      triggerLabel="Remover"
                      confirmLabel="Remover"
                      question={`Remover o grupo ${group.name}? Os membros perdem as permissões que vinham dele.`}
                      action={deletePermissionGroup}
                      hiddenFields={{ groupId: group.id }}
                    />
                  )}
                </CardAction>
              )}
            </CardHeader>
            <CardContent className="grid gap-3">
              {PERMISSION_AREAS.map((area) => {
                const granted = area.permissions.filter((permission) => group.scopes.includes(permission.scope));
                if (granted.length === 0) return null;
                return (
                  <div key={area.title} className="grid gap-1.5">
                    <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{area.title}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {granted.map((permission) => (
                        <span
                          key={permission.scope}
                          className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                        >
                          {permission.label}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
              {group.scopes.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma permissão: só consegue abrir o painel.</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}

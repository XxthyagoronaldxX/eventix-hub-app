import { MailPlus, Send } from "lucide-react";
import type { Metadata } from "next";
import {
  cancelInvitation,
  changeMemberRole,
  inviteMember,
  removeMember,
  resendInvitation,
} from "@/actions/organization-actions";
import { ConfirmAction } from "@/components/confirm-action";
import { MemberGroupsDialog } from "@/components/permissions/member-groups-dialog";
import { FlashNotices } from "@/components/flash-notices";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SelectFormField } from "@/components/form/select-form-field";
import { SelectInput } from "@/components/form/select-input";
import { TextFormField } from "@/components/form/text-form-field";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from "@/lib/api/api-client";
import type { Invitation, Member, OrganizationRole, PermissionGroup } from "@/lib/api/types";
import { readFlash } from "@/lib/flash";
import { formatDateTime, ROLE_LABELS } from "@/lib/format";
import { hasScope, requireScope } from "@/lib/workspace";

export const metadata: Metadata = { title: "Membros" };

const ROLE_OPTIONS = Object.entries(ROLE_LABELS) as [OrganizationRole, string][];
const ROLE_SELECT_OPTIONS = ROLE_OPTIONS.map(([value, label]) => ({ value, label }));

export default async function MembersPage({ searchParams }: PageProps<"/members">) {
  const organization = await requireScope("org:members:read");
  const canManageMembers = hasScope(organization, "org:members:write");
  const [members, permissionGroups, pendingInvitations] = await Promise.all([
    apiRequest<Member[]>("/org/members", { organizationId: organization.id }),
    apiRequest<PermissionGroup[]>("/org/permission-groups", { organizationId: organization.id }),
    canManageMembers
      ? apiRequest<Invitation[]>("/org/invitations", { organizationId: organization.id })
      : Promise.resolve([]),
  ]);

  const groupNameById = new Map(permissionGroups.map((group) => [group.id, group.name]));

  return (
    <PageContainer>
      <PageHeader title="Membros" description={`Pessoas com acesso a ${organization.name}.`} />
      <FlashNotices flash={readFlash(await searchParams)} />

      {canManageMembers && (
        <Card>
          <CardHeader>
            <CardTitle>Convidar membro</CardTitle>
            <CardDescription>A pessoa recebe um link por e-mail para entrar na organização.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={inviteMember} className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px_auto] sm:items-end">
              <TextFormField
                label="E-mail"
                id="invite-email"
                type="email"
                name="email"
                placeholder="email@exemplo.com"
                required
              />
              <SelectFormField
                label="Papel"
                id="invite-role"
                name="role"
                defaultValue="member"
                options={ROLE_SELECT_OPTIONS}
              />
              <Button type="submit">
                <MailPlus /> Enviar convite
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="overflow-visible">
        <CardHeader>
          <CardTitle>Membros ativos</CardTitle>
          <CardDescription>{members.length} pessoa(s) com acesso.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Grupos</TableHead>
                <TableHead>Último acesso</TableHead>
                {canManageMembers && <TableHead className="text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="font-medium">{member.name}</div>
                    <div className="text-xs text-muted-foreground">{member.email}</div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge tone={member.role === "admin" ? "info" : "neutral"}>
                      {ROLE_LABELS[member.role]}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>
                    {member.role === "admin" ? (
                      <span className="text-xs text-muted-foreground">Acesso total</span>
                    ) : (
                      <div className="flex max-w-64 flex-wrap gap-1">
                        {member.permissionGroupIds.length === 0 && (
                          <span className="text-xs text-amber-600 dark:text-warning">Sem grupo</span>
                        )}
                        {member.permissionGroupIds.map((groupId) => (
                          <span
                            key={groupId}
                            className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                          >
                            {groupNameById.get(groupId) ?? "Grupo"}
                          </span>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(member.lastLoginAt)}</TableCell>
                  {canManageMembers && (
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        {member.role === "member" && (
                          <MemberGroupsDialog
                            membershipId={member.id}
                            memberName={member.name}
                            groups={permissionGroups}
                            selectedGroupIds={member.permissionGroupIds}
                          />
                        )}
                        <form action={changeMemberRole} className="flex items-center gap-2">
                          <input type="hidden" name="membershipId" value={member.id} />
                          <SelectInput
                            name="role"
                            defaultValue={member.role}
                            size="sm"
                            aria-label="Novo papel"
                            className="w-32"
                            options={ROLE_SELECT_OPTIONS}
                          />
                          <Button type="submit" variant="outline" size="sm">
                            Alterar
                          </Button>
                        </form>
                        <ConfirmAction
                          triggerLabel="Remover"
                          confirmLabel="Remover"
                          question={`Remover ${member.name} da organização?`}
                          action={removeMember}
                          hiddenFields={{ membershipId: member.id }}
                        />
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {canManageMembers && (
        <Card className="overflow-visible">
          <CardHeader>
            <CardTitle>Convites pendentes</CardTitle>
            <CardDescription>Convites que ainda não foram aceitos.</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingInvitations.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum convite pendente.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Expira em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInvitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium">{invitation.email}</TableCell>
                      <TableCell>{ROLE_LABELS[invitation.role]}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDateTime(invitation.expiresAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <form action={resendInvitation}>
                            <input type="hidden" name="invitationId" value={invitation.id} />
                            <Button type="submit" variant="outline" size="sm">
                              <Send /> Reenviar
                            </Button>
                          </form>
                          <ConfirmAction
                            triggerLabel="Cancelar"
                            confirmLabel="Cancelar convite"
                            question={`Cancelar o convite de ${invitation.email}?`}
                            action={cancelInvitation}
                            hiddenFields={{ invitationId: invitation.id }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}

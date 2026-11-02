import { CalendarDays, LifeBuoy, Ticket, Users } from "lucide-react";
import type { Metadata } from "next";
import { changeOrganizationStatus, enterOrganizationAsSupport, updateOrganization } from "@/actions/platform-actions";
import { ConfirmAction } from "@/components/confirm-action";
import { FlashNotices } from "@/components/flash-notices";
import { TextFormField } from "@/components/form/text-form-field";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/api/api-client";
import type { OrganizationDetail } from "@/lib/api/types";
import { readFlash } from "@/lib/flash";
import { formatDateTime, formatNumber, ORGANIZATION_STATUS_LABELS, ROLE_LABELS } from "@/lib/format";
import { requireSuperAdmin } from "@/lib/workspace";

export const metadata: Metadata = { title: "Organização" };

export default async function PlatformOrganizationPage({
  params,
  searchParams,
}: PageProps<"/platform/organizations/[organizationId]">) {
  await requireSuperAdmin();
  const { organizationId } = await params;
  const organization = await apiRequest<OrganizationDetail>(`/platform/organizations/${organizationId}`);
  const isActive = organization.status === "active";

  return (
    <PageContainer>
      <PageHeader
        title={organization.name}
        breadcrumbs={[{ label: "Organizações", href: "/platform/organizations" }]}
        description={
          <span className="flex items-center gap-2">
            <span className="font-mono text-xs">{organization.slug}</span>
            <StatusBadge tone={isActive ? "success" : "danger"}>
              {ORGANIZATION_STATUS_LABELS[organization.status]}
            </StatusBadge>
          </span>
        }
        actions={
          <>
            <form action={enterOrganizationAsSupport}>
              <input type="hidden" name="organizationId" value={organization.id} />
              <Button type="submit" variant="outline">
                <LifeBuoy /> Acessar como suporte
              </Button>
            </form>
            <ConfirmAction
              triggerLabel={isActive ? "Suspender" : "Reativar"}
              confirmLabel={isActive ? "Suspender" : "Reativar"}
              question={
                isActive
                  ? "Os membros perdem o acesso e a geração de tickets é congelada. Continuar?"
                  : "Reativar o acesso dos membros?"
              }
              tone={isActive ? "danger" : "primary"}
              action={changeOrganizationStatus}
              hiddenFields={{ organizationId: organization.id, transition: isActive ? "suspend" : "reactivate" }}
            />
          </>
        }
      />
      <FlashNotices flash={readFlash(await searchParams)} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Membros" value={formatNumber(organization.metrics.memberCount)} icon={Users} />
        <StatCard label="Eventos" value={formatNumber(organization.metrics.eventCount)} icon={CalendarDays} />
        <StatCard label="Tickets gerados" value={formatNumber(organization.metrics.ticketCount)} icon={Ticket} />
      </div>

      <Card>
        <form action={updateOrganization} className="contents">
          <input type="hidden" name="organizationId" value={organization.id} />
          <CardHeader>
            <CardTitle>Dados da organização</CardTitle>
            <CardDescription>Nome e identificador único.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <TextFormField
              label="Nome"
              id="organization-name"
              name="name"
              defaultValue={organization.name}
              required
              maxLength={120}
            />
            <TextFormField
              label="Slug"
              id="organization-slug"
              name="slug"
              defaultValue={organization.slug}
              required
              maxLength={60}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
            />
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit">Salvar</Button>
          </CardFooter>
        </form>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Membros</CardTitle>
          </CardHeader>
          <CardContent>
            {organization.members.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum membro ativo.</p>
            ) : (
              <ul className="divide-y">
                {organization.members.map((member) => (
                  <li key={member.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{member.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{member.email}</span>
                    </span>
                    <StatusBadge tone={member.role === "admin" ? "info" : "neutral"}>
                      {ROLE_LABELS[member.role]}
                    </StatusBadge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Convites pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            {organization.pendingInvitations.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum convite pendente.</p>
            ) : (
              <ul className="divide-y">
                {organization.pendingInvitations.map((invitation) => (
                  <li key={invitation.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{invitation.email}</span>
                      <span className="text-xs text-muted-foreground">
                        Expira em {formatDateTime(invitation.expiresAt)}
                      </span>
                    </span>
                    <StatusBadge tone="warning">{ROLE_LABELS[invitation.role]}</StatusBadge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

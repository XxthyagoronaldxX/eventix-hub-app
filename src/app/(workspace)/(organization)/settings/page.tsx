import { CalendarDays, Fingerprint, Hash, LayoutTemplate, Lock, ShieldCheck, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { updateOrganizationSettings } from "@/actions/organization-actions";
import { FlashNotices } from "@/components/flash-notices";
import { TextFormField } from "@/components/form/text-form-field";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { apiRequest } from "@/lib/api/api-client";
import type { Member, OrganizationEvent, TemplateSummary } from "@/lib/api/types";
import { readFlash } from "@/lib/flash";
import { formatDate, formatNumber, ORGANIZATION_STATUS_LABELS, ROLE_LABELS } from "@/lib/format";
import { requireScope } from "@/lib/workspace";

export const metadata: Metadata = { title: "Configurações" };

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-4 border-t pt-8 first:border-t-0 first:pt-0 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
      <div className="space-y-1">
        <h2 className="font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function ReadOnlyRow({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Hash;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-mono text-sm">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

export default async function SettingsPage({ searchParams }: PageProps<"/settings">) {
  const organization = await requireScope("org:settings:write");
  const [members, events, templates] = await Promise.all([
    apiRequest<Member[]>("/org/members", { organizationId: organization.id }),
    apiRequest<OrganizationEvent[]>("/org/events", { organizationId: organization.id }),
    apiRequest<TemplateSummary[]>("/org/templates", { organizationId: organization.id }),
  ]);
  const adminCount = members.filter((member) => member.role === "admin").length;
  const usageStats = [
    { icon: Users, label: "Membros", value: members.length, href: "/members" },
    { icon: CalendarDays, label: "Eventos", value: events.length, href: "/events" },
    { icon: LayoutTemplate, label: "Templates", value: templates.length, href: "/templates" },
  ];

  return (
    <PageContainer>
      <PageHeader title="Configurações" description="Dados e identificação da organização." />
      <FlashNotices flash={readFlash(await searchParams)} />

      <Card className="overflow-hidden py-0">
        <div className="h-20 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600" aria-hidden="true" />
        <CardContent className="flex flex-wrap items-end gap-4 pb-5">
          <span className="-mt-10 flex size-20 items-center justify-center rounded-2xl border-4 border-card bg-gradient-to-br from-indigo-500 to-fuchsia-600 text-2xl font-bold text-white shadow-md">
            {initialsOf(organization.name)}
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="truncate text-xl font-semibold tracking-tight">{organization.name}</h2>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="font-mono">{organization.slug}</span>
              <StatusBadge tone={organization.status === "active" ? "success" : "danger"}>
                {ORGANIZATION_STATUS_LABELS[organization.status]}
              </StatusBadge>
              <StatusBadge tone="info">
                {organization.isSupportAccess
                  ? "Modo suporte"
                  : `Você é ${organization.role ? ROLE_LABELS[organization.role] : "membro"}`}
              </StatusBadge>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {usageStats.map(({ icon: StatIcon, label, value, href }) => (
              <Link
                key={label}
                href={href}
                className="flex min-w-24 flex-col rounded-lg border px-3 py-2 transition-colors hover:border-primary/40 hover:bg-accent/40"
              >
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <StatIcon className="size-3.5" aria-hidden="true" /> {label}
                </span>
                <span className="text-lg font-semibold tabular-nums">{formatNumber(value)}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-8 pt-2">
        <SettingsSection
          title="Geral"
          description="O nome aparece para todos os membros, no seletor de organizações e nos convites."
        >
          <Card>
            <form action={updateOrganizationSettings} className="contents">
              <CardContent>
                <TextFormField
                  label="Nome da organização"
                  id="name"
                  name="name"
                  defaultValue={organization.name}
                  required
                  maxLength={120}
                  hint="Até 120 caracteres."
                />
              </CardContent>
              <CardFooter className="justify-end">
                <Button type="submit">Salvar alterações</Button>
              </CardFooter>
            </form>
          </Card>
        </SettingsSection>

        <SettingsSection
          title="Identificação"
          description="Dados únicos usados pela plataforma para reconhecer a organização."
        >
          <Card>
            <CardContent className="divide-y">
              <ReadOnlyRow
                icon={Hash}
                label="Slug"
                value={organization.slug}
                hint="Só o SuperAdmin pode alterar o slug."
              />
              <ReadOnlyRow
                icon={Fingerprint}
                label="ID da organização"
                value={organization.id}
                hint="Use este ID ao falar com o suporte."
              />
              <ReadOnlyRow icon={CalendarDays} label="Criada em" value={formatDate(organization.createdAt)} />
            </CardContent>
          </Card>
        </SettingsSection>

        <SettingsSection title="Acesso" description="Quem pode administrar a organização.">
          <Card>
            <CardContent className="grid gap-4">
              <div className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <ShieldCheck className="size-4" aria-hidden="true" />
                </span>
                <div className="flex-1 text-sm">
                  <p className="font-medium">
                    {adminCount === 1 ? "1 admin" : `${adminCount} admins`} e {members.length - adminCount}{" "}
                    {members.length - adminCount === 1 ? "membro" : "membros"}
                  </p>
                  <p className="text-muted-foreground">
                    Admins gerenciam membros, configurações, cancelamento de tickets e auditoria. A organização precisa
                    ter sempre pelo menos um admin.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Lock className="size-4" aria-hidden="true" />
                </span>
                <p className="flex-1 text-sm text-muted-foreground">
                  Suspender ou reativar a organização é feito pelo SuperAdmin da plataforma.
                </p>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button variant="outline" asChild>
                <Link href="/members">Gerenciar membros</Link>
              </Button>
            </CardFooter>
          </Card>
        </SettingsSection>
      </div>
    </PageContainer>
  );
}

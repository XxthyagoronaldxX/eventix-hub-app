import { ExternalLink, Grid3x3, LayoutTemplate, Lock } from "lucide-react";
import type { Metadata } from "next";
import { deleteTemplate } from "@/actions/template-actions";
import { ConfirmAction } from "@/components/confirm-action";
import { EmptyState } from "@/components/empty-state";
import { FlashNotices } from "@/components/flash-notices";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiRequest } from "@/lib/api/api-client";
import type { TemplateSummary } from "@/lib/api/types";
import { NewTemplateDialog } from "@/components/templates/new-template-dialog";
import { NUMBER_RULE_LABELS } from "@/lib/builder/template-layout";
import { readFlash } from "@/lib/flash";
import { formatDateTime } from "@/lib/format";
import { hasScope, requireScope } from "@/lib/workspace";

export const metadata: Metadata = { title: "Templates" };

export default async function TemplatesPage({ searchParams }: PageProps<"/templates">) {
  const organization = await requireScope("org:templates:read");
  const query = await searchParams;
  const templates = await apiRequest<TemplateSummary[]>("/org/templates", { organizationId: organization.id });
  const canCreateTemplates = hasScope(organization, "org:templates:write");
  const newTemplateButton = canCreateTemplates && <NewTemplateDialog defaultOpen={query.new === "1"} />;

  return (
    <PageContainer>
      <PageHeader
        title="Templates de cartela"
        description="Artes de cartela reutilizáveis em qualquer evento da organização."
        actions={newTemplateButton}
      />
      <FlashNotices flash={readFlash(query)} />

      {templates.length === 0 ? (
        <EmptyState
          icon={LayoutTemplate}
          title="Nenhum template ainda"
          description="Envie a arte da cartela e posicione as matrizes de números."
          action={newTemplateButton}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="gap-0 py-0">
              <div className="checkerboard relative aspect-[4/3] overflow-hidden border-b">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/assets/${template.imageAssetId}`}
                  alt={`Arte do template ${template.name}`}
                  loading="lazy"
                  className="absolute inset-0 size-full object-contain p-3"
                />
              </div>
              <div className="grid gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold tracking-tight">{template.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Versão {template.latestVersion} · {formatDateTime(template.updatedAt)}
                    </p>
                  </div>
                  {template.locked && (
                    <span title="A versão atual já foi usada para gerar tickets">
                      <Lock className="size-4 text-muted-foreground" aria-label="Versão em uso" />
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <StatusBadge tone="info">{NUMBER_RULE_LABELS[template.numberRuleKind]}</StatusBadge>
                  <StatusBadge>
                    {template.matrixCount === 1 ? "1 matriz" : `${template.matrixCount} matrizes`}
                  </StatusBadge>
                  {template.usedInEvents && <StatusBadge tone="warning">Usado em eventos</StatusBadge>}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="flex-1" asChild>
                    <a href={`/templates/${template.id}/edit`} target="_blank" rel="noreferrer">
                      <Grid3x3 /> {canCreateTemplates ? "Abrir editor" : "Visualizar"}{" "}
                      <ExternalLink className="ml-auto" />
                    </a>
                  </Button>
                  {canCreateTemplates && !template.usedInEvents && (
                    <ConfirmAction
                      triggerLabel="Remover"
                      confirmLabel="Remover"
                      question={`Remover o template ${template.name}?`}
                      action={deleteTemplate}
                      hiddenFields={{ templateId: template.id }}
                    />
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}

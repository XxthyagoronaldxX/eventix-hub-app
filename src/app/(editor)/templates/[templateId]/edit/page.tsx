import type { Metadata } from "next";
import { FlashNotices } from "@/components/flash-notices";
import { TemplateBuilder } from "@/components/builder/template-builder";
import { apiRequest } from "@/lib/api/api-client";
import type { TemplateDetail } from "@/lib/api/types";
import { readFlash } from "@/lib/flash";
import { hasScope, requireScope } from "@/lib/workspace";

export const metadata: Metadata = { title: "Editor de template" };

export default async function TemplateEditorPage({ params, searchParams }: PageProps<"/templates/[templateId]/edit">) {
  const organization = await requireScope("org:templates:read");
  const { templateId } = await params;
  const template = await apiRequest<TemplateDetail>(`/org/templates/${templateId}`, {
    organizationId: organization.id,
  });
  const flash = readFlash(await searchParams);
  const { current } = template;

  return (
    <>
      <FlashNotices flash={flash} />
      <TemplateBuilder
        key={`${current.id}-${current.version}-${current.imageAssetId}`}
        templateId={template.id}
        templateKind={template.kind}
        initialName={template.name}
        imageAssetId={current.imageAssetId}
        imageUrl={`/api/assets/${current.imageAssetId}`}
        imageWidth={current.imageWidth}
        imageHeight={current.imageHeight}
        initialLayout={current.layout}
        initialNumberRule={current.numberRule}
        currentVersion={current.version}
        isCurrentVersionLocked={current.locked}
        canEdit={hasScope(organization, "org:templates:write")}
      />
    </>
  );
}

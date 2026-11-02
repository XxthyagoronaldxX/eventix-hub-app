"use server";

import { redirect } from "next/navigation";
import { apiRequest, attempt } from "@/lib/api/api-client";
import type { Asset, TemplateDetail, TemplateKind } from "@/lib/api/types";
import {
  DEFAULT_NUMBER_RULE,
  DEFAULT_TEMPLATE_LAYOUT,
  DEFAULT_TICKET_TEMPLATE_LAYOUT,
  type NumberRuleConfig,
  type TemplateLayout,
} from "@/lib/builder/template-layout";
import { withFlash } from "@/lib/flash";
import { readFile, readText } from "@/lib/form-data";
import { templateDesignSchema } from "@/lib/builder/layout-problems";
import { templateNameSchema } from "@/lib/validation/form-schemas";
import { objectIdSchema } from "@/lib/validation/common-schemas";
import { firstIssueMessage, parseFormData, z } from "@/lib/validation/zod";
import { requireOrganization } from "@/lib/workspace";

export interface TemplateDesign {
  kind: TemplateKind;
  imageAssetId: string;
  layout: TemplateLayout;
  numberRule: NumberRuleConfig;
}

export interface SaveTemplateState {
  error?: string;
}

const TEMPLATES_PATH = "/templates";
const templateKindSchema = z.enum(["bingo", "ticket"], { error: "Escolha o tipo do template." });

function templateEditorPath(templateId: string): string {
  return `/templates/${templateId}/edit`;
}

function readEditorDesign(formData: FormData): TemplateDesign {
  return JSON.parse(readText(formData, "design")) as TemplateDesign;
}

async function uploadTemplateImage(organizationId: string, image: File) {
  const uploadForm = new FormData();
  uploadForm.append("file", image, image.name);
  return attempt(() => apiRequest<Asset>("/org/assets", { method: "POST", organizationId, body: uploadForm }));
}

export interface CreateTemplateState {
  error?: string;
}

export async function createTemplate(
  _previousState: CreateTemplateState,
  formData: FormData,
): Promise<CreateTemplateState> {
  const organization = await requireOrganization();
  const templateName = templateNameSchema.safeParse(readText(formData, "name"));
  if (!templateName.success) {
    return { error: firstIssueMessage(templateName.error) };
  }
  const kind = templateKindSchema.safeParse(readText(formData, "kind") || "bingo");
  if (!kind.success) {
    return { error: firstIssueMessage(kind.error) };
  }
  const image = readFile(formData, "image");
  if (!image) {
    return { error: "Escolha a imagem do template." };
  }

  const upload = await uploadTemplateImage(organization.id, image);
  if (!upload.ok) {
    return { error: upload.message };
  }
  const creation = await attempt(() =>
    apiRequest<TemplateDetail>("/org/templates", {
      method: "POST",
      organizationId: organization.id,
      body: {
        name: templateName.data,
        kind: kind.data,
        imageAssetId: upload.value.id,
        layout: kind.data === "bingo" ? DEFAULT_TEMPLATE_LAYOUT : DEFAULT_TICKET_TEMPLATE_LAYOUT,
        numberRule: DEFAULT_NUMBER_RULE,
      },
    }),
  );
  if (!creation.ok) {
    return { error: creation.message };
  }
  redirect(
    withFlash(templateEditorPath(creation.value.id), {
      notice:
        kind.data === "bingo"
          ? "Imagem enviada. Agora posicione as matrizes de números."
          : "Imagem enviada. Agora posicione o código e o QR Code.",
    }),
  );
}

export async function saveTemplate(_previousState: SaveTemplateState, formData: FormData): Promise<SaveTemplateState> {
  const organization = await requireOrganization();
  const templateId = readText(formData, "templateId");
  const templateName = templateNameSchema.safeParse(readText(formData, "name"));
  if (!templateName.success) {
    return { error: firstIssueMessage(templateName.error) };
  }
  const editorDesign = readEditorDesign(formData);
  const design = templateDesignSchema.safeParse(editorDesign);
  if (!design.success) {
    return { error: firstIssueMessage(design.error) };
  }
  const result = await attempt(() =>
    apiRequest<TemplateDetail>(`/org/templates/${templateId}`, {
      method: "PUT",
      organizationId: organization.id,
      body: { name: templateName.data, ...editorDesign },
    }),
  );
  if (!result.ok) {
    return { error: result.message };
  }
  redirect(
    withFlash(templateEditorPath(templateId), {
      notice: `Template salvo (versão ${result.value.latestVersion}).`,
    }),
  );
}

export async function replaceTemplateImage(formData: FormData) {
  const organization = await requireOrganization();
  const templateId = readText(formData, "templateId");
  const editorPath = templateEditorPath(templateId);
  const image = readFile(formData, "image");
  if (!image) {
    redirect(withFlash(editorPath, { error: "Escolha a nova imagem." }));
  }
  const upload = await uploadTemplateImage(organization.id, image);
  if (!upload.ok) {
    redirect(withFlash(editorPath, { error: upload.message }));
  }
  const editorDesign = readEditorDesign(formData);
  const result = await attempt(() =>
    apiRequest<TemplateDetail>(`/org/templates/${templateId}`, {
      method: "PUT",
      organizationId: organization.id,
      body: {
        name: readText(formData, "name"),
        imageAssetId: upload.value.id,
        layout: editorDesign.layout,
        numberRule: editorDesign.numberRule,
      },
    }),
  );
  redirect(withFlash(editorPath, result.ok ? { notice: "Imagem substituída." } : { error: result.message }));
}

const deleteTemplateSchema = z.object({ templateId: objectIdSchema });

export async function deleteTemplate(formData: FormData) {
  const organization = await requireOrganization();
  const form = parseFormData(deleteTemplateSchema, formData);
  if (!form.ok) {
    redirect(withFlash(TEMPLATES_PATH, { error: form.message }));
  }
  const result = await attempt(() =>
    apiRequest(`/org/templates/${form.data.templateId}`, { method: "DELETE", organizationId: organization.id }),
  );
  redirect(withFlash(TEMPLATES_PATH, result.ok ? { notice: "Template removido." } : { error: result.message }));
}

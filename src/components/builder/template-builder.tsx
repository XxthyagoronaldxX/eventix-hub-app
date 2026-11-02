"use client";

import {
  ArrowLeft,
  Copy,
  Dices,
  Eye,
  Grid3x3,
  Hash,
  Loader2,
  Lock,
  Plus,
  QrCode,
  Save,
  Trash2,
  X,
  ZoomIn,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { type ReactNode, useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  replaceTemplateImage,
  type SaveTemplateState,
  saveTemplate,
  type TemplateDesign,
} from "@/actions/template-actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberFormField } from "@/components/form/number-form-field";
import { SelectFormField } from "@/components/form/select-form-field";
import { SwitchFormField } from "@/components/form/switch-form-field";
import { Separator } from "@/components/ui/separator";
import { clampBox } from "@/lib/builder/layout-geometry";
import { findLayoutProblems, matrixLabel } from "@/lib/builder/layout-problems";
import { generateSampleTicket } from "@/lib/builder/sample-numbers";
import {
  DEFAULT_QR_CODE_FIELD,
  DEFAULT_TICKET_CODE_FIELD,
  type LayoutFieldType,
  MATRIX_SHAPE_BY_RULE,
  MAXIMUM_MATRICES_PER_TEMPLATE,
  type MatrixLayout,
  NUMBER_RULE_LABELS,
  type NumberRuleConfig,
  type NumberRuleKind,
  type RelativeBox,
  type TemplateLayout,
  type TicketCodeField,
} from "@/lib/builder/template-layout";
import type { TemplateKind } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { BuilderCanvas } from "./builder-canvas";
import {
  type BuilderElementKey,
  elementLabel,
  findElementBox,
  listElementKeys,
  matrixElementKey,
  matrixIndexOf,
  withElementBox,
} from "./builder-elements";
import { BoxInputs, PercentInput, TextStyleInputs } from "./builder-inputs";

interface TemplateBuilderProps {
  templateId: string;
  templateKind: TemplateKind;
  initialName: string;
  imageAssetId: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  initialLayout: TemplateLayout;
  initialNumberRule: NumberRuleConfig;
  currentVersion: number;
  isCurrentVersionLocked: boolean;
  canEdit: boolean;
}

const SAMPLE_TICKET_CODE = "EVX-AMST-RA23";
const DEFAULT_RANGE_RULE: NumberRuleConfig = { kind: "range", min: 1, max: 99 };
const DEFAULT_FIELD_BY_TYPE = { ticketCode: DEFAULT_TICKET_CODE_FIELD, qrCode: DEFAULT_QR_CODE_FIELD };
const INITIAL_SAVE_STATE: SaveTemplateState = {};
const DUPLICATE_OFFSET = 0.04;
const MISSING_FIELD_SHORTCUTS: { fieldType: LayoutFieldType; label: string; icon: typeof QrCode }[] = [
  { fieldType: "qrCode", label: "QR Code", icon: QrCode },
  { fieldType: "ticketCode", label: "Código do ticket", icon: Hash },
];
const NUMBER_RULE_OPTIONS = (Object.keys(NUMBER_RULE_LABELS) as NumberRuleKind[]).map((kind) => ({
  value: kind,
  label: NUMBER_RULE_LABELS[kind],
}));

function SaveButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={disabled || pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Save />}
      {pending ? "Salvando..." : "Salvar"}
    </Button>
  );
}

function PanelSection({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="grid gap-3 border-b px-4 py-4 last:border-b-0">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function numberRuleForKind(kind: NumberRuleKind, currentRule: NumberRuleConfig): NumberRuleConfig {
  if (kind === "range") {
    return currentRule.kind === "range" ? currentRule : DEFAULT_RANGE_RULE;
  }
  return { kind };
}

function duplicateMatrix(matrix: MatrixLayout): MatrixLayout {
  const shiftedBox = clampBox({
    x: matrix.x + DUPLICATE_OFFSET,
    y: matrix.y + DUPLICATE_OFFSET,
    width: matrix.width,
    height: matrix.height,
  });
  return { ...matrix, ...shiftedBox };
}

function initialElementFor(templateKind: TemplateKind, layout: TemplateLayout): BuilderElementKey {
  return templateKind === "bingo" ? matrixElementKey(0) : (layout.fields[0]?.type ?? "ticketCode");
}

function elementIcon(elementKey: BuilderElementKey) {
  if (matrixIndexOf(elementKey) !== null) return Grid3x3;
  return elementKey === "qrCode" ? QrCode : Hash;
}

export function TemplateBuilder({
  templateId,
  templateKind,
  initialName,
  imageAssetId,
  imageUrl,
  imageWidth,
  imageHeight,
  initialLayout,
  initialNumberRule,
  currentVersion,
  isCurrentVersionLocked,
  canEdit,
}: TemplateBuilderProps) {
  const [name, setName] = useState(initialName);
  const [layout, setLayout] = useState(initialLayout);
  const [numberRule, setNumberRule] = useState(initialNumberRule);
  const [selectedElement, setSelectedElement] = useState<BuilderElementKey>(() =>
    initialElementFor(templateKind, initialLayout),
  );
  const [editingMatrixIndex, setEditingMatrixIndex] = useState(0);
  const [sampleSeed, setSampleSeed] = useState(1);
  const [zoomPercent, setZoomPercent] = useState(100);
  const [serverPreviewUrl, setServerPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (previewError) toast.error(previewError);
  }, [previewError]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [saveState, saveFormAction] = useActionState(saveTemplate, INITIAL_SAVE_STATE);

  useEffect(() => {
    if (saveState.error) toast.error(saveState.error);
  }, [saveState]);

  useEffect(() => {
    return () => {
      if (serverPreviewUrl) URL.revokeObjectURL(serverPreviewUrl);
    };
  }, [serverPreviewUrl]);

  const shapePreset = MATRIX_SHAPE_BY_RULE[numberRule.kind];
  const sampleNumbers = generateSampleTicket(layout, numberRule, sampleSeed);
  const isBingo = templateKind === "bingo";
  const layoutProblems = findLayoutProblems(layout, numberRule, templateKind);
  const design: TemplateDesign = { kind: templateKind, imageAssetId, layout, numberRule };
  const selectedBox = findElementBox(layout, selectedElement);
  const editingMatrix = layout.matrices[editingMatrixIndex] ?? layout.matrices[0];
  const ticketCodeField = layout.fields.find((field): field is TicketCodeField => field.type === "ticketCode");
  const canAddMatrix = layout.matrices.length < MAXIMUM_MATRICES_PER_TEMPLATE;

  function selectElement(elementKey: BuilderElementKey) {
    setSelectedElement(elementKey);
    const matrixIndex = matrixIndexOf(elementKey);
    if (matrixIndex !== null) setEditingMatrixIndex(matrixIndex);
  }

  function updateEditingMatrix(changes: Partial<MatrixLayout>) {
    setLayout((currentLayout) => ({
      ...currentLayout,
      matrices: currentLayout.matrices.map((matrix, index) =>
        index === editingMatrixIndex ? { ...matrix, ...changes } : matrix,
      ),
    }));
  }

  function changeNumberRuleKind(kind: NumberRuleKind) {
    setNumberRule((currentRule) => numberRuleForKind(kind, currentRule));
    const preset = MATRIX_SHAPE_BY_RULE[kind];
    if (preset) {
      setLayout((currentLayout) => ({
        ...currentLayout,
        matrices: currentLayout.matrices.map((matrix) => ({ ...matrix, ...preset })),
      }));
    }
  }

  function addMatrix() {
    const newMatrixIndex = layout.matrices.length;
    setLayout((currentLayout) => ({
      ...currentLayout,
      matrices: [
        ...currentLayout.matrices,
        duplicateMatrix(currentLayout.matrices[editingMatrixIndex] ?? currentLayout.matrices[0]),
      ],
    }));
    selectElement(matrixElementKey(newMatrixIndex));
  }

  function removeEditingMatrix() {
    setLayout((currentLayout) => ({
      ...currentLayout,
      matrices: currentLayout.matrices.filter((_, index) => index !== editingMatrixIndex),
    }));
    selectElement(matrixElementKey(Math.max(0, editingMatrixIndex - 1)));
  }

  function changeElementBox(elementKey: BuilderElementKey, box: RelativeBox) {
    setLayout((currentLayout) => withElementBox(currentLayout, elementKey, box));
  }

  function toggleField(fieldType: LayoutFieldType, isEnabled: boolean) {
    setLayout((currentLayout) => ({
      ...currentLayout,
      fields: isEnabled
        ? [...currentLayout.fields.filter((field) => field.type !== fieldType), DEFAULT_FIELD_BY_TYPE[fieldType]]
        : currentLayout.fields.filter((field) => field.type !== fieldType),
    }));
    const remainingField = layout.fields.find((field) => field.type !== fieldType);
    const fallbackElement = isBingo ? matrixElementKey(editingMatrixIndex) : (remainingField?.type ?? fieldType);
    selectElement(isEnabled ? fieldType : fallbackElement);
  }

  function updateTicketCodeFont(font: TicketCodeField["font"]) {
    setLayout((currentLayout) => ({
      ...currentLayout,
      fields: currentLayout.fields.map((field) => (field.type === "ticketCode" ? { ...field, font } : field)),
    }));
  }

  async function loadServerPreview() {
    setIsLoadingPreview(true);
    setPreviewError(null);
    try {
      const response = await fetch("/api/templates/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(design),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(payload.message ?? "Não foi possível gerar a prévia.");
      }
      setServerPreviewUrl(URL.createObjectURL(await response.blob()));
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : "Não foi possível gerar a prévia.");
    } finally {
      setIsLoadingPreview(false);
    }
  }

  return (
    <form action={saveFormAction} noValidate className="flex h-dvh flex-col overflow-hidden">
      <input type="hidden" name="templateId" value={templateId} />
      <input type="hidden" name="design" value={JSON.stringify(design)} />

      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b bg-card px-4 py-2.5">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/templates" title="Voltar para templates" aria-label="Voltar para templates">
            <ArrowLeft />
          </Link>
        </Button>
        <Input
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={120}
          readOnly={!canEdit}
          aria-label="Nome do template"
          className="h-9 max-w-xs border-transparent bg-transparent text-base font-semibold shadow-none hover:border-input focus-visible:border-ring"
        />
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {isCurrentVersionLocked && <Lock className="size-3.5" aria-hidden="true" />}
          Versão {currentVersion}
          {isCurrentVersionLocked && ` · salvar cria a versão ${currentVersion + 1}`}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <label className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
            <ZoomIn className="size-4" aria-hidden="true" />
            <input
              type="range"
              min={50}
              max={250}
              step={10}
              value={zoomPercent}
              onChange={(event) => setZoomPercent(Number(event.target.value))}
              className="w-24 accent-primary"
              aria-label="Zoom"
            />
            <span className="w-10 tabular-nums">{zoomPercent}%</span>
          </label>
          {isBingo && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setSampleSeed((seed) => seed + 1)}
              title="Sortear novos números de exemplo"
            >
              <Dices /> <span className="hidden sm:inline">Nova amostra</span>
            </Button>
          )}
          <Button type="button" variant="outline" onClick={loadServerPreview} disabled={isLoadingPreview}>
            {isLoadingPreview ? <Loader2 className="animate-spin" /> : <Eye />}
            <span className="hidden sm:inline">Prévia real</span>
          </Button>
          {canEdit && <SaveButton disabled={layoutProblems.length > 0} />}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        <main className="flex min-h-[60vh] min-w-0 flex-1 flex-col gap-3 bg-muted/30 p-4 lg:min-h-0">
          <div className="flex flex-wrap items-center gap-1" role="tablist" aria-label="Elemento selecionado">
            {listElementKeys(layout).map((elementKey) => {
              const ElementIcon = elementIcon(elementKey);
              const isSelected = selectedElement === elementKey;
              return (
                <button
                  key={elementKey}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => selectElement(elementKey)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-card",
                    isSelected ? "border-primary/40 bg-card text-foreground shadow-sm" : "border-transparent",
                  )}
                >
                  <ElementIcon className="size-3.5" aria-hidden="true" />
                  {elementLabel(elementKey)}
                </button>
              );
            })}
            {MISSING_FIELD_SHORTCUTS.filter(
              (shortcut) => !layout.fields.some((field) => field.type === shortcut.fieldType),
            ).map(({ fieldType, label, icon: ShortcutIcon }) => (
              <button
                key={fieldType}
                type="button"
                onClick={() => toggleField(fieldType, true)}
                className="flex items-center gap-1.5 rounded-md border border-dashed px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:bg-card hover:text-foreground"
              >
                <Plus className="size-3.5" aria-hidden="true" />
                <ShortcutIcon className="size-3.5" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
          <BuilderCanvas
            imageUrl={imageUrl}
            image={{ width: imageWidth, height: imageHeight }}
            layout={layout}
            sampleNumbers={sampleNumbers}
            sampleTicketCode={SAMPLE_TICKET_CODE}
            selectedElement={selectedElement}
            zoomPercent={zoomPercent}
            onSelectElement={selectElement}
            onChangeElementBox={changeElementBox}
          />
          <p className="text-xs text-muted-foreground">
            Arraste para mover, use os cantos para redimensionar ou arraste numa área vazia para redesenhar o elemento
            selecionado.
          </p>
        </main>

        <aside className="w-full shrink-0 border-t bg-card lg:w-[360px] lg:overflow-y-auto lg:overscroll-contain lg:border-t-0 lg:border-l">
          {layoutProblems.length > 0 && (
            <div className="border-b p-4">
              <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
                <AlertTitle>Ajuste antes de salvar</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-4">
                    {layoutProblems.map((problem) => (
                      <li key={problem}>{problem}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {isBingo && (
            <>
              <PanelSection title="Regra dos números">
                <SelectFormField
                  id="number-rule-kind"
                  label="Tipo (vale para todas as matrizes)"
                  compact
                  options={NUMBER_RULE_OPTIONS}
                  value={numberRule.kind}
                  onValueChange={(kind) => changeNumberRuleKind(kind as NumberRuleKind)}
                />
                {numberRule.kind === "range" && (
                  <div className="grid grid-cols-2 gap-3">
                    <NumberFormField
                      id="range-minimum"
                      label="Mínimo"
                      compact
                      step={1}
                      min={0}
                      value={numberRule.min}
                      onValueChange={(min) => setNumberRule({ ...numberRule, min: Math.round(min) })}
                    />
                    <NumberFormField
                      id="range-maximum"
                      label="Máximo"
                      compact
                      step={1}
                      min={1}
                      value={numberRule.max}
                      onValueChange={(max) => setNumberRule({ ...numberRule, max: Math.round(max) })}
                    />
                  </div>
                )}
              </PanelSection>

              <PanelSection
                title={`Matrizes (${layout.matrices.length})`}
                action={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addMatrix}
                    disabled={!canAddMatrix}
                    title="Duplica a matriz em edição"
                  >
                    <Plus /> Adicionar
                  </Button>
                }
              >
                <p className="text-xs text-muted-foreground">
                  Cada matriz é um bingo independente na mesma cartela, com números próprios.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {layout.matrices.map((_, matrixIndex) => (
                    <button
                      key={matrixElementKey(matrixIndex)}
                      type="button"
                      onClick={() => selectElement(matrixElementKey(matrixIndex))}
                      className={cn(
                        "flex size-8 items-center justify-center rounded-md border text-sm font-medium transition-colors hover:bg-muted",
                        matrixIndex === editingMatrixIndex &&
                          "border-primary bg-primary text-primary-foreground hover:bg-primary",
                      )}
                      aria-label={matrixLabel(matrixIndex)}
                      aria-pressed={matrixIndex === editingMatrixIndex}
                    >
                      {matrixIndex + 1}
                    </button>
                  ))}
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{matrixLabel(editingMatrixIndex)}</p>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={addMatrix}
                      disabled={!canAddMatrix}
                      title="Duplicar matriz"
                      aria-label="Duplicar matriz"
                    >
                      <Copy />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={removeEditingMatrix}
                      disabled={layout.matrices.length <= 1}
                      title="Remover matriz"
                      aria-label="Remover matriz"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <NumberFormField
                    id="matrix-rows"
                    label="Linhas"
                    compact
                    step={1}
                    min={1}
                    max={20}
                    disabled={Boolean(shapePreset)}
                    value={editingMatrix.rows}
                    onValueChange={(rows) => updateEditingMatrix({ rows: Math.round(rows) })}
                  />
                  <NumberFormField
                    id="matrix-cols"
                    label="Colunas"
                    compact
                    step={1}
                    min={1}
                    max={20}
                    disabled={Boolean(shapePreset)}
                    value={editingMatrix.cols}
                    onValueChange={(cols) => updateEditingMatrix({ cols: Math.round(cols) })}
                  />
                  <PercentInput
                    id="matrix-gap-x"
                    label="Espaço horizontal"
                    value={editingMatrix.gapX}
                    max={20}
                    onChange={(gapX) => updateEditingMatrix({ gapX })}
                  />
                  <PercentInput
                    id="matrix-gap-y"
                    label="Espaço vertical"
                    value={editingMatrix.gapY}
                    max={20}
                    onChange={(gapY) => updateEditingMatrix({ gapY })}
                  />
                </div>
                <SwitchFormField
                  label="Célula central livre"
                  checked={editingMatrix.freeCenter}
                  disabled={numberRule.kind === "bingo90"}
                  onCheckedChange={(freeCenter) => updateEditingMatrix({ freeCenter })}
                />
                <p className="text-xs font-medium text-muted-foreground">Fonte dos números</p>
                <TextStyleInputs
                  idPrefix="matrix"
                  style={editingMatrix.font}
                  onChange={(font) => updateEditingMatrix({ font })}
                />
              </PanelSection>
            </>
          )}

          <PanelSection title={isBingo ? "Campos extras" : "Campos do ticket"}>
            {!isBingo && (
              <p className="text-xs text-muted-foreground">
                Tickets de rifa e ingresso não têm números. Mostre o código, o QR Code ou os dois.
              </p>
            )}
            <SwitchFormField
              label="Código do ticket"
              checked={Boolean(ticketCodeField)}
              onCheckedChange={(isEnabled) => toggleField("ticketCode", isEnabled)}
            />
            {ticketCodeField && (
              <TextStyleInputs idPrefix="ticket-code" style={ticketCodeField.font} onChange={updateTicketCodeFont} />
            )}
            <Separator />
            <SwitchFormField
              label="QR Code com o código"
              checked={layout.fields.some((field) => field.type === "qrCode")}
              onCheckedChange={(isEnabled) => toggleField("qrCode", isEnabled)}
            />
          </PanelSection>

          {selectedBox && (
            <PanelSection title={`Posição · ${elementLabel(selectedElement)}`}>
              <BoxInputs
                idPrefix="selected-element"
                box={selectedBox}
                onChange={(box) => changeElementBox(selectedElement, box)}
              />
            </PanelSection>
          )}

          {canEdit && (
            <PanelSection title={isBingo ? "Imagem da cartela" : "Imagem do ticket"}>
              <p className="text-xs text-muted-foreground">
                As posições são mantidas, porque são relativas ao tamanho da imagem.
              </p>
              <div className="grid gap-2">
                <input
                  type="file"
                  name="image"
                  accept="image/png,image/jpeg"
                  aria-label="Nova imagem"
                  className="min-w-0"
                />
                <Button type="submit" variant="outline" size="sm" formAction={replaceTemplateImage} formNoValidate>
                  Trocar imagem
                </Button>
              </div>
            </PanelSection>
          )}
        </aside>
      </div>

      {serverPreviewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          role="dialog"
          aria-label="Prévia renderizada no servidor"
        >
          <div className="relative max-h-full max-w-4xl">
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              onClick={() => setServerPreviewUrl(null)}
              aria-label="Fechar prévia"
              className="absolute -top-3 -right-3 rounded-full shadow"
            >
              <X />
            </Button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={serverPreviewUrl}
              alt="Prévia da cartela gerada pelo servidor"
              className="max-h-[90vh] rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </form>
  );
}

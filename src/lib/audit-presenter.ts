import {
  Building,
  CalendarPlus,
  CalendarCog,
  Dices,
  FileDown,
  Layers,
  LayoutTemplate,
  type LucideIcon,
  MailPlus,
  MailX,
  ShieldCheck,
  ShieldOff,
  Trash2,
  TicketX,
  UserCog,
  UserMinus,
  UserPlus,
  Wallet,
} from "lucide-react";
import type { AuditEntry, OrganizationRole, PaymentMethod } from "@/lib/api/types";
import { PAYMENT_METHOD_LABELS, ROLE_LABELS } from "@/lib/format";

export type AuditTone = "info" | "success" | "warning" | "danger" | "neutral";

export interface AuditPresentation {
  icon: LucideIcon;
  tone: AuditTone;
  summary: string;
}

export interface AuditActionOption {
  value: string;
  label: string;
}

export const AUDIT_ACTION_OPTIONS: AuditActionOption[] = [
  { value: "member.invited", label: "Membro convidado" },
  { value: "member.joined", label: "Membro entrou" },
  { value: "member.role_changed", label: "Papel alterado" },
  { value: "member.groups_changed", label: "Grupos do membro alterados" },
  { value: "permission_group.saved", label: "Grupo de permissão salvo" },
  { value: "permission_group.deleted", label: "Grupo de permissão removido" },
  { value: "member.removed", label: "Membro removido" },
  { value: "invitation.canceled", label: "Convite cancelado" },
  { value: "event.created", label: "Evento criado" },
  { value: "event.updated", label: "Evento atualizado" },
  { value: "template.saved", label: "Template salvo" },
  { value: "template.deleted", label: "Template removido" },
  { value: "ticket_batch.created", label: "Lote gerado" },
  { value: "ticket.voided", label: "Ticket cancelado" },
  { value: "ticket.payment_changed", label: "Pagamento de ticket" },
  { value: "ticket_batch.paid", label: "Lote marcado como pago" },
  { value: "export.requested", label: "Exportação solicitada" },
  { value: "draw.started", label: "Rodada de sorteio iniciada" },
  { value: "draw.finished", label: "Rodada de sorteio encerrada" },
  { value: "organization.created", label: "Organização criada" },
  { value: "organization.updated", label: "Organização atualizada" },
  { value: "organization.suspended", label: "Organização suspensa" },
  { value: "organization.reactivated", label: "Organização reativada" },
];

const EVENT_FIELD_LABELS: Record<string, string> = {
  name: "nome",
  startsAt: "data",
  location: "local",
  description: "descrição",
  status: "status",
};

const EXPORT_FORMAT_LABELS: Record<string, string> = { pdf: "PDF", zip: "ZIP" };

function text(metadata: Record<string, unknown>, key: string): string {
  const value = metadata[key];
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function paymentMethodSuffix(metadata: Record<string, unknown>): string {
  const method = text(metadata, "method") as PaymentMethod;
  return PAYMENT_METHOD_LABELS[method] ? ` (${PAYMENT_METHOD_LABELS[method]})` : "";
}

function roleLabel(metadata: Record<string, unknown>, key: string): string {
  const role = text(metadata, key) as OrganizationRole;
  return ROLE_LABELS[role] ?? role;
}

function listChangedFields(metadata: Record<string, unknown>): string {
  const changedFields = Array.isArray(metadata.changedFields) ? (metadata.changedFields as string[]) : [];
  const labels = changedFields.map((field) => EVENT_FIELD_LABELS[field] ?? field);
  return labels.length > 0 ? `: ${labels.join(", ")}` : "";
}

export function presentAuditEntry(entry: AuditEntry): AuditPresentation {
  const { metadata } = entry;
  switch (entry.action) {
    case "member.invited":
      return {
        icon: MailPlus,
        tone: "info",
        summary: `convidou ${text(metadata, "email")} como ${roleLabel(metadata, "role")}`,
      };
    case "member.joined":
      return { icon: UserPlus, tone: "success", summary: `entrou na organização como ${roleLabel(metadata, "role")}` };
    case "member.groups_changed":
      return {
        icon: ShieldCheck,
        tone: "info",
        summary: `alterou os grupos de permissão de um membro (${text(metadata, "groupCount")} grupos)`,
      };
    case "permission_group.saved":
      return {
        icon: ShieldCheck,
        tone: "info",
        summary: `salvou o grupo de permissão “${text(metadata, "name")}” (${text(metadata, "scopeCount")} permissões)`,
      };
    case "permission_group.deleted":
      return { icon: ShieldOff, tone: "danger", summary: `removeu o grupo de permissão “${text(metadata, "name")}”` };
    case "member.role_changed":
      return {
        icon: UserCog,
        tone: "info",
        summary: `alterou o papel de um membro de ${roleLabel(metadata, "previousRole")} para ${roleLabel(metadata, "newRole")}`,
      };
    case "member.removed":
      return { icon: UserMinus, tone: "danger", summary: "removeu um membro da organização" };
    case "invitation.canceled":
      return { icon: MailX, tone: "warning", summary: `cancelou o convite de ${text(metadata, "email")}` };
    case "event.created":
      return { icon: CalendarPlus, tone: "success", summary: `criou o evento “${text(metadata, "name")}”` };
    case "event.updated":
      return { icon: CalendarCog, tone: "info", summary: `atualizou um evento${listChangedFields(metadata)}` };
    case "template.saved":
      return {
        icon: LayoutTemplate,
        tone: "info",
        summary: `salvou o template “${text(metadata, "name")}” (versão ${text(metadata, "version")})`,
      };
    case "template.deleted":
      return { icon: Trash2, tone: "danger", summary: `removeu o template “${text(metadata, "name")}”` };
    case "ticket_batch.created":
      return {
        icon: Layers,
        tone: "success",
        summary: `gerou um lote de ${text(metadata, "quantity")} tickets (template versão ${text(metadata, "templateVersion")})`,
      };
    case "ticket.payment_changed":
      return {
        icon: Wallet,
        tone: metadata.paid ? "success" : "warning",
        summary: metadata.paid
          ? `confirmou o pagamento do ticket ${text(metadata, "code")}${paymentMethodSuffix(metadata)}`
          : `desfez o pagamento do ticket ${text(metadata, "code")}`,
      };
    case "ticket_batch.paid":
      return {
        icon: Wallet,
        tone: "success",
        summary: `marcou ${text(metadata, "updatedCount")} tickets de um lote como pagos${paymentMethodSuffix(metadata)}`,
      };
    case "ticket.voided":
      return { icon: TicketX, tone: "danger", summary: `cancelou o ticket ${text(metadata, "code")}` };
    case "export.requested":
      return {
        icon: FileDown,
        tone: "neutral",
        summary: `exportou um lote em ${EXPORT_FORMAT_LABELS[text(metadata, "format")] ?? text(metadata, "format")}`,
      };
    case "draw.started":
      return {
        icon: Dices,
        tone: "info",
        summary: `iniciou a rodada ${text(metadata, "round")} do sorteio (${text(metadata, "pattern") === "full_card" ? "cartela cheia" : "linha"})`,
      };
    case "draw.finished":
      return {
        icon: Dices,
        tone: "neutral",
        summary: `encerrou a rodada ${text(metadata, "round")} com ${text(metadata, "drawnCount")} números sorteados`,
      };
    case "organization.created":
      return { icon: Building, tone: "success", summary: `criou a organização “${text(metadata, "name")}”` };
    case "organization.updated":
      return { icon: Building, tone: "info", summary: "atualizou os dados da organização" };
    case "organization.suspended":
      return { icon: ShieldOff, tone: "danger", summary: "suspendeu a organização" };
    case "organization.reactivated":
      return { icon: ShieldCheck, tone: "success", summary: "reativou a organização" };
    default:
      return { icon: Building, tone: "neutral", summary: entry.action };
  }
}

const DAY_LABEL_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});
const DAY_KEY_FORMATTER = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" });

export interface AuditDay {
  dayKey: string;
  label: string;
  entries: AuditEntry[];
}

function describeDay(dayKey: string, date: Date): string {
  const todayKey = DAY_KEY_FORMATTER.format(new Date());
  const yesterdayKey = DAY_KEY_FORMATTER.format(new Date(Date.now() - 24 * 60 * 60 * 1000));
  if (dayKey === todayKey) return "Hoje";
  if (dayKey === yesterdayKey) return "Ontem";
  const label = DAY_LABEL_FORMATTER.format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function groupAuditEntriesByDay(entries: AuditEntry[]): AuditDay[] {
  const days = new Map<string, AuditDay>();
  for (const entry of entries) {
    const createdAt = new Date(entry.createdAt);
    const dayKey = DAY_KEY_FORMATTER.format(createdAt);
    const day = days.get(dayKey) ?? { dayKey, label: describeDay(dayKey, createdAt), entries: [] };
    day.entries.push(entry);
    days.set(dayKey, day);
  }
  return [...days.values()];
}

const SAO_PAULO_UTC_OFFSET = "-03:00";

export function startOfDayIso(dateInput: string): string | undefined {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateInput) ? `${dateInput}T00:00:00.000${SAO_PAULO_UTC_OFFSET}` : undefined;
}

export function endOfDayIso(dateInput: string): string | undefined {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateInput) ? `${dateInput}T23:59:59.999${SAO_PAULO_UTC_OFFSET}` : undefined;
}

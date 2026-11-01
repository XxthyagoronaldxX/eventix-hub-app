import type {
  EventStatus,
  JobStatus,
  OrganizationRole,
  OrganizationStatus,
  TicketStatus,
  PaymentMethod,
  UserStatus,
} from "@/lib/api/types";

const LOCALE = "pt-BR";
const TIME_ZONE = "America/Sao_Paulo";

const dateFormatter = new Intl.DateTimeFormat(LOCALE, { dateStyle: "short", timeZone: TIME_ZONE });
const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: TIME_ZONE,
});
const numberFormatter = new Intl.NumberFormat(LOCALE);

export function formatDate(isoDate: string | null | undefined): string {
  return isoDate ? dateFormatter.format(new Date(isoDate)) : "—";
}

export function formatDateTime(isoDate: string | null | undefined): string {
  return isoDate ? dateTimeFormatter.format(new Date(isoDate)) : "—";
}

const CURRENCY_FORMATTER = new Intl.NumberFormat(LOCALE, { style: "currency", currency: "BRL" });

export function formatCurrencyFromCents(cents: number): string {
  return CURRENCY_FORMATTER.format(cents / 100);
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatBytes(bytes: number | null): string {
  if (bytes === null) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function toDateTimeLocalValue(isoDate: string): string {
  const date = new Date(isoDate);
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 16);
}

export const ROLE_LABELS: Record<OrganizationRole, string> = {
  admin: "Admin",
  member: "Membro",
};

export const ORGANIZATION_STATUS_LABELS: Record<OrganizationStatus, string> = {
  active: "Ativa",
  suspended: "Suspensa",
};

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  active: "Ativo",
  blocked: "Bloqueado",
};

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  draft: "Rascunho",
  active: "Ativo",
  archived: "Arquivado",
};

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  queued: "Na fila",
  processing: "Processando",
  done: "Concluído",
  failed: "Falhou",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: "Pix",
  cash: "Dinheiro",
  card: "Cartão",
};

export const PAYMENT_METHOD_OPTIONS = (Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][]).map(
  ([value, label]) => ({ value, label }),
);

export interface EventPaymentSettings {
  allowedPaymentMethods: PaymentMethod[];
  onlinePaymentsEnabled: boolean;
  requireBuyerIdentification?: boolean;
}

export function onlinePaymentMethodsOf(settings: EventPaymentSettings): ("pix" | "card")[] {
  if (!settings.onlinePaymentsEnabled) return [];
  return settings.allowedPaymentMethods.filter((method): method is "pix" | "card" => method !== "cash");
}

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  active: "Ativo",
  void: "Cancelado",
};

export function isJobRunning(status: JobStatus): boolean {
  return status === "queued" || status === "processing";
}

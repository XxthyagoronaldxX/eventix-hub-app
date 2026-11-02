import type { NumberRuleConfig, TemplateLayout } from "@/lib/builder/template-layout";

export type OrganizationRole = "admin" | "member";
export type OrganizationStatus = "active" | "suspended";
export type UserStatus = "active" | "blocked";
export type EventStatus = "draft" | "active" | "archived";

export type EventKind = "bingo" | "tickets" | "raffle";

export type TemplateKind = "bingo" | "ticket";
export type JobStatus = "queued" | "processing" | "done" | "failed";
export type TicketStatus = "active" | "void";
export type PaymentMethod = "pix" | "cash" | "card";

export interface TicketBuyer {
  name: string | null;
  phone: string | null;
  document: string | null;
}
export type ExportFormat = "pdf" | "zip";

export type Scope =
  | "org:read"
  | "org:settings:write"
  | "org:members:read"
  | "org:members:write"
  | "org:events:read"
  | "org:events:write"
  | "org:templates:read"
  | "org:templates:write"
  | "org:tickets:read"
  | "org:tickets:generate"
  | "org:tickets:void"
  | "org:tickets:check-in"
  | "org:tickets:payment"
  | "org:draws:run"
  | "org:audit:read";

export interface Page<TItem> {
  items: TItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface MembershipSummary {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  organizationStatus: OrganizationStatus;
  role: OrganizationRole;
}

export interface CurrentUser {
  user: { id: string; name: string; email: string; isSuperAdmin: boolean };
  memberships: MembershipSummary[];
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  status: OrganizationStatus;
  createdAt: string;
}

export interface ActiveOrganization extends Organization {
  role: OrganizationRole | null;
  isSupportAccess: boolean;
  scopes: Scope[];
}

export interface OrganizationMetrics {
  memberCount: number;
  eventCount: number;
  ticketCount: number;
}

export interface OrganizationWithMetrics extends Organization {
  metrics: OrganizationMetrics;
}

export interface Member {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: OrganizationRole;
  permissionGroupIds: string[];
  lastLoginAt: string | null;
  joinedAt: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: OrganizationRole;
  expiresAt: string;
  createdAt: string;
  acceptUrl?: string;
}

export interface OrganizationDetail extends OrganizationWithMetrics {
  members: Member[];
  pendingInvitations: Invitation[];
}

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  isSuperAdmin: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface CreatedPlatformUser {
  user: PlatformUser;
  organizationName: string | null;
  setupEmailSent: boolean;
  setupUrl?: string;
}

export interface InvitationPreview {
  organizationName: string;
  email: string;
  role: OrganizationRole;
  hasAccount: boolean;
}

export interface OrganizationEvent {
  id: string;
  name: string;
  kind: EventKind;
  startsAt: string;
  location: string;
  description: string;
  ticketPriceCents: number;
  allowedPaymentMethods: PaymentMethod[];
  onlinePaymentsEnabled: boolean;
  requireBuyerIdentification: boolean;
  status: EventStatus;
  canChangeKind: boolean;
  createdAt: string;
}

export interface Asset {
  id: string;
  mimeType: string;
  width: number;
  height: number;
  sizeBytes: number;
  originalFileName: string;
}

interface TemplateIdentity {
  id: string;
  name: string;
  kind: TemplateKind;
  latestVersion: number;
  updatedAt: string;
}

export interface TemplateSummary extends TemplateIdentity {
  imageAssetId: string;
  matrixCount: number;
  numberRuleKind: NumberRuleConfig["kind"];
  locked: boolean;
  usedInEvents: boolean;
}

export interface TemplateVersion {
  id: string;
  version: number;
  imageAssetId: string;
  imageWidth: number;
  imageHeight: number;
  layout: TemplateLayout;
  numberRule: NumberRuleConfig;
  locked: boolean;
  createdAt: string;
}

export interface TemplateDetail extends TemplateIdentity {
  current: TemplateVersion;
  versions: { id: string; version: number; locked: boolean; createdAt: string }[];
}

export interface TicketBatch {
  id: string;
  eventId: string;
  templateId: string;
  templateVersionId: string;
  templateVersion: number;
  quantity: number;
  generatedCount: number;
  status: JobStatus;
  failureReason: string | null;
  createdAt: string;
}

export interface Ticket {
  id: string;
  code: string;
  eventId: string;
  batchId: string;
  numbers: (number | null)[][][];
  status: TicketStatus;
  voidedAt: string | null;
  paidAt: string | null;
  paymentMethod: PaymentMethod | null;
  buyer: TicketBuyer | null;
  checkedInAt: string | null;
  createdAt: string;
}

export interface TicketExport {
  id: string;
  batchId: string;
  format: ExportFormat;
  ticketsPerPage: 1 | 2 | 4;
  status: JobStatus;
  renderedCount: number;
  totalCount: number;
  fileName: string;
  sizeBytes: number | null;
  failureReason: string | null;
  createdAt: string;
}

export interface AuditActor {
  id: string;
  name: string;
  email: string;
}

export interface AuditEntry {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown>;
  actor: AuditActor | null;
  createdAt: string;
}

export type CheckInOutcome = "admitted" | "already_checked_in" | "voided" | "unpaid" | "wrong_event" | "not_found";

export interface CheckInResult {
  outcome: CheckInOutcome;
  code: string;
  ticketId: string | null;
  checkedInAt: string | null;
  checkedInByName: string | null;
  ticketEventName: string | null;
}

export interface CheckInSummary {
  activeTicketCount: number;
  checkedInCount: number;
}

export type WinningPattern = "line" | "full_card";

export interface BingoDraw {
  id: string;
  eventId: string;
  round: number;
  pattern: WinningPattern;
  minimumNumber: number;
  maximumNumber: number;
  drawnNumbers: number[];
  status: "running" | "finished";
  createdAt: string;
  finishedAt: string | null;
}

export interface TicketDrawProgress {
  ticketId: string;
  code: string;
  checkedIn: boolean;
  missingCount: number;
}

export interface DrawProgress {
  consideredTicketCount: number;
  winners: TicketDrawProgress[];
  closest: TicketDrawProgress[];
  missingCountDistribution: Record<string, number>;
}

export interface RaffleWinner {
  id: string;
  position: number | null;
  ticketId: string;
  ticketCode: string;
  buyerName: string | null;
  buyerPhone: string | null;
  drawnAt: string;
  discardedAt: string | null;
}

export interface RaffleState {
  eligibleCount: number;
  winners: RaffleWinner[];
}

export interface DrawState {
  draw: BingoDraw | null;
  progress: DrawProgress | null;
}

export interface PublicDrawView {
  allowTicketTracking: boolean;
  event: { name: string; startsAt: string; location: string };
  draw: {
    round: number;
    pattern: WinningPattern;
    minimumNumber: number;
    maximumNumber: number;
    drawnNumbers: number[];
    status: "running" | "finished";
    winnerCount: number;
  } | null;
}

export type TrackedTicket =
  | { code: string; found: false }
  | {
      code: string;
      found: true;
      status: TicketStatus;
      checkedIn: boolean;
      paid: boolean;
      numbers: (number | null)[][][];
      missingCount: number | null;
      isWinner: boolean;
    };

export interface PaymentSummary {
  activeTicketCount: number;
  paidCount: number;
  pendingCount: number;
  paidCountByMethod: Record<PaymentMethod | "unknown", number>;
}

export interface PermissionGroup {
  id: string;
  name: string;
  description: string;
  scopes: Scope[];
  isDefault: boolean;
  memberCount: number;
  createdAt: string;
}

import { Banknote, CreditCard, ExternalLink, QrCode, UserRound, Wallet } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { changeTicketPayment, voidTicket } from "@/actions/ticket-actions";
import { ConfirmAction } from "@/components/confirm-action";
import { CopyableCode } from "@/components/copyable-code";
import { NumberGrid } from "@/components/number-grid";
import { StripeChargeDialog } from "@/components/tickets/stripe-charge-dialog";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PaymentMethod, Ticket } from "@/lib/api/types";
import { formatPhone, maskCpf } from "@/lib/buyer";
import {
  type EventPaymentSettings,
  formatDateTime,
  onlinePaymentMethodsOf,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_OPTIONS,
  TICKET_STATUS_LABELS,
} from "@/lib/format";

const ALL_PAYMENT_SETTINGS: EventPaymentSettings = {
  allowedPaymentMethods: ["pix", "cash", "card"],
  onlinePaymentsEnabled: true,
};

function allowedMethodsOf(settingsByEvent: Map<string, EventPaymentSettings>, eventId: string): PaymentMethod[] {
  return (settingsByEvent.get(eventId) ?? ALL_PAYMENT_SETTINGS).allowedPaymentMethods;
}

function requiresBuyerOf(settingsByEvent: Map<string, EventPaymentSettings>, eventId: string): boolean {
  return settingsByEvent.get(eventId)?.requireBuyerIdentification === true;
}

function onlineMethodsOf(settingsByEvent: Map<string, EventPaymentSettings>, eventId: string) {
  return onlinePaymentMethodsOf(settingsByEvent.get(eventId) ?? ALL_PAYMENT_SETTINGS);
}

const PAYMENT_METHOD_ICONS: Record<PaymentMethod, ReactNode> = {
  pix: <QrCode />,
  cash: <Banknote />,
  card: <CreditCard />,
};

interface TicketTableProps {
  tickets: Ticket[];
  eventNameById?: Map<string, string>;
  canVoidTickets: boolean;
  canChangePayment: boolean;
  paymentSettingsByEvent: Map<string, EventPaymentSettings>;
  returnPath: string;
}

export function TicketTable({
  tickets,
  eventNameById,
  canVoidTickets,
  canChangePayment,
  paymentSettingsByEvent,
  returnPath,
}: TicketTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Código</TableHead>
          <TableHead>Números</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Pagamento</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets.map((ticket) => (
          <TableRow key={ticket.id}>
            <TableCell>
              <CopyableCode value={ticket.code} />
              {eventNameById && (
                <div className="mt-1 text-xs font-medium">{eventNameById.get(ticket.eventId) ?? "Evento"}</div>
              )}
              <div className="text-xs text-muted-foreground">{formatDateTime(ticket.createdAt)}</div>
            </TableCell>
            <TableCell>
              <NumberGrid cards={ticket.numbers} />
            </TableCell>
            <TableCell>
              <StatusBadge tone={ticket.status === "active" ? "success" : "danger"}>
                {TICKET_STATUS_LABELS[ticket.status]}
              </StatusBadge>
              {ticket.voidedAt && (
                <div className="mt-1 text-xs text-muted-foreground">{formatDateTime(ticket.voidedAt)}</div>
              )}
              {ticket.checkedInAt && (
                <div className="mt-1.5 grid gap-0.5">
                  <StatusBadge tone="info">Entrou no evento</StatusBadge>
                  <span className="text-xs text-muted-foreground">{formatDateTime(ticket.checkedInAt)}</span>
                </div>
              )}
            </TableCell>
            <TableCell>
              <div className="grid justify-items-start gap-1.5">
                <StatusBadge tone={ticket.paidAt ? "success" : "warning"}>
                  {ticket.paidAt
                    ? `Pago${ticket.paymentMethod ? ` · ${PAYMENT_METHOD_LABELS[ticket.paymentMethod]}` : ""}`
                    : "Pendente"}
                </StatusBadge>
                {ticket.paidAt && (
                  <span className="text-xs text-muted-foreground">{formatDateTime(ticket.paidAt)}</span>
                )}
                {ticket.buyer && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <UserRound className="size-3.5" aria-hidden="true" />
                    {[
                      ticket.buyer.name,
                      ticket.buyer.phone && formatPhone(ticket.buyer.phone),
                      ticket.buyer.document && maskCpf(ticket.buyer.document),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                )}
                {canChangePayment &&
                  ticket.status === "active" &&
                  !ticket.paidAt &&
                  requiresBuyerOf(paymentSettingsByEvent, ticket.eventId) && (
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/payments/${ticket.eventId}`}>
                        <Wallet /> Receber no caixa
                      </Link>
                    </Button>
                  )}
                {canChangePayment &&
                  ticket.status === "active" &&
                  !ticket.paidAt &&
                  !requiresBuyerOf(paymentSettingsByEvent, ticket.eventId) && (
                    <form action={changeTicketPayment}>
                      <input type="hidden" name="ticketId" value={ticket.id} />
                      <input type="hidden" name="paid" value="true" />
                      <input type="hidden" name="returnPath" value={returnPath} />
                      <span className="mb-1 block text-xs text-muted-foreground">Confirmar pagamento em:</span>
                      <span className="flex flex-wrap gap-1">
                        {PAYMENT_METHOD_OPTIONS.filter((option) =>
                          allowedMethodsOf(paymentSettingsByEvent, ticket.eventId).includes(option.value),
                        ).map((option) => (
                          <Button
                            key={option.value}
                            type="submit"
                            name="method"
                            value={option.value}
                            size="sm"
                            variant="outline"
                          >
                            {PAYMENT_METHOD_ICONS[option.value]} {option.label}
                          </Button>
                        ))}
                      </span>
                    </form>
                  )}
                {canChangePayment &&
                  ticket.status === "active" &&
                  !ticket.paidAt &&
                  !requiresBuyerOf(paymentSettingsByEvent, ticket.eventId) &&
                  onlineMethodsOf(paymentSettingsByEvent, ticket.eventId).length > 0 && (
                    <StripeChargeDialog
                      ticketId={ticket.id}
                      ticketCode={ticket.code}
                      allowedMethods={onlineMethodsOf(paymentSettingsByEvent, ticket.eventId)}
                    />
                  )}
                {canChangePayment && ticket.status === "active" && ticket.paidAt && !ticket.checkedInAt && (
                  <ConfirmAction
                    triggerLabel="Desfazer pagamento"
                    confirmLabel="Desfazer"
                    question={`Marcar o ticket ${ticket.code} como não pago? Ele deixa de participar do sorteio e não poderá entrar no evento.`}
                    action={changeTicketPayment}
                    hiddenFields={{ ticketId: ticket.id, paid: "false", returnPath }}
                  />
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={`/api/tickets/${ticket.id}/image`} target="_blank" rel="noreferrer">
                    <ExternalLink /> Cartela
                  </a>
                </Button>
                {canVoidTickets && ticket.status === "active" && (
                  <ConfirmAction
                    triggerLabel="Cancelar ticket"
                    confirmLabel="Confirmar"
                    question={`Cancelar o ticket ${ticket.code}? Esta ação não pode ser desfeita.`}
                    action={voidTicket}
                    hiddenFields={{ ticketId: ticket.id, returnPath }}
                  />
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

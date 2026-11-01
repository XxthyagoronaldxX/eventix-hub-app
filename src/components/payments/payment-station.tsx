"use client";

import { toast } from "sonner";
import {
  Banknote,
  CircleCheck,
  CreditCard,
  Loader2,
  QrCode,
  ScanLine,
  Search,
  TicketX,
  UserRound,
  Wallet,
} from "lucide-react";
import { type FormEvent, type ReactNode, useCallback, useRef, useState, useTransition } from "react";
import {
  confirmManualPayment,
  findTicketForPayment,
  type PaymentConfirmation,
  refreshTicketPayment,
} from "@/actions/payment-actions";
import { QrScanner } from "@/components/check-in/qr-scanner";
import { NumberGrid } from "@/components/number-grid";
import { StripeChargeDialog } from "@/components/tickets/stripe-charge-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ManualPaymentDialog } from "@/components/payments/manual-payment-dialog";
import type { PaymentMethod, PaymentSummary, Ticket, TicketBuyer } from "@/lib/api/types";
import { formatPhone, maskCpf, type TicketBuyerInput, toBuyerPayload } from "@/lib/buyer";
import {
  type EventPaymentSettings,
  formatCurrencyFromCents,
  formatDateTime,
  onlinePaymentMethodsOf,
  PAYMENT_METHOD_LABELS,
} from "@/lib/format";
import { cn } from "@/lib/utils";

interface PaymentStationProps {
  eventId: string;
  ticketPriceCents: number;
  paymentSettings: EventPaymentSettings;
  initialSummary: PaymentSummary;
}

interface RecentPayment {
  code: string;
  method: PaymentMethod | null;
  paidAt: string | null;
}

const RECENT_PAYMENTS_LIMIT = 8;
const REPEATED_SCAN_WINDOW_MILLISECONDS = 3000;

const MANUAL_METHODS: { method: PaymentMethod; label: string; icon: ReactNode }[] = [
  { method: "cash", label: "Dinheiro", icon: <Banknote className="size-6" /> },
  { method: "pix", label: "Pix (maquininha / chave)", icon: <QrCode className="size-6" /> },
  { method: "card", label: "Cartão (maquininha)", icon: <CreditCard className="size-6" /> },
];

const METHOD_TONES: Record<PaymentMethod | "unknown", string> = {
  pix: "bg-teal-500",
  cash: "bg-emerald-500",
  card: "bg-indigo-500",
  unknown: "bg-muted-foreground",
};

export function PaymentStation({ eventId, ticketPriceCents, paymentSettings, initialSummary }: PaymentStationProps) {
  const manualMethods = MANUAL_METHODS.filter(({ method }) => paymentSettings.allowedPaymentMethods.includes(method));
  const onlineMethods = onlinePaymentMethodsOf(paymentSettings);
  const [summary, setSummary] = useState(initialSummary);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [justPaid, setJustPaid] = useState(false);
  const [manualMethod, setManualMethod] = useState<PaymentMethod | null>(null);
  const [code, setCode] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [isPending, startTransition] = useTransition();
  const lastScanRef = useRef<{ code: string; at: number } | null>(null);

  const lookUp = useCallback(
    (rawCode: string) => {
      setErrorMessage(null);
      setJustPaid(false);
      startTransition(async () => {
        const result = await findTicketForPayment(eventId, rawCode);
        if (!result.ok) {
          setTicket(null);
          setErrorMessage(result.message);
          toast.error(result.message);
          return;
        }
        setTicket(result.ticket);
        setCode("");
      });
    },
    [eventId],
  );

  const handleScannedCode = useCallback(
    (scannedCode: string) => {
      const now = Date.now();
      const lastScan = lastScanRef.current;
      if (lastScan && lastScan.code === scannedCode && now - lastScan.at < REPEATED_SCAN_WINDOW_MILLISECONDS) {
        return;
      }
      lastScanRef.current = { code: scannedCode, at: now };
      lookUp(scannedCode);
    },
    [lookUp],
  );

  function applyConfirmation(confirmation: PaymentConfirmation) {
    if (!confirmation.ok) {
      setErrorMessage(confirmation.message);
      toast.error(confirmation.message);
      return;
    }
    setTicket(confirmation.ticket);
    setSummary(confirmation.summary);
    if (confirmation.ticket.paidAt) {
      setJustPaid(true);
      toast.success(`Pagamento do ticket ${confirmation.ticket.code} confirmado.`);
      navigator.vibrate?.([80]);
      setRecentPayments((current) =>
        [
          {
            code: confirmation.ticket.code,
            method: confirmation.ticket.paymentMethod,
            paidAt: confirmation.ticket.paidAt,
          },
          ...current.filter((payment) => payment.code !== confirmation.ticket.code),
        ].slice(0, RECENT_PAYMENTS_LIMIT),
      );
    }
  }

  function payManually(method: PaymentMethod, buyer: TicketBuyerInput) {
    if (!ticket) return;
    startTransition(async () => {
      const confirmation = await confirmManualPayment(eventId, ticket.id, method, toBuyerPayload(buyer));
      if (!confirmation.ok) {
        toast.error(confirmation.message);
        return;
      }
      setManualMethod(null);
      applyConfirmation(confirmation);
    });
  }

  const handleStripePaid = useCallback(() => {
    if (!ticket) return;
    startTransition(async () => applyConfirmation(await refreshTicketPayment(eventId, ticket.id)));
  }, [eventId, ticket]);

  function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (code.trim()) lookUp(code);
  }

  const paidPercentage =
    summary.activeTicketCount === 0 ? 0 : Math.round((summary.paidCount / summary.activeTicketCount) * 100);
  const canBePaid = ticket?.status === "active" && !ticket.paidAt;

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      {ticket && manualMethod && (
        <ManualPaymentDialog
          open
          onOpenChange={(open) => !open && setManualMethod(null)}
          methodLabel={PAYMENT_METHOD_LABELS[manualMethod]}
          amountLabel={ticketPriceCents > 0 ? formatCurrencyFromCents(ticketPriceCents) : null}
          ticketCode={ticket.code}
          requireIdentification={paymentSettings.requireBuyerIdentification === true}
          isPending={isPending}
          onConfirm={(buyer) => payManually(manualMethod, buyer)}
        />
      )}
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Buscar ticket</CardTitle>
            <CardDescription>Digite o código impresso na cartela ou leia o QR Code.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <form onSubmit={submitCode} className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="EVX-7K4P-92QD"
                aria-label="Código do ticket"
                autoComplete="off"
                autoCapitalize="characters"
                className="h-10 font-mono text-base tracking-wider"
              />
              <Button type="submit" size="lg" disabled={isPending || !code.trim()}>
                {isPending ? <Loader2 className="animate-spin" /> : <Search />} Buscar
              </Button>
              <Button
                type="button"
                variant={showScanner ? "secondary" : "outline"}
                size="lg"
                className="h-10"
                onClick={() => setShowScanner((visible) => !visible)}
              >
                <ScanLine /> {showScanner ? "Fechar câmera" : "Ler QR Code"}
              </Button>
            </form>
            {showScanner && <QrScanner onCodeDetected={handleScannedCode} isPaused={isPending} />}
          </CardContent>
        </Card>

        {ticket ? (
          <Card
            key={ticket.id}
            className={cn("animate-in fade-in slide-in-from-bottom-2", justPaid && "ring-2 ring-success/60")}
          >
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-3">
                <code className="rounded-md bg-muted px-2 py-1 font-mono text-lg">{ticket.code}</code>
                <TicketPaymentBadge ticket={ticket} />
                {ticket.buyer && <BuyerSummary buyer={ticket.buyer} />}
              </CardTitle>
              <CardDescription>
                {ticketPriceCents > 0
                  ? `Valor: ${formatCurrencyFromCents(ticketPriceCents)}`
                  : "Valor do ticket não definido no evento."}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="flex justify-center rounded-lg bg-muted/40 p-3">
                <NumberGrid cards={ticket.numbers} />
              </div>

              {justPaid ? (
                <div className="flex animate-in flex-col items-center gap-2 py-4 text-center zoom-in-95">
                  <CircleCheck className="size-14 text-success" aria-hidden="true" />
                  <p className="text-lg font-semibold">Pagamento confirmado!</p>
                  <p className="text-sm text-muted-foreground">O ticket já participa do sorteio e pode entrar.</p>
                </div>
              ) : canBePaid ? (
                <div className="grid gap-4">
                  {onlineMethods.length > 0 && (
                    <div className="grid gap-2">
                      <p className="text-sm font-medium">Pagamento online pela Stripe</p>
                      <StripeChargeDialog
                        ticketId={ticket.id}
                        ticketCode={ticket.code}
                        triggerClassName="h-12 w-full text-base"
                        allowedMethods={onlineMethods}
                        requireBuyerIdentification={paymentSettings.requireBuyerIdentification === true}
                        onPaid={handleStripePaid}
                      />
                    </div>
                  )}
                  <div className="grid gap-2">
                    <p className="text-sm font-medium">Recebido no caixa</p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {manualMethods.map(({ method, label, icon }) => (
                        <Button
                          key={method}
                          variant="outline"
                          className="h-20 flex-col gap-1.5 whitespace-normal"
                          disabled={isPending}
                          onClick={() => {
                            setManualMethod(method);
                          }}
                        >
                          {isPending ? <Loader2 className="animate-spin" /> : icon}
                          <span className="text-xs">{label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  {ticket.status === "void"
                    ? "Ticket cancelado não pode ser pago."
                    : `Já pago${ticket.paidAt ? ` em ${formatDateTime(ticket.paidAt)}` : ""}.`}
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          !errorMessage && (
            <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed p-10 text-center text-muted-foreground">
              <Wallet className="size-10" aria-hidden="true" />
              <p className="text-sm">Busque um ticket para receber o pagamento.</p>
            </div>
          )
        )}
      </div>

      <div className="grid gap-4 lg:sticky lg:top-6">
        <Card>
          <CardHeader>
            <CardTitle>Caixa do evento</CardTitle>
            <CardDescription>
              {summary.paidCount} de {summary.activeTicketCount} tickets pagos
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-black tabular-nums">{paidPercentage}%</span>
                {ticketPriceCents > 0 && (
                  <span className="text-sm font-semibold text-success tabular-nums">
                    {formatCurrencyFromCents(summary.paidCount * ticketPriceCents)}
                  </span>
                )}
              </div>
              <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-muted">
                {(Object.keys(METHOD_TONES) as (PaymentMethod | "unknown")[]).map((method) => (
                  <div
                    key={method}
                    className={cn("h-full transition-[width] duration-700 ease-out", METHOD_TONES[method])}
                    style={{
                      width: `${summary.activeTicketCount === 0 ? 0 : (summary.paidCountByMethod[method] / summary.activeTicketCount) * 100}%`,
                    }}
                  />
                ))}
              </div>
            </div>
            <dl className="grid gap-2 text-sm">
              {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((method) => (
                <div key={method} className="flex items-center justify-between">
                  <dt className="flex items-center gap-2">
                    <span className={cn("size-2.5 rounded-full", METHOD_TONES[method])} />
                    {PAYMENT_METHOD_LABELS[method]}
                  </dt>
                  <dd className="font-semibold tabular-nums">{summary.paidCountByMethod[method]}</dd>
                </div>
              ))}
              {summary.paidCountByMethod.unknown > 0 && (
                <div className="flex items-center justify-between text-muted-foreground">
                  <dt className="flex items-center gap-2">
                    <span className={cn("size-2.5 rounded-full", METHOD_TONES.unknown)} /> Sem forma registrada
                  </dt>
                  <dd className="font-semibold tabular-nums">{summary.paidCountByMethod.unknown}</dd>
                </div>
              )}
              <div className="flex items-center justify-between border-t pt-2 text-muted-foreground">
                <dt>Pendentes</dt>
                <dd className="font-semibold tabular-nums">{summary.pendingCount}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimos pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {recentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Os pagamentos recebidos neste caixa aparecem aqui.</p>
            ) : (
              <ul className="grid gap-1.5">
                {recentPayments.map((payment) => (
                  <li
                    key={payment.code}
                    className="flex animate-in items-center justify-between rounded-md px-2 py-1 text-sm fade-in hover:bg-muted"
                  >
                    <span className="font-mono">{payment.code}</span>
                    <span className="text-xs text-muted-foreground">
                      {payment.method ? PAYMENT_METHOD_LABELS[payment.method] : "Pago"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BuyerSummary({ buyer }: { buyer: TicketBuyer }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-normal text-muted-foreground">
      <UserRound className="size-3.5" aria-hidden="true" />
      {[buyer.name, buyer.phone && formatPhone(buyer.phone), buyer.document && maskCpf(buyer.document)]
        .filter(Boolean)
        .join(" · ")}
    </span>
  );
}

function TicketPaymentBadge({ ticket }: { ticket: Ticket }) {
  const baseClassName = "flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold";
  if (ticket.status === "void") {
    return (
      <span className={cn(baseClassName, "bg-destructive/15 text-destructive")}>
        <TicketX className="size-3.5" /> Cancelado
      </span>
    );
  }
  if (ticket.paidAt) {
    return (
      <span className={cn(baseClassName, "bg-success/15 text-success")}>
        <CircleCheck className="size-3.5" /> Pago
        {ticket.paymentMethod ? ` · ${PAYMENT_METHOD_LABELS[ticket.paymentMethod]}` : ""}
      </span>
    );
  }
  return (
    <span className={cn(baseClassName, "bg-warning/15 text-amber-600 dark:text-warning")}>Pagamento pendente</span>
  );
}

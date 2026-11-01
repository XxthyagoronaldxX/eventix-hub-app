"use client";

import { toast } from "sonner";
import { CircleCheck, Copy, CreditCard, ExternalLink, Loader2, QrCode, TimerOff } from "lucide-react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { useEffect, useState, useTransition } from "react";
import { createStripeCheckout, type OnlinePaymentMethod, readStripeCheckoutStatus, type StripeCheckout } from "@/actions/stripe-actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BuyerFields } from "@/components/payments/buyer-fields";
import { EMPTY_BUYER, isBuyerIdentified, type TicketBuyerInput, toBuyerPayload } from "@/lib/buyer";
import { formatCurrencyFromCents } from "@/lib/format";

interface StripeChargeDialogProps {
  ticketId: string;
  ticketCode: string;
  triggerClassName?: string;
  allowedMethods?: OnlinePaymentMethod[];
  requireBuyerIdentification?: boolean;
  onPaid?: () => void;
}

type ChargeState =
  { step: "choose" } | { step: "waiting"; checkout: StripeCheckout; qrCodeDataUrl: string } | { step: "paid"; checkout: StripeCheckout } | { step: "expired" };

const STATUS_POLL_INTERVAL_MS = 3000;
const METHOD_LABELS: Record<OnlinePaymentMethod, string> = { pix: "Pix", card: "Cartão" };

export function StripeChargeDialog({
  ticketId,
  ticketCode,
  triggerClassName,
  allowedMethods = ["pix", "card"],
  requireBuyerIdentification = false,
  onPaid,
}: StripeChargeDialogProps) {
  const [buyer, setBuyer] = useState<TicketBuyerInput>(EMPTY_BUYER);
  const canCharge = !requireBuyerIdentification || isBuyerIdentified(buyer);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [chargeState, setChargeState] = useState<ChargeState>({ step: "choose" });
  const [isPending, startTransition] = useTransition();

  const waitingSessionId = chargeState.step === "waiting" ? chargeState.checkout.sessionId : null;

  useEffect(() => {
    if (!open || !waitingSessionId) return;
    const interval = setInterval(async () => {
      const result = await readStripeCheckoutStatus(ticketId, waitingSessionId);
      if (!result.ok) return;
      if (result.value.ticketPaid) {
        setChargeState((current) => (current.step === "waiting" ? { step: "paid", checkout: current.checkout } : current));
        toast.success(`Pagamento do ticket ${ticketCode} confirmado.`, { id: `stripe-paid-${ticketId}` });
        router.refresh();
        onPaid?.();
      } else if (result.value.status === "expired") {
        setChargeState({ step: "expired" });
      }
    }, STATUS_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [open, waitingSessionId, ticketId, ticketCode, router, onPaid]);

  function startCharge(method: OnlinePaymentMethod) {
    startTransition(async () => {
      const result = await createStripeCheckout(ticketId, method, toBuyerPayload(buyer));
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      const qrCodeDataUrl = await QRCode.toDataURL(result.value.url, { width: 440, margin: 1 });
      setChargeState({ step: "waiting", checkout: result.value, qrCodeDataUrl });
    });
  }

  function changeOpen(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen && chargeState.step !== "waiting") {
      setChargeState({ step: "choose" });
      setBuyer(EMPTY_BUYER);
    }
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="secondary" className={triggerClassName}>
          <svg viewBox="0 0 24 24" className="size-3.5" aria-hidden="true">
            <path
              fill="currentColor"
              d="M13.5 9.2c0-.8.7-1.1 1.7-1.1 1.5 0 3.4.5 4.9 1.3V4.8a13 13 0 0 0-4.9-.9c-4 0-6.7 2.1-6.7 5.6 0 5.5 7.5 4.6 7.5 7 0 .9-.8 1.2-1.9 1.2-1.6 0-3.7-.7-5.4-1.6v4.7c1.8.8 3.7 1.1 5.4 1.1 4.1 0 6.9-2 6.9-5.6 0-5.9-7.5-4.8-7.5-7.1Z"
            />
          </svg>
          Cobrar com Stripe
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cobrar ticket {ticketCode}</DialogTitle>
          <DialogDescription>A pessoa paga no celular pelo QR Code. O ticket é marcado como pago automaticamente.</DialogDescription>
        </DialogHeader>

        {chargeState.step === "choose" && (
          <BuyerFields idPrefix={`stripe-buyer-${ticketId}`} value={buyer} onChange={setBuyer} required={requireBuyerIdentification} />
        )}

        {chargeState.step === "choose" && (
          <div className="grid grid-cols-2 gap-3">
            {allowedMethods.map((method) => (
              <Button key={method} variant="outline" className="h-20 flex-col gap-1.5" disabled={isPending || !canCharge} onClick={() => startCharge(method)}>
                {isPending ? <Loader2 className="animate-spin" /> : method === "pix" ? <QrCode className="size-6" /> : <CreditCard className="size-6" />}
                {METHOD_LABELS[method]}
              </Button>
            ))}
          </div>
        )}

        {chargeState.step === "waiting" && (
          <div className="grid justify-items-center gap-3 text-center">
            <p className="text-2xl font-semibold tabular-nums">
              {formatCurrencyFromCents(chargeState.checkout.amountCents)}
              <span className="ml-2 text-sm font-normal text-muted-foreground">via {METHOD_LABELS[chargeState.checkout.method]}</span>
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={chargeState.qrCodeDataUrl} alt="QR Code da cobrança" className="size-56 rounded-xl bg-white p-2" />
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Aguardando o pagamento…
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void navigator.clipboard.writeText(chargeState.checkout.url).then(() => toast.success("Link de pagamento copiado."))}
              >
                <Copy /> Copiar link
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={chargeState.checkout.url} target="_blank" rel="noreferrer">
                  <ExternalLink /> Abrir
                </a>
              </Button>
            </div>
          </div>
        )}

        {chargeState.step === "paid" && (
          <div className="grid animate-in justify-items-center gap-2 py-6 text-center zoom-in-95">
            <CircleCheck className="size-14 text-success" />
            <p className="text-lg font-semibold">Pagamento confirmado!</p>
            <p className="text-sm text-muted-foreground">
              {formatCurrencyFromCents(chargeState.checkout.amountCents)} via {METHOD_LABELS[chargeState.checkout.method]}. O ticket já pode entrar no evento.
            </p>
          </div>
        )}

        {chargeState.step === "expired" && (
          <div className="grid justify-items-center gap-3 py-4 text-center">
            <TimerOff className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">A cobrança expirou sem pagamento.</p>
            <Button onClick={() => setChargeState({ step: "choose" })}>Gerar nova cobrança</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

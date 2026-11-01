"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { BuyerFields } from "@/components/payments/buyer-fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EMPTY_BUYER, isBuyerIdentified, type TicketBuyerInput } from "@/lib/buyer";

interface ManualPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  methodLabel: string;
  amountLabel: string | null;
  ticketCode: string;
  requireIdentification: boolean;
  isPending: boolean;
  onConfirm: (buyer: TicketBuyerInput) => void;
}

export function ManualPaymentDialog({
  open,
  onOpenChange,
  methodLabel,
  amountLabel,
  ticketCode,
  requireIdentification,
  isPending,
  onConfirm,
}: ManualPaymentDialogProps) {
  const [buyer, setBuyer] = useState<TicketBuyerInput>(EMPTY_BUYER);
  const canConfirm = !requireIdentification || isBuyerIdentified(buyer);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isPending) return;
        if (!nextOpen) setBuyer(EMPTY_BUYER);
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Receber em {methodLabel}</DialogTitle>
          <DialogDescription>
            Ticket {ticketCode}
            {amountLabel ? ` · ${amountLabel}` : ""}. Os dados ficam vinculados ao ticket.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (canConfirm) onConfirm(buyer);
          }}
        >
          <BuyerFields idPrefix="manual-buyer" value={buyer} onChange={setBuyer} required={requireIdentification} />
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending || !canConfirm}>
              {isPending && <Loader2 className="animate-spin" />} Confirmar pagamento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

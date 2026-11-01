"use client";

import { toast } from "sonner";
import { Check, Copy, ExternalLink, Loader2, Share2, Ticket } from "lucide-react";
import QRCode from "qrcode";
import { useState, useTransition } from "react";
import { shareDrawLink } from "@/actions/draw-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface SharedLink {
  url: string;
  qrCodeDataUrl: string;
  allowTicketTracking: boolean;
}

export function ShareDrawDialog({ eventId }: { eventId: string }) {
  const [sharedLink, setSharedLink] = useState<SharedLink | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function loadLink(allowTicketTracking?: boolean) {
    startTransition(async () => {
      const result = await shareDrawLink(eventId, allowTicketTracking);
      if (!result.ok) {
        setErrorMessage(result.message);
        toast.error(result.message);
        return;
      }
      setErrorMessage(null);
      const url = `${window.location.origin}/sorteio/${result.token}`;
      const qrCodeDataUrl = await QRCode.toDataURL(url, { width: 440, margin: 1 });
      setSharedLink({ url, qrCodeDataUrl, allowTicketTracking: result.allowTicketTracking });
    });
  }

  async function copyLink() {
    if (!sharedLink) return;
    await navigator.clipboard.writeText(sharedLink.url);
    setCopied(true);
    toast.success("Link do sorteio copiado.");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog onOpenChange={(open) => open && !sharedLink && loadLink()}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Share2 /> Compartilhar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhar o sorteio</DialogTitle>
          <DialogDescription>Quem estiver no evento acompanha os números sorteados ao vivo.</DialogDescription>
        </DialogHeader>
        {!sharedLink ? (
          !errorMessage && (
            <div className="flex justify-center py-16">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )
        ) : (
          <div className="grid gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sharedLink.qrCodeDataUrl}
              alt="QR Code do link do sorteio"
              className="mx-auto size-56 rounded-xl bg-white p-2"
            />
            <div className="flex gap-2">
              <Input
                readOnly
                value={sharedLink.url}
                aria-label="Link do sorteio"
                onFocus={(event) => event.target.select()}
              />
              <Button type="button" variant="outline" onClick={copyLink} aria-label="Copiar link">
                {copied ? <Check className="text-success" /> : <Copy />}
              </Button>
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3">
              <Ticket className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="flex-1 space-y-0.5">
                <span className="block text-sm font-medium">Participantes podem acompanhar os tickets</span>
                <span className="block text-xs text-muted-foreground">
                  {sharedLink.allowTicketTracking
                    ? "Cada pessoa informa o código das cartelas e vê quanto falta para bater."
                    : "A página mostra somente os números sorteados."}
                </span>
              </span>
              {isPending ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              ) : (
                <Switch
                  checked={sharedLink.allowTicketTracking}
                  onCheckedChange={(checked) => loadLink(checked)}
                  aria-label="Permitir acompanhar tickets"
                />
              )}
            </label>
            <Button asChild variant="secondary">
              <a href={sharedLink.url} target="_blank" rel="noreferrer">
                <ExternalLink /> Abrir página do participante
              </a>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

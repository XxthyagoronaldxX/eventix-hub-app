import { Dices, Grid3x3, type LucideIcon, Ticket, Trophy } from "lucide-react";
import type { EventKind, TemplateKind } from "@/lib/api/types";

export interface EventKindDetails {
  label: string;
  description: string;
  icon: LucideIcon;
  tone: string;
  drawDescription: string | null;
}

export const EVENT_KIND_DETAILS: Record<EventKind, EventKindDetails> = {
  bingo: {
    label: "Bingo",
    description: "Cartelas com números e sorteio de números ao vivo.",
    icon: Dices,
    tone: "from-indigo-500 to-fuchsia-600",
    drawDescription: "Sorteie os números e acompanhe quem está perto de bater.",
  },
  raffle: {
    label: "Rifa",
    description: "Tickets com código e sorteio de um ticket vencedor.",
    icon: Trophy,
    tone: "from-amber-500 to-rose-600",
    drawDescription: "Sorteie um ticket pago e registre os ganhadores.",
  },
  tickets: {
    label: "Ingressos",
    description: "Venda de tickets com código para entrada, sem sorteio.",
    icon: Ticket,
    tone: "from-sky-500 to-emerald-600",
    drawDescription: null,
  },
};

export const EVENT_KINDS = Object.keys(EVENT_KIND_DETAILS) as EventKind[];

export function eventHasDraw(event: { kind: EventKind }): boolean {
  return EVENT_KIND_DETAILS[event.kind].drawDescription !== null;
}

export const TEMPLATE_KIND_DETAILS: Record<TemplateKind, { label: string; description: string; icon: LucideIcon }> = {
  bingo: {
    label: "Cartela de bingo",
    description: "Matrizes de números, para eventos de bingo.",
    icon: Grid3x3,
  },
  ticket: {
    label: "Ticket",
    description: "Só código e QR Code, para rifas e ingressos.",
    icon: Ticket,
  },
};

export const TEMPLATE_KINDS = Object.keys(TEMPLATE_KIND_DETAILS) as TemplateKind[];

export function templateKindForEvent(event: { kind: EventKind }): TemplateKind {
  return event.kind === "bingo" ? "bingo" : "ticket";
}

export function eventHasNumberedTickets(event: { kind: EventKind }): boolean {
  return event.kind === "bingo";
}

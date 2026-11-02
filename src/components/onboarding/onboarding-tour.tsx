"use client";

import { ArrowLeft, ArrowRight, CircleHelp, Plus } from "lucide-react";
import Link from "next/link";
import { type ComponentType, useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  CheckInIllustration,
  DoneIllustration,
  DrawIllustration,
  EventIllustration,
  SaleIllustration,
  TicketsIllustration,
  WelcomeIllustration,
} from "./onboarding-illustrations";

const OPEN_TOUR_EVENT = "eventixhub:open-onboarding-tour";
const SEEN_STORAGE_KEY_PREFIX = "eventixhub:onboarding-seen:";

interface TourSlide {
  eyebrow: string;
  title: string;
  description: string;
  steps: string[];
  illustration: ComponentType;
}

const TOUR_SLIDES: TourSlide[] = [
  {
    eyebrow: "Boas-vindas",
    title: "Seu evento do começo ao fim",
    description:
      "O EventixHub cuida de tudo: cria o evento, gera os tickets, recebe os pagamentos, libera a entrada e conduz o sorteio.",
    steps: [
      "Leva menos de 2 minutos para conhecer o caminho.",
      "Use as setas do teclado para avançar e voltar.",
      "Reveja este tutorial quando quiser no botão Ajuda, no menu.",
    ],
    illustration: WelcomeIllustration,
  },
  {
    eyebrow: "Passo 1",
    title: "Crie o evento",
    description: "Em Eventos, clique em Novo evento e escolha o tipo que combina com a sua festa.",
    steps: [
      "Bingo: cartelas com números e sorteio ao vivo.",
      "Rifa: tickets com código e sorteio de um ganhador.",
      "Ingressos: venda com código para a entrada, sem sorteio.",
      "Defina data, local, valor do ticket e formas de pagamento.",
    ],
    illustration: EventIllustration,
  },
  {
    eyebrow: "Passo 2",
    title: "Gere os tickets",
    description: "Monte a arte uma vez e gere quantos tickets precisar, cada um com código único e QR Code.",
    steps: [
      "Em Templates, envie a imagem e posicione números, código e QR Code.",
      "Abra o evento, vá em Tickets e clique em Gerar lote.",
      "Exporte em PDF para imprimir ou em PNG para enviar.",
    ],
    illustration: TicketsIllustration,
  },
  {
    eyebrow: "Passo 3",
    title: "Venda no caixa",
    description: "No Caixa do evento, busque o ticket pelo código e registre o pagamento.",
    steps: [
      "Receba em Pix, dinheiro ou cartão.",
      "Com a Stripe ativa, mostre um QR Code para a pessoa pagar no celular.",
      "Só tickets pagos entram no evento e concorrem no sorteio.",
    ],
    illustration: SaleIllustration,
  },
  {
    eyebrow: "Passo 4",
    title: "Faça o check-in",
    description: "No dia, abra o Check-in do evento e libere a entrada em segundos.",
    steps: [
      "Leia o QR Code com a câmera ou digite o código.",
      "Tickets não pagos ou cancelados são barrados.",
      "Acompanhe quantas pessoas já entraram.",
    ],
    illustration: CheckInIllustration,
  },
  {
    eyebrow: "Passo 5",
    title: "Conduza o bingo",
    description: "Em Sorteio, inicie a rodada e deixe o sistema conferir as cartelas por você.",
    steps: [
      "Escolha Linha ou Cartela cheia e clique em Iniciar rodada.",
      "Sorteie os números ou marque o número cantado.",
      "Os ganhadores aparecem na hora. Use a tela cheia e compartilhe o link público.",
    ],
    illustration: DrawIllustration,
  },
  {
    eyebrow: "Pronto",
    title: "Hora de criar o seu primeiro evento",
    description: "Comece pelo evento. O restante segue o mesmo caminho que você acabou de ver.",
    steps: ["Precisa rever algum passo? Clique em Ajuda, no menu lateral, a qualquer momento."],
    illustration: DoneIllustration,
  },
];

export function openOnboardingTour() {
  window.dispatchEvent(new Event(OPEN_TOUR_EVENT));
}

function subscribeToStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function readHasSeenTour(storageKey: string): boolean {
  try {
    return window.localStorage.getItem(storageKey) !== null;
  } catch {
    return true;
  }
}

function rememberTourSeen(storageKey: string) {
  try {
    window.localStorage.setItem(storageKey, new Date().toISOString());
  } catch {
    // Storage may be blocked; the tour simply opens again next time.
  }
}

interface OnboardingTourProps {
  userId: string;
  canCreateEvents: boolean;
}

export function OnboardingTour({ userId, canCreateEvents }: OnboardingTourProps) {
  const storageKey = `${SEEN_STORAGE_KEY_PREFIX}${userId}`;
  const hasSeenTour = useSyncExternalStore(
    subscribeToStorage,
    () => readHasSeenTour(storageKey),
    () => true,
  );
  const [isOpenedByHelp, setIsOpenedByHelp] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const open = isOpenedByHelp || !hasSeenTour;
  const slide = TOUR_SLIDES[slideIndex];
  const isFirstSlide = slideIndex === 0;
  const isLastSlide = slideIndex === TOUR_SLIDES.length - 1;

  useEffect(() => {
    function openFromStart() {
      setSlideIndex(0);
      setIsOpenedByHelp(true);
    }
    window.addEventListener(OPEN_TOUR_EVENT, openFromStart);
    return () => window.removeEventListener(OPEN_TOUR_EVENT, openFromStart);
  }, []);

  function changeOpen(nextOpen: boolean) {
    if (!nextOpen) rememberTourSeen(storageKey);
    setIsOpenedByHelp(nextOpen);
  }

  function goTo(index: number) {
    setSlideIndex(Math.min(TOUR_SLIDES.length - 1, Math.max(0, index)));
  }

  useEffect(() => {
    if (!open) return;
    function navigateWithArrows(event: KeyboardEvent) {
      if (event.key === "ArrowRight") setSlideIndex((index) => Math.min(TOUR_SLIDES.length - 1, index + 1));
      if (event.key === "ArrowLeft") setSlideIndex((index) => Math.max(0, index - 1));
    }
    window.addEventListener("keydown", navigateWithArrows);
    return () => window.removeEventListener("keydown", navigateWithArrows);
  }, [open]);

  const Illustration = slide.illustration;

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-4xl"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <div className="grid md:min-h-[26rem] md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div key={`illustration-${slideIndex}`} className="animate-in p-3 fade-in md:p-4 md:pr-0">
            <Illustration />
          </div>
          <div className="flex flex-col gap-5 p-6">
            <div key={`text-${slideIndex}`} className="grid animate-in gap-3 fade-in slide-in-from-right-2">
              <p className="text-xs font-semibold tracking-wider text-primary uppercase">
                {slide.eyebrow} · {slideIndex + 1} de {TOUR_SLIDES.length}
              </p>
              <DialogTitle className="text-2xl font-semibold tracking-tight">{slide.title}</DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">{slide.description}</DialogDescription>
              <ul className="grid gap-2 pt-1">
                {slide.steps.map((step) => (
                  <li key={step} className="flex gap-2.5 text-sm">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                    {step}
                  </li>
                ))}
              </ul>
              {isLastSlide && canCreateEvents && (
                <Button asChild size="lg" className="mt-2 w-full">
                  <Link href="/events?new=1" onClick={() => changeOpen(false)}>
                    <Plus /> Criar meu primeiro evento
                  </Link>
                </Button>
              )}
            </div>

            <div className="mt-auto flex items-center gap-3 border-t pt-4">
              <div className="flex gap-1.5" role="tablist" aria-label="Passos do tutorial">
                {TOUR_SLIDES.map((tourSlide, index) => (
                  <button
                    key={tourSlide.title}
                    type="button"
                    role="tab"
                    aria-selected={index === slideIndex}
                    aria-label={`Ir para ${tourSlide.title}`}
                    onClick={() => goTo(index)}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      index === slideIndex
                        ? "w-6 bg-primary"
                        : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60",
                    )}
                  />
                ))}
              </div>
              <div className="ml-auto flex items-center gap-2">
                {isFirstSlide ? (
                  <Button variant="ghost" onClick={() => changeOpen(false)}>
                    Pular
                  </Button>
                ) : (
                  <Button variant="outline" size="icon" onClick={() => goTo(slideIndex - 1)} aria-label="Voltar">
                    <ArrowLeft />
                  </Button>
                )}
                {isLastSlide ? (
                  <Button onClick={() => changeOpen(false)}>Concluir</Button>
                ) : (
                  <Button onClick={() => goTo(slideIndex + 1)}>
                    {isFirstSlide ? "Começar" : "Próximo"} <ArrowRight />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function HelpButton() {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.currentTarget.closest("details")?.removeAttribute("open");
        openOnboardingTour();
      }}
      title="Ajuda: rever o tutorial"
      className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:group-data-[sidebar-collapsed=true]/shell:justify-center lg:group-data-[sidebar-collapsed=true]/shell:px-0"
    >
      <CircleHelp className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="truncate lg:group-data-[sidebar-collapsed=true]/shell:sr-only">Ajuda · tutorial</span>
    </button>
  );
}

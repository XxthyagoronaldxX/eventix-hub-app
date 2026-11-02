import {
  Banknote,
  CalendarPlus,
  Check,
  CreditCard,
  Dices,
  DoorOpen,
  LayoutTemplate,
  PartyPopper,
  QrCode,
  ScanLine,
  Sparkles,
  Ticket,
  Trophy,
  Wallet,
} from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

function Stage({ tone, children }: { tone: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "@container relative flex h-full min-h-56 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br p-4 text-white @md:p-6",
        tone,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgb(255_255_255/0.25),transparent_45%),radial-gradient(circle_at_10%_90%,rgb(255_255_255/0.15),transparent_50%)]"
      />
      <div className="relative">{children}</div>
    </div>
  );
}

function Glass({ className, style, children }: { className?: string; style?: CSSProperties; children: ReactNode }) {
  return (
    <div className={cn("rounded-xl bg-white/15 shadow-lg ring-1 ring-white/25 backdrop-blur", className)} style={style}>
      {children}
    </div>
  );
}

const JOURNEY_STEPS = [
  { icon: CalendarPlus, label: "Evento" },
  { icon: Ticket, label: "Tickets" },
  { icon: Wallet, label: "Venda" },
  { icon: ScanLine, label: "Check-in" },
  { icon: Dices, label: "Sorteio" },
];

export function WelcomeIllustration() {
  return (
    <Stage tone="from-indigo-600 via-violet-600 to-fuchsia-600">
      <div className="flex items-center gap-1">
        {JOURNEY_STEPS.map(({ icon: Icon, label }, index) => (
          <div key={label} className="flex items-center gap-1">
            <div
              className="flex w-12 animate-in flex-col items-center gap-2 fade-in slide-in-from-bottom-3 fill-mode-both @lg:w-16"
              style={{ animationDelay: `${index * 120}ms` }}
            >
              <Glass className="flex size-10 items-center justify-center @lg:size-14">
                <Icon className="size-5 @lg:size-6" aria-hidden="true" />
              </Glass>
              <span className="text-[10px] font-medium text-white/90 @lg:text-xs">{label}</span>
            </div>
            {index < JOURNEY_STEPS.length - 1 && <span className="mb-6 h-px w-2 bg-white/50 @lg:w-4" />}
          </div>
        ))}
      </div>
    </Stage>
  );
}

const EVENT_KIND_CHIPS = [
  { icon: Dices, label: "Bingo" },
  { icon: Trophy, label: "Rifa" },
  { icon: Ticket, label: "Ingressos" },
];

export function EventIllustration() {
  return (
    <Stage tone="from-sky-500 via-indigo-500 to-violet-600">
      <Glass className="w-72 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <CalendarPlus className="size-4" aria-hidden="true" /> Novo evento
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {EVENT_KIND_CHIPS.map(({ icon: Icon, label }, index) => (
            <span
              key={label}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] font-medium",
                index === 0 ? "bg-white text-indigo-700 shadow" : "bg-white/10",
              )}
            >
              <Icon className="size-4" aria-hidden="true" /> {label}
            </span>
          ))}
        </div>
        <div className="mt-3 grid gap-1.5">
          <span className="h-7 rounded-md bg-white/20 px-2 text-[11px] leading-7">Bingo de Natal</span>
          <span className="grid grid-cols-2 gap-1.5">
            <span className="h-7 rounded-md bg-white/20 px-2 text-[11px] leading-7">24/12 · 19:00</span>
            <span className="h-7 rounded-md bg-white/20 px-2 text-[11px] leading-7">R$ 10,00</span>
          </span>
        </div>
      </Glass>
    </Stage>
  );
}

export function TicketsIllustration() {
  return (
    <Stage tone="from-amber-500 via-orange-500 to-rose-500">
      <div className="relative h-44 w-64">
        {[2, 1, 0].map((layer) => (
          <Glass
            key={layer}
            className="absolute inset-x-0 top-0 flex h-36 flex-col justify-between bg-white/20 p-3"
            style={{ transform: `translate(${layer * 14}px, ${layer * 12}px) rotate(${layer * -3}deg)` }}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold">
                <LayoutTemplate className="size-3.5" aria-hidden="true" /> Cartela
              </span>
              <QrCode className="size-7" aria-hidden="true" />
            </div>
            <div className="grid grid-cols-5 gap-1">
              {Array.from({ length: 10 }, (_, cell) => (
                <span key={cell} className="h-3.5 rounded-sm bg-white/35" />
              ))}
            </div>
            <span className="font-mono text-[11px] tracking-wider">EVX-7K2P-QH9M</span>
          </Glass>
        ))}
      </div>
    </Stage>
  );
}

const PAYMENT_CHIPS = [
  { icon: QrCode, label: "Pix" },
  { icon: Banknote, label: "Dinheiro" },
  { icon: CreditCard, label: "Cartão" },
];

export function SaleIllustration() {
  return (
    <Stage tone="from-emerald-500 via-teal-500 to-cyan-600">
      <Glass className="w-72 p-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm font-semibold">EVX-7K2P-QH9M</span>
          <span className="flex animate-in items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-emerald-700 zoom-in-75 fill-mode-both [animation-delay:400ms]">
            <Check className="size-3" aria-hidden="true" /> Pago
          </span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {PAYMENT_CHIPS.map(({ icon: Icon, label }, index) => (
            <span
              key={label}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg py-2 text-[11px] font-medium",
                index === 0 ? "bg-white text-emerald-700 shadow" : "bg-white/10",
              )}
            >
              <Icon className="size-4" aria-hidden="true" /> {label}
            </span>
          ))}
        </div>
        <p className="mt-3 text-center text-2xl font-bold tabular-nums">R$ 10,00</p>
      </Glass>
    </Stage>
  );
}

export function CheckInIllustration() {
  return (
    <Stage tone="from-blue-600 via-sky-500 to-cyan-500">
      <div className="flex items-center gap-6">
        <div className="relative flex size-36 items-center justify-center">
          {[
            "top-0 left-0 border-t-4 border-l-4",
            "top-0 right-0 border-t-4 border-r-4",
            "bottom-0 left-0 border-b-4 border-l-4",
            "right-0 bottom-0 border-r-4 border-b-4",
          ].map((corner) => (
            <span key={corner} className={cn("absolute size-8 rounded-sm border-white", corner)} />
          ))}
          <QrCode className="size-20 opacity-90" aria-hidden="true" />
          <span className="absolute inset-x-4 top-1/2 h-0.5 animate-pulse bg-white shadow-[0_0_12px_2px_rgb(255_255_255/0.8)]" />
        </div>
        <Glass className="flex animate-in flex-col items-center gap-1 px-4 py-3 fade-in slide-in-from-left-4 fill-mode-both [animation-delay:300ms]">
          <DoorOpen className="size-6" aria-hidden="true" />
          <span className="text-sm font-semibold">Entrada liberada</span>
          <span className="text-[11px] text-white/80">Ticket pago</span>
        </Glass>
      </div>
    </Stage>
  );
}

const DRAWN_NUMBERS = [7, 23, 41, 58, 66];

export function DrawIllustration() {
  return (
    <Stage tone="from-indigo-600 via-purple-600 to-fuchsia-600">
      <div className="flex items-center gap-6">
        <div className="flex size-32 animate-ball-reveal items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_25%,#fff_0%,#c7d2fe_18%,#6366f1_55%,#4c1d95_100%)] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]">
          <span className="flex size-20 flex-col items-center justify-center rounded-full bg-white text-indigo-950 shadow-inner">
            <span className="text-[11px] font-bold tracking-widest text-indigo-500">N</span>
            <span className="text-3xl font-black tabular-nums">41</span>
          </span>
        </div>
        <div className="grid gap-3">
          <div className="flex gap-1.5">
            {DRAWN_NUMBERS.map((value, index) => (
              <span
                key={value}
                className="flex size-8 animate-in items-center justify-center rounded-full bg-white/20 text-xs font-semibold tabular-nums zoom-in-50 fill-mode-both"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {value}
              </span>
            ))}
          </div>
          <Glass className="flex items-center gap-2 px-3 py-2 text-sm font-semibold">
            <Trophy className="size-4" aria-hidden="true" /> Bingo! EVX-7K2P-QH9M
          </Glass>
        </div>
      </div>
    </Stage>
  );
}

export function DoneIllustration() {
  return (
    <Stage tone="from-fuchsia-600 via-rose-500 to-amber-500">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-20 animate-ball-reveal items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30">
          <PartyPopper className="size-10" aria-hidden="true" />
        </span>
        <span className="flex items-center gap-1.5 text-lg font-semibold">
          <Sparkles className="size-5" aria-hidden="true" /> Tudo pronto para o seu evento
        </span>
      </div>
    </Stage>
  );
}

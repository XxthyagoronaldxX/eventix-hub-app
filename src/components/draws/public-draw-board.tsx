"use client";

import { toast } from "sonner";
import { CalendarDays, MapPin, Plus, Ticket as TicketIcon, Trophy, X } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { loadPublicDrawSnapshot } from "@/actions/public-draw-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { PublicDrawView, TrackedTicket } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface PublicDrawBoardProps {
  token: string;
  initialView: PublicDrawView;
}

const REFRESH_INTERVAL_MS = 4000;
const MAXIMUM_TRACKED_TICKETS = 20;
const BINGO_LETTERS = ["B", "I", "N", "G", "O"];
const PATTERN_LABELS = { line: "Linha", full_card: "Cartela cheia" } as const;

function storageKeyOf(token: string): string {
  return `evx_tracked_tickets_${token}`;
}

function readStoredCodes(token: string): string[] {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKeyOf(token)) ?? "[]");
    return Array.isArray(stored) ? stored.filter((code): code is string => typeof code === "string") : [];
  } catch {
    return [];
  }
}

function storeCodes(token: string, codes: string[]) {
  try {
    localStorage.setItem(storageKeyOf(token), JSON.stringify(codes));
  } catch {
    // Persisting is a convenience; tracking still works for this visit.
  }
}

function splitCodes(input: string): string[] {
  return input
    .split(/[\s,;]+/)
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean);
}

function bingoLetterOf(value: number, maximumNumber: number): string | null {
  if (maximumNumber !== 75 || value < 1) return null;
  return BINGO_LETTERS[Math.min(4, Math.floor((value - 1) / 15))];
}

export function PublicDrawBoard({ token, initialView }: PublicDrawBoardProps) {
  const [view, setView] = useState(initialView);
  const [codes, setCodes] = useState<string[]>([]);
  const [tickets, setTickets] = useState<TrackedTicket[]>([]);
  const [codeInput, setCodeInput] = useState("");
  const codesRef = useRef<string[]>([]);

  const refresh = useCallback(async () => {
    const snapshot = await loadPublicDrawSnapshot(token, codesRef.current);
    if (!snapshot.ok) {
      toast.error(snapshot.message, { id: "public-draw-error" });
      return;
    }
    toast.dismiss("public-draw-error");
    setView(snapshot.view);
    setTickets(snapshot.tickets);
  }, [token]);

  useEffect(() => {
    const restoreTimeout = setTimeout(() => {
      const storedCodes = readStoredCodes(token);
      codesRef.current = storedCodes;
      setCodes(storedCodes);
      void refresh();
    }, 0);
    const interval = setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
    return () => {
      clearTimeout(restoreTimeout);
      clearInterval(interval);
    };
  }, [token, refresh]);

  function updateCodes(nextCodes: string[]) {
    codesRef.current = nextCodes;
    setCodes(nextCodes);
    storeCodes(token, nextCodes);
    if (nextCodes.length === 0) setTickets([]);
    void refresh();
  }

  function addCodes(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const newCodes = splitCodes(codeInput).filter((code) => !codes.includes(code));
    if (newCodes.length === 0) return;
    const nextCodes = [...codes, ...newCodes].slice(0, MAXIMUM_TRACKED_TICKETS);
    if (codes.length + newCodes.length > MAXIMUM_TRACKED_TICKETS) {
      toast.warning(`Você pode acompanhar até ${MAXIMUM_TRACKED_TICKETS} tickets.`);
    }
    setCodeInput("");
    updateCodes(nextCodes);
  }

  const draw = view.draw;
  const drawnNumbers = draw?.drawnNumbers ?? [];
  const drawnSet = new Set(drawnNumbers);
  const lastNumber = drawnNumbers.at(-1) ?? null;
  const ticketByCode = new Map(tickets.map((ticket) => [ticket.code, ticket]));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{view.event.name}</h1>
        <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-4" aria-hidden="true" /> {formatDateTime(view.event.startsAt)}
          </span>
          {view.event.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4" aria-hidden="true" /> {view.event.location}
            </span>
          )}
        </p>
      </div>

      {!draw ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            O sorteio ainda não começou. Esta página atualiza sozinha.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-5 sm:flex-row sm:gap-8">
            <div
              key={lastNumber ?? "empty"}
              className="flex size-36 shrink-0 animate-ball-reveal items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_25%,#fff_0%,#c7d2fe_18%,#6366f1_55%,#4c1d95_100%)] shadow-[0_20px_50px_-12px_rgba(79,70,229,0.6)]"
            >
              <span className="flex size-24 flex-col items-center justify-center rounded-full bg-white text-indigo-950">
                {lastNumber !== null && bingoLetterOf(lastNumber, draw.maximumNumber) && (
                  <span className="text-xs font-bold tracking-widest text-indigo-500">
                    {bingoLetterOf(lastNumber, draw.maximumNumber)}
                  </span>
                )}
                <span className="text-4xl font-black tabular-nums">{lastNumber ?? "?"}</span>
              </span>
            </div>
            <div className="w-full space-y-3 text-center sm:text-left">
              <p className="text-sm text-muted-foreground">
                Rodada {draw.round} · {PATTERN_LABELS[draw.pattern]} · {drawnNumbers.length} números sorteados
                {draw.status === "finished" && <span className="ml-1 font-medium text-foreground">(encerrada)</span>}
              </p>
              <div className="flex flex-wrap justify-center gap-1.5 sm:justify-start">
                {[...drawnNumbers]
                  .reverse()
                  .slice(0, 10)
                  .map((value, index) => (
                    <span
                      key={value}
                      className={cn(
                        "flex size-9 items-center justify-center rounded-full border text-sm font-semibold tabular-nums",
                        index === 0 && "animate-in zoom-in-50 border-primary bg-primary text-primary-foreground",
                      )}
                    >
                      {value}
                    </span>
                  ))}
              </div>
              {draw.winnerCount > 0 && (
                <p className="flex items-center justify-center gap-2 text-sm font-semibold text-success sm:justify-start">
                  <Trophy className="size-4" aria-hidden="true" />
                  {draw.winnerCount === 1 ? "1 cartela já bateu!" : `${draw.winnerCount} cartelas já bateram!`}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {view.allowTicketTracking && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TicketIcon className="size-5 text-primary" aria-hidden="true" /> Meus tickets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={addCodes} className="flex gap-2">
              <Input
                value={codeInput}
                onChange={(event) => setCodeInput(event.target.value)}
                placeholder="Código do ticket, ex.: EVX-7K4P-92QD (separe vários com vírgula)"
                aria-label="Códigos dos tickets"
                autoCapitalize="characters"
              />
              <Button type="submit" disabled={codeInput.trim() === ""}>
                <Plus /> Adicionar
              </Button>
            </form>
            {codes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Adicione o código impresso na sua cartela para ver quantos números faltam para bater.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {codes.map((code) => (
                  <TrackedTicketCard
                    key={code}
                    code={code}
                    ticket={ticketByCode.get(code)}
                    drawnSet={drawnSet}
                    hasDraw={Boolean(draw)}
                    onRemove={() => updateCodes(codes.filter((current) => current !== code))}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {draw && (
        <Card>
          <CardHeader>
            <CardTitle>Números sorteados</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={cn("grid gap-1", draw.maximumNumber === 75 ? "grid-cols-10 sm:grid-cols-15" : "grid-cols-10")}
            >
              {Array.from({ length: draw.maximumNumber - draw.minimumNumber + 1 }, (_, index) => {
                const value = draw.minimumNumber + index;
                const isDrawn = drawnSet.has(value);
                return (
                  <span
                    key={value}
                    className={cn(
                      "flex aspect-square items-center justify-center rounded-md text-xs font-semibold tabular-nums transition-colors duration-500",
                      isDrawn ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                      value === lastNumber &&
                        "animate-number-pop ring-2 ring-primary ring-offset-2 ring-offset-background",
                    )}
                  >
                    {value}
                  </span>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface TrackedTicketCardProps {
  code: string;
  ticket: TrackedTicket | undefined;
  drawnSet: Set<number>;
  hasDraw: boolean;
  onRemove: () => void;
}

function TrackedTicketCard({ code, ticket, drawnSet, hasDraw, onRemove }: TrackedTicketCardProps) {
  const isWinner = ticket?.found && ticket.isWinner;
  return (
    <div
      className={cn(
        "relative space-y-3 rounded-xl border p-3 transition-colors",
        isWinner && "animate-in zoom-in-95 border-success bg-success/10 ring-2 ring-success/40",
      )}
    >
      <div className="flex items-center gap-2">
        <code className="font-mono text-sm font-semibold">{code}</code>
        <TicketStatusLabel ticket={ticket} hasDraw={hasDraw} />
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto size-7"
          onClick={onRemove}
          aria-label={`Parar de acompanhar ${code}`}
        >
          <X />
        </Button>
      </div>
      {ticket?.found && (
        <div className="flex flex-wrap justify-center gap-3">
          {ticket.numbers.map((grid, gridIndex) => (
            <div
              key={gridIndex}
              className="inline-grid gap-1"
              style={{ gridTemplateColumns: `repeat(${grid[0]?.length ?? 0}, minmax(0, 2rem))` }}
            >
              {grid.flatMap((row, rowIndex) =>
                row.map((value, columnIndex) => {
                  const isMarked = value === null || drawnSet.has(value);
                  return (
                    <span
                      key={`${rowIndex}-${columnIndex}`}
                      className={cn(
                        "flex size-8 items-center justify-center rounded-md text-xs font-semibold tabular-nums transition-all duration-500",
                        value === null
                          ? "bg-amber-400/80 text-amber-950"
                          : isMarked
                            ? "scale-105 bg-primary text-primary-foreground shadow-sm"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {value ?? "★"}
                    </span>
                  );
                }),
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TicketStatusLabel({ ticket, hasDraw }: { ticket: TrackedTicket | undefined; hasDraw: boolean }) {
  const baseClassName = "rounded-full px-2 py-0.5 text-xs font-semibold";
  if (!ticket) return <span className={cn(baseClassName, "bg-muted text-muted-foreground")}>Carregando…</span>;
  if (!ticket.found)
    return <span className={cn(baseClassName, "bg-destructive/15 text-destructive")}>Não encontrado</span>;
  if (ticket.status === "void")
    return <span className={cn(baseClassName, "bg-destructive/15 text-destructive")}>Cancelado</span>;
  if (!ticket.paid)
    return (
      <span className={cn(baseClassName, "bg-amber-500/15 text-amber-600 dark:text-amber-400")}>
        Pagamento pendente
      </span>
    );
  if (!hasDraw || ticket.missingCount === null) {
    return <span className={cn(baseClassName, "bg-muted text-muted-foreground")}>Aguardando sorteio</span>;
  }
  if (ticket.isWinner) return <span className={cn(baseClassName, "animate-pulse bg-success text-white")}>BINGO!</span>;
  return (
    <span
      className={cn(
        baseClassName,
        ticket.missingCount === 1
          ? "bg-rose-500 text-white"
          : ticket.missingCount <= 3
            ? "bg-amber-500 text-white"
            : "bg-muted text-muted-foreground",
      )}
    >
      Falta {ticket.missingCount}
    </span>
  );
}

"use client";

import { toast } from "sonner";
import { Expand, Loader2, Medal, Sparkles, Trophy, UserCheck, UserX } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import {
  discardRaffleWinner,
  drawRaffleTicket,
  loadRaffleState,
  type RaffleActionResult,
} from "@/actions/raffle-actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { RaffleState, RaffleWinner } from "@/lib/api/types";
import { formatPhone } from "@/lib/buyer";
import { formatDateTime, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const SHUFFLE_DURATION_MS = 1800;
const SHUFFLE_INTERVAL_MS = 60;
const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function randomTicketCode(): string {
  const group = () =>
    Array.from({ length: 4 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join("");
  return `EVX-${group()}-${group()}`;
}

function describeBuyer(winner: RaffleWinner): string | null {
  return [winner.buyerName, winner.buyerPhone && formatPhone(winner.buyerPhone)].filter(Boolean).join(" · ") || null;
}

interface RaffleStationProps {
  eventId: string;
  initialState: RaffleState;
}

export function RaffleStation({ eventId, initialState }: RaffleStationProps) {
  const [state, setState] = useState(initialState);
  const [onlyCheckedIn, setOnlyCheckedIn] = useState(false);
  const [shufflingCode, setShufflingCode] = useState<string | null>(null);
  const [revealedWinner, setRevealedWinner] = useState<RaffleWinner | null>(null);
  const [isPending, startTransition] = useTransition();
  const stationRef = useRef<HTMLDivElement>(null);

  const activeWinners = state.winners.filter((winner) => winner.position !== null);
  const discardedWinners = state.winners.filter((winner) => winner.position === null);
  const isShuffling = shufflingCode !== null;

  function applyResult(result: RaffleActionResult): result is RaffleActionResult & { ok: true } {
    if (!result.ok) {
      toast.error(result.message);
      return false;
    }
    setState(result.state);
    return true;
  }

  function drawTicket() {
    setRevealedWinner(null);
    setShufflingCode(randomTicketCode());
    const interval = setInterval(() => setShufflingCode(randomTicketCode()), SHUFFLE_INTERVAL_MS);
    startTransition(async () => {
      const [result] = await Promise.all([
        drawRaffleTicket(eventId, onlyCheckedIn),
        new Promise((resolve) => setTimeout(resolve, SHUFFLE_DURATION_MS)),
      ]);
      clearInterval(interval);
      setShufflingCode(null);
      if (applyResult(result) && result.winner) {
        setRevealedWinner(result.winner);
      }
    });
  }

  function discardWinner(winner: RaffleWinner) {
    startTransition(async () => {
      const result = await discardRaffleWinner(eventId, winner.id, onlyCheckedIn);
      if (applyResult(result)) {
        toast.success(`Ticket ${winner.ticketCode} descartado.`);
        if (revealedWinner?.id === winner.id) setRevealedWinner(null);
      }
    });
  }

  function toggleOnlyCheckedIn() {
    const next = !onlyCheckedIn;
    setOnlyCheckedIn(next);
    startTransition(async () => {
      applyResult(await loadRaffleState(eventId, next));
    });
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void stationRef.current?.requestFullscreen();
  }

  const displayedCode = shufflingCode ?? revealedWinner?.ticketCode ?? null;
  const revealedBuyer = revealedWinner && describeBuyer(revealedWinner);

  return (
    <div
      ref={stationRef}
      className="relative overflow-y-auto bg-background station-fullscreen:flex station-fullscreen:flex-col station-fullscreen:px-12 station-fullscreen:py-14"
    >
      <div className="space-y-4 fs:mx-auto fs:my-auto fs:w-full fs:max-w-[1680px] fs:space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">
            <strong className="font-semibold text-foreground tabular-nums">{formatNumber(state.eligibleCount)}</strong>{" "}
            {state.eligibleCount === 1 ? "ticket pago concorrendo" : "tickets pagos concorrendo"}
          </span>
          <label
            className={cn(
              "ml-auto flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-1.5 text-sm transition-colors",
              onlyCheckedIn
                ? "border-primary/40 bg-primary/10 text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <UserCheck className="size-4" aria-hidden="true" />
            Somente quem fez check-in
            <Switch checked={onlyCheckedIn} onCheckedChange={toggleOnlyCheckedIn} disabled={isPending} />
          </label>
          <Button variant="ghost" size="icon" onClick={toggleFullscreen} aria-label="Tela cheia">
            <Expand />
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px] fs:gap-6 fs:xl:grid-cols-[minmax(0,1fr)_440px]">
          <Card className="overflow-hidden">
            <CardContent className="relative flex min-h-80 flex-col items-center justify-center gap-6 py-10 text-center fs:min-h-[60vh]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgb(245_158_11/0.16),transparent_55%)]"
              />
              <span
                className={cn(
                  "relative flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-rose-500 text-white shadow-[0_18px_40px_-12px_rgba(244,63,94,0.55)] fs:size-28",
                  isShuffling && "animate-ball-shake",
                  revealedWinner && "animate-ball-reveal",
                )}
              >
                <Trophy className="size-9 fs:size-12" aria-hidden="true" />
              </span>

              <div className="relative grid gap-2" aria-live="polite">
                <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                  {isShuffling
                    ? "Sorteando…"
                    : revealedWinner
                      ? `${revealedWinner.position}º ganhador`
                      : "Pronto para sortear"}
                </p>
                <p
                  key={displayedCode ?? "empty"}
                  className={cn(
                    "font-mono text-4xl font-black tracking-wider tabular-nums sm:text-6xl fs:text-8xl",
                    isShuffling ? "text-muted-foreground" : "text-foreground",
                    revealedWinner && "animate-in zoom-in-75 duration-500",
                  )}
                >
                  {displayedCode ?? "EVX-····-····"}
                </p>
                {revealedBuyer && <p className="text-lg text-muted-foreground fs:text-2xl">{revealedBuyer}</p>}
              </div>

              <Button
                size="lg"
                className="relative h-14 min-w-64 text-lg"
                disabled={isPending || state.eligibleCount === 0}
                onClick={drawTicket}
              >
                {isShuffling ? <Loader2 className="animate-spin" /> : <Sparkles />}
                {activeWinners.length === 0 ? "Sortear ticket" : "Sortear próximo ticket"}
              </Button>
              {state.eligibleCount === 0 && !isShuffling && (
                <p className="relative text-sm text-muted-foreground">
                  {onlyCheckedIn
                    ? "Nenhum ticket pago com check-in disponível para sortear."
                    : "Nenhum ticket pago disponível para sortear."}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Medal className="size-4 text-amber-500" aria-hidden="true" /> Ganhadores
              </CardTitle>
              <CardDescription>
                Cada ticket só pode ser sorteado uma vez. Descarte quem não estiver presente e sorteie de novo.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {activeWinners.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Nenhum ticket sorteado ainda.</p>
              ) : (
                <ol className="grid gap-2">
                  {activeWinners.map((winner) => (
                    <li
                      key={winner.id}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-3",
                        winner.id === revealedWinner?.id && "border-amber-500/50 bg-amber-500/10",
                      )}
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-rose-500 text-sm font-bold text-white tabular-nums">
                        {winner.position}º
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-mono font-semibold">{winner.ticketCode}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {describeBuyer(winner) ?? "Comprador não identificado"} · {formatDateTime(winner.drawnAt)}
                        </span>
                      </span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={isPending} aria-label="Descartar ganhador">
                            <UserX />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Descartar o ticket {winner.ticketCode}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Use quando o ganhador não estiver presente. O ticket não volta a concorrer e os próximos
                              ganhadores sobem de posição.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Manter ganhador</AlertDialogCancel>
                            <AlertDialogAction variant="destructive" onClick={() => discardWinner(winner)}>
                              Descartar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </li>
                  ))}
                </ol>
              )}
              {discardedWinners.length > 0 && (
                <div className="grid gap-1.5 border-t pt-3">
                  <p className="text-xs font-medium text-muted-foreground">Descartados</p>
                  {discardedWinners.map((winner) => (
                    <p key={winner.id} className="text-xs text-muted-foreground line-through">
                      {winner.ticketCode}
                      {describeBuyer(winner) && ` · ${describeBuyer(winner)}`}
                    </p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

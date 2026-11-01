"use client";

import { toast } from "sonner";
import { Expand, Loader2, Play, Sparkles, Square, Trophy, Undo2, UserCheck } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState, useTransition } from "react";
import {
  type DrawActionResult,
  changeDrawPattern,
  drawBingoNumber,
  finishDrawRound,
  loadDrawState,
  startDrawRound,
  undoBingoNumber,
} from "@/actions/draw-actions";
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
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ShareDrawDialog } from "./share-draw-dialog";
import type { DrawState, WinningPattern } from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface DrawStationProps {
  eventId: string;
  initialState: DrawState;
}

const SHUFFLE_DURATION_MS = 1100;
const BINGO_LETTERS = ["B", "I", "N", "G", "O"];
const PATTERN_LABELS: Record<WinningPattern, string> = { line: "Linha", full_card: "Cartela cheia" };
const MISSING_TONES: Record<string, string> = { "1": "bg-rose-500", "2": "bg-amber-500", "3": "bg-sky-500" };

function bingoLetterOf(value: number, maximumNumber: number): string | null {
  if (maximumNumber !== 75 || value < 1) return null;
  return BINGO_LETTERS[Math.min(4, Math.floor((value - 1) / 15))];
}

function numberRange(minimum: number, maximum: number): number[] {
  return Array.from({ length: Math.max(0, maximum - minimum + 1) }, (_, index) => minimum + index);
}

export function DrawStation({ eventId, initialState }: DrawStationProps) {
  const [state, setState] = useState(initialState);
  const [onlyCheckedIn, setOnlyCheckedIn] = useState(false);
  const [pattern, setPattern] = useState<WinningPattern>(initialState.draw?.pattern ?? "line");
  const [shufflingNumber, setShufflingNumber] = useState<number | null>(null);
  const [revealedNumber, setRevealedNumber] = useState<number | null>(initialState.draw?.drawnNumbers.at(-1) ?? null);
  const [celebrating, setCelebrating] = useState(false);
  const [manualNumber, setManualNumber] = useState("");
  const [isPending, startTransition] = useTransition();
  const stationRef = useRef<HTMLDivElement>(null);
  const previousWinnerCount = useRef(initialState.progress?.winners.length ?? 0);

  const draw = state.draw;
  const progress = state.progress;
  const isRunning = draw?.status === "running";
  const drawnSet = new Set(draw?.drawnNumbers ?? []);
  const isShuffling = shufflingNumber !== null;

  useEffect(() => {
    const winnerCount = progress?.winners.length ?? 0;
    if (winnerCount > previousWinnerCount.current) {
      setCelebrating(true);
      const timeout = setTimeout(() => setCelebrating(false), 4000);
      previousWinnerCount.current = winnerCount;
      return () => clearTimeout(timeout);
    }
    previousWinnerCount.current = winnerCount;
  }, [progress?.winners.length]);

  function applyResult(result: DrawActionResult): boolean {
    if (!result.ok) {
      toast.error(result.message);
      return false;
    }
    setState(result.state);
    return true;
  }

  function run(action: () => Promise<DrawActionResult>, onSuccess?: (result: DrawActionResult & { ok: true }) => void) {
    startTransition(async () => {
      const result = await action();
      if (applyResult(result) && result.ok) onSuccess?.(result);
    });
  }

  function revealWithShuffle(action: () => Promise<DrawActionResult>) {
    if (!draw) return;
    const range = numberRange(draw.minimumNumber, draw.maximumNumber);
    const interval = setInterval(() => setShufflingNumber(range[Math.floor(Math.random() * range.length)]), 70);
    setShufflingNumber(range[0]);
    startTransition(async () => {
      const [result] = await Promise.all([
        action(),
        new Promise((resolve) => setTimeout(resolve, SHUFFLE_DURATION_MS)),
      ]);
      clearInterval(interval);
      setShufflingNumber(null);
      if (applyResult(result) && result.ok && result.drawnNumber !== undefined) setRevealedNumber(result.drawnNumber);
    });
  }

  function drawRandom() {
    if (draw) revealWithShuffle(() => drawBingoNumber(draw.id, undefined, onlyCheckedIn));
  }

  function drawManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draw || manualNumber.trim() === "") return;
    const requested = Number(manualNumber);
    revealWithShuffle(() => drawBingoNumber(draw.id, requested, onlyCheckedIn));
    setManualNumber("");
  }

  function selectPattern(nextPattern: WinningPattern) {
    setPattern(nextPattern);
    if (!draw || !isRunning || draw.pattern === nextPattern) return;
    run(
      () => changeDrawPattern(draw.id, nextPattern, onlyCheckedIn),
      (result) => {
        previousWinnerCount.current = result.state.progress?.winners.length ?? 0;
      },
    );
  }

  function toggleOnlyCheckedIn() {
    const next = !onlyCheckedIn;
    setOnlyCheckedIn(next);
    run(() => loadDrawState(eventId, next));
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void stationRef.current?.requestFullscreen();
  }

  const ballNumber = shufflingNumber ?? revealedNumber;
  const ballLetter = draw && ballNumber !== null ? bingoLetterOf(ballNumber, draw.maximumNumber) : null;
  const recentNumbers = [...(draw?.drawnNumbers ?? [])].reverse().slice(0, 8);
  const distribution = progress?.missingCountDistribution ?? {};
  const distributionMax = Math.max(1, ...Object.values(distribution));

  return (
    <div
      ref={stationRef}
      className="relative overflow-y-auto bg-background station-fullscreen:flex station-fullscreen:flex-col station-fullscreen:px-12 station-fullscreen:py-14"
    >
      <div className="space-y-4 fs:mx-auto fs:my-auto fs:w-full fs:max-w-[1680px] fs:space-y-6">
        {celebrating && <Celebration winnerCodes={progress?.winners.map((winner) => winner.code) ?? []} />}

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border p-0.5">
            {(Object.keys(PATTERN_LABELS) as WinningPattern[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => selectPattern(option)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  pattern === option
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {PATTERN_LABELS[option]}
              </button>
            ))}
          </div>
          <Button
            disabled={isPending}
            onClick={() =>
              run(
                () => startDrawRound(eventId, pattern, onlyCheckedIn),
                () => setRevealedNumber(null),
              )
            }
          >
            <Play /> {isRunning ? "Nova rodada" : "Iniciar rodada"}
          </Button>
          {isRunning && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={isPending}>
                  <Square /> Encerrar rodada
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Encerrar a rodada {draw.round}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {draw.drawnNumbers.length}{" "}
                    {draw.drawnNumbers.length === 1 ? "número sorteado" : "números sorteados"} ·{" "}
                    {progress?.winners.length ?? 0}{" "}
                    {(progress?.winners.length ?? 0) === 1 ? "ticket bateu" : "tickets bateram"}. Depois de encerrada,
                    não será possível sortear nem desfazer números nesta rodada.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Continuar sorteando</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={() => run(() => finishDrawRound(draw.id, onlyCheckedIn))}
                  >
                    Encerrar rodada
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
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
          <ShareDrawDialog eventId={eventId} />
          <Button variant="ghost" size="icon" onClick={toggleFullscreen} aria-label="Tela cheia">
            <Expand />
          </Button>
        </div>

        {!draw ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <Sparkles className="size-10 animate-pulse text-primary" />
              <p className="text-lg font-semibold">Nenhuma rodada ainda</p>
              <p className="text-sm text-muted-foreground">Escolha o tipo de vitória e clique em “Iniciar rodada”.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] fs:gap-6 fs:xl:grid-cols-[minmax(0,1fr)_400px]">
            <div className="space-y-4 fs:space-y-6">
              <Card>
                <CardContent className="flex flex-col items-center gap-5 py-6 sm:flex-row sm:items-center sm:gap-8">
                  <div
                    key={isShuffling ? "shuffling" : `ball-${revealedNumber}`}
                    className={cn(
                      "flex size-44 shrink-0 flex-col items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_25%,#fff_0%,#c7d2fe_18%,#6366f1_55%,#4c1d95_100%)] text-white shadow-[0_20px_50px_-12px_rgba(79,70,229,0.6)]",
                      isShuffling ? "animate-ball-shake" : ballNumber !== null && "animate-ball-reveal",
                    )}
                  >
                    <span className="flex size-28 flex-col items-center justify-center rounded-full bg-white text-indigo-950 shadow-inner">
                      {ballLetter && (
                        <span className="text-sm font-bold tracking-widest text-indigo-500">{ballLetter}</span>
                      )}
                      <span className="text-5xl font-black tabular-nums">{ballNumber ?? "?"}</span>
                    </span>
                  </div>
                  <div className="flex w-full flex-col gap-3">
                    <div className="text-sm text-muted-foreground">
                      Rodada {draw.round} · {PATTERN_LABELS[draw.pattern]} · {draw.drawnNumbers.length} de{" "}
                      {draw.maximumNumber - draw.minimumNumber + 1} números
                      {!isRunning && <span className="ml-2 font-medium text-foreground">(encerrada)</span>}
                    </div>
                    <Button size="lg" className="h-14 text-lg" disabled={!isRunning || isPending} onClick={drawRandom}>
                      {isShuffling ? <Loader2 className="animate-spin" /> : <Sparkles />} Sortear número
                    </Button>
                    <form onSubmit={drawManual} className="flex gap-2">
                      <Input
                        inputMode="numeric"
                        placeholder="Número cantado"
                        value={manualNumber}
                        onChange={(event) => setManualNumber(event.target.value.replace(/\D/g, ""))}
                        disabled={!isRunning || isPending}
                      />
                      <Button type="submit" variant="outline" disabled={!isRunning || isPending || manualNumber === ""}>
                        Marcar
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={!isRunning || isPending || draw.drawnNumbers.length === 0}
                        onClick={() =>
                          run(
                            () => undoBingoNumber(draw.id, onlyCheckedIn),
                            (result) => setRevealedNumber(result.state.draw?.drawnNumbers.at(-1) ?? null),
                          )
                        }
                      >
                        <Undo2 /> Desfazer
                      </Button>
                    </form>
                    {recentNumbers.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {recentNumbers.map((value, index) => (
                          <span
                            key={value}
                            className={cn(
                              "flex size-9 items-center justify-center rounded-full border text-sm font-semibold tabular-nums transition-all",
                              index === 0
                                ? "animate-in zoom-in-50 border-primary bg-primary text-primary-foreground"
                                : "opacity-80",
                            )}
                          >
                            {value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Números sorteados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={cn("grid gap-1.5", draw.maximumNumber === 75 ? "grid-cols-15" : "grid-cols-10")}>
                    {numberRange(draw.minimumNumber, draw.maximumNumber).map((value) => {
                      const isDrawn = drawnSet.has(value);
                      const isLatest = value === revealedNumber && isDrawn;
                      return (
                        <span
                          key={value}
                          className={cn(
                            "flex aspect-square items-center justify-center rounded-md text-xs font-semibold tabular-nums transition-all duration-300 sm:text-sm",
                            isDrawn ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground",
                            isLatest && "animate-number-pop ring-2 ring-primary ring-offset-2 ring-offset-background",
                          )}
                        >
                          {value}
                        </span>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col gap-4 fs:gap-6">
              <Card className={cn((progress?.winners.length ?? 0) > 0 && "ring-2 ring-success/60")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="size-5 text-amber-500" /> Bateram
                    <span className="ml-auto text-3xl font-black tabular-nums">{progress?.winners.length ?? 0}</span>
                  </CardTitle>
                  <CardDescription>{progress?.consideredTicketCount ?? 0} tickets participando</CardDescription>
                </CardHeader>
                {(progress?.winners.length ?? 0) > 0 && (
                  <CardContent className="flex flex-wrap gap-1.5">
                    {progress?.winners.map((winner) => (
                      <span
                        key={winner.ticketId}
                        className="animate-in zoom-in-75 rounded-md bg-success/15 px-2 py-1 font-mono text-sm font-semibold text-success"
                      >
                        {winner.code}
                      </span>
                    ))}
                  </CardContent>
                )}
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Perto de bater</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {["1", "2", "3"].map((missing) => {
                    const count = distribution[missing] ?? 0;
                    return (
                      <div key={missing} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>
                            Falta {missing} {missing === "1" ? "número" : "números"}
                          </span>
                          <span key={count} className="animate-in zoom-in-50 font-semibold tabular-nums">
                            {count}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              "h-full rounded-full transition-[width] duration-700 ease-out",
                              MISSING_TONES[missing],
                            )}
                            style={{ width: `${(count / distributionMax) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {(progress?.closest.length ?? 0) > 0 && (
                <Card className="min-h-64 flex-1">
                  <CardHeader>
                    <CardTitle>Tickets mais próximos</CardTitle>
                  </CardHeader>
                  <CardContent className="relative flex-1">
                    <div className="absolute inset-0 space-y-1 overflow-y-auto px-(--card-spacing)">
                      {progress?.closest.map((ticket) => (
                        <div
                          key={ticket.ticketId}
                          className="flex items-center justify-between rounded-md px-2 py-1 text-sm hover:bg-muted"
                        >
                          <span className="font-mono">{ticket.code}</span>
                          <span
                            className={cn(
                              "rounded-full px-2 text-xs font-semibold text-white",
                              MISSING_TONES[String(ticket.missingCount)],
                            )}
                          >
                            falta {ticket.missingCount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const CONFETTI_COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#0ea5e9"];

function Celebration({ winnerCodes }: { winnerCodes: string[] }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      {Array.from({ length: 60 }, (_, index) => (
        <span
          key={index}
          className="animate-confetti absolute top-0 size-2.5 rounded-sm"
          style={{
            left: `${(index * 37) % 100}%`,
            backgroundColor: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
            animationDelay: `${(index % 12) * 0.12}s`,
          }}
        />
      ))}
      <div className="animate-in zoom-in-50 fade-in rounded-2xl bg-background/95 px-10 py-6 text-center shadow-2xl ring-2 ring-success">
        <p className="text-4xl font-black text-success">BINGO!</p>
        <p className="mt-1 font-mono text-sm">{winnerCodes.slice(-5).join(" · ")}</p>
      </div>
    </div>
  );
}

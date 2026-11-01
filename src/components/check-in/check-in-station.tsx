"use client";

import { CircleCheck, CircleX, Clock, Loader2, TicketX, TriangleAlert, Users, Wallet } from "lucide-react";
import { type FormEvent, useCallback, useRef, useState } from "react";
import { type CheckInAttempt, checkInTicket } from "@/actions/check-in-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import type { CheckInOutcome, CheckInResult, CheckInSummary } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { QrScanner } from "./qr-scanner";

interface CheckInStationProps {
  eventId: string;
  initialSummary: CheckInSummary;
}

interface OutcomePresentation {
  title: string;
  tone: string;
  icon: typeof CircleCheck;
  vibration: number[];
}

const OUTCOME_PRESENTATION: Record<CheckInOutcome, OutcomePresentation> = {
  admitted: {
    title: "Entrada liberada",
    tone: "border-success/40 bg-success/10 text-success",
    icon: CircleCheck,
    vibration: [80],
  },
  already_checked_in: {
    title: "Ticket já utilizado",
    tone: "border-warning/50 bg-warning/15 text-amber-700 dark:text-warning",
    icon: Clock,
    vibration: [80, 60, 80],
  },
  voided: {
    title: "Ticket cancelado",
    tone: "border-destructive/40 bg-destructive/10 text-destructive",
    icon: TicketX,
    vibration: [250],
  },
  unpaid: {
    title: "Pagamento pendente",
    tone: "border-warning/50 bg-warning/15 text-amber-700 dark:text-warning",
    icon: Wallet,
    vibration: [250, 80, 250],
  },
  wrong_event: {
    title: "Ticket de outro evento",
    tone: "border-destructive/40 bg-destructive/10 text-destructive",
    icon: TriangleAlert,
    vibration: [250],
  },
  not_found: {
    title: "Ticket não encontrado",
    tone: "border-destructive/40 bg-destructive/10 text-destructive",
    icon: CircleX,
    vibration: [250],
  },
};

const REPEATED_SCAN_WINDOW_MILLISECONDS = 4000;
const RECENT_RESULTS_LIMIT = 8;

const timeFormatter = new Intl.DateTimeFormat("pt-BR", { timeStyle: "short", timeZone: "America/Sao_Paulo" });
const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

function describeResult(result: CheckInResult): string {
  switch (result.outcome) {
    case "admitted":
      return "Pode entrar. Bom evento!";
    case "already_checked_in":
      return `Entrada registrada em ${result.checkedInAt ? dateTimeFormatter.format(new Date(result.checkedInAt)) : "—"}${result.checkedInByName ? ` por ${result.checkedInByName}` : ""}.`;
    case "voided":
      return "Este ticket foi cancelado e não dá direito à entrada.";
    case "unpaid":
      return "Este ticket ainda não foi pago. Confirme o pagamento antes de liberar a entrada.";
    case "wrong_event":
      return `Este ticket é do evento ${result.ticketEventName ?? "diferente"}.`;
    case "not_found":
      return "Confira o código digitado ou se o QR Code é de um ticket do EventixHub.";
  }
}

interface RecentCheckIn {
  result: CheckInResult;
  validatedAt: Date;
}

export function CheckInStation({ eventId, initialSummary }: CheckInStationProps) {
  const [summary, setSummary] = useState(initialSummary);
  const [latestAttempt, setLatestAttempt] = useState<CheckInAttempt | null>(null);
  const [recentCheckIns, setRecentCheckIns] = useState<RecentCheckIn[]>([]);
  const [manualCode, setManualCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const lastScanRef = useRef<{ code: string; at: number } | null>(null);

  const validate = useCallback(
    async (code: string) => {
      setIsValidating(true);
      try {
        const attemptResult = await checkInTicket(eventId, code);
        setLatestAttempt(attemptResult);
        if (attemptResult.ok) {
          setSummary(attemptResult.summary);
          setRecentCheckIns((current) =>
            [{ result: attemptResult.result, validatedAt: new Date() }, ...current].slice(0, RECENT_RESULTS_LIMIT),
          );
          navigator.vibrate?.(OUTCOME_PRESENTATION[attemptResult.result.outcome].vibration);
        }
      } finally {
        setIsValidating(false);
      }
    },
    [eventId],
  );

  const handleScannedCode = useCallback(
    (code: string) => {
      const now = Date.now();
      const lastScan = lastScanRef.current;
      if (lastScan && lastScan.code === code && now - lastScan.at < REPEATED_SCAN_WINDOW_MILLISECONDS) {
        return;
      }
      lastScanRef.current = { code, at: now };
      void validate(code);
    },
    [validate],
  );

  function submitManualCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!manualCode.trim()) return;
    void validate(manualCode).then(() => setManualCode(""));
  }

  const checkedInPercentage =
    summary.activeTicketCount === 0 ? 0 : Math.round((summary.checkedInCount / summary.activeTicketCount) * 100);
  const presentation = latestAttempt?.ok ? OUTCOME_PRESENTATION[latestAttempt.result.outcome] : null;
  const ResultIcon = presentation?.icon ?? CircleX;

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Ler QR Code</CardTitle>
            <CardDescription>O ticket é validado assim que o QR Code aparece na câmera.</CardDescription>
          </CardHeader>
          <CardContent>
            <QrScanner onCodeDetected={handleScannedCode} isPaused={isValidating} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Digitar código</CardTitle>
            <CardDescription>Use quando o QR Code estiver danificado ou sem câmera.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitManualCode} className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={manualCode}
                onChange={(event) => setManualCode(event.target.value.toUpperCase())}
                placeholder="EVX-7K4P-92QD"
                aria-label="Código do ticket"
                autoComplete="off"
                autoCapitalize="characters"
                className="h-10 font-mono text-base tracking-wider"
              />
              <Button type="submit" size="lg" disabled={isValidating || !manualCode.trim()}>
                {isValidating && <Loader2 className="animate-spin" />}
                Validar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:sticky lg:top-6">
        <div
          aria-live="assertive"
          className={cn(
            "flex min-h-44 flex-col items-center justify-center gap-2 rounded-xl border-2 p-6 text-center transition-colors",
            presentation?.tone ??
              (latestAttempt && !latestAttempt.ok
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : "border-dashed text-muted-foreground"),
          )}
        >
          {isValidating ? (
            <>
              <Loader2 className="size-10 animate-spin" aria-hidden="true" />
              <p className="font-medium">Validando...</p>
            </>
          ) : latestAttempt ? (
            <>
              <ResultIcon className="size-12" aria-hidden="true" />
              <p className="text-xl font-semibold">
                {latestAttempt.ok ? presentation?.title : "Não foi possível validar"}
              </p>
              {latestAttempt.ok ? (
                <>
                  <p className="font-mono text-sm font-medium tracking-wider">{latestAttempt.result.code}</p>
                  <p className="text-sm text-foreground/80">{describeResult(latestAttempt.result)}</p>
                </>
              ) : (
                <p className="text-sm">{latestAttempt.message}</p>
              )}
            </>
          ) : (
            <>
              <CircleCheck className="size-10" aria-hidden="true" />
              <p className="font-medium">Aguardando o primeiro ticket</p>
            </>
          )}
        </div>

        <Card size="sm">
          <CardContent className="grid gap-3">
            <div className="flex items-end justify-between">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="size-4" aria-hidden="true" /> Entradas
              </span>
              <span className="text-2xl font-semibold tabular-nums">
                {summary.checkedInCount}
                <span className="text-base font-normal text-muted-foreground"> / {summary.activeTicketCount}</span>
              </span>
            </div>
            <Progress value={checkedInPercentage} />
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>Últimas validações</CardTitle>
          </CardHeader>
          <CardContent>
            {recentCheckIns.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma validação nesta sessão.</p>
            ) : (
              <ul className="divide-y">
                {recentCheckIns.map(({ result, validatedAt }) => {
                  const { icon: OutcomeIcon, title, tone } = OUTCOME_PRESENTATION[result.outcome];
                  return (
                    <li key={`${result.code}-${validatedAt.getTime()}`} className="flex items-center gap-3 py-2">
                      <span className={cn("flex size-7 items-center justify-center rounded-full border", tone)}>
                        <OutcomeIcon className="size-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-mono text-xs font-medium">{result.code}</span>
                        <span className="text-xs text-muted-foreground">{title}</span>
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {timeFormatter.format(validatedAt)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

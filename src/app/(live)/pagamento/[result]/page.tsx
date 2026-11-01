import { CircleCheck, CircleX } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Brand } from "@/components/brand";
import { Card, CardContent } from "@/components/ui/card";
import { readSearchParam } from "@/lib/flash";

export const metadata: Metadata = { title: "Pagamento" };

const PAYMENT_RESULTS = {
  concluido: {
    icon: CircleCheck,
    iconClassName: "text-success",
    title: "Pagamento recebido!",
    message: "Obrigado! Seu ticket já está liberado. Mostre a cartela na entrada do evento.",
  },
  cancelado: {
    icon: CircleX,
    iconClassName: "text-muted-foreground",
    title: "Pagamento não concluído",
    message: "Nenhum valor foi cobrado. Fale com a equipe do evento para tentar novamente.",
  },
} as const;

export default async function PaymentResultPage({ params, searchParams }: PageProps<"/pagamento/[result]">) {
  const { result } = await params;
  if (!(result in PAYMENT_RESULTS)) {
    notFound();
  }
  const presentation = PAYMENT_RESULTS[result as keyof typeof PAYMENT_RESULTS];
  const ticketCode = readSearchParam(await searchParams, "ticket");
  const Icon = presentation.icon;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[radial-gradient(circle_at_top,rgb(99_102_241/0.18),transparent_55%)] p-4">
      <Brand />
      <Card className="w-full max-w-sm">
        <CardContent className="grid justify-items-center gap-3 py-6 text-center">
          <Icon className={`size-14 animate-in zoom-in-50 ${presentation.iconClassName}`} aria-hidden="true" />
          <h1 className="text-xl font-semibold">{presentation.title}</h1>
          {ticketCode && <code className="rounded bg-muted px-2 py-1 font-mono text-sm">{ticketCode}</code>}
          <p className="text-sm text-muted-foreground">{presentation.message}</p>
        </CardContent>
      </Card>
    </div>
  );
}

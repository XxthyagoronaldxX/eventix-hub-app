import type { Metadata } from "next";
import { updateEvent } from "@/actions/event-actions";
import { EventFields } from "@/components/events/event-fields";
import { EventKindBadge, EventKindPicker } from "@/components/events/event-kind-picker";
import { FlashNotices } from "@/components/flash-notices";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { eventRoutes } from "@/lib/event-routes";
import { requireEventWorkspace } from "@/lib/event-workspace";
import { readFlash } from "@/lib/flash";

export const metadata: Metadata = { title: "Configurações do evento" };

export default async function EventSettingsPage({ params, searchParams }: PageProps<"/events/[eventId]/settings">) {
  const { eventId } = await params;
  const { event } = await requireEventWorkspace(eventId, "org:events:write");

  return (
    <PageContainer>
      <PageHeader
        title="Configurações"
        breadcrumbs={[{ label: event.name, href: eventRoutes.overview(event.id) }]}
        description="Tipo, dados, status, valor do ticket e formas de pagamento do evento."
      />
      <FlashNotices flash={readFlash(await searchParams)} />

      <Card>
        <form action={updateEvent} className="contents">
          <input type="hidden" name="eventId" value={event.id} />
          <CardHeader>
            <CardTitle>Dados do evento</CardTitle>
            <CardDescription>Tipo, nome, data, local e status.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            {event.canChangeKind ? (
              <EventKindPicker
                defaultKind={event.kind}
                note="Dá para mudar o tipo enquanto nenhum ticket for gerado. Depois do primeiro lote, ele fica fixo."
              />
            ) : (
              <div className="grid gap-2">
                <span className="text-sm font-medium">Tipo do evento</span>
                <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <EventKindBadge kind={event.kind} /> O tipo não pode mais mudar porque este evento já tem tickets
                  gerados.
                </p>
              </div>
            )}
            <EventFields event={event} />
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit">Salvar alterações</Button>
          </CardFooter>
        </form>
      </Card>
    </PageContainer>
  );
}

import { DateFormField } from "@/components/form/date-form-field";
import { EventPaymentSettingsFields } from "@/components/events/event-payment-settings-fields";
import { NumberFormField } from "@/components/form/number-form-field";
import { SelectFormField } from "@/components/form/select-form-field";
import type { SelectOption } from "@/components/form/select-input";
import { TextFormField } from "@/components/form/text-form-field";
import { TextareaFormField } from "@/components/form/textarea-form-field";
import type { OrganizationEvent } from "@/lib/api/types";
import { toDateTimeLocalValue } from "@/lib/format";
import { cn } from "@/lib/utils";

const EVENT_STATUS_OPTIONS: SelectOption[] = [
  {
    value: "draft",
    label: "Rascunho",
    description: "Em preparação, ainda sem venda.",
    indicatorClassName: "bg-amber-500",
  },
  {
    value: "active",
    label: "Ativo",
    description: "Vendendo tickets e pronto para o dia.",
    indicatorClassName: "bg-emerald-500",
  },
  {
    value: "archived",
    label: "Arquivado",
    description: "Encerrado; some do caixa, check-in e sorteio.",
    indicatorClassName: "bg-muted-foreground",
  },
];

export function EventFields({ event }: { event?: OrganizationEvent }) {
  return (
    <>
      <div className={cn("grid gap-5", event && "sm:grid-cols-[minmax(0,1fr)_220px]")}>
        <TextFormField
          label="Nome do evento"
          id="event-name"
          name="name"
          defaultValue={event?.name}
          placeholder="Bingo de Natal"
          required
          maxLength={160}
        />
        {event && (
          <SelectFormField
            label="Status"
            id="event-status"
            name="status"
            defaultValue={event.status}
            options={EVENT_STATUS_OPTIONS}
          />
        )}
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_220px]">
        <DateFormField
          withTime
          label="Data e hora"
          id="event-starts-at"
          name="startsAt"
          defaultValue={event ? toDateTimeLocalValue(event.startsAt) : undefined}
          required
        />
        <TextFormField
          label="Local"
          id="event-location"
          name="location"
          defaultValue={event?.location}
          placeholder="Salão paroquial"
          maxLength={200}
        />
        <NumberFormField
          label="Valor do ticket"
          id="event-ticket-price"
          name="ticketPrice"
          unit="R$"
          min={0}
          step={0.01}
          placeholder="0,00"
          defaultValue={event ? event.ticketPriceCents / 100 : undefined}
          hint="Usado nas cobranças pela Stripe."
        />
      </div>
      <EventPaymentSettingsFields event={event} />
      <TextareaFormField
        label="Descrição"
        id="event-description"
        name="description"
        defaultValue={event?.description}
        maxLength={2000}
        rows={4}
      />
    </>
  );
}

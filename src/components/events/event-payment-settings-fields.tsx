import { Banknote, CreditCard, Globe, IdCard, QrCode } from "lucide-react";
import type { ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import type { OrganizationEvent, PaymentMethod } from "@/lib/api/types";

const PAYMENT_METHOD_CHOICES: { method: PaymentMethod; label: string; icon: ReactNode }[] = [
  { method: "pix", label: "Pix", icon: <QrCode className="size-4" aria-hidden="true" /> },
  { method: "cash", label: "Dinheiro", icon: <Banknote className="size-4" aria-hidden="true" /> },
  { method: "card", label: "Cartão", icon: <CreditCard className="size-4" aria-hidden="true" /> },
];

export function EventPaymentSettingsFields({ event }: { event?: OrganizationEvent }) {
  const allowedMethods = event?.allowedPaymentMethods ?? PAYMENT_METHOD_CHOICES.map(({ method }) => method);
  return (
    <fieldset className="grid gap-3">
      <legend className="mb-2 text-sm font-medium">Pagamentos aceitos</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {PAYMENT_METHOD_CHOICES.map(({ method, label, icon }) => (
          <label
            key={method}
            className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 has-data-[state=checked]:border-primary/50 has-data-[state=checked]:bg-primary/5"
          >
            <Checkbox name="allowedPaymentMethods" value={method} defaultChecked={allowedMethods.includes(method)} />
            <span className="text-muted-foreground">{icon}</span>
            <span className="text-sm font-medium">{label}</span>
          </label>
        ))}
      </div>
      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3">
        <span className="flex items-start gap-3">
          <Globe className="mt-0.5 size-4 text-muted-foreground" aria-hidden="true" />
          <span>
            <span className="block text-sm font-medium">Cobrança online pela Stripe</span>
            <span className="block text-xs text-muted-foreground">
              Permite gerar QR Code de Pix ou cartão (se marcados acima) para a pessoa pagar no celular.
            </span>
          </span>
        </span>
        <Switch name="onlinePaymentsEnabled" defaultChecked={event?.onlinePaymentsEnabled ?? true} />
      </label>
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 has-data-[state=checked]:border-primary/50 has-data-[state=checked]:bg-primary/5">
        <Checkbox
          name="requireBuyerIdentification"
          defaultChecked={event?.requireBuyerIdentification ?? false}
          className="mt-0.5"
        />
        <span className="flex items-start gap-3">
          <IdCard className="mt-0.5 size-4 text-muted-foreground" aria-hidden="true" />
          <span>
            <span className="block text-sm font-medium">Exigir celular ou CPF de quem paga</span>
            <span className="block text-xs text-muted-foreground">
              O caixa só confirma o pagamento depois de informar o celular ou o CPF, que ficam vinculados ao ticket.
            </span>
          </span>
        </span>
      </label>
    </fieldset>
  );
}

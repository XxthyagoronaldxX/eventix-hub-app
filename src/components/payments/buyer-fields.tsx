"use client";

import { IdCard, Phone, User } from "lucide-react";
import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCpf, formatPhone, type TicketBuyerInput } from "@/lib/buyer";

interface BuyerFieldsProps {
  value: TicketBuyerInput;
  onChange: (buyer: TicketBuyerInput) => void;
  required: boolean;
  idPrefix: string;
}

function IconInput({ icon, ...props }: { icon: ReactNode } & React.ComponentProps<typeof Input>) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground">
        {icon}
      </span>
      <Input className="pl-8" {...props} />
    </div>
  );
}

export function BuyerFields({ value, onChange, required, idPrefix }: BuyerFieldsProps) {
  return (
    <fieldset className="grid gap-3 rounded-lg border bg-muted/30 p-3">
      <legend className="px-1 text-sm font-medium">
        Quem está pagando{" "}
        <span className="text-xs font-normal text-muted-foreground">
          {required ? "(celular ou CPF obrigatório)" : "(opcional)"}
        </span>
      </legend>
      <div className="grid gap-1.5">
        <Label htmlFor={`${idPrefix}-name`}>Nome</Label>
        <IconInput
          id={`${idPrefix}-name`}
          icon={<User className="size-4" />}
          value={value.name}
          onChange={(event) => onChange({ ...value, name: event.target.value })}
          placeholder="Maria da Silva"
          maxLength={120}
          autoComplete="off"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor={`${idPrefix}-phone`}>Celular</Label>
          <IconInput
            id={`${idPrefix}-phone`}
            icon={<Phone className="size-4" />}
            value={value.phone}
            onChange={(event) => onChange({ ...value, phone: formatPhone(event.target.value) })}
            placeholder="(11) 98765-4321"
            inputMode="tel"
            autoComplete="off"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`${idPrefix}-document`}>CPF</Label>
          <IconInput
            id={`${idPrefix}-document`}
            icon={<IdCard className="size-4" />}
            value={value.document}
            onChange={(event) => onChange({ ...value, document: formatCpf(event.target.value) })}
            placeholder="000.000.000-00"
            inputMode="numeric"
            autoComplete="off"
          />
        </div>
      </div>
    </fieldset>
  );
}

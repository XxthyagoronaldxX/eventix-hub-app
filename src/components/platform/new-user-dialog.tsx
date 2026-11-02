"use client";

import { toast } from "sonner";
import { KeyRound, Loader2, Mail, UserPlus } from "lucide-react";
import { type FormEvent, startTransition, useActionState, useEffect, useState } from "react";
import { createPlatformUser, type CreatePlatformUserState } from "@/actions/platform-actions";
import { SelectFormField } from "@/components/form/select-form-field";
import { TextFormField } from "@/components/form/text-form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Organization } from "@/lib/api/types";
import { ROLE_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";
import { NO_ORGANIZATION } from "@/lib/validation/form-schemas";

const INITIAL_STATE: CreatePlatformUserState = {};

type PasswordMode = "email" | "manual";

const PASSWORD_MODES: { value: PasswordMode; label: string; description: string; icon: typeof Mail }[] = [
  {
    value: "email",
    label: "Enviar link por e-mail",
    description: "A pessoa recebe um link para criar a própria senha.",
    icon: Mail,
  },
  {
    value: "manual",
    label: "Definir a senha agora",
    description: "Você escolhe a senha e repassa para a pessoa.",
    icon: KeyRound,
  },
];

const ROLE_OPTIONS = (Object.keys(ROLE_LABELS) as (keyof typeof ROLE_LABELS)[]).map((role) => ({
  value: role,
  label: ROLE_LABELS[role],
}));

export function NewUserDialog({ organizations }: { organizations: Organization[] }) {
  const [open, setOpen] = useState(false);
  const [organizationId, setOrganizationId] = useState(NO_ORGANIZATION);
  const [passwordMode, setPasswordMode] = useState<PasswordMode>("email");
  const [state, formAction, isPending] = useActionState(createPlatformUser, INITIAL_STATE);
  const organizationOptions = [
    { value: NO_ORGANIZATION, label: "Sem organização" },
    ...organizations.map((organization) => ({ value: organization.id, label: organization.name })),
  ];

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state]);

  function submitKeepingValues(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isPending && setOpen(nextOpen)}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus /> Novo usuário
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <UserPlus className="size-4" aria-hidden="true" />
            </span>
            Novo usuário
          </DialogTitle>
          <DialogDescription>Crie a conta e, se quiser, já dê acesso a uma organização.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submitKeepingValues} className="grid gap-5">
          <TextFormField label="Nome" id="new-user-name" name="name" required maxLength={120} />
          <TextFormField label="E-mail" id="new-user-email" name="email" type="email" required />

          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_140px]">
            <SelectFormField
              label="Organização"
              id="new-user-organization"
              name="organizationId"
              value={organizationId}
              onValueChange={setOrganizationId}
              options={organizationOptions}
            />
            <SelectFormField
              label="Papel"
              id="new-user-role"
              name="role"
              defaultValue="member"
              disabled={organizationId === NO_ORGANIZATION}
              options={ROLE_OPTIONS}
            />
          </div>

          <fieldset className="grid min-w-0 gap-2">
            <legend className="mb-2 text-sm font-medium">Senha</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {PASSWORD_MODES.map(({ value, label, description, icon: Icon }) => (
                <label
                  key={value}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50",
                    "has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:ring-2 has-[:checked]:ring-primary/30 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                  )}
                >
                  <input
                    type="radio"
                    name="passwordMode"
                    value={value}
                    checked={passwordMode === value}
                    onChange={() => setPasswordMode(value)}
                    className="sr-only"
                  />
                  <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="grid gap-0.5">
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-xs text-muted-foreground">{description}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          {passwordMode === "manual" && (
            <TextFormField
              label="Senha inicial"
              id="new-user-password"
              name="password"
              type="password"
              autoComplete="new-password"
              hint="Pelo menos 8 caracteres, com letras e números."
              required
              minLength={8}
              maxLength={128}
            />
          )}

          <DialogFooter className="sticky bottom-0 z-10 bg-popover">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />} Criar usuário
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

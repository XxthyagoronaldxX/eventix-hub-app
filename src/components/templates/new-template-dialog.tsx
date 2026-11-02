"use client";

import { toast } from "sonner";
import { LayoutTemplate, Loader2, Plus } from "lucide-react";
import { type ComponentProps, type FormEvent, startTransition, useActionState, useState, useEffect } from "react";
import { createTemplate, type CreateTemplateState } from "@/actions/template-actions";
import { FileFormField } from "@/components/form/file-form-field";
import { TextFormField } from "@/components/form/text-form-field";
import { TemplateKindPicker } from "@/components/templates/template-kind-picker";
import type { TemplateKind } from "@/lib/api/types";
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

const INITIAL_STATE: CreateTemplateState = {};

interface NewTemplateDialogProps {
  defaultOpen?: boolean;
  triggerVariant?: ComponentProps<typeof Button>["variant"];
  triggerClassName?: string;
  defaultKind?: TemplateKind;
}

export function NewTemplateDialog({
  defaultOpen = false,
  triggerVariant,
  triggerClassName,
  defaultKind = "bingo",
}: NewTemplateDialogProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [state, formAction, isPending] = useActionState(createTemplate, INITIAL_STATE);

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
        <Button type="button" variant={triggerVariant} className={triggerClassName}>
          <Plus /> Novo template
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <LayoutTemplate className="size-4" aria-hidden="true" />
            </span>
            Novo template
          </DialogTitle>
          <DialogDescription>
            Escolha o tipo e envie a arte. Depois você posiciona os elementos no editor.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submitKeepingValues} className="grid gap-5">
          <TemplateKindPicker defaultKind={defaultKind} />
          <TextFormField
            label="Nome do template"
            id="template-name"
            name="name"
            defaultValue="Cartela padrão"
            required
            maxLength={120}
          />
          <FileFormField
            label="Imagem do template"
            id="template-image"
            name="image"
            accept="image/png,image/jpeg"
            prompt="Escolha a imagem"
            hint="PNG ou JPG, até 10 MB, com pelo menos 1000 px no menor lado."
            required
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {isPending ? "Enviando imagem…" : "Enviar e abrir o editor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

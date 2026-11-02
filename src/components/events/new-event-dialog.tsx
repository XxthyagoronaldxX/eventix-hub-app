"use client";

import { toast } from "sonner";
import { CalendarPlus, Loader2, Plus } from "lucide-react";
import { type FormEvent, startTransition, useActionState, useState, useEffect } from "react";
import { createEvent, type CreateEventState } from "@/actions/event-actions";
import { EventFields } from "@/components/events/event-fields";
import { EventKindPicker } from "@/components/events/event-kind-picker";
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

const INITIAL_STATE: CreateEventState = {};

export function NewEventDialog({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [state, formAction, isPending] = useActionState(createEvent, INITIAL_STATE);

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state]);

  function submitKeepingValues(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> Novo evento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <CalendarPlus className="size-4" aria-hidden="true" />
            </span>
            Novo evento
          </DialogTitle>
          <DialogDescription>
            Escolha o tipo do evento. Depois de criar, você escolhe o template e gera os tickets.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submitKeepingValues} className="grid gap-5">
          <EventKindPicker />
          <EventFields />
          <DialogFooter className="sticky bottom-0 z-10 bg-popover">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />} Criar evento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

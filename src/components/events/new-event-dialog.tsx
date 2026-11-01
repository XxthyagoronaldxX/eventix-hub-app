"use client";

import { toast } from "sonner";
import { CalendarPlus, Loader2, Plus } from "lucide-react";
import { type FormEvent, startTransition, useActionState, useState, useEffect } from "react";
import { createEvent, type CreateEventState } from "@/actions/event-actions";
import { EventFields } from "@/components/events/event-fields";
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <CalendarPlus className="size-4" aria-hidden="true" />
            </span>
            Novo evento
          </DialogTitle>
          <DialogDescription>Depois de criar, você escolhe o template da cartela e gera os tickets.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submitKeepingValues} className="grid gap-5">
          <EventFields />
          <DialogFooter>
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

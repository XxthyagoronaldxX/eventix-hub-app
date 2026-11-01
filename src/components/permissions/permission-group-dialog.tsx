"use client";

import { toast } from "sonner";
import { Loader2, Pencil, Plus } from "lucide-react";
import { type FormEvent, startTransition, useActionState, useState, useEffect } from "react";
import { savePermissionGroup, type SavePermissionGroupState } from "@/actions/permission-group-actions";
import { TextFormField } from "@/components/form/text-form-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Switch } from "@/components/ui/switch";
import type { PermissionGroup, Scope } from "@/lib/api/types";
import { PERMISSION_AREAS } from "@/lib/permissions";

const INITIAL_STATE: SavePermissionGroupState = {};

export function PermissionGroupDialog({ group }: { group?: PermissionGroup }) {
  const [open, setOpen] = useState(false);
  const [selectedScopes, setSelectedScopes] = useState<Set<Scope>>(() => new Set(group?.scopes ?? []));
  const [state, formAction, isPending] = useActionState(savePermissionGroup, INITIAL_STATE);

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state]);

  function toggleScope(scope: Scope, checked: boolean) {
    setSelectedScopes((current) => {
      const next = new Set(current);
      if (checked) next.add(scope);
      else next.delete(scope);
      return next;
    });
  }

  function toggleArea(scopes: Scope[], checked: boolean) {
    setSelectedScopes((current) => {
      const next = new Set(current);
      for (const scope of scopes) {
        if (checked) next.add(scope);
        else next.delete(scope);
      }
      return next;
    });
  }

  function submitKeepingValues(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.delete("scopes");
    for (const scope of selectedScopes) formData.append("scopes", scope);
    startTransition(() => formAction(formData));
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isPending && setOpen(nextOpen)}>
      <DialogTrigger asChild>
        {group ? (
          <Button variant="outline" size="sm">
            <Pencil /> Editar
          </Button>
        ) : (
          <Button>
            <Plus /> Novo grupo
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{group ? `Editar ${group.name}` : "Novo grupo de permissão"}</DialogTitle>
          <DialogDescription>
            Membros vinculados ao grupo recebem estas permissões. Admins sempre têm acesso total.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submitKeepingValues} className="grid gap-5">
          {group && <input type="hidden" name="groupId" value={group.id} />}
          <div className="grid gap-4 sm:grid-cols-2">
            <TextFormField
              label="Nome"
              id={`group-name-${group?.id ?? "new"}`}
              name="name"
              defaultValue={group?.name}
              placeholder="Caixa"
              required
              maxLength={60}
            />
            <TextFormField
              label="Descrição"
              id={`group-description-${group?.id ?? "new"}`}
              name="description"
              defaultValue={group?.description}
              placeholder="Quem recebe os pagamentos na portaria"
              maxLength={240}
            />
          </div>
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3">
            <span>
              <span className="block text-sm font-medium">Grupo padrão</span>
              <span className="block text-xs text-muted-foreground">
                Novos membros entram neste grupo automaticamente.
              </span>
            </span>
            <Switch name="isDefault" defaultChecked={group?.isDefault} />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            {PERMISSION_AREAS.map((area) => {
              const areaScopes = area.permissions.map((permission) => permission.scope);
              const selectedCount = areaScopes.filter((scope) => selectedScopes.has(scope)).length;
              const areaState =
                selectedCount === 0 ? false : selectedCount === areaScopes.length ? true : "indeterminate";
              return (
                <fieldset key={area.title} className="grid gap-2 rounded-lg border p-3">
                  <legend className="sr-only">{area.title}</legend>
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
                    <Checkbox
                      checked={areaState}
                      onCheckedChange={(checked) => toggleArea(areaScopes, checked === true)}
                    />
                    {area.title}
                    <span className="ml-auto text-xs font-normal text-muted-foreground">
                      {selectedCount}/{areaScopes.length}
                    </span>
                  </label>
                  {area.permissions.map((permission) => (
                    <label key={permission.scope} className="flex cursor-pointer items-start gap-2 pl-6">
                      <Checkbox
                        className="mt-0.5"
                        checked={selectedScopes.has(permission.scope)}
                        onCheckedChange={(checked) => toggleScope(permission.scope, checked === true)}
                      />
                      <span>
                        <span className="block text-sm">{permission.label}</span>
                        <span className="block text-xs text-muted-foreground">{permission.description}</span>
                      </span>
                    </label>
                  ))}
                </fieldset>
              );
            })}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {group ? "Salvar grupo" : "Criar grupo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

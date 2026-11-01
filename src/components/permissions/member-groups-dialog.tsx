"use client";

import { ShieldCheck } from "lucide-react";
import { changeMemberGroups } from "@/actions/permission-group-actions";
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
import type { PermissionGroup } from "@/lib/api/types";

interface MemberGroupsDialogProps {
  membershipId: string;
  memberName: string;
  groups: PermissionGroup[];
  selectedGroupIds: string[];
}

export function MemberGroupsDialog({ membershipId, memberName, groups, selectedGroupIds }: MemberGroupsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ShieldCheck /> Grupos
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Grupos de {memberName}</DialogTitle>
          <DialogDescription>O membro recebe a soma das permissões dos grupos marcados.</DialogDescription>
        </DialogHeader>
        <form action={changeMemberGroups} className="grid gap-4">
          <input type="hidden" name="membershipId" value={membershipId} />
          <div className="grid gap-2">
            {groups.map((group) => (
              <label
                key={group.id}
                className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-muted/50"
              >
                <Checkbox
                  name="groupIds"
                  value={group.id}
                  defaultChecked={selectedGroupIds.includes(group.id)}
                  className="mt-0.5"
                />
                <span>
                  <span className="block text-sm font-medium">{group.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {group.scopes.length} permissões{group.description ? ` · ${group.description}` : ""}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit">Salvar grupos</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

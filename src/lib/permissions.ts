import type { Scope } from "@/lib/api/types";

export interface PermissionDefinition {
  scope: Scope;
  label: string;
  description: string;
}

export interface PermissionArea {
  title: string;
  permissions: PermissionDefinition[];
}

export const PERMISSION_AREAS: PermissionArea[] = [
  {
    title: "Eventos",
    permissions: [
      { scope: "org:events:read", label: "Ver eventos", description: "Acessa a lista e os dados dos eventos." },
      {
        scope: "org:events:write",
        label: "Criar e editar eventos",
        description: "Cria eventos e altera data, local e valor.",
      },
    ],
  },
  {
    title: "Templates",
    permissions: [
      { scope: "org:templates:read", label: "Ver templates", description: "Acessa as artes de cartela." },
      { scope: "org:templates:write", label: "Editar templates", description: "Cria, edita e remove templates." },
    ],
  },
  {
    title: "Tickets",
    permissions: [
      { scope: "org:tickets:read", label: "Ver tickets", description: "Busca tickets e abre as cartelas." },
      { scope: "org:tickets:generate", label: "Gerar lotes", description: "Gera lotes e exporta PDF/ZIP." },
      { scope: "org:tickets:void", label: "Cancelar tickets", description: "Cancela tickets de forma definitiva." },
    ],
  },
  {
    title: "Operadores",
    permissions: [
      { scope: "org:tickets:payment", label: "Receber pagamentos", description: "Usa o caixa e confirma pagamentos." },
      { scope: "org:tickets:check-in", label: "Fazer check-in", description: "Valida tickets na entrada do evento." },
      { scope: "org:draws:run", label: "Conduzir sorteio", description: "Sorteia números e compartilha o link." },
    ],
  },
  {
    title: "Gestão",
    permissions: [
      { scope: "org:members:read", label: "Ver membros", description: "Vê membros e grupos de permissão." },
      { scope: "org:audit:read", label: "Ver auditoria", description: "Acessa o histórico de ações." },
      { scope: "org:settings:write", label: "Configurar organização", description: "Altera os dados da organização." },
    ],
  },
];

export const ASSIGNABLE_SCOPES: Scope[] = PERMISSION_AREAS.flatMap((area) =>
  area.permissions.map((permission) => permission.scope),
);

export const PERMISSION_LABELS = Object.fromEntries(
  PERMISSION_AREAS.flatMap((area) => area.permissions.map((permission) => [permission.scope, permission.label])),
) as Partial<Record<Scope, string>>;

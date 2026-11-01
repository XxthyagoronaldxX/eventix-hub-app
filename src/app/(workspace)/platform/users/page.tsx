import { UserCog } from "lucide-react";
import type { Metadata } from "next";
import { changeUserStatus } from "@/actions/platform-actions";
import { ConfirmAction } from "@/components/confirm-action";
import { EmptyState } from "@/components/empty-state";
import { FlashNotices } from "@/components/flash-notices";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { buildQueryHref, Pagination } from "@/components/pagination";
import { SearchBar } from "@/components/search-bar";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from "@/lib/api/api-client";
import type { Page, PlatformUser } from "@/lib/api/types";
import { readFlash, readSearchParam } from "@/lib/flash";
import { formatDateTime, USER_STATUS_LABELS } from "@/lib/format";
import { requireSuperAdmin } from "@/lib/workspace";

export const metadata: Metadata = { title: "Usuários" };

const PAGE_SIZE = 20;

export default async function PlatformUsersPage({ searchParams }: PageProps<"/platform/users">) {
  const currentUser = await requireSuperAdmin();
  const query = await searchParams;
  const search = readSearchParam(query, "search") ?? "";
  const page = Number(readSearchParam(query, "page") ?? 1) || 1;
  const usersPage = await apiRequest<Page<PlatformUser>>(
    buildQueryHref("/platform/users", { search, page, pageSize: PAGE_SIZE }),
  );
  const currentPath = buildQueryHref("/platform/users", { search, page });

  return (
    <PageContainer>
      <PageHeader title="Usuários" description="Todas as contas cadastradas na plataforma." />
      <FlashNotices flash={readFlash(query)} />
      <Card className="overflow-visible">
        <CardContent className="grid gap-4">
          <SearchBar name="search" defaultValue={search} placeholder="Buscar por nome ou e-mail" />
          {usersPage.items.length === 0 ? (
            <EmptyState icon={UserCog} title="Nenhum usuário encontrado" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último acesso</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersPage.items.map((user) => {
                  const isBlocked = user.status === "blocked";
                  const isCurrentUser = user.id === currentUser.user.id;
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2 font-medium">
                          {user.name}
                          {user.isSuperAdmin && <StatusBadge tone="info">SuperAdmin</StatusBadge>}
                        </div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge tone={isBlocked ? "danger" : "success"}>
                          {USER_STATUS_LABELS[user.status]}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDateTime(user.lastLoginAt)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          {!isCurrentUser && (
                            <ConfirmAction
                              triggerLabel={isBlocked ? "Desbloquear" : "Bloquear"}
                              confirmLabel={isBlocked ? "Desbloquear" : "Bloquear"}
                              question={
                                isBlocked
                                  ? `Liberar o acesso de ${user.name}?`
                                  : `Bloquear ${user.name}? As sessões ativas serão encerradas.`
                              }
                              tone={isBlocked ? "primary" : "danger"}
                              action={changeUserStatus}
                              hiddenFields={{
                                userId: user.id,
                                transition: isBlocked ? "unblock" : "block",
                                returnPath: currentPath,
                              }}
                            />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          <Pagination
            page={usersPage.page}
            pageSize={usersPage.pageSize}
            total={usersPage.total}
            buildHref={(targetPage) => buildQueryHref("/platform/users", { search, page: targetPage })}
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}

import { Building, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { FlashNotices } from "@/components/flash-notices";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { buildQueryHref, Pagination } from "@/components/pagination";
import { SearchBar } from "@/components/search-bar";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SelectInput } from "@/components/form/select-input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from "@/lib/api/api-client";
import type { OrganizationWithMetrics, Page } from "@/lib/api/types";
import { readFlash, readSearchParam } from "@/lib/flash";
import { formatDate, formatNumber, ORGANIZATION_STATUS_LABELS } from "@/lib/format";
import { requireSuperAdmin } from "@/lib/workspace";

export const metadata: Metadata = { title: "Organizações" };

const PAGE_SIZE = 20;
const ORGANIZATION_STATUS_FILTER_OPTIONS = [
  { value: "", label: "Todos os status" },
  { value: "active", label: "Ativas" },
  { value: "suspended", label: "Suspensas" },
];

export default async function PlatformOrganizationsPage({ searchParams }: PageProps<"/platform/organizations">) {
  await requireSuperAdmin();
  const query = await searchParams;
  const search = readSearchParam(query, "search") ?? "";
  const status = readSearchParam(query, "status") ?? "";
  const page = Number(readSearchParam(query, "page") ?? 1) || 1;
  const organizationsPage = await apiRequest<Page<OrganizationWithMetrics>>(
    buildQueryHref("/platform/organizations", { search, status, page, pageSize: PAGE_SIZE }),
  );

  return (
    <PageContainer>
      <PageHeader
        title="Organizações"
        description="Todas as organizações da plataforma."
        actions={
          <Button asChild>
            <Link href="/platform/organizations/new">
              <Plus /> Nova organização
            </Link>
          </Button>
        }
      />
      <FlashNotices flash={readFlash(query)} />

      <Card>
        <CardContent className="grid gap-4">
          <SearchBar name="search" defaultValue={search} placeholder="Buscar por nome ou slug">
            <SelectInput
              name="status"
              defaultValue={status}
              aria-label="Status"
              className="sm:w-44"
              options={ORGANIZATION_STATUS_FILTER_OPTIONS}
            />
          </SearchBar>

          {organizationsPage.items.length === 0 ? (
            <EmptyState icon={Building} title="Nenhuma organização encontrada" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organização</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Membros</TableHead>
                  <TableHead className="text-right">Eventos</TableHead>
                  <TableHead className="text-right">Tickets</TableHead>
                  <TableHead className="text-right">Criada em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizationsPage.items.map((organization) => (
                  <TableRow key={organization.id}>
                    <TableCell>
                      <Link
                        href={`/platform/organizations/${organization.id}`}
                        className="font-medium hover:text-primary"
                      >
                        {organization.name}
                      </Link>
                      <div className="text-xs text-muted-foreground">{organization.slug}</div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={organization.status === "active" ? "success" : "danger"}>
                        {ORGANIZATION_STATUS_LABELS[organization.status]}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(organization.metrics.memberCount)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(organization.metrics.eventCount)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(organization.metrics.ticketCount)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatDate(organization.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <Pagination
            page={organizationsPage.page}
            pageSize={organizationsPage.pageSize}
            total={organizationsPage.total}
            buildHref={(targetPage) => buildQueryHref("/platform/organizations", { search, status, page: targetPage })}
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}

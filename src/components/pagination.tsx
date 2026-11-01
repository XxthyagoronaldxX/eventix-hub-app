import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  buildHref: (page: number) => string;
}

export function Pagination({ page, pageSize, total, buildHref }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (pageCount <= 1) {
    return null;
  }
  return (
    <nav className="flex items-center justify-between gap-3 text-sm" aria-label="Paginação">
      <span className="text-muted-foreground">
        Página {page} de {pageCount} · {total} itens
      </span>
      <span className="flex gap-2">
        {page > 1 && (
          <Button variant="outline" size="sm" asChild>
            <Link href={buildHref(page - 1)}>
              <ChevronLeft /> Anterior
            </Link>
          </Button>
        )}
        {page < pageCount && (
          <Button variant="outline" size="sm" asChild>
            <Link href={buildHref(page + 1)}>
              Próxima <ChevronRight />
            </Link>
          </Button>
        )}
      </span>
    </nav>
  );
}

export function buildQueryHref(pathname: string, query: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  }
  const serializedQuery = searchParams.toString();
  return serializedQuery ? `${pathname}?${serializedQuery}` : pathname;
}

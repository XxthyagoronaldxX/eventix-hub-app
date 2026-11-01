import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface Breadcrumb {
  label: string;
  href: string;
}

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  breadcrumbs?: Breadcrumb[];
  actions?: ReactNode;
}

export function PageHeader({ title, description, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 space-y-1.5">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Navegação" className="flex items-center gap-1 text-sm text-muted-foreground">
            {breadcrumbs.map((breadcrumb) => (
              <span key={breadcrumb.href} className="flex items-center gap-1">
                <Link href={breadcrumb.href} className="transition-colors hover:text-foreground">
                  {breadcrumb.label}
                </Link>
                <ChevronRight className="size-3.5" aria-hidden="true" />
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <div className="text-sm text-muted-foreground">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

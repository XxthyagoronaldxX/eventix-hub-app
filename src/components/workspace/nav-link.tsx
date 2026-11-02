"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";

function isLinkActive(href: string, currentPath: string, exact: boolean, activePrefixes: string[]): boolean {
  if (exact) {
    return currentPath === href;
  }
  return [href, ...activePrefixes].some((prefix) => currentPath === prefix || currentPath.startsWith(`${prefix}/`));
}

function closeEnclosingMobileMenu(event: MouseEvent<HTMLAnchorElement>) {
  event.currentTarget.closest("details")?.removeAttribute("open");
}

interface NavLinkProps {
  href: string;
  label: string;
  icon: ReactNode;
  exact?: boolean;
  activePrefixes?: string[];
}

export function NavLink({ href, label, icon, exact = false, activePrefixes = [] }: NavLinkProps) {
  const isActive = isLinkActive(href, usePathname(), exact, activePrefixes);
  return (
    <Link
      href={href}
      title={label}
      aria-current={isActive ? "page" : undefined}
      onClick={closeEnclosingMobileMenu}
      className={cn(
        "group/nav relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        "lg:group-data-[sidebar-collapsed=true]/shell:justify-center lg:group-data-[sidebar-collapsed=true]/shell:px-0",
        isActive &&
          "bg-sidebar-accent font-medium text-sidebar-accent-foreground before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-primary",
      )}
    >
      {icon}
      <span className="truncate lg:group-data-[sidebar-collapsed=true]/shell:sr-only">{label}</span>
    </Link>
  );
}

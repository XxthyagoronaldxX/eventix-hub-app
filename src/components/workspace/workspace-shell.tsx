"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { createContext, type ReactNode, use, useCallback, useEffect, useState } from "react";
import { serializeSidebarPreference } from "@/lib/sidebar-preference";
import { cn } from "@/lib/utils";

interface SidebarCollapseState {
  isCollapsed: boolean;
  toggle: () => void;
}

const SidebarCollapseContext = createContext<SidebarCollapseState | null>(null);

const TOGGLE_SHORTCUT_KEY = "b";

interface WorkspaceShellProps {
  initiallyCollapsed: boolean;
  sidebar: ReactNode;
  children: ReactNode;
}

export function WorkspaceShell({ initiallyCollapsed, sidebar, children }: WorkspaceShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(initiallyCollapsed);

  const toggle = useCallback(() => {
    setIsCollapsed((wasCollapsed) => {
      document.cookie = serializeSidebarPreference(!wasCollapsed);
      return !wasCollapsed;
    });
  }, []);

  useEffect(() => {
    function toggleOnShortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === TOGGLE_SHORTCUT_KEY) {
        event.preventDefault();
        toggle();
      }
    }
    window.addEventListener("keydown", toggleOnShortcut);
    return () => window.removeEventListener("keydown", toggleOnShortcut);
  }, [toggle]);

  return (
    <SidebarCollapseContext value={{ isCollapsed, toggle }}>
      <div
        data-sidebar-collapsed={isCollapsed}
        className={cn(
          "group/shell min-h-screen lg:grid lg:transition-[grid-template-columns] lg:duration-200",
          isCollapsed ? "lg:grid-cols-[72px_minmax(0,1fr)]" : "lg:grid-cols-[264px_minmax(0,1fr)]",
        )}
      >
        {sidebar}
        <main className="min-w-0 px-4 py-8 sm:px-8 lg:px-10">{children}</main>
      </div>
    </SidebarCollapseContext>
  );
}

export function SidebarCollapseButton() {
  const collapseState = use(SidebarCollapseContext);
  if (!collapseState) {
    return null;
  }
  const label = collapseState.isCollapsed ? "Expandir menu" : "Recolher menu";
  const Icon = collapseState.isCollapsed ? PanelLeftOpen : PanelLeftClose;
  return (
    <button
      type="button"
      onClick={collapseState.toggle}
      title={`${label} (Ctrl+B)`}
      aria-label={label}
      aria-expanded={!collapseState.isCollapsed}
      className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  );
}

export const SIDEBAR_COLLAPSED_COOKIE = "evx_sidebar_collapsed";

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export function serializeSidebarPreference(isCollapsed: boolean): string {
  return `${SIDEBAR_COLLAPSED_COOKIE}=${isCollapsed ? "1" : "0"}; path=/; max-age=${ONE_YEAR_IN_SECONDS}; samesite=lax`;
}

export function isSidebarCollapsedValue(cookieValue: string | undefined): boolean {
  return cookieValue === "1";
}

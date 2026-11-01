export interface Flash {
  notice?: string;
  error?: string;
  link?: string;
}

export const FLASH_KEYS = ["notice", "error", "link"] as const;

export type SearchParams = Record<string, string | string[] | undefined>;

export function withFlash(path: string, flash: Flash): string {
  const [pathname, existingQuery = ""] = path.split("?");
  const query = new URLSearchParams(existingQuery);
  for (const key of FLASH_KEYS) {
    query.delete(key);
    const value = flash[key];
    if (value) {
      query.set(key, value);
    }
  }
  const serializedQuery = query.toString();
  return serializedQuery ? `${pathname}?${serializedQuery}` : pathname;
}

export function readFlash(searchParams: SearchParams): Flash {
  return {
    notice: readSearchParam(searchParams, "notice"),
    error: readSearchParam(searchParams, "error"),
    link: readSearchParam(searchParams, "link"),
  };
}

export function readSearchParam(searchParams: SearchParams, key: string): string | undefined {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

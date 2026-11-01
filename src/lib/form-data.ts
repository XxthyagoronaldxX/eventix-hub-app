export function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function readOptionalText(formData: FormData, key: string): string | undefined {
  return readText(formData, key) || undefined;
}

export function readInteger(formData: FormData, key: string): number {
  return Number.parseInt(readText(formData, key), 10);
}

export function readFile(formData: FormData, key: string): File | null {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

export function safeInternalPath(candidatePath: string | undefined, fallbackPath: string): string {
  if (!candidatePath || !candidatePath.startsWith("/") || candidatePath.startsWith("//")) {
    return fallbackPath;
  }
  return candidatePath;
}

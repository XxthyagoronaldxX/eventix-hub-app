export function apiUrl(path: string): string {
  const baseUrl = process.env.API_URL;
  if (!baseUrl) {
    throw new Error("API_URL is not configured");
  }
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

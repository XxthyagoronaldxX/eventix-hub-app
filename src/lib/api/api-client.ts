import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiUrl } from "@/lib/api/api-url";
import { ACCESS_TOKEN_COOKIE } from "@/lib/session/session-cookies";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  organizationId?: string;
  authenticated?: boolean;
}

const FALLBACK_ERROR_MESSAGE = "Não foi possível concluir a operação. Tente novamente.";

export async function apiRequest<TResponse>(path: string, options: ApiRequestOptions = {}): Promise<TResponse> {
  const response = await sendToApi(path, options);
  if (response.status === 204) {
    return undefined as TResponse;
  }
  return (await response.json()) as TResponse;
}

export async function apiRequestRaw(path: string, options: ApiRequestOptions = {}): Promise<Response> {
  return sendToApi(path, options);
}

async function sendToApi(path: string, options: ApiRequestOptions): Promise<Response> {
  const headers = new Headers();
  if (options.authenticated !== false) {
    const accessToken = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
    if (accessToken) {
      headers.set("authorization", `Bearer ${accessToken}`);
    }
  }
  if (options.organizationId) {
    headers.set("x-org-id", options.organizationId);
  }

  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(options.body);
  }

  const response = await fetch(apiUrl(path), {
    method: options.method ?? "GET",
    headers,
    body,
    cache: "no-store",
  });

  if (response.status === 401 && options.authenticated !== false) {
    redirect("/login");
  }
  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response));
  }
  return response;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: unknown };
    if (Array.isArray(payload.message)) {
      return payload.message.join(". ");
    }
    if (typeof payload.message === "string") {
      return payload.message;
    }
  } catch {
    return FALLBACK_ERROR_MESSAGE;
  }
  return FALLBACK_ERROR_MESSAGE;
}

export type Attempt<TValue> = { ok: true; value: TValue } | { ok: false; message: string; status: number };

export async function attempt<TValue>(operation: () => Promise<TValue>): Promise<Attempt<TValue>> {
  try {
    return { ok: true, value: await operation() };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, message: error.message, status: error.status };
    }
    throw error;
  }
}

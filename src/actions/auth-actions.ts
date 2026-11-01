"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiRequest, attempt } from "@/lib/api/api-client";
import { withFlash } from "@/lib/flash";
import { readText, safeInternalPath } from "@/lib/form-data";
import {
  ACCESS_TOKEN_COOKIE,
  ACTIVE_ORGANIZATION_COOKIE,
  type AuthTokens,
  REFRESH_TOKEN_COOKIE,
  writeActiveOrganizationCookie,
  writeSessionCookies,
} from "@/lib/session/session-cookies";
import {
  acceptInvitationSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from "@/lib/validation/form-schemas";
import { parseFormData } from "@/lib/validation/zod";

export async function login(formData: FormData) {
  const nextPath = safeInternalPath(readText(formData, "next"), "/dashboard");
  const loginPath = `/login?next=${encodeURIComponent(nextPath)}`;
  const form = parseFormData(loginSchema, formData);
  if (!form.ok) {
    redirect(withFlash(loginPath, { error: form.message }));
  }
  const result = await attempt(() =>
    apiRequest<AuthTokens>("/auth/login", {
      method: "POST",
      authenticated: false,
      body: { email: form.data.email, password: form.data.password },
    }),
  );
  if (!result.ok) {
    redirect(withFlash(loginPath, { error: result.message }));
  }
  writeSessionCookies(await cookies(), result.value);
  redirect(nextPath);
}

export async function logout() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  if (refreshToken) {
    await attempt(() => apiRequest("/auth/logout", { method: "POST", authenticated: false, body: { refreshToken } }));
  }
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
  cookieStore.delete(ACTIVE_ORGANIZATION_COOKIE);
  redirect("/login");
}

export async function requestPasswordReset(formData: FormData) {
  const form = parseFormData(forgotPasswordSchema, formData);
  if (!form.ok) {
    redirect(withFlash("/forgot-password", { error: form.message }));
  }
  const result = await attempt(() =>
    apiRequest<{ resetUrl?: string }>("/auth/forgot-password", {
      method: "POST",
      authenticated: false,
      body: form.data,
    }),
  );
  if (!result.ok) {
    redirect(withFlash("/forgot-password", { error: result.message }));
  }
  redirect(
    withFlash("/forgot-password", {
      notice: "Se o e-mail estiver cadastrado, enviaremos um link para redefinir a senha.",
      link: result.value.resetUrl,
    }),
  );
}

export async function resetPassword(formData: FormData) {
  const resetPath = `/reset-password?token=${encodeURIComponent(readText(formData, "token"))}`;
  const form = parseFormData(resetPasswordSchema, formData);
  if (!form.ok) {
    redirect(withFlash(resetPath, { error: form.message }));
  }
  const result = await attempt(() =>
    apiRequest("/auth/reset-password", {
      method: "POST",
      authenticated: false,
      body: { token: form.data.token, password: form.data.password },
    }),
  );
  if (!result.ok) {
    redirect(withFlash(resetPath, { error: result.message }));
  }
  redirect(withFlash("/login", { notice: "Senha redefinida. Entre com a nova senha." }));
}

export async function acceptInvitation(formData: FormData) {
  const invitationPath = `/invitations/${encodeURIComponent(readText(formData, "token"))}`;
  const form = parseFormData(acceptInvitationSchema, formData);
  if (!form.ok) {
    redirect(withFlash(invitationPath, { error: form.message }));
  }
  const result = await attempt(() =>
    apiRequest<AuthTokens & { organizationId: string }>(`/auth/invitations/${form.data.token}/accept`, {
      method: "POST",
      authenticated: false,
      body: { name: form.data.name || undefined, password: form.data.password },
    }),
  );
  if (!result.ok) {
    redirect(withFlash(invitationPath, { error: result.message }));
  }
  const cookieStore = await cookies();
  writeSessionCookies(cookieStore, result.value);
  writeActiveOrganizationCookie(cookieStore, result.value.organizationId);
  redirect(withFlash("/dashboard", { notice: "Convite aceito. Bem-vindo!" }));
}

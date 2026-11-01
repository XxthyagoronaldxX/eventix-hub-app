import { z } from "zod";

z.config(z.locales.pt());

export { z };

export type ParsedForm<TData> =
  { ok: true; data: TData } | { ok: false; message: string; fieldErrors: Record<string, string> };

function formDataToObject(formData: FormData): Record<string, FormDataEntryValue> {
  const values: Record<string, FormDataEntryValue> = {};
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("$ACTION")) {
      values[key] = typeof value === "string" ? value.trim() : value;
    }
  }
  return values;
}

export function firstIssueMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Verifique os dados informados.";
}

export function parseFormData<TSchema extends z.ZodType>(
  schema: TSchema,
  formData: FormData,
): ParsedForm<z.output<TSchema>> {
  const result = schema.safeParse(formDataToObject(formData));
  if (result.success) {
    return { ok: true, data: result.data };
  }
  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const fieldName = issue.path.join(".");
    fieldErrors[fieldName] ??= issue.message;
  }
  return { ok: false, message: firstIssueMessage(result.error), fieldErrors };
}

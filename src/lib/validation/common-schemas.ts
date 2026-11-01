import { z } from "./zod";

export const MINIMUM_PASSWORD_LENGTH = 8;
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const emailSchema = z.email({ error: "Informe um e-mail válido." }).toLowerCase();

export const requiredTextSchema = (fieldLabel: string, maximumLength: number) =>
  z
    .string()
    .trim()
    .min(1, { error: `Informe ${fieldLabel}.` })
    .max(maximumLength, { error: `${capitalize(fieldLabel)} pode ter no máximo ${maximumLength} caracteres.` });

export const optionalTextSchema = (maximumLength: number) => z.string().trim().max(maximumLength).default("");

export const strongPasswordSchema = z
  .string()
  .min(MINIMUM_PASSWORD_LENGTH, { error: `A senha precisa ter pelo menos ${MINIMUM_PASSWORD_LENGTH} caracteres.` })
  .max(128)
  .regex(/(?=.*[A-Za-z])(?=.*\d)/, { error: "A senha precisa ter letras e números." });

export const objectIdSchema = z.string().regex(/^[a-f0-9]{24}$/i, { error: "Identificador inválido." });

export const slugSchema = z
  .string()
  .trim()
  .max(60)
  .regex(SLUG_PATTERN, { error: "Use apenas letras minúsculas, números e hífens no slug." });

export const organizationRoleSchema = z.enum(["admin", "member"], { error: "Escolha um papel válido." });

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

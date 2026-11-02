import {
  emailSchema,
  objectIdSchema,
  optionalTextSchema,
  organizationRoleSchema,
  requiredTextSchema,
  slugSchema,
  strongPasswordSchema,
} from "./common-schemas";
import { z } from "./zod";

export const MAXIMUM_TICKETS_PER_BATCH = 10_000;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: "Informe a senha." }),
  next: z.string().optional(),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: strongPasswordSchema,
    passwordConfirmation: z.string(),
  })
  .refine((values) => values.password === values.passwordConfirmation, {
    error: "As senhas não conferem.",
    path: ["passwordConfirmation"],
  });

export const acceptInvitationSchema = z.object({
  token: z.string().min(1),
  name: z.string().trim().max(120).optional(),
  password: z.string().min(1, { error: "Informe a senha." }),
});

export const organizationSettingsSchema = z.object({
  name: requiredTextSchema("o nome da organização", 120),
});

export const createOrganizationSchema = z.object({
  name: requiredTextSchema("o nome da organização", 120),
  slug: slugSchema,
  adminEmail: emailSchema,
});

export const updateOrganizationSchema = z.object({
  organizationId: objectIdSchema,
  name: requiredTextSchema("o nome da organização", 120),
  slug: slugSchema,
});

export const inviteMemberSchema = z.object({
  email: emailSchema,
  role: organizationRoleSchema,
});

export const changeMemberRoleSchema = z.object({
  membershipId: objectIdSchema,
  role: organizationRoleSchema,
});

const eventFieldsSchema = z.object({
  name: requiredTextSchema("o nome do evento", 160),
  startsAt: z
    .string()
    .min(1, { error: "Informe a data e a hora do evento." })
    .refine((value) => !Number.isNaN(Date.parse(value)), { error: "Informe uma data válida." })
    .transform((value) => new Date(value).toISOString()),
  location: optionalTextSchema(200),
  description: optionalTextSchema(2000),
  ticketPrice: z
    .string()
    .trim()
    .transform((value) => (value === "" ? 0 : Number(value.replace(",", "."))))
    .pipe(
      z
        .number({ error: "Informe um valor válido." })
        .min(0, { error: "O valor não pode ser negativo." })
        .max(100_000, { error: "O valor máximo é R$ 100.000,00." }),
    ),
});

export const createEventSchema = eventFieldsSchema.extend({
  kind: z.enum(["bingo", "tickets", "raffle"], { error: "Escolha o tipo do evento." }),
});

export const updateEventSchema = eventFieldsSchema.extend({
  eventId: objectIdSchema,
  kind: z.enum(["bingo", "tickets", "raffle"], { error: "Escolha o tipo do evento." }).optional(),
  status: z.enum(["draft", "active", "archived"], { error: "Escolha um status válido." }),
});

export const createTicketBatchSchema = z.object({
  eventId: objectIdSchema,
  templateId: objectIdSchema.or(z.literal("")).refine(Boolean, { error: "Escolha um template." }),
  quantity: z.coerce
    .number({ error: "Informe a quantidade de tickets." })
    .int({ error: "A quantidade precisa ser um número inteiro." })
    .min(1, { error: "Gere pelo menos 1 ticket." })
    .max(MAXIMUM_TICKETS_PER_BATCH, { error: `Cada lote pode ter no máximo ${MAXIMUM_TICKETS_PER_BATCH} tickets.` }),
});

export const requestExportSchema = z.object({
  batchId: objectIdSchema,
  format: z.enum(["pdf", "zip"], { error: "Escolha um formato válido." }),
  ticketsPerPage: z.coerce
    .number()
    .pipe(z.union([z.literal(1), z.literal(2), z.literal(4)]))
    .default(1),
});

export const templateNameSchema = requiredTextSchema("o nome do template", 120);

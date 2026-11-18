import { z } from "zod";

const emailField = z
  .string()
  .trim()
  .email("E-mail inválido.")
  .transform((value) => value.toLowerCase());

export const strongPasswordSchema = z
  .string()
  .min(8, "A senha deve ter pelo menos 8 caracteres.")
  .max(128, "Senha muito longa.")
  .regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula.")
  .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula.")
  .regex(/[0-9]/, "A senha deve conter pelo menos um número.");

const baseRegisterFields = {
  name: z
    .string()
    .trim()
    .min(2, "Informe seu nome completo.")
    .max(120, "Nome muito longo."),
  email: emailField,
  password: strongPasswordSchema,
  acceptedTerms: z.literal(true, {
    message: "Você precisa aceitar os Termos de Uso.",
  }),
  acceptedPrivacy: z.literal(true, {
    message: "Você precisa aceitar a Política de Privacidade.",
  }),
};

const studentRegisterSchema = z.object({
  ...baseRegisterFields,
  role: z.literal("ESTUDANTE"),
  inviteCode: z
    .string()
    .trim()
    .min(3, "Informe o código da turma.")
    .max(64, "Código da turma inválido.")
    .transform((value) => value.toUpperCase()),
});

const educatorRegisterSchema = z.object({
  ...baseRegisterFields,
  role: z.literal("EDUCADOR"),
  institutionCode: z
    .string()
    .trim()
    .min(3, "Informe o código da instituição.")
    .max(64, "Código da instituição inválido.")
    .transform((value) => value.toUpperCase()),
  acceptedSigilo: z.literal(true, {
    message: "Educadores precisam aceitar o Termo de Compromisso e Sigilo.",
  }),
});

export const registerSchema = z.discriminatedUnion("role", [
  studentRegisterSchema,
  educatorRegisterSchema,
]);

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Informe sua senha."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const resetRequestSchema = z.object({
  email: emailField,
});

export type ResetRequestInput = z.infer<typeof resetRequestSchema>;

export const resetConfirmSchema = z.object({
  token: z.string().trim().min(16, "Token de recuperação inválido."),
  newPassword: strongPasswordSchema,
});

export type ResetConfirmInput = z.infer<typeof resetConfirmSchema>;

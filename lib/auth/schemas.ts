import { z } from "zod";

export const loginSchema = z.object({
  email: z.email({ message: "Informe um e-mail válido." }),
  password: z.string().min(1, { message: "Informe sua senha." }),
});

export const forgotPasswordSchema = z.object({
  email: z.email({ message: "Informe um e-mail válido." }),
});

export const passwordPolicySchema = z
  .string()
  .min(8, { message: "A senha deve ter no mínimo 8 caracteres." })
  .regex(/[A-Za-z]/, { message: "A senha deve conter pelo menos uma letra." })
  .regex(/\d/, { message: "A senha deve conter pelo menos um número." });

export const resetPasswordSchema = z.object({
  password: passwordPolicySchema,
});

export const activateAccountSchema = z
  .object({
    temporaryPassword: z
      .string()
      .min(1, { message: "Informe sua senha temporária." }),
    password: passwordPolicySchema,
    confirmPassword: z
      .string()
      .min(1, { message: "Confirme sua nova senha." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.password !== data.temporaryPassword, {
    message: "A nova senha deve ser diferente da senha temporária.",
    path: ["password"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ActivateAccountInput = z.infer<typeof activateAccountSchema>;

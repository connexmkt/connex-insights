import { z } from "zod";

export const loginSchema = z.object({
  email: z.email({ message: "Informe um e-mail válido." }),
  password: z.string().min(1, { message: "Informe sua senha." }),
});

export const forgotPasswordSchema = z.object({
  email: z.email({ message: "Informe um e-mail válido." }),
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, { message: "A senha deve ter no mínimo 8 caracteres." })
    .regex(/[A-Za-z]/, { message: "A senha deve conter pelo menos uma letra." })
    .regex(/\d/, { message: "A senha deve conter pelo menos um número." }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

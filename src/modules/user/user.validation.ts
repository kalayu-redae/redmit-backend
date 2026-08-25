import { z } from "zod";

export const registerSchema = z.object({
    email: z
        .string()
        .trim()
        .email("Invalid email address")
        .transform((value) => value.toLowerCase()),

    phone: z
        .string()
        .trim()
        .regex(
            /^\+?[1-9]\d{1,14}$/,
            "Invalid phone number"
        ),

    username: z
        .string()
        .trim()
        .min(3, "Username must be at least 3 characters")
        .max(30, "Username must not exceed 30 characters")
        .regex(
            /^[a-zA-Z0-9_]+$/,
            "Username can only contain letters, numbers, and underscores"
        )
        .transform((value) => value.toLowerCase()),

    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(100, "Password must not exceed 100 characters"),

    fullName: z
        .string()
        .trim()
        .min(2, "Full name must be at least 2 characters")
        .max(100, "Full name must not exceed 100 characters")
        .optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
    email: z
        .string()
        .trim()
        .email("Invalid email address")
        .transform((value) => value.toLowerCase())
        .optional(),
    username: z
        .string()
        .trim()
        .optional(),
    phone: z
        .string()
        .trim()
        .regex(
            /^\+?[1-9]\d{1,14}$/,
            "Invalid phone number"
        )
        .optional(),

    password: z
        .string()
        .min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;
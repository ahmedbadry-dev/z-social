import { z } from "zod"

export const signUpSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password cannot exceed 100 characters"),
})

export const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
})

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export const otpSchema = z.object({
  otp: z
    .string()
    .length(4, "OTP must be 4 digits")
    .regex(/^\d+$/, "OTP must contain only digits"),
})

export const createPostSchema = z.object({
  content: z
    .string()
    .min(1, "Post cannot be empty")
    .max(500, "Post cannot exceed 500 characters"),
  mediaUrl: z.string().url().optional(),
  mediaType: z.enum(["image", "video"]).optional(),
})

export const editPostSchema = z.object({
  content: z
    .string()
    .min(1, "Post cannot be empty")
    .max(500, "Post cannot exceed 500 characters"),
})

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(300, "Comment cannot exceed 300 characters"),
})

export const sendMessageSchema = z.object({
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(1000, "Message cannot exceed 1000 characters"),
})

export const generalSettingsSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username cannot exceed 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    )
    .optional()
    .or(z.literal("")),
  bio: z
    .string()
    .max(160, "Bio cannot exceed 160 characters")
    .optional()
    .or(z.literal("")),
})

export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type OTPInput = z.infer<typeof otpSchema>
export type CreatePostInput = z.infer<typeof createPostSchema>
export type EditPostInput = z.infer<typeof editPostSchema>
export type CreateCommentInput = z.infer<typeof createCommentSchema>
export type SendMessageInput = z.infer<typeof sendMessageSchema>
export type GeneralSettingsInput = z.infer<typeof generalSettingsSchema>

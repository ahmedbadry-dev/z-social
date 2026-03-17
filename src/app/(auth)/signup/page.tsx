"use client"

import Link from "next/link"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { AuthCard } from "@/components/auth/auth-card"
import { AuthLayoutWrapper } from "@/components/auth/auth-layout-wrapper"
import { EmailButton } from "@/components/auth/email-button"
import { GoogleButton } from "@/components/auth/google-button"
import { OrDivider } from "@/components/auth/or-divider"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"
import { signUpSchema } from "@/lib/validations"

const signupSchema = signUpSchema.extend({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username cannot exceed 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores"),
  terms: z.boolean().refine((value) => value === true, {
    message: "You must accept the terms",
  }),
})

type SignupInput = z.infer<typeof signupSchema>

export default function SignupPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      username: "",
      password: "",
      terms: false,
    },
  })

  const onSubmit = async (data: SignupInput) => {
    const signUpPayload = {
      email: data.email,
      password: data.password,
      name: data.name,
      username: data.username,
    }

    const result = await authClient.signUp.email(signUpPayload)
    if (result.error) {
      toast.error(result.error.message ?? "Could not create account")
      return
    }

    router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`)
  }

  const onGoogleClick = async () => {
    setGoogleLoading(true)
    try {
      await authClient.signIn.social({ provider: "google", callbackURL: "/feed" })
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <AuthLayoutWrapper>
      <AuthCard>
        <div className="space-y-4">
          <GoogleButton
            label="Sign up with Google"
            onClick={onGoogleClick}
            isLoading={googleLoading}
          />
          <EmailButton
            label="Log in with Email"
            onClick={() => router.push("/login-with-email")}
          />
          <OrDivider />
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="name" className="text-[#0F172A]">
                      Name
                    </FieldLabel>
                    <Input
                      {...field}
                      id="name"
                      aria-invalid={fieldState.invalid}
                      className="h-10 border-neutral-200 bg-white focus-visible:border-[#3B55E6] focus-visible:ring-0"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="email" className="text-[#0F172A]">
                      Email
                    </FieldLabel>
                    <Input
                      {...field}
                      id="email"
                      type="email"
                      aria-invalid={fieldState.invalid}
                      className="h-10 border-neutral-200 bg-white focus-visible:border-[#3B55E6] focus-visible:ring-0"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="username"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="username" className="text-[#0F172A]">
                      Username
                    </FieldLabel>
                    <Input
                      {...field}
                      id="username"
                      aria-invalid={fieldState.invalid}
                      className="h-10 border-neutral-200 bg-white focus-visible:border-[#3B55E6] focus-visible:ring-0"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="password" className="text-[#0F172A]">
                      Password
                    </FieldLabel>
                    <div className="relative">
                      <Input
                        {...field}
                        id="password"
                        type={showPassword ? "text" : "password"}
                        aria-invalid={fieldState.invalid}
                        className="h-10 border-neutral-200 bg-white pr-10 focus-visible:border-[#3B55E6] focus-visible:ring-0"
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-[#64748B]"
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="terms"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} orientation="horizontal">
                    <Checkbox
                      id="terms"
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                      aria-invalid={fieldState.invalid}
                    />
                    <div className="space-y-1">
                      <FieldLabel htmlFor="terms" className="text-sm text-[#0F172A]">
                        I agree to the{" "}
                        <Link href="#" className="text-[#3B55E6] hover:underline">
                          Terms
                        </Link>{" "}
                        and{" "}
                        <Link href="#" className="text-[#3B55E6] hover:underline">
                          Privacy Policy
                        </Link>
                        .
                      </FieldLabel>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </div>
                  </Field>
                )}
              />
            </FieldGroup>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="h-11 w-full bg-[#0F172A] text-white hover:bg-[#1E293B]"
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Continue"
              )}
            </Button>
          </form>
          <p className="text-center text-sm text-[#64748B]">
            Have an account?{" "}
            <Link href="/login" className="font-medium text-[#3B55E6] hover:underline">
              Log In
            </Link>
          </p>
        </div>
      </AuthCard>
    </AuthLayoutWrapper>
  )
}

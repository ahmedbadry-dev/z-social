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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  })

  // Check email existence on blur
  const handleEmailBlur = async (email: string) => {
    if (!email || !email.includes("@")) return
    setIsCheckingEmail(true)
    setEmailError(null)
    try {
      await fetch(`/api/check-email?email=${encodeURIComponent(email)}`)
      // We'll use convex directly via authClient check — simpler approach:
      // just let the server return the error on submit
      // The real check happens in onSubmit via result.error
    } catch {
      // silently ignore
    } finally {
      setIsCheckingEmail(false)
    }
  }

  const onSubmit = async (data: SignupInput) => {
    setEmailError(null)
    const signUpPayload = {
      email: data.email,
      password: data.password,
      name: data.name,
      username: data.username,
    }

    const result = await authClient.signUp.email(signUpPayload)
    if (result.error) {
      const msg = result.error.message ?? ""
      if (
        msg.toLowerCase().includes("email") &&
        (msg.toLowerCase().includes("exist") ||
          msg.toLowerCase().includes("already") ||
          msg.toLowerCase().includes("taken"))
      ) {
        setEmailError("This email is already registered. Try logging in instead.")
        form.setError("email", { message: "This email is already registered." })
      } else {
        toast.error(msg || "Could not create account")
      }
      return
    }

    if (typeof window !== "undefined") {
      const trimmedUsername = data.username.trim()
      if (trimmedUsername) {
        localStorage.setItem("pending-username", trimmedUsername)
        localStorage.setItem("pending-email", data.email.trim().toLowerCase())
      }
    }

    const otpResult = await authClient.$fetch("/email-otp/send-verification-otp", {
      method: "POST",
      body: {
        email: data.email,
        type: "email-verification",
      },
    })

    if (otpResult?.error) {
      toast.error("We couldn't send a verification code. Please resend on the next screen.")
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

  const inputClass = "h-10 border-border bg-card focus-visible:border-[#3B55E6] focus-visible:ring-0"

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
                    <FieldLabel htmlFor="name" className="text-foreground">
                      Name
                    </FieldLabel>
                    <Input
                      {...field}
                      id="name"
                      aria-invalid={fieldState.invalid}
                      className={inputClass}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || !!emailError}>
                    <FieldLabel htmlFor="email" className="text-foreground">
                      Email
                    </FieldLabel>
                    <div className="relative">
                      <Input
                        {...field}
                        id="email"
                        type="email"
                        aria-invalid={fieldState.invalid || !!emailError}
                        className={inputClass}
                        onBlur={(e) => {
                          field.onBlur()
                          void handleEmailBlur(e.target.value)
                        }}
                      />
                      {isCheckingEmail && (
                        <Loader2 className="absolute top-1/2 right-3 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    {emailError && !fieldState.invalid && (
                      <p className="mt-1 text-xs text-destructive">{emailError}</p>
                    )}
                  </Field>
                )}
              />
              <Controller
                name="username"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="username" className="text-foreground">
                      Username
                    </FieldLabel>
                    <Input
                      {...field}
                      id="username"
                      aria-invalid={fieldState.invalid}
                      className={inputClass}
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
                    <FieldLabel htmlFor="password" className="text-foreground">
                      Password
                    </FieldLabel>
                    <div className="relative">
                      <Input
                        {...field}
                        id="password"
                        type={showPassword ? "text" : "password"}
                        aria-invalid={fieldState.invalid}
                        className={`${inputClass} pr-10`}
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="confirmPassword"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="confirmPassword" className="text-foreground">
                      Confirm password
                    </FieldLabel>
                    <div className="relative">
                      <Input
                        {...field}
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        aria-invalid={fieldState.invalid}
                        className={`${inputClass} pr-10`}
                      />
                      <button
                        type="button"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                      >
                        {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
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
                      <FieldLabel htmlFor="terms" className="text-sm text-foreground">
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
              className="h-11 w-full bg-foreground text-background hover:bg-foreground/90"
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Continue"
              )}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
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

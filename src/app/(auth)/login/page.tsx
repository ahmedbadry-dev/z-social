"use client"

import Link from "next/link"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { AuthCard } from "@/components/auth/auth-card"
import { AuthLayoutWrapper } from "@/components/auth/auth-layout-wrapper"
import { EmailButton } from "@/components/auth/email-button"
import { GoogleButton } from "@/components/auth/google-button"
import { OrDivider } from "@/components/auth/or-divider"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"
import { signInSchema, type SignInInput } from "@/lib/validations"

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: SignInInput) => {
    const result = await authClient.signIn.email({
      email: data.email,
      password: data.password,
    })

    if (result.error) {
      toast.error(result.error.message ?? "Invalid email or password")
      return
    }

    router.push("/feed")
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
            label="Log in with Google"
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
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="email" className="text-foreground">
                      Email
                    </FieldLabel>
                    <Input
                      {...field}
                      id="email"
                      type="email"
                      aria-invalid={fieldState.invalid}
                      className="h-10 border-border bg-card focus-visible:border-[#3B55E6] focus-visible:ring-0"
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
                        className="h-10 border-border bg-card pr-10 focus-visible:border-[#3B55E6] focus-visible:ring-0"
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground"
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
            </FieldGroup>
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Forget Password?
              </Link>
            </div>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="h-11 w-full bg-foreground text-background hover:bg-foreground/90"
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Log in"
              )}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-[#3B55E6] hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </AuthCard>
    </AuthLayoutWrapper>
  )
}

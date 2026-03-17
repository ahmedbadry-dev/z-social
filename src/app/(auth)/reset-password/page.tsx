"use client"

import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { AuthCard } from "@/components/auth/auth-card"
import { AuthLayoutWrapper } from "@/components/auth/auth-layout-wrapper"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (data: ResetPasswordInput) => {
    if (!token) {
      toast.error("Invalid or missing reset token")
      return
    }

    const result = await authClient.resetPassword({
      newPassword: data.password,
      token,
    })

    if (result?.error) {
      toast.error(result.error.message ?? "Could not reset password")
      return
    }

    toast.success("Password reset successfully")
    router.push("/login")
  }

  return (
    <AuthLayoutWrapper>
      <AuthCard className="space-y-5">
        <h1 className="text-2xl font-semibold text-[#0F172A]">Reset Password</h1>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="password" className="text-[#0F172A]">
                    New password
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
                  <FieldLabel htmlFor="confirmPassword" className="text-[#0F172A]">
                    Confirm password
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      {...field}
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      aria-invalid={fieldState.invalid}
                      className="h-10 border-neutral-200 bg-white pr-10 focus-visible:border-[#3B55E6] focus-visible:ring-0"
                    />
                    <button
                      type="button"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-[#64748B]"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                    >
                      {showConfirmPassword ? (
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
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="h-11 w-full bg-[#0F172A] text-white hover:bg-[#1E293B]"
          >
            {form.formState.isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Reset password"
            )}
          </Button>
        </form>
      </AuthCard>
    </AuthLayoutWrapper>
  )
}

"use client"

import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { AuthCard } from "@/components/auth/auth-card"
import { AuthLayoutWrapper } from "@/components/auth/auth-layout-wrapper"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
})

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const router = useRouter()
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (data: ForgotPasswordInput) => {
    const result = await authClient.$fetch("/request-password-reset", {
      method: "POST",
      body: {
        email: data.email,
        redirectTo: "/reset-password",
      },
    })

    if (result?.error) {
      toast.error(result.error.message ?? "Could not send reset link")
      return
    }

    toast.success("Reset link sent — check your inbox")
    router.push(`/check-inbox?email=${encodeURIComponent(data.email)}`)
  }

  return (
    <AuthLayoutWrapper showBack>
      <AuthCard className="space-y-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-[#0F172A]">Forgot password</h1>
          <p className="text-sm text-[#64748B]">
            Enter your email to reset your password and access your account.
          </p>
        </div>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
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
          </FieldGroup>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="h-11 w-full bg-[#0F172A] text-white hover:bg-[#1E293B]"
          >
            {form.formState.isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Send reset link"
            )}
          </Button>
        </form>
      </AuthCard>
    </AuthLayoutWrapper>
  )
}

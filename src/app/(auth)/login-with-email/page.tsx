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
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"

const emailLinkSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
})

type EmailLinkInput = z.infer<typeof emailLinkSchema>

export default function LoginEmailPage() {
  const router = useRouter()
  const form = useForm<EmailLinkInput>({
    resolver: zodResolver(emailLinkSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (data: EmailLinkInput) => {
    const result = await authClient.$fetch("/sign-in/magic-link", {
      method: "POST",
      body: {
        email: data.email,
        callbackURL: "/feed",
      },
    })

    if (result?.error) {
      toast.error(result.error.message ?? "Could not send sign-in link")
      return
    }

    router.push(`/check-inbox?email=${encodeURIComponent(data.email)}`)
  }

  return (
    <AuthLayoutWrapper showBack>
      <AuthCard className="space-y-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Enter your email</h1>
          <p className="text-sm text-muted-foreground">
            We&apos;ll send a secure link for instant access to your account.
          </p>
        </div>
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
                  <FieldDescription className="text-xs text-muted-foreground">
                    We&apos;ll only use this email for authentication.
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
              "Send link"
            )}
          </Button>
        </form>
      </AuthCard>
    </AuthLayoutWrapper>
  )
}

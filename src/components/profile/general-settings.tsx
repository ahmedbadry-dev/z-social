"use client"

import Image from "next/image"
import { ImageUp, Loader2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAvatarUpload } from "@/hooks/use-avatar-upload"
import { authClient } from "@/lib/auth-client"
import { api } from "../../../convex/_generated/api"
import { generalSettingsSchema, type GeneralSettingsInput } from "@/lib/validations"

export function GeneralSettings() {
  const currentUser = useQuery(api.auth.getCurrentUser)
  const profile = useQuery(
    api.users.getUserProfile,
    currentUser?.userId ? { userId: currentUser.userId } : "skip"
  )
  const updateUserProfile = useMutation(api.users.updateUserProfile)
  const { upload, isUploading } = useAvatarUpload()

  const fileRef = useRef<HTMLInputElement>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const form = useForm<GeneralSettingsInput>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      name: "",
      username: "",
      bio: "",
    },
  })

  useEffect(() => {
    if (currentUser) {
      form.setValue("name", currentUser.name ?? "")
    }
  }, [currentUser, form])

  useEffect(() => {
    if (profile) {
      form.setValue("username", profile.username ?? "")
      form.setValue("bio", profile.bio ?? "")
    }
  }, [profile, form])

  const onSubmit = async (data: GeneralSettingsInput) => {
    try {
      let imageUrl: string | undefined
      if (avatarFile) {
        imageUrl = await upload(avatarFile)
      }

      await updateUserProfile({
        bio: data.bio?.trim() || undefined,
        username: data.username?.trim() || undefined,
      })

      const updateUserPayload = {
        name: data.name.trim(),
        image: imageUrl,
      }
      await authClient.updateUser(updateUserPayload)

      toast.success("Profile updated!")
      setAvatarFile(null)
      setAvatarPreview(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update profile"
      toast.error(message)
    }
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div
        className="cursor-pointer rounded-lg border-2 border-dashed border-[#E2E8F0] p-4 text-center"
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null
            setAvatarFile(file)
            if (file) {
              setAvatarPreview(URL.createObjectURL(file))
            } else {
              setAvatarPreview(null)
            }
          }}
        />
        {avatarPreview ? (
          <Image
            src={avatarPreview}
            alt="Avatar preview"
            width={96}
            height={96}
            className="mx-auto h-24 w-24 rounded-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <ImageUp className="size-6 text-[#64748B]" />
            <p className="text-sm text-[#64748B]">Choose an image for avatar</p>
          </div>
        )}
      </div>

      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="profile-name">Full name</FieldLabel>
              <Input {...field} id="profile-name" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="username"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="profile-username">Username</FieldLabel>
              <Input {...field} id="profile-username" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="bio"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="profile-bio">Bio</FieldLabel>
              <Textarea
                {...field}
                id="profile-bio"
                rows={4}
                maxLength={160}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <Button
        type="submit"
        className="w-full bg-[#0F172A] text-white hover:bg-[#1E293B]"
        disabled={form.formState.isSubmitting || isUploading}
      >
        {form.formState.isSubmitting || isUploading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          "Save Changes"
        )}
      </Button>
    </form>
  )
}

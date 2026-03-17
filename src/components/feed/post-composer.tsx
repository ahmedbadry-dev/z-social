"use client"

import Image from "next/image"
import { ImagePlus, Loader2, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"
import { UserAvatar } from "@/components/shared/user-avatar"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { usePostMediaUpload } from "@/hooks/use-post-media-upload"
import { api } from "../../../convex/_generated/api"
import { createPostSchema, type CreatePostInput } from "@/lib/validations"

export function PostComposer() {
  const createPost = useMutation(api.posts.createPost)
  const currentUser = useQuery(api.auth.getCurrentUser)
  const { upload, isUploading } = usePostMediaUpload()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)

  const form = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
    defaultValues: { content: "" },
  })

  useEffect(() => {
    return () => {
      if (mediaPreview) {
        URL.revokeObjectURL(mediaPreview)
      }
    }
  }, [mediaPreview])

  const onFileChange = (file: File | null) => {
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview)
    }
    setMediaFile(file)
    setMediaPreview(file ? URL.createObjectURL(file) : null)
  }

  const onSubmit = async (data: CreatePostInput) => {
    const content = data.content.trim()
    let mediaData:
      | {
          mediaUrl?: string
          mediaType?: "image" | "video"
        }
      | undefined

    try {
      if (mediaFile) {
        const uploaded = await upload(mediaFile)
        mediaData = {
          mediaUrl: uploaded.url,
          mediaType: uploaded.type,
        }
      }

      await createPost({
        content,
        mediaUrl: mediaData?.mediaUrl,
        mediaType: mediaData?.mediaType,
      })

      form.reset()
      onFileChange(null)
      toast.success("Post shared!")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create post"
      toast.error(message)
    }
  }

  const currentName = currentUser?.name || currentUser?.email?.split("@")[0] || "User"
  const contentLength = form.watch("content")?.length ?? 0

  return (
    <section className="rounded-lg bg-white p-4 shadow-sm">
      <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
          <Controller
            name="content"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <div className="flex items-start gap-3">
                  <UserAvatar
                    name={currentName}
                    imageUrl={currentUser?.image ?? undefined}
                    size="md"
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <FieldLabel htmlFor="post-content" className="sr-only">
                      Post content
                    </FieldLabel>
                    <Textarea
                      {...field}
                      id="post-content"
                      rows={3}
                      maxLength={500}
                      placeholder="What's on your mind?"
                      className="min-h-24 resize-none border-none p-0 text-sm text-[#0F172A] shadow-none focus-visible:ring-0"
                    />
                  </div>
                </div>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>

        {mediaPreview && (
          <div className="relative overflow-hidden rounded-lg border border-neutral-200">
            {mediaFile?.type.startsWith("video/") ? (
              <video src={mediaPreview} controls className="max-h-80 w-full object-cover" />
            ) : (
              <Image
                src={mediaPreview}
                alt="Post preview"
                width={900}
                height={500}
                className="max-h-80 w-full object-cover"
              />
            )}
            <button
              type="button"
              className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white"
              onClick={() => onFileChange(null)}
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
        />

        <div className="flex items-center justify-between border-t pt-3">
          <Button
            type="button"
            variant="outline"
            className="border-neutral-200"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="size-4" />
            Add Media
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#64748B]">{contentLength}/500</span>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting || isUploading}
              className="bg-[#3B55E6] text-white hover:bg-[#2D46D6]"
            >
              {form.formState.isSubmitting || isUploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Post"
              )}
            </Button>
          </div>
        </div>
      </form>
    </section>
  )
}

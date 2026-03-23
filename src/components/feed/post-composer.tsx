"use client"

import Image from "next/image"
import { ImagePlus, Loader2, Video, X } from "lucide-react"
import { type ChangeEvent, type ReactElement, useEffect, useRef, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"
import { VideoTrimControls } from "@/components/feed/video-trim-controls"
import { UserAvatar } from "@/components/shared/user-avatar"
import { MentionTextarea } from "@/components/shared/mention-textarea"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { usePostMediaUpload } from "@/hooks/use-post-media-upload"
import { api } from "../../../convex/_generated/api"
import { createPostSchema, type CreatePostInput } from "@/lib/validations"

export function PostComposer(): ReactElement {
  const createPost = useMutation(api.posts.createPost)
  const currentUser = useQuery(api.auth.getCurrentUser)
  const { upload, isUploading } = usePostMediaUpload()
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(0)
  const [videoDuration, setVideoDuration] = useState(0)
  const [isTrimming, setIsTrimming] = useState(false)

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

  const resetVideoTrim = (): void => {
    setTrimStart(0)
    setTrimEnd(0)
    setVideoDuration(0)
  }

  const onFileChange = (file: File | null): void => {
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview)
    }
    setMediaFile(file)
    setMediaPreview(file ? URL.createObjectURL(file) : null)
    if (!file || !file.type.startsWith("video/")) {
      resetVideoTrim()
    }
  }

  function getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video")
      video.preload = "metadata"
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src)
        resolve(video.duration)
      }
      video.onerror = () => {
        URL.revokeObjectURL(video.src)
        reject(new Error("Could not read video metadata"))
      }
      video.src = URL.createObjectURL(file)
    })
  }

  // TODO: Client-side trimming is suitable for short clips. Consider server-side
  // processing (e.g., FFmpeg via a worker) for production at scale.
  const trimVideo = async (file: File, start: number, end: number): Promise<File> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video")
      video.src = URL.createObjectURL(file)
      video.preload = "auto"
      video.muted = true

      const cleanup = (): void => {
        URL.revokeObjectURL(video.src)
      }

      video.onloadedmetadata = () => {
        const canvas = document.createElement("canvas")
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          cleanup()
          reject(new Error("Video trim failed"))
          return
        }
        const stream = canvas.captureStream(30)

        let audioCtx: AudioContext | null = null
        try {
          audioCtx = new AudioContext()
          const src = audioCtx.createMediaElementSource(video)
          const dest = audioCtx.createMediaStreamDestination()
          src.connect(dest)
          src.connect(audioCtx.destination)
          const audioTracks = dest.stream.getAudioTracks()
          if (audioTracks[0]) {
            stream.addTrack(audioTracks[0])
          }
        } catch {
          audioCtx = null
        }

        const recorder = new MediaRecorder(stream, { mimeType: "video/webm" })
        const chunks: Blob[] = []

        recorder.ondataavailable = (event: BlobEvent) => {
          if (event.data.size > 0) {
            chunks.push(event.data)
          }
        }
        recorder.onstop = () => {
          cleanup()
          if (audioCtx) {
            void audioCtx.close()
          }
          const blob = new Blob(chunks, { type: "video/webm" })
          resolve(new File([blob], "trimmed.webm", { type: "video/webm" }))
        }

        const drawFrame = (): void => {
          if (video.currentTime >= end) {
            if (recorder.state !== "inactive") {
              recorder.stop()
            }
            video.pause()
            return
          }
          ctx.drawImage(video, 0, 0)
          requestAnimationFrame(drawFrame)
        }

        video.currentTime = start
        video.onseeked = () => {
          recorder.start()
          void video.play()
          drawFrame()
        }
      }

      video.onerror = () => {
        cleanup()
        reject(new Error("Video trim failed"))
      }
    })
  }

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onFileChange(event.target.files?.[0] ?? null)
  }

  const handleVideoChange = async (
    event: ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const file = event.target.files?.[0] ?? null
    if (!file) {
      onFileChange(null)
      return
    }

    try {
      const duration = await getVideoDuration(file)
      if (duration > 600) {
        toast.error("Video is too long. Maximum allowed duration is 10 minutes.")
        event.target.value = ""
        onFileChange(null)
        return
      }
      setVideoDuration(duration)
      setTrimStart(0)
      setTrimEnd(duration)
      onFileChange(file)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not read video metadata"
      toast.error(message)
      event.target.value = ""
      onFileChange(null)
    }
  }

  const handleTrimChange = (start: number, end: number): void => {
    setTrimStart(start)
    setTrimEnd(end)
  }

  const onSubmit = async (data: CreatePostInput): Promise<void> => {
    const content = data.content.trim()
    let mediaData:
      | {
          mediaUrl?: string
          mediaType?: "image" | "video"
        }
      | undefined

    try {
      if (mediaFile) {
        let fileToUpload = mediaFile
        if (
          mediaFile.type.startsWith("video/") &&
          (trimStart > 0 || trimEnd < videoDuration)
        ) {
          setIsTrimming(true)
          try {
            fileToUpload = await trimVideo(mediaFile, trimStart, trimEnd)
          } finally {
            setIsTrimming(false)
          }
        }

        const uploaded = await upload(fileToUpload)
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
  const isPosting = form.formState.isSubmitting || isUploading || isTrimming

  return (
    <section className="rounded-lg bg-card p-4 shadow-sm">
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
                    <MentionTextarea
                      id="post-content"
                      value={field.value}
                      onChange={field.onChange}
                      rows={3}
                      maxLength={500}
                      placeholder="What's on your mind?"
                      dir="auto"
                      className="min-h-24 resize-none border-none p-0 text-sm text-foreground shadow-none focus-visible:ring-0"
                    />
                  </div>
                </div>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>

        {mediaPreview && (
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-lg border border-border">
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
            {mediaFile?.type.startsWith("video/") && (
              <VideoTrimControls
                videoSrc={mediaPreview}
                duration={videoDuration}
                trimStart={trimStart}
                trimEnd={trimEnd}
                onTrimChange={handleTrimChange}
              />
            )}
          </div>
        )}

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleVideoChange}
        />

        <div className="flex items-center justify-between border-t pt-3">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-border"
              onClick={() => imageInputRef.current?.click()}
            >
              <ImagePlus className="size-4" />
              Add Image
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-border"
              onClick={() => videoInputRef.current?.click()}
            >
              <Video className="size-4" />
              Add Video
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{contentLength}/500</span>
            <Button
              type="submit"
              disabled={isPosting}
              className="bg-[#3B55E6] text-white hover:bg-[#2D46D6] gap-2"
            >
              {isTrimming ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Processing video...
                </>
              ) : form.formState.isSubmitting || isUploading ? (
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

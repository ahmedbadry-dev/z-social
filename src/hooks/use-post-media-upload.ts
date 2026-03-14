"use client"

import { useUploadThing } from "@/lib/uploadthing"

export function usePostMediaUpload() {
  const { startUpload, isUploading } = useUploadThing("postMedia")

  const upload = async (file: File) => {
    const result = await startUpload([file])
    if (!result?.[0]) {
      throw new Error("Upload failed")
    }

    const type = file.type.startsWith("video/") ? "video" : "image"
    return {
      url: result[0].ufsUrl,
      type,
    } as const
  }

  return { upload, isUploading }
}

"use client"

import { useUploadThing } from "@/lib/uploadthing"

export function useAvatarUpload() {
  const { startUpload, isUploading } = useUploadThing("avatar")

  const upload = async (file: File): Promise<string> => {
    const result = await startUpload([file])
    if (!result?.[0]) {
      throw new Error("Upload failed")
    }
    return result[0].ufsUrl
  }

  return { upload, isUploading }
}

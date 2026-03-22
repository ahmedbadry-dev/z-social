"use client"

import { useUploadThing } from "@/lib/uploadthing"

export function useAvatarUpload() {
  const { startUpload, isUploading } = useUploadThing("avatar")

  const upload = async (file: File): Promise<string> => {
    const result = await startUpload([file])
    if (!result?.[0]) {
      throw new Error("Upload failed")
    }
    const uploadedUrl =
      result[0].serverData?.url ?? result[0].url ?? result[0].ufsUrl
    if (!uploadedUrl) {
      throw new Error("Upload failed")
    }
    return uploadedUrl
  }

  return { upload, isUploading }
}

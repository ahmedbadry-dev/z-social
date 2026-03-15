import { createUploadthing, type FileRouter } from "uploadthing/next"
import { getToken, isAuthenticated } from "@/lib/auth-server"

const f = createUploadthing()

export const ourFileRouter = {
  postMedia: f({
    image: { maxFileSize: "8MB", maxFileCount: 1 },
    video: { maxFileSize: "64MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      const authenticated = await isAuthenticated()
      if (!authenticated) throw new Error("Unauthorized")
      return { authenticated }
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl }
    }),

  avatar: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const authenticated = await isAuthenticated()
      if (!authenticated) throw new Error("Unauthorized")
      return { authenticated }
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter

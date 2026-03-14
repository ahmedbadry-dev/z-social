import { redirect } from "next/navigation"
import { getToken } from "@/lib/auth-server"

export default async function RootPage() {
  const token = await getToken()

  if (token) {
    redirect("/feed")
  }

  redirect("/login")
}

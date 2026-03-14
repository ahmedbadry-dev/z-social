import { redirect } from "next/navigation"
import { getToken } from "@/lib/auth-server"

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const token = await getToken()
  if (token) {
    redirect("/feed")
  }

  return <div className="min-h-screen bg-[#F3F4F6] flex flex-col">{children}</div>
}

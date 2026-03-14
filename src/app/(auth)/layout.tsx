export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="min-h-screen bg-[#F3F4F6] flex flex-col">{children}</div>
}

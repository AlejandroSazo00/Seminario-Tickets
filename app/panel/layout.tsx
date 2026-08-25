import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/session"
import { Sidebar } from "@/components/panel/sidebar"
import { Topbar } from "@/components/panel/topbar"
import { MobileNav } from "@/components/panel/mobile-nav"

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect("/ingresar")

  return (
    <div className="flex min-h-svh bg-background">
      <Sidebar role={user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} />
        <main className="flex-1 overflow-x-hidden px-4 pb-24 pt-6 md:px-8 md:pb-8">{children}</main>
        <MobileNav role={user.role} />
      </div>
    </div>
  )
}

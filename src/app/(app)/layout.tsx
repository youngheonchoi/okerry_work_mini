import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/session'
import { db } from '@/lib/db'
import { wageSettings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import BottomNav from '@/components/BottomNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()
  if (!session?.user) redirect('/sign-in')

  const settings = await db.query.wageSettings.findFirst({
    where: eq(wageSettings.userId, session.user.id),
  })

  if (!settings) redirect('/onboarding')

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav />
    </div>
  )
}

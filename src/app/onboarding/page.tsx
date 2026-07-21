import { getServerSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { wageSettings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import OnboardingFlow from '@/components/onboarding/OnboardingFlow'

export default async function OnboardingPage() {
  const session = await getServerSession()
  if (!session?.user) redirect('/sign-in')

  const existing = await db.query.wageSettings.findFirst({
    where: eq(wageSettings.userId, session.user.id),
  })
  if (existing) redirect('/calendar')

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <OnboardingFlow />
    </div>
  )
}

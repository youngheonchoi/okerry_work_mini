import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/session'
import { db } from '@/lib/db'
import { workLogs } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { format } from 'date-fns'

export default async function RootPage() {
  const session = await getServerSession()
  if (!session?.user) redirect('/today')

  const today = format(new Date(), 'yyyy-MM-dd')
  const existing = await db.query.workLogs.findFirst({
    where: and(eq(workLogs.userId, session.user.id), eq(workLogs.workDate, today)),
  })

  redirect(existing ? '/journal' : '/today')
}

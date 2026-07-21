import { getServerSession } from '@/lib/session'
import { db } from '@/lib/db'
import { workLogs } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import TodayFlow from '@/components/today/TodayFlow'

export default async function TodayPage() {
  const session = await getServerSession()
  const today = format(new Date(), 'yyyy-MM-dd')

  const existing = session?.user
    ? await db.query.workLogs.findFirst({
        where: and(
          eq(workLogs.userId, session.user.id),
          eq(workLogs.workDate, today),
        ),
      })
    : null

  const dateLabel = format(new Date(), 'M월 d일 (eee)', { locale: ko })

  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col bg-white">
      <TodayFlow dateLabel={dateLabel} existingLog={existing ?? null} />
    </div>
  )
}

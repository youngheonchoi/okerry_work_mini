import { getServerSession } from '@/lib/session'
import { db } from '@/lib/db'
import { workLogs } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'
import WorkHistoryFlow from '@/components/settings/WorkHistoryFlow'

export default async function WorkHistoryPage() {
  const session = await getServerSession()

  const logs = session?.user
    ? await db.query.workLogs.findMany({
        where: eq(workLogs.userId, session.user.id),
        orderBy: asc(workLogs.workDate),
      })
    : []

  const minDate = logs[0]?.workDate ?? null
  const maxDate = logs[logs.length - 1]?.workDate ?? null

  return <WorkHistoryFlow logs={logs} minDate={minDate} maxDate={maxDate} />
}

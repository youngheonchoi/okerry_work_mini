import { getServerSession } from '@/lib/session'
import { db } from '@/lib/db'
import { wageSettings, workLogs, dailyJournals } from '@/lib/db/schema'
import { eq, and, gte, lte } from 'drizzle-orm'
import { startOfMonth, endOfMonth, format } from 'date-fns'
import CalendarView from '@/components/calendar/CalendarView'

export default async function CalendarPage() {
  const session = await getServerSession()
  if (!session?.user) return null

  const now = new Date()
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd')

  const [settings, logs, journals] = await Promise.all([
    db.query.wageSettings.findFirst({
      where: eq(wageSettings.userId, session.user.id),
    }),
    db.query.workLogs.findMany({
      where: and(
        eq(workLogs.userId, session.user.id),
        gte(workLogs.workDate, monthStart),
        lte(workLogs.workDate, monthEnd),
      ),
    }),
    db.query.dailyJournals.findMany({
      where: and(
        eq(dailyJournals.userId, session.user.id),
        gte(dailyJournals.workDate, monthStart),
        lte(dailyJournals.workDate, monthEnd),
      ),
    }),
  ])

  return (
    <CalendarView
      settings={settings ?? null}
      logs={logs}
      journals={journals}
      currentMonth={format(now, 'yyyy-MM')}
    />
  )
}

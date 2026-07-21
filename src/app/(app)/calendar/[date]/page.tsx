import Link from 'next/link'
import { getServerSession } from '@/lib/session'
import { db } from '@/lib/db'
import { wageSettings, workLogs, dailyJournals } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import DayDetail from '@/components/calendar/DayDetail'

export default async function CalendarDayPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params
  const session = await getServerSession()

  const [settings, log, journal] = session?.user
    ? await Promise.all([
        db.query.wageSettings.findFirst({
          where: eq(wageSettings.userId, session.user.id),
        }),
        db.query.workLogs.findFirst({
          where: and(eq(workLogs.userId, session.user.id), eq(workLogs.workDate, date)),
        }),
        db.query.dailyJournals.findFirst({
          where: and(eq(dailyJournals.userId, session.user.id), eq(dailyJournals.workDate, date)),
        }),
      ])
    : [null, null, null]

  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col bg-white px-5 pt-8 pb-10">
      <Link href="/calendar" className="flex items-center gap-1 text-sm text-gray-500">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        캘린더
      </Link>

      <div className="mt-4">
        <DayDetail dateStr={date} log={log ?? null} journal={journal ?? null} dailyWage={settings?.dailyWage ?? 0} />
      </div>
    </div>
  )
}

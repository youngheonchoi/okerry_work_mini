'use server'

import { getServerSession } from '@/lib/session'
import { db } from '@/lib/db'
import { dailyJournals, type JournalEntry } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function getJournal(date: string): Promise<JournalEntry[]> {
  const session = await getServerSession()
  if (!session?.user?.id) return []

  const journal = await db.query.dailyJournals.findFirst({
    where: and(eq(dailyJournals.userId, session.user.id), eq(dailyJournals.workDate, date)),
  })

  return journal?.entries ?? []
}

export async function saveJournal(date: string, entries: JournalEntry[]) {
  const session = await getServerSession()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const valid = entries.filter((e) => e.startTime)
  for (const e of valid) {
    if (e.endTime && e.endTime < e.startTime) {
      throw new Error('종료시간은 시작시간보다 빠를 수 없습니다')
    }
  }
  if (valid.length > 20) throw new Error('항목은 최대 20개까지 등록할 수 있습니다')

  const sorted = [...valid].sort((a, b) => a.startTime.localeCompare(b.startTime))

  await db
    .insert(dailyJournals)
    .values({
      userId: session.user.id,
      workDate: date,
      entries: sorted,
    })
    .onConflictDoUpdate({
      target: [dailyJournals.userId, dailyJournals.workDate],
      set: {
        entries: sorted,
        updatedAt: new Date(),
      },
    })

  revalidatePath('/journal')
  revalidatePath('/calendar')
}

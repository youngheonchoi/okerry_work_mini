'use server'

import { getServerSession } from '@/lib/session'
import { db } from '@/lib/db'
import { wageSettings, workLogs } from '@/lib/db/schema'
import { calculateWage } from '@/lib/wage'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { format } from 'date-fns'

export async function saveWageSettings(data: {
  dailyWage: number
  payType: 'daily' | 'weekly' | 'monthly'
  nextPayDate: string
}) {
  const session = await getServerSession()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await db
    .insert(wageSettings)
    .values({
      userId: session.user.id,
      dailyWage: data.dailyWage,
      payType: data.payType,
      nextPayDate: data.nextPayDate,
    })
    .onConflictDoUpdate({
      target: wageSettings.userId,
      set: {
        dailyWage: data.dailyWage,
        payType: data.payType,
        nextPayDate: data.nextPayDate,
        updatedAt: new Date(),
      },
    })

  revalidatePath('/calendar')
}

export async function saveWorkLog(data: {
  worked: boolean
  isHoliday: boolean
  overtimeHrs: number
}) {
  const session = await getServerSession()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const settings = await db.query.wageSettings.findFirst({
    where: eq(wageSettings.userId, session.user.id),
  })
  if (!settings) throw new Error('급여 설정이 없습니다')

  const today = format(new Date(), 'yyyy-MM-dd')
  const totalWage = calculateWage(
    settings.dailyWage,
    data.worked,
    data.isHoliday,
    data.overtimeHrs,
  )

  await db
    .insert(workLogs)
    .values({
      userId: session.user.id,
      workDate: today,
      worked: data.worked,
      isHoliday: data.isHoliday,
      overtimeHrs: String(data.overtimeHrs),
      totalWage,
    })
    .onConflictDoUpdate({
      target: [workLogs.userId, workLogs.workDate],
      set: {
        worked: data.worked,
        isHoliday: data.isHoliday,
        overtimeHrs: String(data.overtimeHrs),
        totalWage,
        updatedAt: new Date(),
      },
    })

  revalidatePath('/calendar')
  revalidatePath('/today')
}

'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { getServerSession } from '@/lib/session'
import { db } from '@/lib/db'
import { wageSettings, workLogs } from '@/lib/db/schema'

export async function signOut() {
  const cookieStore = await cookies()
  cookieStore.set('neon-auth-jwt', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  redirect('/sign-in')
}

export async function deleteAccount() {
  const session = await getServerSession()
  if (!session?.user?.id) redirect('/sign-in')

  const userId = session.user.id

  await db.delete(workLogs).where(eq(workLogs.userId, userId))
  await db.delete(wageSettings).where(eq(wageSettings.userId, userId))

  const baseUrl = process.env.NEON_AUTH_BASE_URL!
  const cookieStore = await cookies()
  const jwt = cookieStore.get('neon-auth-jwt')?.value

  if (jwt) {
    await fetch(`${baseUrl}/delete-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
    }).catch(() => null)
  }

  cookieStore.set('neon-auth-jwt', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  redirect('/sign-in')
}

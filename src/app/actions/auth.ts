'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { getServerSession } from '@/lib/session'
import { db } from '@/lib/db'
import { wageSettings, workLogs } from '@/lib/db/schema'

const GUEST_USER_ID = '5a8b5f72-df91-4136-8ed6-2caeffca31bf'

export async function guestSignIn(formData: FormData) {
  const code = formData.get('code')
  const expected = process.env.GUEST_INVITE_CODE

  if (!expected || code !== expected) {
    redirect('/sign-in?error=invalid_code')
  }

  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(
    JSON.stringify({ id: GUEST_USER_ID, name: '친구', email: 'guest@okerry.local' })
  ).toString('base64url')

  const cookieStore = await cookies()
  cookieStore.set('neon-auth-jwt', `${header}.${payload}.`, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })
  redirect('/calendar')
}

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

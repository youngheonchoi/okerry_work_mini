import { cookies } from 'next/headers'

export interface SessionUser {
  id: string
  name: string
  email: string
}

function decodeJWTPayload(token: string): Record<string, unknown> | null {
  try {
    const [, payload] = token.split('.')
    if (!payload) return null
    const json = Buffer.from(payload, 'base64url').toString('utf-8')
    return JSON.parse(json)
  } catch {
    return null
  }
}

export async function getServerSession(): Promise<{ user: SessionUser } | null> {
  const cookieStore = await cookies()
  const jwt = cookieStore.get('neon-auth-jwt')?.value
  if (!jwt) return null

  const payload = decodeJWTPayload(jwt)
  if (!payload?.id || !payload?.email) return null

  return {
    user: {
      id: payload.id as string,
      name: (payload.name as string) ?? '',
      email: payload.email as string,
    },
  }
}

import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const verifier = url.searchParams.get('neon_auth_session_verifier')

  if (!verifier) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  const cookieHeader = request.headers.get('cookie') || ''
  const neonCookies = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .filter((c) => c.startsWith('__Secure-neon-auth'))
    .join('; ')

  const baseUrl = process.env.NEON_AUTH_BASE_URL!
  const upstreamUrl = new URL(`${baseUrl}/get-session`)
  upstreamUrl.searchParams.set('neon_auth_session_verifier', verifier)

  let jwt: string | undefined
  let maxAge = 60 * 60 * 24 * 7

  try {
    const res = await fetch(upstreamUrl.toString(), {
      method: 'GET',
      headers: {
        Cookie: neonCookies,
        Origin: url.origin,
        'x-neon-auth-middleware': 'true',
      },
    })

    if (!res.ok) {
      console.error('[oauth-callback] upstream error:', res.status, await res.text())
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }

    jwt = res.headers.get('set-auth-jwt') ?? undefined

    const data = await res.json().catch(() => null)
    if (data?.session?.expiresAt) {
      const ms = new Date(data.session.expiresAt).getTime() - Date.now()
      if (ms > 0) maxAge = Math.floor(ms / 1000)
    }
  } catch (e) {
    console.error('[oauth-callback] fetch error:', e)
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  if (!jwt) {
    console.error('[oauth-callback] no set-auth-jwt header in response')
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  const response = NextResponse.redirect(new URL('/calendar', request.url))

  response.cookies.set('neon-auth-jwt', jwt, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge,
  })

  response.cookies.set('__Secure-neon-auth.session_challange', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })

  return response
}

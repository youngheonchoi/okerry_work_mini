import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PREFIXES = ['/sign-in', '/api/auth', '/api/oauth-callback']

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const jwt = request.cookies.get('neon-auth-jwt')?.value
  if (!jwt) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|icons).*)'],
}

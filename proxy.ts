import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Next.js 16 expects a `proxy` export from `proxy.ts`.
// This file is intentionally minimal to avoid build failures caused by missing
// server-side session helpers. Client-side auth protection still lives in `app/layout.tsx`.
export async function proxy(_request: NextRequest) {
  return NextResponse.next()
}

// Configure matcher to run middleware on all routes except static files
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

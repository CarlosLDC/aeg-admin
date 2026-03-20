import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Update session and get user
  const { response, user } = await updateSession(request)
  
  const pathname = request.nextUrl.pathname
  
  // Check if this is an auth page
  const isAuthPage = pathname === '/login'
  
  // Check if user is trying to access protected routes
  const isProtectedRoute = !isAuthPage && !pathname.startsWith('/_next') && !pathname.startsWith('/api') && pathname !== '/'
  
  // Redirect unauthenticated users to login
  if (!user && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }
  
  // Redirect authenticated users away from login page
  if (user && isAuthPage) {
    const homeUrl = new URL('/', request.url)
    return NextResponse.redirect(homeUrl)
  }
  
  // Return the response with updated session cookies
  return response
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

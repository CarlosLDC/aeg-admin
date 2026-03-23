import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createSupabaseProxyClient } from './lib/supabase-server';

export async function proxy(request: NextRequest) {
  const { supabase, response } = createSupabaseProxyClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname === '/login';

  if (!user && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

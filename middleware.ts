import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const publicRoutes = ['/', '/auth/signin', '/auth/signup', '/auth/forgot-password', '/pricing']
const superAdminRoutes = ['/superadmin']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (publicRoutes.includes(pathname) || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Get token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // Redirect to signin if not authenticated
  if (!token) {
    const url = new URL('/auth/signin', request.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  // 🔒 SÉCURITÉ CRITIQUE: Check SuperAdmin routes
  if (superAdminRoutes.some(route => pathname.startsWith(route))) {
    // Vérifier que l'utilisateur est SuperAdmin via le token JWT
    // Le token contient isSuperAdmin car on l'ajoute dans callbacks.jwt
    if (!token.isSuperAdmin) {
      // Rediriger vers dashboard normal si pas SuperAdmin
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}

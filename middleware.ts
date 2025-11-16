import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const publicRoutes = ['/', '/auth/signin', '/auth/signup', '/auth/forgot-password', '/pricing']
const adminRoutes = ['/admin']

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

  // ✅ SÉCURITÉ: Check admin/superadmin routes
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    // Les routes /admin nécessitent un check isSuperAdmin
    // Cette vérification devrait être faite dans chaque route admin pour plus de sécurité
    // On pourrait ajouter un check ici mais il vaut mieux le faire dans les routes elles-mêmes
    // pour avoir accès à la DB et vérifier user.isSuperAdmin

    // Pour l'instant, on laisse passer les utilisateurs authentifiés
    // Les routes admin elles-mêmes doivent vérifier isSuperAdmin
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}

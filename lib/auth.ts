import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { withCache, CacheKeys, CACHE_TTL } from './cache'
import { logger } from './logger'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    newUser: '/dashboard',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required')
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        })

        if (!user || !user.password) {
          throw new Error('Invalid credentials')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error('Invalid credentials')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],
  callbacks: {
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id
        session.user.name = token.name
        session.user.email = token.email
        session.user.image = token.picture
      }

      return session
    },
    async jwt({ token, user, trigger }) {
      // Initial sign in - fetch isSuperAdmin from DB
      if (user) {
        token.id = user.id

        // Fetch isSuperAdmin flag for middleware checks
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { isSuperAdmin: true },
        })
        token.isSuperAdmin = dbUser?.isSuperAdmin ?? false
      }

      // On update, refresh isSuperAdmin from DB
      if (trigger === 'update') {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { isSuperAdmin: true },
        })
        token.isSuperAdmin = dbUser?.isSuperAdmin ?? false
      }

      return token
    },
  },
}

/**
 * PERFORMANCE: Get the current user's organization (avec cache Redis)
 * Cette fonction est tres sollicitee, le cache ameliore drastiquement les perfs
 */
export async function getUserOrganization(userId: string) {
  return withCache(
    CacheKeys.userOrganization(userId),
    CACHE_TTL.USER_ORG,
    async () => {
      const startTime = Date.now()

      const orgUser = await prisma.organizationUser.findFirst({
        where: { userId },
        include: {
          organization: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      const duration = Date.now() - startTime
      logger.debug(
        { userId, duration, cached: false, component: 'auth' },
        'getUserOrganization executed'
      )

      return orgUser?.organization
    }
  )
}

/**
 * Check if user has required role in organization
 */
export async function hasOrganizationRole(
  userId: string,
  organizationId: string,
  requiredRole: 'OWNER' | 'ADMIN' | 'MEMBER'
): Promise<boolean> {
  const orgUser = await prisma.organizationUser.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
  })

  if (!orgUser) return false

  const roleHierarchy: Record<string, number> = { OWNER: 3, ADMIN: 2, MEMBER: 1 }

  return roleHierarchy[orgUser.role] >= roleHierarchy[requiredRole]
}

/**
 * SECURITE: Check if user is super admin
 * A utiliser dans toutes les routes /admin et /superadmin
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true },
  })

  return user?.isSuperAdmin ?? false
}

/**
 * SECURITE: Verifie que l'utilisateur est super admin et retourne une erreur si non
 */
export async function requireSuperAdmin(userId: string) {
  const isAdmin = await isSuperAdmin(userId)
  if (!isAdmin) {
    throw new Error('Super Admin access required')
  }
}

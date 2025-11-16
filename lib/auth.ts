import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'
import { prisma } from './prisma'

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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }

      return token
    },
  },
}

/**
 * Get the current user's organization
 */
export async function getUserOrganization(userId: string) {
  const orgUser = await prisma.organizationUser.findFirst({
    where: { userId },
    include: {
      organization: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return orgUser?.organization
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

  const roleHierarchy = { OWNER: 3, ADMIN: 2, MEMBER: 1 }

  return roleHierarchy[orgUser.role] >= roleHierarchy[requiredRole]
}

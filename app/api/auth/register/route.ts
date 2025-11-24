import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { validateRequest, registerSchema } from '@/lib/validations'
import { apiLogger, logError, logSuccess } from '@/lib/logger'

const log = apiLogger('/api/auth/register')

export async function POST(req: NextRequest) {
  const startTime = Date.now()

  try {
    // SECURITE: Validation Zod des inputs
    const validation = await validateRequest(req, registerSchema)
    if (!validation.success) {
      log.warn({ error: validation.error }, 'Registration validation failed')
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { name, email, password, organizationName } = validation.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      log.warn({ email }, 'Registration attempt with existing email')
      return NextResponse.json(
        { error: 'Un compte existe deja avec cet email' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user + organization in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      })

      // Create organization
      const slug = organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        + '-' + Math.random().toString(36).substring(7)

      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          slug,
          plan: 'FREE',
          creditBalance: 100, // 100 credits gratuits
        },
      })

      // Add user as owner
      await tx.organizationUser.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          role: 'OWNER',
        },
      })

      // Add welcome credits
      await tx.creditTransaction.create({
        data: {
          organizationId: organization.id,
          amount: 100,
          type: 'ADJUSTMENT',
          description: 'Credits de bienvenue',
        },
      })

      return { user, organization }
    })

    const duration = Date.now() - startTime
    logSuccess('User registered successfully', {
      component: 'auth',
      action: 'register',
      userId: result.user.id,
      organizationId: result.organization.id,
      metadata: { email, duration },
    })

    return NextResponse.json({
      success: true,
      message: 'Compte cree avec succes',
      userId: result.user.id,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    logError(error, {
      component: 'auth',
      action: 'register',
      metadata: { duration },
    })

    return NextResponse.json(
      { error: 'Erreur lors de la creation du compte' },
      { status: 500 }
    )
  }
}

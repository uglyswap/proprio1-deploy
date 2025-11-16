import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, organizationName } = await req.json()

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un compte existe déjà avec cet email' },
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
          creditBalance: 100, // 100 crédits gratuits
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
          description: 'Crédits de bienvenue',
        },
      })

      return { user, organization }
    })

    return NextResponse.json({
      success: true,
      message: 'Compte créé avec succès',
      userId: result.user.id,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du compte' },
      { status: 500 }
    )
  }
}

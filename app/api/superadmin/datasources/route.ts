import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin, createAuditLog } from '@/lib/super-admin'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/encryption'

export async function GET() {
  try {
    await requireSuperAdmin()

    const dataSources = await prisma.dataSource.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        mappings: true,
      },
    })

    return NextResponse.json(dataSources)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin()

    const body = await request.json()
    const { name, host, port, database, username, password, schema, tableName } = body

    if (!name || !host || !database || !username || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Chiffrer le mot de passe
    const encryptedPassword = encrypt(password)

    // Créer la source de données
    const dataSource = await prisma.dataSource.create({
      data: {
        name,
        type: 'POSTGRESQL',
        status: 'INACTIVE',
        host,
        port: port || 5432,
        database,
        username,
        password: encryptedPassword,
        schema: schema || 'public',
        tableName,
      },
    })

    // Audit log
    await createAuditLog({
      action: 'CREATE',
      entity: 'DataSource',
      entityId: dataSource.id,
      description: `Source de données créée: ${name}`,
    })

    return NextResponse.json(dataSource)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

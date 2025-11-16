import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin, createAuditLog } from '@/lib/super-admin'
import { dropcontactConfig } from '@/lib/system-config'

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin()

    const { apiKey } = await request.json()

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key required' },
        { status: 400 }
      )
    }

    // Sauvegarder la clé (chiffrée)
    await dropcontactConfig.setApiKey(apiKey)

    // Audit log
    await createAuditLog({
      action: 'CONFIG_CHANGE',
      entity: 'SystemConfig',
      description: 'API Dropcontact configurée',
      metadata: { category: 'API' },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

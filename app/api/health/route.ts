import { NextResponse } from 'next/server'

/**
 * Health Check Endpoint
 * Simple health check that doesn't depend on database
 * Database connectivity is checked separately
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: 'v22',
  })
}

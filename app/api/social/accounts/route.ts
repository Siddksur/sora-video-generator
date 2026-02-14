import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { getConnectedAccounts } from '@/lib/ghl-social'
import { db } from '@/lib/db'

/**
 * GET /api/social/accounts
 * List connected social media accounts for the current user's GHL location.
 * Requires an active GHL integration with socialplanner/account.readonly scope.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the user's GHL integration
    const integration = await db.ghlIntegration.findUnique({
      where: { userId: user.id },
      select: {
        apiKey: true,
        locationId: true,
        isConnected: true,
      },
    })

    if (!integration || !integration.isConnected) {
      return NextResponse.json(
        { error: 'GHL integration not connected. Please connect your GoHighLevel account in Settings.' },
        { status: 400 }
      )
    }

    // Fetch connected accounts from GHL
    const result = await getConnectedAccounts(integration.apiKey, integration.locationId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch social accounts.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      accounts: result.accounts || [],
    })
  } catch (error) {
    console.error('GET /api/social/accounts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

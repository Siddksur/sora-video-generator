import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { validateSubaccountApiKey } from '@/lib/ghl-subaccount'
import { db } from '@/lib/db'

/**
 * GET /api/settings/ghl
 * Retrieve the current user's GHL integration status.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const integration = await db.ghlIntegration.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        locationId: true,
        businessName: true,
        businessEmail: true,
        businessPhone: true,
        locationName: true,
        locationEmail: true,
        isConnected: true,
        createdAt: true,
        updatedAt: true,
        // Do NOT return the API key for security
      },
    })

    // Also get the user's locationId from their account (for GHL users)
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      select: { locationId: true, authType: true },
    })

    return NextResponse.json({
      integration,
      userLocationId: fullUser?.locationId || null,
      isGhlUser: fullUser?.authType === 'ghl',
    })
  } catch (error) {
    console.error('GET /api/settings/ghl error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/settings/ghl
 * Validate and save a GHL subaccount Private Integration API key.
 * Body: { apiKey: string, locationId?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { apiKey, locationId: providedLocationId } = body

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 })
    }

    // Determine the locationId to use
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      select: { locationId: true, authType: true },
    })

    const locationId = providedLocationId || fullUser?.locationId
    if (!locationId) {
      return NextResponse.json(
        { error: 'Location ID is required. Please provide your GHL Location ID.' },
        { status: 400 }
      )
    }

    // Validate the API key against GHL
    const result = await validateSubaccountApiKey(apiKey.trim(), locationId)

    if (!result.valid) {
      return NextResponse.json(
        { error: result.error || 'Failed to validate API key' },
        { status: 400 }
      )
    }

    // Determine the best display name and email
    const businessName = result.business?.name || result.location?.name || null
    const businessEmail = result.business?.email || result.location?.email || null
    const businessPhone = result.business?.phone || result.location?.phone || null

    // Upsert the integration record
    const integration = await db.ghlIntegration.upsert({
      where: { userId: user.id },
      update: {
        apiKey: apiKey.trim(),
        locationId,
        businessName,
        businessEmail,
        businessPhone,
        locationName: result.location?.name || null,
        locationEmail: result.location?.email || null,
        isConnected: true,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        apiKey: apiKey.trim(),
        locationId,
        businessName,
        businessEmail,
        businessPhone,
        locationName: result.location?.name || null,
        locationEmail: result.location?.email || null,
        isConnected: true,
      },
    })

    // Also update the user's email if it's a placeholder
    if (user.email?.includes('@ghl.placeholder') && (businessEmail || result.location?.email)) {
      const realEmail = businessEmail || result.location?.email
      if (realEmail) {
        try {
          await db.user.update({
            where: { id: user.id },
            data: { email: realEmail },
          })
        } catch (emailError) {
          // Email might conflict with another user, log but don't fail
          console.warn('Could not update user email:', emailError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      integration: {
        id: integration.id,
        locationId: integration.locationId,
        businessName: integration.businessName,
        businessEmail: integration.businessEmail,
        businessPhone: integration.businessPhone,
        locationName: integration.locationName,
        locationEmail: integration.locationEmail,
        isConnected: integration.isConnected,
      },
    })
  } catch (error) {
    console.error('POST /api/settings/ghl error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/settings/ghl
 * Remove the GHL integration for the current user.
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await db.ghlIntegration.deleteMany({
      where: { userId: user.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/settings/ghl error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

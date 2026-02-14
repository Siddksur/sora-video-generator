import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch GHL integration info for welcome message
    const ghlIntegration = await db.ghlIntegration.findUnique({
      where: { userId: user.id },
      select: {
        businessName: true,
        locationName: true,
        isConnected: true,
      },
    })

    const businessName = ghlIntegration?.isConnected
      ? (ghlIntegration.businessName || ghlIntegration.locationName || null)
      : null

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        creditsBalance: user.creditsBalance,
        businessName,
        ghlConnected: ghlIntegration?.isConnected || false,
      }
    })
  } catch (error) {
    console.error('Profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { validateLocation } from '@/lib/ghl'
import { createSession } from '@/lib/session'
import crypto from 'crypto'

/**
 * Verify a signed cookie value.
 * Format: timestamp.hmac(timestamp)
 * The HMAC is generated using the same secret used in middleware.
 */
function verifySignedValue(value: string, secret: string, ttlMs = 60_000): boolean {
  const parts = value.split('.')
  if (parts.length !== 2) return false

  const [timestamp, hmac] = parts
  const ts = parseInt(timestamp, 10)
  if (isNaN(ts)) return false

  // Check TTL
  if (Date.now() - ts > ttlMs) return false

  // Verify HMAC
  const expected = crypto.createHmac('sha256', secret).update(timestamp).digest('hex')
  return hmac === expected
}

/**
 * GET /api/init?location_id=xxx
 *
 * Unauthenticated endpoint for GHL iframe auto-login.
 * 1. Requires the `ghl_embed_verified` cookie (set by middleware when Referer is GHL).
 * 2. Validates location_id via GHL API.
 * 3. Gets or creates a User for this location.
 * 4. Creates a session token and returns it.
 */
export async function GET(request: NextRequest) {
  try {
    const locationId = request.nextUrl.searchParams.get('location_id')

    if (!locationId) {
      return NextResponse.json(
        { error: 'location_id is required' },
        { status: 400 }
      )
    }

    // --- Server-side iframe verification ---
    // Dev mode bypass
    const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

    if (!isDevMode) {
      const cookie = request.cookies.get('ghl_embed_verified')
      if (!cookie?.value) {
        return NextResponse.json(
          { error: 'Access denied. This app must be accessed from within GoHighLevel.' },
          { status: 403 }
        )
      }

      const secret = process.env.JWT_SECRET!
      const isValidCookie = verifySignedValue(cookie.value, secret, 120_000) // 2 min tolerance
      if (!isValidCookie) {
        return NextResponse.json(
          { error: 'Access denied. Verification expired. Please reload from GoHighLevel.' },
          { status: 403 }
        )
      }
    }

    // --- Validate location via GHL API ---
    const validation = await validateLocation(locationId)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'Invalid location' },
        { status: 403 }
      )
    }

    // --- Get or create User for this location ---
    let user = await db.user.findUnique({
      where: { locationId },
      select: {
        id: true,
        username: true,
        email: true,
        creditsBalance: true,
      },
    })

    if (!user) {
      // Create a new user for this GHL location
      const username = `ghl_${locationId}`
      const email = `location_${locationId}@ghl.placeholder`
      // Generate a random password hash (this user will never log in with a password)
      const randomPass = crypto.randomBytes(32).toString('hex')
      const passwordHash = await hashPassword(randomPass)

      user = await db.user.create({
        data: {
          username,
          email,
          passwordHash,
          locationId,
          authType: 'ghl',
          creditsBalance: 0,
        },
        select: {
          id: true,
          username: true,
          email: true,
          creditsBalance: true,
        },
      })
    }

    // --- Create session ---
    const sessionToken = await createSession(locationId)

    // Clear the verification cookie (one-time use)
    const response = NextResponse.json({
      session_token: sessionToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        creditsBalance: user.creditsBalance,
      },
    })

    // Delete the verification cookie after use
    response.cookies.delete('ghl_embed_verified')

    return response
  } catch (error) {
    console.error('Init error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

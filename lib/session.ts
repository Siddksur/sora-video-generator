import crypto from 'crypto'
import { db } from './db'

/**
 * Create a new session for a GHL location.
 * Generates a 64-char hex token, stores SHA256(token) in DB with 24h expiry.
 * Deletes any existing sessions for this locationId first.
 */
export async function createSession(locationId: string): Promise<string> {
  // Generate a random 64-char hex token
  const rawToken = crypto.randomBytes(32).toString('hex')

  // Hash the token for storage
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

  // Set expiry to 24 hours from now
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

  // Delete existing sessions for this location
  await db.session.deleteMany({
    where: { locationId },
  })

  // Create new session
  await db.session.create({
    data: {
      locationId,
      tokenHash,
      expiresAt,
    },
  })

  // Return the raw token (NOT the hash) to the client
  return rawToken
}

interface SessionValidation {
  valid: boolean
  locationId?: string
  error?: string
}

/**
 * Validate a session token from a request.
 * Hashes the token, looks it up in the DB, checks expiry.
 */
export async function validateSessionToken(token: string): Promise<SessionValidation> {
  try {
    // Hash the incoming token
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    // Look up session by hash
    const session = await db.session.findFirst({
      where: { tokenHash },
    })

    if (!session) {
      return { valid: false, error: 'Session not found' }
    }

    // Check if expired
    if (new Date() > session.expiresAt) {
      // Clean up expired session
      await db.session.delete({ where: { id: session.id } })
      return { valid: false, error: 'Session expired' }
    }

    return { valid: true, locationId: session.locationId }
  } catch (error) {
    console.error('Session validation error:', error)
    return { valid: false, error: 'Session validation failed' }
  }
}

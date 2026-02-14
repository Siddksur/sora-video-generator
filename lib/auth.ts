import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'
import { db } from './db'
import { validateSessionToken } from './session'

const JWT_SECRET = process.env.JWT_SECRET!

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' })
}

export async function verifyToken(token: string): Promise<string | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    return decoded.userId
  } catch {
    return null
  }
}

/**
 * Determine if a token is a JWT (3-segment dot-separated) or a session token (64-char hex).
 */
function isJwt(token: string): boolean {
  const parts = token.split('.')
  return parts.length === 3
}

/**
 * Get the authenticated user from a request.
 * Supports dual auth:
 *   - JWT tokens (from login/register) → look up user by userId in JWT payload
 *   - Session tokens (64-char hex from GHL init) → look up user by locationId
 */
export async function getUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)

  if (isJwt(token)) {
    // JWT auth path (existing login/register users)
    const userId = await verifyToken(token)
    if (!userId) return null

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        creditsBalance: true,
      }
    })
    return user
  } else {
    // Session token auth path (GHL users)
    const sessionResult = await validateSessionToken(token)
    if (!sessionResult.valid || !sessionResult.locationId) return null

    const user = await db.user.findUnique({
      where: { locationId: sessionResult.locationId },
      select: {
        id: true,
        username: true,
        email: true,
        creditsBalance: true,
      }
    })
    return user
  }
}


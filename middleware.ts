import { NextRequest, NextResponse } from 'next/server'

/**
 * Next.js Edge middleware for GHL iframe verification.
 *
 * When a request to `/` or `/dashboard` carries `location_id` in the query
 * string, the middleware checks the Referer header. If the Referer matches a
 * GHL domain, it sets a short-lived signed cookie (`ghl_embed_verified`) that
 * the `/api/init` route will later require.
 *
 * Uses Web Crypto API (Edge-compatible, no Node.js crypto).
 */

// Default GHL domain patterns
const DEFAULT_GHL_DOMAINS = [
  'app.gohighlevel.com',
  'gohighlevel.com',
  'app.leadconnectorhq.com',
  'leadconnectorhq.com',
]

function getGhlDomainPatterns(): string[] {
  const envDomains = process.env.GHL_ALLOWED_REFERER_DOMAINS
  if (envDomains) {
    return envDomains
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean)
  }
  return DEFAULT_GHL_DOMAINS
}

function isGhlReferer(referer: string | null, patterns: string[]): boolean {
  if (!referer) return false

  let refererHost: string
  try {
    refererHost = new URL(referer).hostname
  } catch {
    return false
  }

  return patterns.some((pattern) => {
    if (pattern.startsWith('*.')) {
      // Wildcard: *.gohighlevel.com matches any subdomain
      const suffix = pattern.slice(1) // ".gohighlevel.com"
      return refererHost.endsWith(suffix) || refererHost === pattern.slice(2)
    }
    return refererHost === pattern
  })
}

/**
 * Encode bytes to hex string (Edge-compatible alternative to Buffer.toString('hex'))
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Create a signed verification value using Web Crypto API.
 * Format: timestamp.hmac(timestamp)
 */
async function createSignedValue(secret: string): Promise<string> {
  const timestamp = Date.now().toString()
  const encoder = new TextEncoder()

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(timestamp))
  const hmac = bytesToHex(new Uint8Array(signature))

  return `${timestamp}.${hmac}`
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const locationId = searchParams.get('location_id')

  // Only act on pages that have location_id
  if (!locationId) {
    return NextResponse.next()
  }

  // Only intercept page routes (not API routes)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Dev mode bypass
  if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
    const response = NextResponse.next()
    // In dev mode, always set the cookie so init works
    const secret = process.env.JWT_SECRET || 'dev-secret'
    const signedValue = await createSignedValue(secret)
    response.cookies.set('ghl_embed_verified', signedValue, {
      httpOnly: true,
      sameSite: 'none', // Required for cross-origin iframe
      secure: true,
      path: '/',
      maxAge: 120, // 2 minutes in dev for extra buffer
    })
    return response
  }

  // Check Referer header
  const referer = request.headers.get('referer')
  const patterns = getGhlDomainPatterns()
  const isValid = isGhlReferer(referer, patterns)

  if (isValid) {
    const secret = process.env.JWT_SECRET!
    const signedValue = await createSignedValue(secret)

    const response = NextResponse.next()
    response.cookies.set('ghl_embed_verified', signedValue, {
      httpOnly: true,
      sameSite: 'none', // Required for cross-origin iframe
      secure: true,
      path: '/',
      maxAge: 60, // 60 seconds TTL
    })
    return response
  }

  // No valid GHL referer — don't set cookie, proceed normally
  // The init API will reject the request without the cookie
  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/dashboard'],
}

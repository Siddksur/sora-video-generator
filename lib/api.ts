/**
 * Client-side auth helpers.
 * Supports dual auth: JWT (localStorage) for direct users, session token (sessionStorage) for GHL users.
 */

/**
 * Get the current auth token (JWT or GHL session token).
 * Prefers JWT (localStorage) over session token (sessionStorage).
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token') || sessionStorage.getItem('agh_session_token') || null
}

/**
 * Get auth headers for API requests.
 * Returns an object with Authorization header if a token is available.
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * Get the stored user object (from either localStorage or sessionStorage).
 */
export function getStoredUser(): any | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('user') || sessionStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * Check if the user is authenticated via GHL session (vs JWT).
 */
export function isGhlSession(): boolean {
  if (typeof window === 'undefined') return false
  return !localStorage.getItem('token') && !!sessionStorage.getItem('agh_session_token')
}

/**
 * Clear all auth data (both JWT and session).
 */
export function clearAuth(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  sessionStorage.removeItem('agh_session_token')
  sessionStorage.removeItem('user')
}

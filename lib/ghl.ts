import axios from 'axios'

const GHL_API_KEY = process.env.GHL_API_KEY!
const GHL_COMPANY_ID = process.env.GHL_COMPANY_ID || ''

interface GHLLocation {
  id: string
  name: string
  companyId: string
  [key: string]: any
}

interface ValidationResult {
  valid: boolean
  location?: GHLLocation
  error?: string
}

/**
 * Validate a GHL location_id by calling the GHL Locations API.
 * Optionally enforce that the location belongs to a specific agency (companyId).
 */
export async function validateLocation(locationId: string): Promise<ValidationResult> {
  if (!GHL_API_KEY) {
    console.error('GHL_API_KEY is not set')
    return { valid: false, error: 'Server configuration error' }
  }

  try {
    const response = await axios.get(
      `https://services.leadconnectorhq.com/locations/${locationId}`,
      {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28',
          'Accept': 'application/json',
        },
      }
    )

    const location: GHLLocation = response.data.location || response.data

    if (!location || !location.id) {
      return { valid: false, error: 'Location not found' }
    }

    // Enforce agency check if GHL_COMPANY_ID is set
    if (GHL_COMPANY_ID && location.companyId !== GHL_COMPANY_ID) {
      return { valid: false, error: 'Location does not belong to this agency' }
    }

    return { valid: true, location }
  } catch (error: any) {
    if (error.response?.status === 404 || error.response?.status === 401) {
      return { valid: false, error: 'Invalid location' }
    }
    console.error('GHL validation error:', error.message)
    return { valid: false, error: 'Failed to validate location' }
  }
}

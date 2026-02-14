import axios from 'axios'

const GHL_API_BASE = 'https://services.leadconnectorhq.com'
const GHL_API_VERSION = '2021-07-28'

interface GHLLocationInfo {
  id: string
  name: string
  email: string
  phone?: string
}

interface GHLBusinessInfo {
  name: string
  email?: string
  phone?: string
}

interface SubaccountValidationResult {
  valid: boolean
  location?: GHLLocationInfo
  business?: GHLBusinessInfo
  error?: string
}

/**
 * Build standard GHL API headers for a subaccount private integration API key.
 */
function ghlHeaders(apiKey: string) {
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Version': GHL_API_VERSION,
    'Accept': 'application/json',
  }
}

/**
 * Validate a GHL subaccount Private Integration API key.
 * Calls the Location API to verify the key works and fetches location info.
 * Then attempts to fetch business info for a richer display name.
 */
export async function validateSubaccountApiKey(
  apiKey: string,
  locationId: string
): Promise<SubaccountValidationResult> {
  try {
    // Step 1: Validate the API key by fetching the location
    const locationResponse = await axios.get(
      `${GHL_API_BASE}/locations/${locationId}`,
      { headers: ghlHeaders(apiKey) }
    )

    const locationData = locationResponse.data.location || locationResponse.data

    if (!locationData || !locationData.id) {
      return { valid: false, error: 'Could not retrieve location info' }
    }

    const location: GHLLocationInfo = {
      id: locationData.id,
      name: locationData.name || '',
      email: locationData.email || '',
      phone: locationData.phone || '',
    }

    // Step 2: Try to fetch business info (optional, may fail if scope not granted)
    let business: GHLBusinessInfo | undefined
    try {
      const businessResponse = await axios.get(
        `${GHL_API_BASE}/businesses/`,
        {
          params: { locationId },
          headers: ghlHeaders(apiKey),
        }
      )

      const businesses = businessResponse.data.businesses || []
      if (businesses.length > 0) {
        business = {
          name: businesses[0].name || '',
          email: businesses[0].email || '',
          phone: businesses[0].phone || '',
        }
      }
    } catch (bizError: any) {
      // Business API call failed - not critical, we still have location info
      console.warn('Could not fetch business info (scope may not be granted):', bizError.message)
    }

    return { valid: true, location, business }
  } catch (error: any) {
    if (error.response?.status === 401) {
      return { valid: false, error: 'Invalid API key or insufficient permissions. Make sure you have the "locations.readonly" scope enabled.' }
    }
    if (error.response?.status === 403) {
      return { valid: false, error: 'API key does not have access to this location. Check your Private Integration scopes.' }
    }
    if (error.response?.status === 404) {
      return { valid: false, error: 'Location not found. Please verify your Location ID.' }
    }
    if (error.response?.status === 422) {
      return { valid: false, error: 'Invalid Location ID format.' }
    }
    console.error('GHL subaccount validation error:', error.message)
    return { valid: false, error: 'Failed to validate API key. Please try again.' }
  }
}

/**
 * Fetch the notification email for a GHL location using the subaccount API key.
 * Returns the real email address instead of the placeholder.
 */
export async function fetchLocationEmail(
  apiKey: string,
  locationId: string
): Promise<string | null> {
  try {
    const response = await axios.get(
      `${GHL_API_BASE}/locations/${locationId}`,
      { headers: ghlHeaders(apiKey) }
    )

    const location = response.data.location || response.data
    return location?.email || null
  } catch (error: any) {
    console.error('Failed to fetch location email:', error.message)
    return null
  }
}

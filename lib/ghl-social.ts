import axios from 'axios'

const GHL_API_BASE = 'https://services.leadconnectorhq.com'
const GHL_API_VERSION = '2021-07-28'

// --- Types ---

export interface SocialAccount {
  id: string
  name: string
  platform: string
  avatar?: string
  type?: string
}

export interface ConnectedAccountsResult {
  success: boolean
  accounts?: SocialAccount[]
  error?: string
}

export interface CreatePostPayload {
  accountIds: string[]
  summary: string
  media: string[]
  scheduledDate?: string // ISO 8601 date string for scheduling
}

export interface CreatePostResult {
  success: boolean
  postId?: string
  error?: string
}

export interface UploadMediaResult {
  success: boolean
  url?: string
  error?: string
}

// --- Helpers ---

function ghlHeaders(apiKey: string) {
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Version': GHL_API_VERSION,
    'Accept': 'application/json',
  }
}

// --- API Functions ---

/**
 * Get connected social media accounts for a GHL location.
 * Requires scope: socialplanner/account.readonly
 */
export async function getConnectedAccounts(
  apiKey: string,
  locationId: string
): Promise<ConnectedAccountsResult> {
  try {
    const response = await axios.get(
      `${GHL_API_BASE}/social-media-posting/${locationId}/accounts`,
      { headers: ghlHeaders(apiKey) }
    )

    // The response may contain accounts at different paths depending on API version
    const rawAccounts = response.data?.accounts || response.data?.data || response.data || []
    const accountList = Array.isArray(rawAccounts) ? rawAccounts : []

    const accounts: SocialAccount[] = accountList.map((acc: any) => ({
      id: acc.id || acc._id,
      name: acc.name || acc.pageName || acc.accountName || 'Unknown Account',
      platform: (acc.platform || acc.type || 'unknown').toLowerCase(),
      avatar: acc.avatar || acc.profilePicture || acc.thumbnail || undefined,
      type: acc.type || acc.accountType || undefined,
    }))

    return { success: true, accounts }
  } catch (error: any) {
    if (error.response?.status === 401) {
      return { success: false, error: 'Unauthorized. Check your API key and socialplanner/account.readonly scope.' }
    }
    if (error.response?.status === 403) {
      return { success: false, error: 'Access denied. The socialplanner/account.readonly scope may not be enabled.' }
    }
    console.error('Failed to fetch connected accounts:', error.message)
    return { success: false, error: 'Failed to fetch connected social media accounts.' }
  }
}

/**
 * Create a social media post via the GHL Social Planner API.
 * Requires scope: socialplanner/post.write
 *
 * @param apiKey - Subaccount Private Integration API key
 * @param locationId - GHL location ID
 * @param payload - Post data (accountIds, summary, media URLs, optional scheduledDate)
 */
export async function createSocialPost(
  apiKey: string,
  locationId: string,
  payload: CreatePostPayload
): Promise<CreatePostResult> {
  try {
    const body: any = {
      accountIds: payload.accountIds,
      summary: payload.summary,
      media: payload.media,
    }

    // Add scheduled date if provided (otherwise it posts immediately)
    if (payload.scheduledDate) {
      body.scheduledDate = payload.scheduledDate
    }

    const response = await axios.post(
      `${GHL_API_BASE}/social-media-posting/${locationId}/posts`,
      body,
      { headers: ghlHeaders(apiKey) }
    )

    const postId = response.data?.id || response.data?.postId || response.data?._id
    return { success: true, postId }
  } catch (error: any) {
    if (error.response?.status === 401) {
      return { success: false, error: 'Unauthorized. Check your API key and socialplanner/post.write scope.' }
    }
    if (error.response?.status === 400) {
      const msg = error.response?.data?.message || error.response?.data?.error || 'Invalid request.'
      return { success: false, error: `Bad request: ${msg}` }
    }
    if (error.response?.status === 422) {
      const msg = error.response?.data?.message || error.response?.data?.error || 'Validation failed.'
      return { success: false, error: `Validation error: ${msg}` }
    }
    console.error('Failed to create social post:', error.message)
    return { success: false, error: 'Failed to create social media post. Please try again.' }
  }
}

/**
 * Upload a video from an external URL to GHL media storage.
 * Falls back approach if direct URLs are not accepted by the Social Planner.
 * Requires scope: medias.write
 *
 * Downloads the video from the external URL and uploads it to GHL.
 */
export async function uploadMediaToGhl(
  apiKey: string,
  locationId: string,
  videoUrl: string
): Promise<UploadMediaResult> {
  try {
    // Step 1: Download the video from the external URL
    const videoResponse = await axios.get(videoUrl, {
      responseType: 'arraybuffer',
      timeout: 120000, // 2 minute timeout for large videos
    })

    const videoBuffer = Buffer.from(videoResponse.data)
    const contentType = videoResponse.headers['content-type'] || 'video/mp4'

    // Step 2: Create a FormData-like upload to GHL media storage
    const FormData = (await import('form-data')).default
    const formData = new FormData()
    formData.append('file', videoBuffer, {
      filename: `video-${Date.now()}.mp4`,
      contentType,
    })
    formData.append('hosted', 'true')
    formData.append('fileProcessingType', 'video')

    const uploadResponse = await axios.post(
      `${GHL_API_BASE}/medias/upload-file`,
      formData,
      {
        headers: {
          ...ghlHeaders(apiKey),
          ...formData.getHeaders(),
        },
        params: { locationId },
        timeout: 180000, // 3 minute timeout for upload
        maxContentLength: 500 * 1024 * 1024, // 500MB
        maxBodyLength: 500 * 1024 * 1024,
      }
    )

    const uploadedUrl = uploadResponse.data?.url || uploadResponse.data?.fileUrl
    if (!uploadedUrl) {
      return { success: false, error: 'Upload succeeded but no URL was returned.' }
    }

    return { success: true, url: uploadedUrl }
  } catch (error: any) {
    if (error.response?.status === 401) {
      return { success: false, error: 'Unauthorized. Check your API key and medias.write scope.' }
    }
    console.error('Failed to upload media to GHL:', error.message)
    return { success: false, error: 'Failed to upload video to GHL media storage.' }
  }
}

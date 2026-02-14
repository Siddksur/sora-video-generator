import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { createSocialPost, uploadMediaToGhl } from '@/lib/ghl-social'
import { db } from '@/lib/db'

/**
 * POST /api/social/post
 * Create a social media post with a completed video.
 * 
 * Body: {
 *   videoId: string,
 *   accountIds: string[],
 *   summary: string,
 *   scheduledDate?: string (ISO 8601)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { videoId, accountIds, summary, scheduledDate } = body

    // Validate required fields
    if (!videoId || typeof videoId !== 'string') {
      return NextResponse.json({ error: 'videoId is required.' }, { status: 400 })
    }
    if (!accountIds || !Array.isArray(accountIds) || accountIds.length === 0) {
      return NextResponse.json({ error: 'At least one social account must be selected.' }, { status: 400 })
    }
    if (!summary || typeof summary !== 'string' || !summary.trim()) {
      return NextResponse.json({ error: 'A caption/summary is required.' }, { status: 400 })
    }

    // Get the user's GHL integration
    const integration = await db.ghlIntegration.findUnique({
      where: { userId: user.id },
      select: {
        apiKey: true,
        locationId: true,
        isConnected: true,
      },
    })

    if (!integration || !integration.isConnected) {
      return NextResponse.json(
        { error: 'GHL integration not connected. Please connect your GoHighLevel account in Settings.' },
        { status: 400 }
      )
    }

    // Get the video record and verify ownership
    const video = await db.video.findUnique({
      where: { id: videoId },
      select: {
        id: true,
        userId: true,
        videoUrl: true,
        status: true,
        prompt: true,
      },
    })

    if (!video) {
      return NextResponse.json({ error: 'Video not found.' }, { status: 404 })
    }

    if (video.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized access to this video.' }, { status: 403 })
    }

    if (video.status !== 'completed' || !video.videoUrl) {
      return NextResponse.json({ error: 'Video is not yet completed or has no URL.' }, { status: 400 })
    }

    // Try Option A first: Direct URL in the media array
    // Try creating the social post with the video URL directly
    let mediaUrls = [video.videoUrl]

    console.log('[Social Post] Attempting with direct video URL:', video.videoUrl.substring(0, 80) + '...')

    let result = await createSocialPost(integration.apiKey, integration.locationId, {
      accountIds,
      summary: summary.trim(),
      media: mediaUrls,
      scheduledDate: scheduledDate || undefined,
    })

    console.log('[Social Post] Direct URL result:', JSON.stringify(result))

    // If direct URL failed, try Option B: Upload to GHL media storage first
    if (!result.success) {
      console.log('[Social Post] Direct URL failed, attempting GHL media upload fallback...')

      const uploadResult = await uploadMediaToGhl(
        integration.apiKey,
        integration.locationId,
        video.videoUrl
      )

      console.log('[Social Post] Upload result:', JSON.stringify({ success: uploadResult.success, url: uploadResult.url?.substring(0, 80), error: uploadResult.error }))

      if (uploadResult.success && uploadResult.url) {
        mediaUrls = [uploadResult.url]
        result = await createSocialPost(integration.apiKey, integration.locationId, {
          accountIds,
          summary: summary.trim(),
          media: mediaUrls,
          scheduledDate: scheduledDate || undefined,
        })
        console.log('[Social Post] Retry with uploaded URL result:', JSON.stringify(result))
      } else {
        return NextResponse.json(
          { error: uploadResult.error || 'Failed to upload video to GHL media storage.' },
          { status: 400 }
        )
      }
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create social media post.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      postId: result.postId,
      message: scheduledDate ? 'Post scheduled successfully!' : 'Posted successfully!',
    })
  } catch (error) {
    console.error('POST /api/social/post error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

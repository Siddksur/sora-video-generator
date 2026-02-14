import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { getVideoCostCredits } from '@/lib/stripe'
import axios from 'axios'

const N8N_WEBHOOK_URL_SORA = process.env.N8N_WEBHOOK_URL_SORA || process.env.N8N_WEBHOOK_URL!
const N8N_WEBHOOK_URL_VEO3 = process.env.N8N_WEBHOOK_URL_VEO3!

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { prompt, additionalDetails, requestedEmail, aspectRatio, model, imageUrl, startFrameUrl, endFrameUrl, service } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Determine service and full model name
    const activeService = service || 'SORA'

    // Calculate credit cost based on model and service
    const creditCost = getVideoCostCredits(model, service)

    if (user.creditsBalance < creditCost) {
      return NextResponse.json(
        { error: 'Insufficient credits. Please purchase more credits.' },
        { status: 400 }
      )
    }

    // Determine video type
    // For VEO 3, check if we have startFrameUrl or endFrameUrl (image-to-video)
    // For SORA, check if we have imageUrl (image-to-video)
    const videoType = (activeService === 'VEO 3' && (startFrameUrl || endFrameUrl)) || (activeService !== 'VEO 3' && imageUrl) ? 'image-to-video' : 'text-to-video'
    // Extract model variant (Pro or standard) - check for Pro in model name
    const isPro = model?.includes('Pro') || model === 'SORA 2 Pro' || model === 'VEO 3 Pro'
    const fullModelName = activeService === 'VEO 3' 
      ? (isPro ? 'VEO 3 Pro' : 'VEO 3')
      : (model || 'SORA 2')

    // Create video record - try with new fields first, fallback if columns don't exist
    let video
    try {
      // Try creating with model and videoType fields
      video = await db.video.create({
        data: {
          userId: user.id,
          prompt,
          additionalDetails: additionalDetails || null,
          status: 'pending',
          model: fullModelName,
          videoType: videoType
        }
      })
    } catch (error: any) {
      // If columns don't exist (P2022 error), create without them
      if (error.code === 'P2022' || error.message?.includes('does not exist')) {
        console.log('Model/videoType columns not available, creating video without them')
        video = await db.video.create({
          data: {
            userId: user.id,
            prompt,
            additionalDetails: additionalDetails || null,
            status: 'pending'
          }
        })
      } else {
        // Re-throw if it's a different error
        throw error
      }
    }

    // Deduct credits
    await db.user.update({
      where: { id: user.id },
      data: {
        creditsBalance: {
          decrement: creditCost
        }
      }
    })

    // Create credit history entry
    await db.creditHistory.create({
      data: {
        userId: user.id,
        amount: -creditCost,
        transactionType: 'usage',
        description: `Used ${creditCost} credits for video generation (${fullModelName})`
      }
    })

    // Call n8n webhook - use service-specific webhook URL
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/videos/callback`
    const webhookUrl = activeService === 'VEO 3' ? N8N_WEBHOOK_URL_VEO3 : N8N_WEBHOOK_URL_SORA
    
    // Determine the model value for the webhook payload
    // Note: isPro is already defined above, reusing it here
    let webhookModel = model || (activeService === 'VEO 3' ? 'VEO 3' : 'SORA 2')
    
    // Check if this is image-to-video mode
    const isImageToVideo = (activeService === 'VEO 3' && (startFrameUrl || endFrameUrl)) || (activeService !== 'VEO 3' && imageUrl)
    
    if (isImageToVideo) {
      // Image to Video mode
      if (activeService === 'VEO 3') {
        // VEO 3 uses new format: veo3-image-to-video or veo3pro-image-to-video
        webhookModel = isPro ? 'veo3pro-image-to-video' : 'veo3-image-to-video'
      } else {
        // SORA 2 uses existing format
        webhookModel = isPro ? 'image-to-video-sora2pro' : 'image-to-video-sora2'
      }
    } else {
      // Text to Video mode
      if (activeService === 'VEO 3') {
        // VEO 3 uses new format: veo3-text-to-video or veo3pro-text-to-video
        webhookModel = isPro ? 'veo3pro-text-to-video' : 'veo3-text-to-video'
      } else {
        // SORA 2 uses existing format
        webhookModel = isPro ? 'sora2pro' : 'sora2'
      }
    }
    
    try {
      // Format aspect ratio based on service
      // VEO 3 uses "16:9" for landscape and "9:16" for portrait
      // SORA 2 uses "landscape" and "portrait" (unchanged)
      let formattedAspectRatio = aspectRatio || 'landscape'
      if (activeService === 'VEO 3') {
        formattedAspectRatio = formattedAspectRatio === 'portrait' ? '9:16' : '16:9'
      }

      // Get the real email from GHL integration if connected (overrides stale user.email)
      let effectiveEmail = user.email
      try {
        const ghlIntegration = await db.ghlIntegration.findUnique({
          where: { userId: user.id },
          select: { businessEmail: true, locationEmail: true, isConnected: true },
        })
        if (ghlIntegration?.isConnected) {
          effectiveEmail = ghlIntegration.businessEmail || ghlIntegration.locationEmail || user.email
        }
      } catch (e) {
        // GHL lookup failed, fall back to user.email
      }

      // Prepare webhook payload
      const webhookPayload: any = {
        video_id: video.id,
        user_id: user.id,
        user_email: effectiveEmail,
        video_prompt: prompt,
        additional_details: additionalDetails || '',
        callback_url: callbackUrl,
        requested_email: requestedEmail || effectiveEmail,
        aspect_ratio: formattedAspectRatio,
        model: webhookModel,
        service: activeService
      }

      // Add image URLs based on service
      if (activeService === 'VEO 3') {
        // VEO 3 uses start_frame_url and end_frame_url
        if (startFrameUrl) {
          webhookPayload.start_frame_url = startFrameUrl
        }
        if (endFrameUrl) {
          webhookPayload.end_frame_url = endFrameUrl
        }
      } else {
        // SORA 2 uses image_url (single image)
        if (imageUrl) {
          webhookPayload.image_url = imageUrl
        }
      }

      await axios.post(webhookUrl, webhookPayload)
    } catch (error) {
      console.error('Error calling n8n webhook:', error)
      // Don't fail the request, video is already created
    }

    return NextResponse.json({
      video: {
        id: video.id,
        status: video.status,
        createdAt: video.createdAt
      }
    })
  } catch (error) {
    console.error('Video generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


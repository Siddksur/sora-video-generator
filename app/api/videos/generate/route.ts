import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { getVideoCostCredits } from '@/lib/stripe'
import axios from 'axios'

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL!

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { prompt, additionalDetails, requestedEmail, aspectRatio, model, imageUrl } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Calculate credit cost based on model
    const creditCost = getVideoCostCredits(model)

    if (user.creditsBalance < creditCost) {
      return NextResponse.json(
        { error: 'Insufficient credits. Please purchase more credits.' },
        { status: 400 }
      )
    }

    // Determine video type
    const videoType = imageUrl ? 'image-to-video' : 'text-to-video'

    // Create video record
    const video = await db.video.create({
      data: {
        userId: user.id,
        prompt,
        additionalDetails: additionalDetails || null,
        status: 'pending',
        model: model || 'SORA 2',
        videoType: videoType
      }
    })

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
        description: `Used ${creditCost} credits for video generation (${model || 'SORA 2'})`
      }
    })

    // Call n8n webhook
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/videos/callback`
    
    // Determine the model value for the webhook payload
    let webhookModel = model || 'SORA 2'
    if (imageUrl) {
      // Image to Video mode
      if (model === 'SORA 2 Pro') {
        webhookModel = 'image-to-video-sora2pro'
      } else {
        webhookModel = 'image-to-video-sora2'
      }
    }
    
    try {
      await axios.post(N8N_WEBHOOK_URL, {
        video_id: video.id,
        user_id: user.id,
        user_email: user.email,
        video_prompt: prompt,
        additional_details: additionalDetails || '',
        callback_url: callbackUrl,
        // optional fields for your workflow
        requested_email: requestedEmail || user.email,
        aspect_ratio: aspectRatio || 'landscape',
        model: webhookModel,
        image_url: imageUrl || null
      })
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


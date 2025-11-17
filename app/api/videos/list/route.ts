import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch all videos without explicit select to handle dynamic columns
    const videos = await db.video.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    })

    // Map to ensure consistent response format, handling potentially missing columns
    const mappedVideos = videos.map((video: any) => ({
      id: video.id,
      prompt: video.prompt,
      additionalDetails: video.additionalDetails || undefined,
      videoUrl: video.videoUrl || undefined,
      status: video.status,
      model: video.model || undefined,
      videoType: video.videoType || undefined,
      errorMessage: video.errorMessage || undefined,
      createdAt: video.createdAt.toISOString(),
      completedAt: video.completedAt?.toISOString() || undefined
    }))

    return NextResponse.json({ videos: mappedVideos })
  } catch (error) {
    console.error('List videos error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


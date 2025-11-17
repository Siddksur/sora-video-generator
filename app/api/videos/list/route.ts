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

    // Use explicit select to avoid errors if new columns don't exist yet
    const videos = await db.video.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        prompt: true,
        additionalDetails: true,
        videoUrl: true,
        status: true,
        createdAt: true,
        completedAt: true
        // Note: model and videoType are excluded to avoid errors if columns don't exist
      }
    })

    // Map to ensure consistent response format
    const mappedVideos = videos.map(video => ({
      id: video.id,
      prompt: video.prompt,
      additionalDetails: video.additionalDetails || undefined,
      videoUrl: video.videoUrl || undefined,
      status: video.status,
      model: undefined, // Will be populated after migration
      videoType: undefined, // Will be populated after migration
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


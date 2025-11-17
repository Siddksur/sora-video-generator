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

    // Use findMany without select to get all fields (handles missing columns gracefully)
    const videos = await db.video.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    })

    // Map to ensure we only return the fields we need, handling missing columns
    const mappedVideos = videos.map(video => ({
      id: video.id,
      prompt: video.prompt,
      additionalDetails: video.additionalDetails || undefined,
      videoUrl: video.videoUrl || undefined,
      status: video.status,
      model: (video as any).model || undefined,
      videoType: (video as any).videoType || undefined,
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


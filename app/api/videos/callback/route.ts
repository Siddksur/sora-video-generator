import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { video_id, video_url, status, n8n_task_id } = await request.json()

    if (!video_id) {
      return NextResponse.json(
        { error: 'video_id is required' },
        { status: 400 }
      )
    }

    const video = await db.video.findUnique({
      where: { id: video_id }
    })

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    await db.video.update({
      where: { id: video_id },
      data: {
        videoUrl: video_url || null,
        status: status || 'completed',
        n8nTaskId: n8n_task_id || null,
        completedAt: status === 'completed' ? new Date() : null
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


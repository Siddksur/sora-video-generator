import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getVideoCostCredits } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const { video_id, video_url, status, n8n_task_id, failMsg } = await request.json()

    if (!video_id) {
      return NextResponse.json(
        { error: 'video_id is required' },
        { status: 400 }
      )
    }

    const video = await db.video.findUnique({
      where: { id: video_id },
      include: { user: true }
    })

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    // Handle failed status - refund credits
    if (status === 'failed' && failMsg) {
      // Calculate credit refund based on model (using type assertion for potentially missing field)
      const videoModel = (video as any).model || undefined
      const creditRefund = getVideoCostCredits(videoModel)
      
      // Update video with error message
      try {
        await db.video.update({
          where: { id: video_id },
          data: {
            status: 'failed',
            errorMessage: failMsg as any, // Type assertion until Prisma types are regenerated
            n8nTaskId: n8n_task_id || null,
            completedAt: new Date()
          } as any
        })
      } catch (error: any) {
        // If errorMessage column doesn't exist yet, update without it
        if (error.code === 'P2022' || error.message?.includes('does not exist')) {
          await db.video.update({
            where: { id: video_id },
            data: {
              status: 'failed',
              n8nTaskId: n8n_task_id || null,
              completedAt: new Date()
            }
          })
        } else {
          throw error
        }
      }

      // Refund credits to user
      await db.user.update({
        where: { id: video.userId },
        data: {
          creditsBalance: {
            increment: creditRefund
          }
        }
      })

      // Create credit history entry for refund
      await db.creditHistory.create({
        data: {
          userId: video.userId,
          amount: creditRefund,
          transactionType: 'refund',
          description: `Refunded ${creditRefund} credits for failed video generation (${videoModel || 'SORA 2'})`
        }
      })

      return NextResponse.json({ success: true, refunded: creditRefund })
    }

    // Handle success/completed status
    try {
      await db.video.update({
        where: { id: video_id },
        data: {
          videoUrl: video_url || null,
          status: status || 'completed',
          n8nTaskId: n8n_task_id || null,
          completedAt: status === 'completed' ? new Date() : null
        }
      })
    } catch (error: any) {
      // If new columns don't exist, update without them
      if (error.code === 'P2022' || error.message?.includes('does not exist')) {
        await db.video.update({
          where: { id: video_id },
          data: {
            videoUrl: video_url || null,
            status: status || 'completed',
            n8nTaskId: n8n_task_id || null,
            completedAt: status === 'completed' ? new Date() : null
          }
        })
      } else {
        throw error
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


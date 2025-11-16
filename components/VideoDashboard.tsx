'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { Loader2, Play, Download, Clock, CheckCircle, XCircle, Trash2, AlertTriangle } from 'lucide-react'

interface Video {
  id: string
  prompt: string
  additionalDetails?: string
  videoUrl?: string
  status: string
  createdAt: string
  completedAt?: string
}

export default function VideoDashboard() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchVideos()
    const interval = setInterval(() => {
      const hasPending = videos.some(v => v.status === 'pending' || v.status === 'processing')
      if (hasPending) fetchVideos()
    }, 10000)
    return () => clearInterval(interval)
  }, [videos.length])

  const fetchVideos = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/videos/list', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setVideos(response.data.videos)
    } catch (error) {
      console.error('Failed to fetch videos:', error)
    } finally {
      setLoading(false)
    }
  }

  const isStale = (video: Video) => {
    if (video.status === 'completed' || video.status === 'failed') return false
    const created = new Date(video.createdAt).getTime()
    const ageMs = Date.now() - created
    return ageMs > 60 * 60 * 1000 // > 1 hour
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />
    }
  }

  const getStatusText = (video: Video) => {
    if (isStale(video)) return 'Stale (no update > 1h)'
    switch (video.status) {
      case 'completed':
        return 'Completed'
      case 'failed':
        return 'Failed'
      case 'processing':
        return 'Processing'
      default:
        return 'Pending'
    }
  }

  const handleDownload = (videoUrl: string, prompt: string) => {
    const link = document.createElement('a')
    link.href = videoUrl
    link.download = `sora-video-${prompt.substring(0, 20).replace(/\s/g, '-')}.mp4`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this request? This cannot be undone.')) return
    setDeletingId(id)
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`/api/videos/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setVideos(videos.filter(v => v.id !== id))
    } catch (err) {
      alert('Failed to delete request')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No videos yet. Generate your first video!
      </div>
    )
  }

  return (
    <div className="space-y-4 max-h-[600px] overflow-y-auto">
      {videos.map((video) => (
        <div
          key={video.id}
          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800 mb-1 line-clamp-2">
                {video.prompt}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {getStatusIcon(video.status)}
                <span>{getStatusText(video)}</span>
                <span>•</span>
                <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                {isStale(video) && (
                  <span className="ml-2 inline-flex items-center gap-1 text-amber-600">
                    <AlertTriangle className="w-4 h-4" />
                    No update for over 1 hour
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(video.status !== 'completed') && (
                <button
                  onClick={() => handleDelete(video.id)}
                  disabled={deletingId === video.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 hover:bg-red-100 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {deletingId === video.id ? 'Deleting...' : 'Delete'}
                </button>
              )}
            </div>
          </div>

          {video.status === 'completed' && video.videoUrl && (
            <div className="mt-4 space-y-2">
              <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  src={video.videoUrl}
                  controls
                  className="w-full h-full"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
              <div className="flex gap-2">
                <a
                  href={video.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Open Video
                </a>
                <button
                  onClick={() => handleDownload(video.videoUrl!, video.prompt)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-200 text-gray-800 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          )}

          {(video.status === 'pending' || video.status === 'processing') && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Your video is being generated. This may take 2-4 minutes...</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}


'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { Loader2, Download, Clock, CheckCircle, XCircle, Trash2, AlertTriangle } from 'lucide-react'
import { getAuthHeaders } from '@/lib/api'

interface Video {
  id: string
  prompt: string
  additionalDetails?: string
  videoUrl?: string
  status: string
  model?: string
  videoType?: string
  errorMessage?: string
  createdAt: string
  completedAt?: string
}

export default function VideoDashboard() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set())

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
      const response = await axios.get('/api/videos/list', {
        headers: getAuthHeaders()
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
        return <CheckCircle className="w-5 h-5 text-emerald-400" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-rose-400" />
      case 'processing':
        return <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
      default:
        return <Clock className="w-5 h-5 text-amber-400" />
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
    if (!confirm('Delete this video? This cannot be undone.')) return
    setDeletingId(id)
    try {
      await axios.delete(`/api/videos/${id}`, {
        headers: getAuthHeaders()
      })
      setVideos(videos.filter(v => v.id !== id))
      // Remove from expanded prompts if it was expanded
      setExpandedPrompts(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    } catch (err) {
      alert('Failed to delete video')
    } finally {
      setDeletingId(null)
    }
  }

  const togglePromptExpansion = (videoId: string) => {
    setExpandedPrompts(prev => {
      const next = new Set(prev)
      if (next.has(videoId)) {
        next.delete(videoId)
      } else {
        next.add(videoId)
      }
      return next
    })
  }

  const shouldTruncatePrompt = (prompt: string) => {
    return prompt.length > 100
  }

  const getModelDisplayText = (video: Video) => {
    if (!video.model) return null
    
    const modelName = video.model
    const videoType = video.videoType === 'image-to-video' ? 'Image to Video' : 'Text To Video'
    return `Model: ${modelName} ${videoType}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-8 text-slate-300">
        No videos yet. Generate your first video!
      </div>
    )
  }

  return (
    <div className="space-y-4 max-h-[600px] overflow-y-auto">
      {videos.map((video) => (
        <div
          key={video.id}
          className="rounded-xl p-4 border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="mb-1">
                <p className={`text-sm font-medium text-white/90 ${!expandedPrompts.has(video.id) && shouldTruncatePrompt(video.prompt) ? 'line-clamp-2' : ''}`}>
                  {video.prompt}
                </p>
                {shouldTruncatePrompt(video.prompt) && (
                  <button
                    onClick={() => togglePromptExpansion(video.id)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 mt-1 transition-colors"
                  >
                    {expandedPrompts.has(video.id) ? 'See less' : 'See more'}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                {getStatusIcon(video.status)}
                <span>{getStatusText(video)}</span>
                {video.status === 'completed' && getModelDisplayText(video) && (
                  <>
                    <span>•</span>
                    <span className="text-slate-400">{getModelDisplayText(video)}</span>
                  </>
                )}
                <span>•</span>
                <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                {isStale(video) && (
                  <span className="ml-2 inline-flex items-center gap-1 text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                    No update for over 1 hour
                  </span>
                )}
              </div>
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
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <a
                    href="https://business.facebook.com/adsmanager"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Ads Manager
                  </a>
                  <button
                    onClick={() => handleDownload(video.videoUrl!, video.prompt)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/10 text-white text-sm rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download Video
                  </button>
                </div>
                <button
                  onClick={() => handleDelete(video.id)}
                  disabled={deletingId === video.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 text-rose-200 text-sm rounded-lg border border-rose-500/30 hover:bg-rose-500/20 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {deletingId === video.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          )}

          {(video.status === 'pending' || video.status === 'processing') && (
            <div className="mt-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-cyan-200">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Your video is being generated. This may take up to 6-15 minutes depending on the model selected...</span>
                </div>
                <button
                  onClick={() => handleDelete(video.id)}
                  disabled={deletingId === video.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 text-rose-200 text-sm rounded-lg border border-rose-500/30 hover:bg-rose-500/20 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {deletingId === video.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          )}

          {video.status === 'failed' && (
            <div className="mt-4 bg-rose-500/10 border border-rose-500/30 rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-rose-200 mb-2">
                    <XCircle className="w-5 h-5 text-rose-400" />
                    <span>Video Generation Failed</span>
                  </div>
                  {video.errorMessage && (
                    <div className="mt-2 p-3 bg-rose-900/20 border border-rose-500/20 rounded-lg">
                      <p className="text-sm text-rose-100 whitespace-pre-wrap">{video.errorMessage}</p>
                    </div>
                  )}
                  <p className="text-xs text-rose-300/80 mt-3">
                    Credits have been refunded to your account. Please try generating again.
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(video.id)}
                  disabled={deletingId === video.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 text-rose-200 text-sm rounded-lg border border-rose-500/30 hover:bg-rose-500/20 disabled:opacity-50 flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                  {deletingId === video.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}


'use client'

import { useState } from 'react'
import axios from 'axios'
import { Loader2 } from 'lucide-react'

interface VideoFormProps {
  onSuccess: () => void
}

export default function VideoForm({ onSuccess }: VideoFormProps) {
  const [prompt, setPrompt] = useState('')
  const [requestedEmail, setRequestedEmail] = useState('')
  const [aspectRatio, setAspectRatio] = useState<'portrait' | 'landscape'>('landscape')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      await axios.post('/api/videos/generate', 
        { prompt, requestedEmail, aspectRatio },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setSuccess(true)
      setPrompt('')
      setRequestedEmail('')
      setAspectRatio('landscape')
      onSuccess()
      
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate video')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-white">
      <div>
        <label htmlFor="prompt" className="block text-sm font-medium text-slate-200 mb-2">
          Video Prompt *
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          required
          rows={4}
          className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          placeholder="Just write a simple prompt, and our AI will generate a professional prompt for you!"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="requestedEmail" className="block text-sm font-medium text-slate-200 mb-2">
            Notification Email (Optional)
          </label>
          <input
            id="requestedEmail"
            type="email"
            value={requestedEmail}
            onChange={(e) => setRequestedEmail(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            placeholder="Email to notify when ready"
          />
        </div>

        <div>
          <label htmlFor="aspectRatio" className="block text-sm font-medium text-slate-200 mb-2">
            Aspect Ratio
          </label>
          <select
            id="aspectRatio"
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as 'portrait' | 'landscape')}
            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <option value="landscape">Landscape (16:9)</option>
            <option value="portrait">Portrait (9:16)</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-200 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 px-4 py-3 rounded-lg text-sm">
          Video generation started! You'll be notified when it's ready.
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 text-white py-2 px-4 rounded-lg font-medium hover:from-cyan-400 hover:to-indigo-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/20"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : (
          'Generate Video (5 Credits)'
        )}
      </button>
    </form>
  )
}


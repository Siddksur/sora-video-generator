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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
          Video Prompt *
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          required
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
          placeholder="Just write a simple prompt, and our AI will generate a professional prompt for you!"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="requestedEmail" className="block text-sm font-medium text-gray-700 mb-2">
            Notification Email (Optional)
          </label>
          <input
            id="requestedEmail"
            type="email"
            value={requestedEmail}
            onChange={(e) => setRequestedEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            placeholder="Email to notify when ready"
          />
        </div>

        <div>
          <label htmlFor="aspectRatio" className="block text-sm font-medium text-gray-700 mb-2">
            Aspect Ratio
          </label>
          <select
            id="aspectRatio"
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as 'portrait' | 'landscape')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
          >
            <option value="landscape">Landscape (16:9)</option>
            <option value="portrait">Portrait (9:16)</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          Video generation started! You'll be notified when it's ready.
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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


'use client'

import { useState } from 'react'
import axios from 'axios'
import { Loader2 } from 'lucide-react'

interface VideoFormProps {
  onSuccess: () => void
}

export default function VideoForm({ onSuccess }: VideoFormProps) {
  const [prompt, setPrompt] = useState('')
  const [additionalDetails, setAdditionalDetails] = useState('')
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
      const response = await axios.post('/api/videos/generate', 
        { prompt, additionalDetails },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setSuccess(true)
      setPrompt('')
      setAdditionalDetails('')
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
          placeholder="Describe the video you want to generate..."
        />
      </div>

      <div>
        <label htmlFor="additionalDetails" className="block text-sm font-medium text-gray-700 mb-2">
          Additional Details (Optional)
        </label>
        <textarea
          id="additionalDetails"
          value={additionalDetails}
          onChange={(e) => setAdditionalDetails(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
          placeholder="Any additional information or requirements..."
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          Video generation started! Check your video dashboard for progress.
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


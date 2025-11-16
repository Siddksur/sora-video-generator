'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { Loader2, Sparkles } from 'lucide-react'

interface VideoFormProps {
  onSuccess: () => void
}

export default function VideoForm({ onSuccess }: VideoFormProps) {
  const [prompt, setPrompt] = useState('')
  const [enhancedPrompt, setEnhancedPrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState<'portrait' | 'landscape'>('landscape')
  const [notifyChecked, setNotifyChecked] = useState(false)
  const [userEmail, setUserEmail] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [enhancing, setEnhancing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user')
      if (raw) {
        const u = JSON.parse(raw)
        if (u?.email) setUserEmail(u.email)
      }
    } catch {}
  }, [])

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt first')
      return
    }

    setEnhancing(true)
    setError('')

    try {
      const response = await axios.post('/api/prompts/enhance', {
        prompt: prompt
      })

      setEnhancedPrompt(response.data.enhancedPrompt || response.data.enhanced_prompt || '')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to enhance prompt. Please try again.')
    } finally {
      setEnhancing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    // Use enhanced prompt if available, otherwise use original prompt
    const finalPrompt = enhancedPrompt.trim() || prompt.trim()

    if (!finalPrompt) {
      setError('Please enter a prompt')
      setLoading(false)
      return
    }

    try {
      const token = localStorage.getItem('token')
      await axios.post('/api/videos/generate', 
        { 
          prompt: finalPrompt, 
          aspectRatio, 
          requestedEmail: notifyChecked ? userEmail : undefined 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setSuccess(true)
      setPrompt('')
      setEnhancedPrompt('')
      setNotifyChecked(false)
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
          Your Prompt *
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
        <button
          type="button"
          onClick={handleEnhancePrompt}
          disabled={enhancing || !prompt.trim()}
          className="mt-2 w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-purple-400 hover:to-pink-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
        >
          {enhancing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating AI Prompt...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate AI Prompt
            </>
          )}
        </button>
      </div>

      {enhancedPrompt && (
        <div>
          <label htmlFor="enhancedPrompt" className="block text-sm font-medium text-slate-200 mb-2">
            AI Enhanced Prompt (Cinematic)
          </label>
          <textarea
            id="enhancedPrompt"
            value={enhancedPrompt}
            onChange={(e) => setEnhancedPrompt(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            placeholder="AI-enhanced prompt will appear here..."
          />
          <p className="mt-1 text-xs text-emerald-300">This enhanced prompt will be used for video generation</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <input
            id="notify"
            type="checkbox"
            checked={notifyChecked}
            onChange={(e) => setNotifyChecked(e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-cyan-400"
          />
          <label htmlFor="notify" className="text-sm text-slate-200">
            Notify at <span className="font-medium text-white">{userEmail || 'your email on file'}</span>
          </label>
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
        disabled={loading || (!prompt.trim() && !enhancedPrompt.trim())}
        className="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 text-white py-2 px-4 rounded-lg font-medium hover:from-cyan-400 hover:to-indigo-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
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


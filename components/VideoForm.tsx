'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { Loader2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'

interface VideoFormProps {
  onSuccess: () => void
}

export default function VideoForm({ onSuccess }: VideoFormProps) {
  const [prompt, setPrompt] = useState('')
  const [enhancedPrompt, setEnhancedPrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState<'portrait' | 'landscape'>('landscape')
  const [model, setModel] = useState<'SORA 2' | 'SORA 2 Pro'>('SORA 2')
  const [notifyChecked, setNotifyChecked] = useState(false)
  const [userEmail, setUserEmail] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [enhancing, setEnhancing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [exampleModel, setExampleModel] = useState<'SORA 2' | 'SORA 2 Pro'>('SORA 2')
  const [exampleExpanded, setExampleExpanded] = useState(false)

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
          model,
          requestedEmail: notifyChecked ? userEmail : undefined 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setSuccess(true)
      setPrompt('')
      setEnhancedPrompt('')
      setNotifyChecked(false)
      setAspectRatio('landscape')
      setModel('SORA 2')
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
          style={{ color: '#ffffff' }}
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
          <label htmlFor="enhancedPrompt" className="block text-sm font-medium text-emerald-300 mb-2">
            AI Enhanced Prompt (Cinematic)
          </label>
          <textarea
            id="enhancedPrompt"
            value={enhancedPrompt}
            onChange={(e) => setEnhancedPrompt(e.target.value)}
            rows={4}
            style={{ color: '#ffffff' }}
            className="w-full px-4 py-3 rounded-lg bg-emerald-500/20 border-2 border-emerald-400/50 text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
            placeholder="AI-enhanced prompt will appear here..."
          />
          <p className="mt-1 text-xs text-emerald-200">This enhanced prompt will be used for video generation</p>
        </div>
      )}

      {/* Example Video Section */}
      <div className="bg-white/5 border border-white/10 rounded-lg">
        <button
          type="button"
          onClick={() => setExampleExpanded(!exampleExpanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
        >
          <h3 className="text-sm font-medium text-slate-200">Example Output</h3>
          {exampleExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>
        {exampleExpanded && (
          <div className="p-4 pt-0 space-y-3">
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={() => setExampleModel('SORA 2')}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  exampleModel === 'SORA 2'
                    ? 'bg-cyan-500 text-white'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                SORA 2
              </button>
              <button
                type="button"
                onClick={() => setExampleModel('SORA 2 Pro')}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  exampleModel === 'SORA 2 Pro'
                    ? 'bg-cyan-500 text-white'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                SORA 2 Pro
              </button>
            </div>
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
              <video
                key={exampleModel}
                src={exampleModel === 'SORA 2' 
                  ? 'https://file.aiquickdraw.com/custom-page/akr/section-images/1759432328669pkhobl0t.mp4'
                  : 'https://file.aiquickdraw.com/custom-page/akr/section-images/1760182741759dipnk388.mp4'
                }
                controls
                className="w-full h-full"
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
            </div>
            <p className="text-xs text-slate-400 text-center">
              Example output from {exampleModel}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div>
          <label htmlFor="model" className="block text-sm font-medium text-slate-200 mb-2">
            Model
          </label>
          <select
            id="model"
            value={model}
            onChange={(e) => setModel(e.target.value as 'SORA 2' | 'SORA 2 Pro')}
            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <option value="SORA 2">SORA 2 (5 Credits)</option>
            <option value="SORA 2 Pro">SORA 2 Pro (20 Credits)</option>
          </select>
        </div>
      </div>

      {/* Generation Time Alert */}
      <div className={`bg-amber-500/10 border border-amber-500/30 text-amber-200 px-4 py-3 rounded-lg text-sm flex items-start gap-2`}>
        <Loader2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium mb-1">Estimated Generation Time:</p>
          <p>
            {model === 'SORA 2' 
              ? 'SORA 2 videos can take up to 6 minutes to generate.'
              : 'SORA 2 Pro videos can take up to 15 minutes to generate.'
            }
          </p>
        </div>
      </div>

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
          `Generate Video (${model === 'SORA 2' ? '5' : '20'} Credits)`
        )}
      </button>
    </form>
  )
}


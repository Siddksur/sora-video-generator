'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [ghlLoading, setGhlLoading] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const locationId = searchParams.get('location_id')

    if (locationId) {
      // GHL flow: auto-login via location_id
      const isInIframe = window.self !== window.top
      const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

      if (!isInIframe && !isDevMode) {
        // Direct access with location_id in production — block it
        setAccessDenied(true)
        return
      }

      // Init GHL session
      setGhlLoading(true)
      axios
        .get(`/api/init?location_id=${encodeURIComponent(locationId)}`)
        .then((response) => {
          const { session_token, user } = response.data
          // Store session token in sessionStorage (not localStorage)
          sessionStorage.setItem('agh_session_token', session_token)
          sessionStorage.setItem('user', JSON.stringify(user))
          router.push('/dashboard')
        })
        .catch((err) => {
          console.error('GHL init failed:', err)
          const errorMsg = err.response?.data?.error || 'Failed to initialize session'
          setError(errorMsg)
          setGhlLoading(false)
        })
      return
    }

    // Normal flow: check existing JWT token
    const token = localStorage.getItem('token')
    if (token) router.push('/dashboard')
  }, [router, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'login') {
        const response = await axios.post('/api/auth/login', {
          username,
          password
        })
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        router.push('/dashboard')
      } else {
        const response = await axios.post('/api/auth/register', {
          username,
          email,
          password
        })
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || (mode === 'login' ? 'Login failed' : 'Sign up failed'))
    } finally {
      setLoading(false)
    }
  }

  // GHL loading state
  if (ghlLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black" />
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-white text-lg font-medium">Setting up your session...</p>
            <p className="text-slate-400 text-sm mt-2">Please wait while we connect your account.</p>
          </div>
        </div>
      </div>
    )
  }

  // Access denied state (someone trying to access with location_id outside GHL)
  if (accessDenied) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black" />
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="w-full max-w-md backdrop-blur-xl bg-white/10 border border-white/10 rounded-2xl shadow-2xl p-8 text-center">
            <div className="text-rose-400 text-5xl mb-4">&#x26D4;</div>
            <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
            <p className="text-slate-300 text-sm">
              This app must be accessed from within your GoHighLevel account.
              Please open it from the sidebar menu inside your subaccount.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black" />
      <div className="pointer-events-none absolute -top-1/2 -left-1/2 w-[1200px] h-[1200px] rounded-full bg-indigo-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-1/2 -right-1/2 w-[1200px] h-[1200px] rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md backdrop-blur-xl bg-white/10 border border-white/10 rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6 flex items-center justify-center gap-3">
            <img src="https://statics.myclickfunnels.com/workspace/JGrmMP/image/16250088/file/f56b74313c1d6a8f3c0774060784aa1d.png" alt="LeadCallr AI" className="h-8 w-8 rounded" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-cyan-200 to-indigo-200 bg-clip-text text-transparent">
              LeadCallr AI
            </h1>
          </div>
          <p className="text-slate-300 text-sm mt-1 text-center mb-4">Sora Video Generator</p>

          {/* Mode toggle */}
          <div className="grid grid-cols-2 mb-6 rounded-lg overflow-hidden border border-white/10">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`py-2 text-sm font-medium ${mode==='login' ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-300'} transition-colors`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`py-2 text-sm font-medium ${mode==='signup' ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-300'} transition-colors`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-xs font-medium text-slate-300 mb-2">
                Username {mode==='login' ? 'or Email' : ''}
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder={mode==='login' ? 'Enter your username or email' : 'Choose a username'}
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-slate-300 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="you@example.com"
                />
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder={mode==='login' ? 'Enter your password' : 'Create a strong password'}
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 text-white py-2 px-4 rounded-lg font-medium hover:from-cyan-400 hover:to-indigo-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/20"
            >
              {loading ? (mode==='login' ? 'Logging in...' : 'Creating account...') : (mode==='login' ? 'Login' : 'Create Account')}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-4">
            By continuing you agree to our Terms & Privacy.
          </p>
        </div>
      </div>
    </div>
  )
}


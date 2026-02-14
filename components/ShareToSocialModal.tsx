'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  X,
  Loader2,
  CheckCircle2,
  XCircle,
  Share2,
  Calendar,
  Send,
  Settings,
  AlertTriangle,
} from 'lucide-react'
import { getAuthHeaders } from '@/lib/api'

interface SocialAccount {
  id: string
  name: string
  platform: string
  avatar?: string
}

interface ShareToSocialModalProps {
  videoId: string
  videoUrl: string
  prompt: string
  onClose: () => void
}

const PLATFORM_ICONS: Record<string, string> = {
  facebook: 'f',
  instagram: 'IG',
  linkedin: 'in',
  twitter: 'X',
  youtube: 'YT',
  pinterest: 'P',
  tiktok: 'TT',
  google: 'G',
}

const PLATFORM_COLORS: Record<string, string> = {
  facebook: 'bg-blue-600',
  instagram: 'bg-gradient-to-br from-purple-600 to-pink-500',
  linkedin: 'bg-blue-700',
  twitter: 'bg-slate-800',
  youtube: 'bg-red-600',
  pinterest: 'bg-red-700',
  tiktok: 'bg-black',
  google: 'bg-red-500',
}

function getPlatformBadge(platform: string) {
  const icon = PLATFORM_ICONS[platform] || platform.charAt(0).toUpperCase()
  const color = PLATFORM_COLORS[platform] || 'bg-slate-600'
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-white text-xs font-bold ${color}`}>
      {icon}
    </span>
  )
}

function formatPlatformName(platform: string) {
  const names: Record<string, string> = {
    facebook: 'Facebook',
    instagram: 'Instagram',
    linkedin: 'LinkedIn',
    twitter: 'X (Twitter)',
    youtube: 'YouTube',
    pinterest: 'Pinterest',
    tiktok: 'TikTok',
    google: 'Google Business',
  }
  return names[platform] || platform.charAt(0).toUpperCase() + platform.slice(1)
}

export default function ShareToSocialModal({
  videoId,
  videoUrl,
  prompt,
  onClose,
}: ShareToSocialModalProps) {
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [accountsError, setAccountsError] = useState<string | null>(null)
  const [noIntegration, setNoIntegration] = useState(false)

  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set())
  const [caption, setCaption] = useState(prompt || '')
  const [scheduleMode, setScheduleMode] = useState<'now' | 'schedule'>('now')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')

  const [posting, setPosting] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)
  const [postSuccess, setPostSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    setLoadingAccounts(true)
    setAccountsError(null)
    try {
      const response = await axios.get('/api/social/accounts', {
        headers: getAuthHeaders(),
      })
      setAccounts(response.data.accounts || [])
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to load social accounts.'
      if (errorMsg.includes('integration not connected')) {
        setNoIntegration(true)
      }
      setAccountsError(errorMsg)
    } finally {
      setLoadingAccounts(false)
    }
  }

  const toggleAccount = (accountId: string) => {
    setSelectedAccounts((prev) => {
      const next = new Set(prev)
      if (next.has(accountId)) {
        next.delete(accountId)
      } else {
        next.add(accountId)
      }
      return next
    })
  }

  const handlePost = async () => {
    if (selectedAccounts.size === 0) {
      setPostError('Please select at least one social account.')
      return
    }
    if (!caption.trim()) {
      setPostError('Please enter a caption.')
      return
    }

    setPosting(true)
    setPostError(null)
    setPostSuccess(null)

    try {
      let isoScheduledDate: string | undefined
      if (scheduleMode === 'schedule' && scheduledDate && scheduledTime) {
        isoScheduledDate = new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
      }

      const response = await axios.post(
        '/api/social/post',
        {
          videoId,
          accountIds: Array.from(selectedAccounts),
          summary: caption.trim(),
          scheduledDate: isoScheduledDate,
        },
        { headers: getAuthHeaders() }
      )

      setPostSuccess(response.data.message || 'Posted successfully!')
    } catch (err: any) {
      setPostError(err.response?.data?.error || 'Failed to post. Please try again.')
    } finally {
      setPosting(false)
    }
  }

  // Group accounts by platform
  const accountsByPlatform = accounts.reduce<Record<string, SocialAccount[]>>((groups, account) => {
    const platform = account.platform || 'other'
    if (!groups[platform]) groups[platform] = []
    groups[platform].push(account)
    return groups
  }, {})

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="backdrop-blur-xl bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Share2 className="w-5 h-5 text-cyan-300" />
            <h2 className="text-lg font-semibold text-white">Share to Social Media</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* No GHL Integration State */}
          {noIntegration && (
            <div className="text-center py-8">
              <Settings className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-white font-medium mb-1">GHL Integration Required</p>
              <p className="text-slate-400 text-sm mb-4">
                Connect your GoHighLevel account in Settings to share videos to social media.
              </p>
              <a
                href="/dashboard/settings?tab=ghl"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 text-white rounded-lg text-sm hover:from-cyan-400 hover:to-indigo-400 transition-all"
              >
                <Settings className="w-4 h-4" />
                Go to Settings
              </a>
            </div>
          )}

          {/* Loading State */}
          {loadingAccounts && !noIntegration && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400 mr-3" />
              <span className="text-slate-300 text-sm">Loading connected accounts...</span>
            </div>
          )}

          {/* Error State (non-integration error) */}
          {accountsError && !noIntegration && !loadingAccounts && (
            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm flex items-center gap-2">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              {accountsError}
            </div>
          )}

          {/* No Accounts Connected */}
          {!loadingAccounts && !accountsError && !noIntegration && accounts.length === 0 && (
            <div className="text-center py-8">
              <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
              <p className="text-white font-medium mb-1">No Social Accounts Connected</p>
              <p className="text-slate-400 text-sm">
                Connect social media accounts in your GoHighLevel dashboard under Marketing &gt; Social Planner to get started.
              </p>
            </div>
          )}

          {/* Account Selection */}
          {!loadingAccounts && !noIntegration && accounts.length > 0 && (
            <>
              {/* Select Accounts */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Select Accounts
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {Object.entries(accountsByPlatform).map(([platform, platformAccounts]) => (
                    <div key={platform}>
                      <div className="text-xs text-slate-500 uppercase tracking-wider mb-1 px-1">
                        {formatPlatformName(platform)}
                      </div>
                      {platformAccounts.map((account) => (
                        <label
                          key={account.id}
                          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                            selectedAccounts.has(account.id)
                              ? 'bg-cyan-500/15 border border-cyan-500/30'
                              : 'bg-white/5 border border-transparent hover:bg-white/10'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedAccounts.has(account.id)}
                            onChange={() => toggleAccount(account.id)}
                            className="sr-only"
                          />
                          {getPlatformBadge(account.platform)}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white font-medium truncate">
                              {account.name}
                            </div>
                          </div>
                          {selectedAccounts.has(account.id) && (
                            <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                          )}
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Caption */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Caption
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                  placeholder="Write a caption for your post..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/40 text-sm resize-none"
                />
                <div className="text-xs text-slate-500 mt-1 text-right">
                  {caption.length} characters
                </div>
              </div>

              {/* Schedule Toggle */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  When to Post
                </label>
                <div className="flex gap-2 p-1 bg-white/5 rounded-lg">
                  <button
                    onClick={() => setScheduleMode('now')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      scheduleMode === 'now'
                        ? 'bg-cyan-500 text-white'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    Post Now
                  </button>
                  <button
                    onClick={() => setScheduleMode('schedule')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      scheduleMode === 'schedule'
                        ? 'bg-cyan-500 text-white'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Schedule
                  </button>
                </div>

                {scheduleMode === 'schedule' && (
                  <div className="flex gap-3 mt-3">
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                    />
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                    />
                  </div>
                )}
              </div>

              {/* Video Preview Thumbnail */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Video
                </label>
                <div className="relative w-full aspect-video bg-black/50 rounded-lg overflow-hidden border border-white/10">
                  <video
                    src={videoUrl}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="bg-black/60 rounded-full p-2">
                      <Share2 className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Success / Error Messages */}
          {postSuccess && (
            <div className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              {postSuccess}
            </div>
          )}
          {postError && (
            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm flex items-center gap-2">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              {postError}
            </div>
          )}
        </div>

        {/* Footer */}
        {!noIntegration && accounts.length > 0 && !postSuccess && (
          <div className="px-6 py-4 border-t border-white/10 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-white/10 border border-white/10 text-white py-2.5 rounded-lg text-sm hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePost}
              disabled={posting || selectedAccounts.size === 0 || !caption.trim()}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-indigo-500 text-white py-2.5 rounded-lg text-sm font-medium hover:from-cyan-400 hover:to-indigo-400 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {posting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {scheduleMode === 'schedule' ? 'Scheduling...' : 'Posting...'}
                </>
              ) : (
                <>
                  {scheduleMode === 'schedule' ? (
                    <>
                      <Calendar className="w-4 h-4" />
                      Schedule Post
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Post Now
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        )}

        {/* Close button after success */}
        {postSuccess && (
          <div className="px-6 py-4 border-t border-white/10">
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 text-white py-2.5 rounded-lg text-sm font-medium hover:from-cyan-400 hover:to-indigo-400 transition-all"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

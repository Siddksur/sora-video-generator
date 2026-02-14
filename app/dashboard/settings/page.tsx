'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'
import {
  ArrowLeft,
  Settings,
  CreditCard,
  Link2,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  ExternalLink,
  Trash2,
  Building2,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react'
import { getAuthToken, getAuthHeaders, clearAuth } from '@/lib/api'

interface GhlIntegration {
  id: string
  locationId: string
  businessName: string | null
  businessEmail: string | null
  businessPhone: string | null
  locationName: string | null
  locationEmail: string | null
  isConnected: boolean
  createdAt?: string
  updatedAt?: string
}

export default function SettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'ghl'

  const [loading, setLoading] = useState(true)
  const [integration, setIntegration] = useState<GhlIntegration | null>(null)
  const [userLocationId, setUserLocationId] = useState<string | null>(null)
  const [isGhlUser, setIsGhlUser] = useState(false)

  // Form state
  const [apiKey, setApiKey] = useState('')
  const [locationId, setLocationId] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const token = getAuthToken()
    if (!token) {
      router.push('/')
      return
    }
    fetchIntegration()
  }, [router])

  const fetchIntegration = async () => {
    try {
      const response = await axios.get('/api/settings/ghl', {
        headers: getAuthHeaders(),
      })
      setIntegration(response.data.integration)
      setUserLocationId(response.data.userLocationId)
      setIsGhlUser(response.data.isGhlUser)

      // Pre-fill locationId for GHL users
      if (response.data.userLocationId) {
        setLocationId(response.data.userLocationId)
      }
      if (response.data.integration?.locationId) {
        setLocationId(response.data.integration.locationId)
      }
    } catch (err) {
      console.error('Failed to fetch integration:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setValidating(true)

    try {
      const response = await axios.post(
        '/api/settings/ghl',
        {
          apiKey: apiKey.trim(),
          locationId: locationId.trim() || undefined,
        },
        { headers: getAuthHeaders() }
      )

      setIntegration(response.data.integration)
      setSuccess('Successfully connected to GoHighLevel!')
      setApiKey('')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to connect. Please check your API key and try again.')
    } finally {
      setValidating(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your GHL integration? This will remove your API key.')) {
      return
    }

    setDeleting(true)
    setError(null)
    setSuccess(null)

    try {
      await axios.delete('/api/settings/ghl', {
        headers: getAuthHeaders(),
      })
      setIntegration(null)
      setApiKey('')
      setSuccess('GHL integration disconnected.')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to disconnect.')
    } finally {
      setDeleting(false)
    }
  }

  const setTab = (tab: string) => {
    router.push(`/dashboard/settings?tab=${tab}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black" />
      <div className="pointer-events-none absolute -top-1/2 -left-1/2 w-[1200px] h-[1200px] rounded-full bg-indigo-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-1/2 -right-1/2 w-[1200px] h-[1200px] rounded-full bg-cyan-500/10 blur-3xl" />

      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/5 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">Back to Dashboard</span>
              </button>
              <div className="w-px h-5 bg-white/20 hidden sm:block" />
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-cyan-300" />
                <h1 className="text-lg font-semibold text-white">Settings</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Sidebar Tabs */}
          <div className="sm:w-56 flex-shrink-0">
            <nav className="flex sm:flex-col gap-2">
              <button
                onClick={() => setTab('ghl')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full text-left ${
                  activeTab === 'ghl'
                    ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-white border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Link2 className="w-4 h-4" />
                GHL Integration
              </button>
              <button
                onClick={() => setTab('billing')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full text-left ${
                  activeTab === 'billing'
                    ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-white border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Billing
              </button>
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            {activeTab === 'ghl' && (
              <div className="space-y-6">
                {/* Connection Status Card */}
                <div className="backdrop-blur-xl bg-white/10 border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white">GoHighLevel Integration</h2>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                      integration?.isConnected
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                    }`}>
                      {integration?.isConnected ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Connected
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          Not Connected
                        </>
                      )}
                    </div>
                  </div>

                  <p className="text-slate-300 text-sm mb-6">
                    Connect your GoHighLevel subaccount to unlock additional features like personalized business name display and real email notifications.
                  </p>

                  {/* Connected Info */}
                  {integration?.isConnected && (
                    <div className="mb-6 space-y-3">
                      <div className="bg-white/5 rounded-xl p-4 space-y-3">
                        {integration.businessName && (
                          <div className="flex items-center gap-3">
                            <Building2 className="w-4 h-4 text-cyan-300 flex-shrink-0" />
                            <div>
                              <div className="text-xs text-slate-400">Business Name</div>
                              <div className="text-white font-medium">{integration.businessName}</div>
                            </div>
                          </div>
                        )}
                        {integration.locationName && integration.locationName !== integration.businessName && (
                          <div className="flex items-center gap-3">
                            <MapPin className="w-4 h-4 text-cyan-300 flex-shrink-0" />
                            <div>
                              <div className="text-xs text-slate-400">Location Name</div>
                              <div className="text-white font-medium">{integration.locationName}</div>
                            </div>
                          </div>
                        )}
                        {(integration.businessEmail || integration.locationEmail) && (
                          <div className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-cyan-300 flex-shrink-0" />
                            <div>
                              <div className="text-xs text-slate-400">Email</div>
                              <div className="text-white font-medium">
                                {integration.businessEmail || integration.locationEmail}
                              </div>
                            </div>
                          </div>
                        )}
                        {(integration.businessPhone || integration.locationEmail) && integration.businessPhone && (
                          <div className="flex items-center gap-3">
                            <Phone className="w-4 h-4 text-cyan-300 flex-shrink-0" />
                            <div>
                              <div className="text-xs text-slate-400">Phone</div>
                              <div className="text-white font-medium">{integration.businessPhone}</div>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-cyan-300 flex-shrink-0" />
                          <div>
                            <div className="text-xs text-slate-400">Location ID</div>
                            <div className="text-white font-mono text-sm">{integration.locationId}</div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleDisconnect}
                        disabled={deleting}
                        className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm transition-colors disabled:opacity-50"
                      >
                        {deleting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        Disconnect Integration
                      </button>
                    </div>
                  )}

                  {/* Success / Error Messages */}
                  {success && (
                    <div className="mb-4 p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      {success}
                    </div>
                  )}
                  {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm flex items-center gap-2">
                      <XCircle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  {/* Connection Form */}
                  <form onSubmit={handleConnect} className="space-y-4">
                    <h3 className="text-white font-medium text-sm">
                      {integration?.isConnected ? 'Update API Key' : 'Connect Your Subaccount'}
                    </h3>

                    {/* Location ID field */}
                    <div>
                      <label className="block text-sm text-slate-300 mb-1.5">
                        Location ID
                        {isGhlUser && <span className="text-slate-500 ml-1">(auto-detected)</span>}
                      </label>
                      <input
                        type="text"
                        value={locationId}
                        onChange={(e) => setLocationId(e.target.value)}
                        placeholder="e.g., odXVBCMBAhdak34bPq6r"
                        disabled={isGhlUser && !!userLocationId}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/40 text-sm font-mono disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                      {!isGhlUser && (
                        <p className="text-xs text-slate-500 mt-1">
                          Find this in GHL under Settings &gt; Business Info &gt; Location ID
                        </p>
                      )}
                    </div>

                    {/* API Key field */}
                    <div>
                      <label className="block text-sm text-slate-300 mb-1.5">
                        Private Integration API Key
                      </label>
                      <div className="relative">
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="pit-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 pr-10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/40 text-sm font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={validating || !apiKey.trim()}
                      className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-indigo-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:from-cyan-400 hover:to-indigo-400 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {validating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Validating...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          {integration?.isConnected ? 'Update Connection' : 'Validate & Connect'}
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Setup Instructions Card */}
                <div className="backdrop-blur-xl bg-white/10 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">How to Create a Private Integration</h3>
                  <ol className="space-y-3 text-sm text-slate-300">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-xs font-bold">1</span>
                      <span>Log into your GoHighLevel subaccount dashboard</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-xs font-bold">2</span>
                      <span>Navigate to <strong className="text-white">Settings &gt; Private Integrations</strong></span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-xs font-bold">3</span>
                      <span>Click <strong className="text-white">&quot;Create New Integration&quot;</strong></span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-xs font-bold">4</span>
                      <div>
                        <span>Enable the following scopes (at minimum):</span>
                        <ul className="mt-2 space-y-1 ml-2">
                          <li className="text-slate-400"><code className="text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded text-xs">locations.readonly</code> — View location info</li>
                          <li className="text-slate-400"><code className="text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded text-xs">businesses.readonly</code> — View business name</li>
                        </ul>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-xs font-bold">5</span>
                      <span>Copy the generated API key and paste it above</span>
                    </li>
                  </ol>

                  <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs">
                    <strong>Tip:</strong> For future features like social media posting, you may also want to enable{' '}
                    <code className="bg-amber-500/10 px-1 py-0.5 rounded">socialplanner/post.readonly</code>,{' '}
                    <code className="bg-amber-500/10 px-1 py-0.5 rounded">socialplanner/account.readonly</code>, and related scopes.
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="backdrop-blur-xl bg-white/10 border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Billing</h2>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CreditCard className="w-12 h-12 text-slate-500 mb-4" />
                  <p className="text-slate-300 text-sm mb-1">Billing history coming soon</p>
                  <p className="text-slate-500 text-xs">
                    View your credit purchases and transaction history here.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

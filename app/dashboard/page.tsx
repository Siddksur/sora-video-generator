'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'
import { CreditCard, LogOut, Settings } from 'lucide-react'
import VideoForm from '@/components/VideoForm'
import ImageToVideoForm from '@/components/ImageToVideoForm'
import VideoDashboard from '@/components/VideoDashboard'
import { getAuthToken, getAuthHeaders, clearAuth } from '@/lib/api'

interface User {
  id: string
  username: string
  email: string
  creditsBalance: number
  businessName?: string | null
  ghlConnected?: boolean
}

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
  const [activeService, setActiveService] = useState<'SORA' | 'VEO 3' | 'KLING'>('SORA')
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text')
  const [parentUrl, setParentUrl] = useState<string | null>(null)

  // Listen for postMessage from parent window (optional, non-blocking)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages with parent_url data
      if (event.data && event.data.type === 'parent_url' && event.data.url) {
        try {
          const url = event.data.url
          // Validate URL format
          if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
            setParentUrl(url)
            // Also store in sessionStorage as backup
            try {
              sessionStorage.setItem('stripe_parent_url', url)
            } catch (e) {
              // sessionStorage might be blocked, continue anyway
            }
          }
        } catch (e) {
          // Invalid message, ignore
        }
      }
    }

    // Only add listener if in iframe
    if (typeof window !== 'undefined' && window.self !== window.top) {
      window.addEventListener('message', handleMessage)
      return () => {
        window.removeEventListener('message', handleMessage)
      }
    }
  }, [])

  // Check for parent URL in URL parameter (if parent passes it)
  useEffect(() => {
    const urlParam = searchParams.get('parent_url')
    if (urlParam) {
      try {
        const decoded = decodeURIComponent(urlParam)
        if (/^https?:\/\//i.test(decoded)) {
          setParentUrl(decoded)
          try {
            sessionStorage.setItem('stripe_parent_url', decoded)
          } catch (e) {
            // sessionStorage might be blocked
          }
        }
      } catch (e) {
        // Invalid URL parameter, ignore
      }
    }
  }, [searchParams])

  useEffect(() => {
    const token = getAuthToken()
    if (!token) {
      router.push('/')
      return
    }

    fetchUser()

    // Handle return from Stripe checkout
    if (searchParams.get('success') === 'true' || searchParams.get('canceled') === 'true') {
      setTimeout(() => {
        fetchUser()
        setShowPurchaseModal(false)
        
        // Check if we should redirect back to parent iframe
        // Priority 1: Get parent URL from query parameter (passed from Stripe redirect)
        const parentUrlParam = searchParams.get('parent_url')
        if (parentUrlParam) {
          try {
            const parentUrl = decodeURIComponent(parentUrlParam)
            // Validate it's a valid URL before redirecting
            if (/^https?:\/\//i.test(parentUrl)) {
              // Redirect back to parent iframe URL
              window.location.href = parentUrl
              return
            }
          } catch (e) {
            console.error('Error parsing parent URL:', e)
          }
        }
        
        // Priority 2: Check state (from postMessage)
        if (parentUrl && /^https?:\/\//i.test(parentUrl)) {
          try {
            window.location.href = parentUrl
            return
          } catch (e) {
            // Redirect failed, continue to next fallback
          }
        }
        
        // Priority 3: Fallback to sessionStorage (for older flow)
        const storedParentUrl = sessionStorage.getItem('stripe_parent_url')
        if (storedParentUrl && /^https?:\/\//i.test(storedParentUrl)) {
          try {
            window.location.href = storedParentUrl
            sessionStorage.removeItem('stripe_parent_url')
            return
          } catch (e) {
            sessionStorage.removeItem('stripe_parent_url')
          }
        }
      }, 2000)
    }
  }, [router, searchParams, parentUrl])

  const fetchUser = async () => {
    try {
      const response = await axios.get('/api/auth/profile', {
        headers: getAuthHeaders()
      })
      setUser(response.data.user)
      // Keep stored user in sync so components (VideoForm, etc.) get fresh data
      try {
        const storage = localStorage.getItem('token') ? localStorage : sessionStorage
        storage.setItem('user', JSON.stringify(response.data.user))
      } catch (e) {
        // Storage might be blocked in iframe context
      }
    } catch (error) {
      clearAuth()
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    clearAuth()
    router.push('/')
  }

  const handlePurchase = async (packageIndex: number) => {
    setPurchasing(true)
    try {
      const token = getAuthToken()
      
      // Detect iframe context and get parent URL
      const isInIframe = window.self !== window.top
      let capturedParentUrl: string | null = null
      
      if (isInIframe) {
        // Try multiple methods to capture parent URL (in order of preference)
        
        // Method 1: Use stored parent URL from postMessage or URL parameter
        if (parentUrl && /^https?:\/\//i.test(parentUrl)) {
          capturedParentUrl = parentUrl
        }
        
        // Method 2: Try to read window.top.location.href (may work if same-origin or sandbox allows)
        if (!capturedParentUrl) {
          try {
            if (window.top && window.top !== window.self) {
              const topUrl = (window.top as any).location?.href
              if (topUrl && /^https?:\/\//i.test(topUrl)) {
                capturedParentUrl = topUrl
              }
            }
          } catch (e) {
            // Cross-origin restriction or sandbox blocking - expected, continue to next method
          }
        }
        
        // Method 3: Try window.parent.location.href (may work if same-origin)
        if (!capturedParentUrl) {
          try {
            if (window.parent && window.parent !== window.self) {
              const parentLocationUrl = (window.parent as any).location?.href
              if (parentLocationUrl && /^https?:\/\//i.test(parentLocationUrl)) {
                capturedParentUrl = parentLocationUrl
              }
            }
          } catch (e) {
            // Cross-origin restriction - expected, continue to next method
          }
        }
        
        // Method 4: Check sessionStorage (from previous attempts)
        if (!capturedParentUrl) {
          try {
            const stored = sessionStorage.getItem('stripe_parent_url')
            if (stored && /^https?:\/\//i.test(stored)) {
              capturedParentUrl = stored
            }
          } catch (e) {
            // sessionStorage might be blocked
          }
        }
        
        // Method 5: Fallback to document.referrer (may be incomplete but better than nothing)
        if (!capturedParentUrl) {
          try {
            const referrer = document.referrer
            if (referrer && /^https?:\/\//i.test(referrer)) {
              capturedParentUrl = referrer
            }
          } catch (e) {
            // Can't access referrer
          }
        }
      }
      
      // Create checkout session with parent URL if in iframe
      const requestBody: { packageIndex: number; parentUrl?: string } = { packageIndex }
      if (capturedParentUrl && /^https?:\/\//i.test(capturedParentUrl)) {
        requestBody.parentUrl = capturedParentUrl
        // Store in sessionStorage as backup
        try {
          sessionStorage.setItem('stripe_parent_url', capturedParentUrl)
        } catch (e) {
          // sessionStorage might be blocked, continue anyway
        }
      }
      
      const response = await axios.post('/api/stripe/checkout', 
        requestBody,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      if (response.data.url) {
        if (isInIframe) {
          // Try multiple methods to break out of iframe
          try {
            // Method 1: Try redirecting top window (works if sandbox allows it)
            if (window.top) {
              window.top.location.href = response.data.url
              return
            }
          } catch (e) {
            // Method 2: If top navigation is blocked, try opening popup
            try {
              const popup = window.open(response.data.url, '_blank', 'width=800,height=600')
              if (popup) {
                // Monitor popup for completion
                const checkPopup = setInterval(() => {
                  if (popup.closed) {
                    clearInterval(checkPopup)
                    fetchUser() // Refresh credits
                  }
                }, 500)
                return
              }
            } catch (e2) {
              // Method 3: Fallback - try postMessage to parent
              try {
                window.parent.postMessage({ 
                  type: 'stripe_checkout', 
                  url: response.data.url 
                }, '*')
                alert('Please allow popups or check with the website administrator to enable Stripe checkout.')
                return
              } catch (e3) {
                // Method 4: Last resort - show URL
                alert(`Please visit this URL to complete checkout:\n${response.data.url}`)
                return
              }
            }
          }
        } else {
          // Direct access - normal redirect
          window.location.href = response.data.url
        }
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to initiate purchase')
    } finally {
      setPurchasing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!user) return null

  const creditPackages = [
    { credits: 5, price: 5.00 },
    { credits: 10, price: 9.70 },
    { credits: 20, price: 18.00 },
    { credits: 50, price: 40.00 },
  ]

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
              <img src="https://statics.myclickfunnels.com/workspace/JGrmMP/image/16250088/file/f56b74313c1d6a8f3c0774060784aa1d.png" alt="LeadCallr AI" className="h-7 w-7 rounded" />
              <div>
                <h1 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-white via-cyan-200 to-indigo-200 bg-clip-text text-transparent">
                  LeadCallr AI
                </h1>
                {user.businessName && (
                  <p className="text-xs text-cyan-300/80 -mt-0.5">
                    Welcome, {user.businessName}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 text-white">
                <CreditCard className="w-4 h-4 text-cyan-300" />
                <span className="font-semibold">{user.creditsBalance} Credits</span>
              </div>
              <button
                onClick={() => setShowPurchaseModal(true)}
                className="hidden sm:inline-flex bg-gradient-to-r from-cyan-500 to-indigo-500 text-white px-4 py-2 rounded-lg text-sm hover:from-cyan-400 hover:to-indigo-400 transition-all shadow-lg shadow-cyan-500/20"
              >
                Buy Credits
              </button>

              {/* Settings */}
              <button
                onClick={() => router.push('/dashboard/settings')}
                className="text-slate-300 hover:text-white text-sm flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-white/10 transition-all"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </button>

              <button
                onClick={handleLogout}
                className="text-slate-300 hover:text-white text-sm flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Video Generation Form */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/10 rounded-2xl shadow-2xl p-6">
            {/* Service Selector */}
            <div className="flex gap-2 mb-4 p-1 bg-white/5 rounded-lg">
              <button
                onClick={() => setActiveService('SORA')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeService === 'SORA'
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                SORA
              </button>
              <button
                onClick={() => setActiveService('VEO 3')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeService === 'VEO 3'
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                VEO 3
              </button>
              <button
                onClick={() => setActiveService('KLING')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeService === 'KLING'
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                Kling
              </button>
            </div>

            {activeService === 'KLING' ? (
              /* Kling AI - Coming Soon Placeholder */
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="text-5xl mb-4">🎬</div>
                <h2 className="text-2xl font-bold text-white mb-2">Kling AI</h2>
                <p className="text-slate-300 text-sm mb-1">Coming Soon</p>
                <p className="text-slate-400 text-xs max-w-xs">
                  Kling AI video generation is currently under development. Stay tuned for updates!
                </p>
              </div>
            ) : (
              <>
                {/* Tab Menu */}
                <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-lg">
                  <button
                    onClick={() => setActiveTab('text')}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'text'
                        ? 'bg-cyan-500 text-white'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Text to Video
                  </button>
                  <button
                    onClick={() => setActiveTab('image')}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'image'
                        ? 'bg-cyan-500 text-white'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Image to Video
                  </button>
                </div>

                <h2 className="text-xl font-semibold text-white mb-4">
                  {activeTab === 'text' 
                    ? `Generate ${activeService} Video` 
                    : `Generate ${activeService} Video from Image`}
                </h2>
                
                {activeTab === 'text' ? (
                  <VideoForm onSuccess={fetchUser} service={activeService} />
                ) : (
                  <ImageToVideoForm onSuccess={fetchUser} service={activeService} />
                )}
              </>
            )}
          </div>

          {/* Video Dashboard */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/10 rounded-2xl shadow-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Your Videos</h2>
            <VideoDashboard />
          </div>
        </div>
      </main>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="backdrop-blur-xl bg-white/10 border border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-6 text-white">
            <h2 className="text-2xl font-bold mb-4">Purchase Credits</h2>
            <div className="space-y-3 mb-6">
              {creditPackages.map((pkg, index) => (
                <button
                  key={index}
                  onClick={() => handlePurchase(index)}
                  disabled={purchasing}
                  className="w-full flex items-center justify-between p-4 rounded-lg bg-white/10 border border-white/10 hover:bg-white/20 transition-all disabled:opacity-50"
                >
                  <div>
                    <div className="font-semibold">{pkg.credits} Credits</div>
                    <div className="text-sm text-slate-300">${pkg.price.toFixed(2)}</div>
                  </div>
                  <CreditCard className="w-5 h-5 text-cyan-300" />
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowPurchaseModal(false)}
              className="w-full bg-white/10 border border-white/10 text-white py-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


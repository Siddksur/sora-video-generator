'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'
import { CreditCard, LogOut } from 'lucide-react'
import VideoForm from '@/components/VideoForm'
import VideoDashboard from '@/components/VideoDashboard'

interface User {
  id: string
  username: string
  email: string
  creditsBalance: number
}

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [purchasing, setPurchasing] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/')
      return
    }

    fetchUser()

    if (searchParams.get('success') === 'true') {
      setTimeout(() => {
        fetchUser()
        setShowPurchaseModal(false)
      }, 2000)
    }
  }, [router, searchParams])

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser(response.data.user)
    } catch (error) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/')
  }

  const handlePurchase = async (packageIndex: number) => {
    setPurchasing(true)
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post('/api/stripe/checkout', 
        { packageIndex },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.data.url) window.location.href = response.data.url
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
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black" />
      <div className="absolute -top-1/2 -left-1/2 w-[1200px] h-[1200px] rounded-full bg-indigo-600/20 blur-3xl" />
      <div className="absolute -bottom-1/2 -right-1/2 w-[1200px] h-[1200px] rounded-full bg-cyan-500/10 blur-3xl" />

      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/5 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="https://statics.myclickfunnels.com/workspace/JGrmMP/image/16250088/file/f56b74313c1d6a8f3c0774060784aa1d.png" alt="LeadCallr AI" className="h-7 w-7 rounded" />
              <h1 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-white via-cyan-200 to-indigo-200 bg-clip-text text-transparent">
                LeadCallr AI
              </h1>
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
              <button
                onClick={handleLogout}
                className="text-slate-300 hover:text-white text-sm flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Video Generation Form */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/10 rounded-2xl shadow-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Generate Video</h2>
            <VideoForm onSuccess={fetchUser} />
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


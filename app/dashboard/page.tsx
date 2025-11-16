'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'
import { CreditCard, Video, LogOut, Loader2, Play, Download } from 'lucide-react'
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
    
    // Check for Stripe success
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
      
      if (response.data.url) {
        window.location.href = response.data.url
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to initiate purchase')
    } finally {
      setPurchasing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">Sora Video Generator</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-800">
                  {user.creditsBalance} Credits
                </span>
              </div>
              <button
                onClick={() => setShowPurchaseModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Buy Credits
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <LogOut className="w-5 h-5" />
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
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Generate Video</h2>
            <VideoForm onSuccess={fetchUser} />
          </div>

          {/* Video Dashboard */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Your Videos</h2>
            <VideoDashboard />
          </div>
        </div>
      </main>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Purchase Credits</h2>
            <div className="space-y-3 mb-6">
              {creditPackages.map((pkg, index) => (
                <button
                  key={index}
                  onClick={() => handlePurchase(index)}
                  disabled={purchasing}
                  className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50"
                >
                  <div>
                    <div className="font-semibold text-gray-800">{pkg.credits} Credits</div>
                    <div className="text-sm text-gray-600">${pkg.price.toFixed(2)}</div>
                  </div>
                  <CreditCard className="w-5 h-5 text-gray-400" />
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowPurchaseModal(false)}
              className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


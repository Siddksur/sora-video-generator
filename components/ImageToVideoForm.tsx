'use client'

import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { Loader2, Sparkles, ChevronDown, ChevronUp, Upload, X, Image as ImageIcon } from 'lucide-react'
import { getAuthHeaders, getStoredUser } from '@/lib/api'

interface ImageToVideoFormProps {
  onSuccess: () => void
  service: 'SORA' | 'VEO 3'
}

export default function ImageToVideoForm({ onSuccess, service }: ImageToVideoFormProps) {
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
  // SORA 2 uses single image upload
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  // VEO 3 uses two image uploads (Start Frame & End Frame)
  const [startFrameFile, setStartFrameFile] = useState<File | null>(null)
  const [startFramePreview, setStartFramePreview] = useState<string | null>(null)
  const [startFrameUrl, setStartFrameUrl] = useState<string | null>(null)
  const [endFrameFile, setEndFrameFile] = useState<File | null>(null)
  const [endFramePreview, setEndFramePreview] = useState<string | null>(null)
  const [endFrameUrl, setEndFrameUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadingStartFrame, setUploadingStartFrame] = useState(false)
  const [uploadingEndFrame, setUploadingEndFrame] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const startFrameInputRef = useRef<HTMLInputElement>(null)
  const endFrameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const u = getStoredUser()
    if (u?.email) setUserEmail(u.email)
  }, [])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file')
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      setError('Image size must be less than 10MB')
      return
    }

    setImageFile(file)
    setError('')

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload image
    handleImageUpload(file)
  }

  const handleStartFrameSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file')
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      setError('Image size must be less than 10MB')
      return
    }

    setStartFrameFile(file)
    setError('')

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setStartFramePreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload image
    handleStartFrameUpload(file)
  }

  const handleEndFrameSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file')
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      setError('Image size must be less than 10MB')
      return
    }

    setEndFrameFile(file)
    setError('')

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setEndFramePreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload image
    handleEndFrameUpload(file)
  }

  const handleImageUpload = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await axios.post('/api/upload', formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      })

      setImageUrl(response.data.imageUrl)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload image')
      setImageFile(null)
      setImagePreview(null)
    } finally {
      setUploading(false)
    }
  }

  const handleStartFrameUpload = async (file: File) => {
    setUploadingStartFrame(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await axios.post('/api/upload', formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      })

      setStartFrameUrl(response.data.imageUrl)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload start frame image')
      setStartFrameFile(null)
      setStartFramePreview(null)
    } finally {
      setUploadingStartFrame(false)
    }
  }

  const handleEndFrameUpload = async (file: File) => {
    setUploadingEndFrame(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await axios.post('/api/upload', formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      })

      setEndFrameUrl(response.data.imageUrl)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload end frame image')
      setEndFrameFile(null)
      setEndFramePreview(null)
    } finally {
      setUploadingEndFrame(false)
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setImageUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveStartFrame = () => {
    setStartFrameFile(null)
    setStartFramePreview(null)
    setStartFrameUrl(null)
    if (startFrameInputRef.current) {
      startFrameInputRef.current.value = ''
    }
  }

  const handleRemoveEndFrame = () => {
    setEndFrameFile(null)
    setEndFramePreview(null)
    setEndFrameUrl(null)
    if (endFrameInputRef.current) {
      endFrameInputRef.current.value = ''
    }
  }

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt first')
      return
    }

    setEnhancing(true)
    setError('')

    try {
      const response = await axios.post('/api/prompts/enhance', {
        prompt: prompt,
        videoType: 'image-to-video'
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

    // Validate image uploads based on service
    if (service === 'VEO 3') {
      if (!startFrameUrl || !endFrameUrl) {
        setError('Please upload both Start Frame and End Frame images')
        setLoading(false)
        return
      }
    } else {
      // SORA 2 requires single image
      if (!imageUrl) {
        setError('Please upload an image')
        setLoading(false)
        return
      }
    }

    try {
      const payload: any = {
        prompt: finalPrompt,
        aspectRatio,
        model,
        service,
        requestedEmail: notifyChecked ? userEmail : undefined
      }

      // Add image URLs based on service
      if (service === 'VEO 3') {
        payload.startFrameUrl = startFrameUrl
        payload.endFrameUrl = endFrameUrl
      } else {
        payload.imageUrl = imageUrl
      }

      await axios.post('/api/videos/generate', payload, {
        headers: getAuthHeaders()
      })

      setSuccess(true)
      setPrompt('')
      setEnhancedPrompt('')
      setNotifyChecked(false)
      setAspectRatio('landscape')
      setModel('SORA 2')
      handleRemoveImage()
      handleRemoveStartFrame()
      handleRemoveEndFrame()
      onSuccess()
      
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate video')
    } finally {
      setLoading(false)
    }
  }

  // Helper function to render image upload UI
  const renderImageUpload = (
    label: string,
    preview: string | null,
    uploading: boolean,
    fileInputRef: React.RefObject<HTMLInputElement>,
    handleSelect: (e: React.ChangeEvent<HTMLInputElement>) => void,
    handleRemove: () => void,
    imageUrl: string | null,
    inputId: string
  ) => (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-200 mb-2">
        {label} *
      </label>
      {!preview ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center cursor-pointer hover:border-cyan-400/50 hover:bg-white/5 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            id={inputId}
            accept="image/*"
            onChange={handleSelect}
            className="hidden"
          />
          <Upload className="w-12 h-12 mx-auto mb-3 text-slate-400" />
          <p className="text-sm text-slate-300 mb-1">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-slate-400">
            PNG, JPG, GIF up to 10MB
          </p>
          {uploading && (
            <div className="mt-3 flex items-center justify-center gap-2 text-cyan-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Uploading...</span>
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-white/10">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-contain"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-2 bg-rose-500/90 hover:bg-rose-500 text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {imageUrl && (
            <p className="mt-2 text-xs text-emerald-400 text-center">
              ✓ Image uploaded successfully
            </p>
          )}
        </div>
      )}
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-white">
      {/* Image Upload Section - Conditional based on service */}
      {service === 'VEO 3' ? (
        <>
          {/* VEO 3: Two image uploads (Start Frame & End Frame) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderImageUpload(
              'Start Frame',
              startFramePreview,
              uploadingStartFrame,
              startFrameInputRef,
              handleStartFrameSelect,
              handleRemoveStartFrame,
              startFrameUrl,
              'startFrame'
            )}
            {renderImageUpload(
              'End Frame',
              endFramePreview,
              uploadingEndFrame,
              endFrameInputRef,
              handleEndFrameSelect,
              handleRemoveEndFrame,
              endFrameUrl,
              'endFrame'
            )}
          </div>
        </>
      ) : (
        <>
          {/* SORA 2: Single image upload */}
          {renderImageUpload(
            'Upload Image',
            imagePreview,
            uploading,
            fileInputRef,
            handleImageSelect,
            handleRemoveImage,
            imageUrl,
            'image'
          )}
        </>
      )}

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
          placeholder="Describe how you want the image to be animated or transformed..."
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
                  ? 'https://tempfile.aiquickdraw.com/f/b52bf519efb4a2c7b3330c418c0752bc/e179d9eb-81a7-47b0-ba76-efa786147e6b.mp4'
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
            {service === 'VEO 3' ? (
              <>
                <option value="SORA 2">VEO 3 (5 Credits)</option>
                <option value="SORA 2 Pro">VEO 3 Pro (20 Credits)</option>
              </>
            ) : (
              <>
                <option value="SORA 2">SORA 2 (5 Credits)</option>
                <option value="SORA 2 Pro">SORA 2 Pro (20 Credits)</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Generation Time Alert */}
      <div className={`bg-amber-500/10 border border-amber-500/30 text-amber-200 px-4 py-3 rounded-lg text-sm flex items-start gap-2`}>
        <Loader2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium mb-1">Estimated Generation Time:</p>
          <p>
            {service === 'VEO 3' ? (
              model === 'SORA 2' 
                ? 'VEO 3 videos can take up to 6 minutes to generate.'
                : 'VEO 3 Pro videos can take up to 15 minutes to generate.'
            ) : (
              model === 'SORA 2' 
                ? 'SORA 2 videos can take up to 6 minutes to generate.'
                : 'SORA 2 Pro videos can take up to 15 minutes to generate.'
            )}
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
        disabled={
          loading || 
          (!prompt.trim() && !enhancedPrompt.trim()) || 
          (service === 'VEO 3' ? (!startFrameUrl || !endFrameUrl) : !imageUrl)
        }
        className="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 text-white py-2 px-4 rounded-lg font-medium hover:from-cyan-400 hover:to-indigo-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : (
          `Generate ${service} Video (${model === 'SORA 2' ? '5' : '20'} Credits)`
        )}
      </button>
    </form>
  )
}


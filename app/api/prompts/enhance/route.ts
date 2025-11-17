import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const N8N_PROMPT_ENHANCE_WEBHOOK_URL = process.env.N8N_PROMPT_ENHANCE_WEBHOOK_URL || 'https://siddharthsur.app.n8n.cloud/webhook-test/88074343-a495-410c-8d65-6d673af4ddd9'

export async function POST(request: NextRequest) {
  try {
    const { prompt, videoType } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Call n8n webhook to enhance the prompt
    const response = await axios.post(N8N_PROMPT_ENHANCE_WEBHOOK_URL, {
      prompt: prompt,
      video_type: videoType || 'text-to-video' // text-to-video or image-to-video
    })

    // Extract enhanced prompt from response
    // n8n typically returns data in different formats:
    // 1. Direct: { enhanced_prompt: "..." }
    // 2. Array format: [{ json: { enhanced_prompt: "..." } }]
    // 3. Nested: { data: { enhanced_prompt: "..." } }
    let enhancedPrompt: string | undefined

    if (Array.isArray(response.data) && response.data.length > 0) {
      // Handle n8n array format
      const firstItem = response.data[0]
      enhancedPrompt = firstItem?.json?.enhanced_prompt || 
                      firstItem?.json?.enhancedPrompt ||
                      firstItem?.json?.result ||
                      firstItem?.json?.prompt ||
                      firstItem?.enhanced_prompt ||
                      firstItem?.enhancedPrompt ||
                      firstItem?.result ||
                      firstItem
    } else if (response.data) {
      // Handle direct object format
      enhancedPrompt = response.data.enhanced_prompt || 
                      response.data.enhancedPrompt ||
                      response.data.result ||
                      response.data.prompt ||
                      response.data.data?.enhanced_prompt ||
                      response.data.data?.enhancedPrompt
    }

    // If still no prompt, try the whole response as string
    if (!enhancedPrompt) {
      enhancedPrompt = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    }

    if (!enhancedPrompt || (typeof enhancedPrompt !== 'string' && typeof enhancedPrompt !== 'number')) {
      return NextResponse.json(
        { error: 'Failed to get enhanced prompt from n8n. Please check your n8n workflow response format.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      enhancedPrompt: String(enhancedPrompt)
    })
  } catch (error: any) {
    console.error('Prompt enhancement error:', error)
    return NextResponse.json(
      { error: error.response?.data?.error || error.message || 'Failed to enhance prompt' },
      { status: 500 }
    )
  }
}


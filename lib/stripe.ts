import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

// Credit packages: amount in cents, credits
export const CREDIT_PACKAGES = [
  { amount: 500, credits: 5 },      // $5 for 5 credits
  { amount: 970, credits: 10 },     // $9.70 for 10 credits
  { amount: 1800, credits: 20 },    // $18 for 20 credits
  { amount: 4000, credits: 50 },    // $40 for 50 credits
] as const

export const VIDEO_COST_CREDITS = 5 // Default cost for SORA 2
export const VIDEO_COST_CREDITS_SORA2 = 5
export const VIDEO_COST_CREDITS_SORA2_PRO = 20

export function getVideoCostCredits(model?: string): number {
  if (model === 'SORA 2 Pro') {
    return VIDEO_COST_CREDITS_SORA2_PRO
  }
  return VIDEO_COST_CREDITS_SORA2
}


import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import Stripe from 'stripe'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    try {
      const transaction = await db.transaction.findUnique({
        where: { stripeSessionId: session.id }
      })

      if (!transaction) {
        console.error('Transaction not found for session:', session.id)
        return NextResponse.json({ received: true })
      }

      if (transaction.status === 'completed') {
        return NextResponse.json({ received: true })
      }

      // Update transaction status
      await db.transaction.update({
        where: { id: transaction.id },
        data: { status: 'completed' }
      })

      // Update user credits
      await db.user.update({
        where: { id: transaction.userId },
        data: {
          creditsBalance: {
            increment: transaction.creditsPurchased
          }
        }
      })

      // Create credit history entry
      await db.creditHistory.create({
        data: {
          userId: transaction.userId,
          amount: transaction.creditsPurchased,
          transactionType: 'purchase',
          description: `Purchased ${transaction.creditsPurchased} credits`
        }
      })

      console.log('Credits added successfully for user:', transaction.userId)
    } catch (error) {
      console.error('Error processing webhook:', error)
      return NextResponse.json(
        { error: 'Webhook processing failed' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ received: true })
}


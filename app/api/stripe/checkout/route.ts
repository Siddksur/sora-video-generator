import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { stripe, CREDIT_PACKAGES } from '@/lib/stripe'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { packageIndex } = await request.json()
    
    if (packageIndex === undefined || packageIndex < 0 || packageIndex >= CREDIT_PACKAGES.length) {
      return NextResponse.json(
        { error: 'Invalid package selection' },
        { status: 400 }
      )
    }

    const creditPackage = CREDIT_PACKAGES[packageIndex]

    // Determine base URL for redirects
    const envBaseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
    const host = request.headers.get('host') || ''
    const inferredBase = host ? `${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${host}` : ''
    const baseUrl = envBaseUrl || inferredBase

    if (!baseUrl || !/^https?:\/\//i.test(baseUrl)) {
      console.error('Invalid or missing base URL for Stripe redirects', { envBaseUrl, host })
      return NextResponse.json(
        { error: 'Server configuration error (base URL)' },
        { status: 500 }
      )
    }

    // Create transaction record
    const transaction = await db.transaction.create({
      data: {
        userId: user.id,
        amount: creditPackage.amount / 100, // Convert cents to dollars
        creditsPurchased: creditPackage.credits,
        status: 'pending'
      }
    })

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${creditPackage.credits} Credits`,
              description: `Purchase ${creditPackage.credits} credits for video generation`,
            },
            unit_amount: creditPackage.amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard?canceled=true`,
      metadata: {
        userId: user.id,
        transactionId: transaction.id,
        credits: creditPackage.credits.toString(),
      },
    })

    // Update transaction with Stripe session ID
    await db.transaction.update({
      where: { id: transaction.id },
      data: { stripeSessionId: session.id }
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


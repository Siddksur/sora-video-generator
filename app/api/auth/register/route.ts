import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json()

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email and password are required' },
        { status: 400 }
      )
    }

    const existing = await db.user.findFirst({
      where: {
        OR: [{ username }, { email }]
      },
      select: { id: true }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Username or email already in use' },
        { status: 409 }
      )
    }

    const passwordHash = await hashPassword(password)

    const user = await db.user.create({
      data: {
        username,
        email,
        passwordHash,
        creditsBalance: 0,
      }
    })

    const token = generateToken(user.id)

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        creditsBalance: user.creditsBalance
      }
    })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

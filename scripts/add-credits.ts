import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2)
  
  let email: string | undefined
  let username: string | undefined
  let credits: number | undefined
  let description: string | undefined

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email' && args[i + 1]) {
      email = args[i + 1]
      i++
    } else if (args[i] === '--username' && args[i + 1]) {
      username = args[i + 1]
      i++
    } else if (args[i] === '--credits' && args[i + 1]) {
      credits = parseInt(args[i + 1], 10)
      i++
    } else if (args[i] === '--description' && args[i + 1]) {
      description = args[i + 1]
      i++
    }
  }

  // Validate required arguments
  if (!email && !username) {
    console.error('Error: Either --email or --username is required')
    console.log('\nUsage:')
    console.log('  npm run add-credits -- --email user@example.com --credits 20')
    console.log('  npm run add-credits -- --username myuser --credits 20 --description "Promo credits"')
    process.exit(1)
  }

  if (!credits || isNaN(credits) || credits <= 0) {
    console.error('Error: --credits must be a positive number')
    process.exit(1)
  }

  try {
    // Find user by email or username
    const user = await prisma.user.findUnique({
      where: email ? { email } : { username: username! },
      select: {
        id: true,
        username: true,
        email: true,
        creditsBalance: true,
      }
    })

    if (!user) {
      console.error(`Error: User not found with ${email ? `email: ${email}` : `username: ${username}`}`)
      process.exit(1)
    }

    console.log(`Found user: ${user.username} (${user.email})`)
    console.log(`Current balance: ${user.creditsBalance} credits`)
    console.log(`Adding: ${credits} credits`)

    // Update user credits (same pattern as Stripe webhook)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        creditsBalance: {
          increment: credits
        }
      }
    })

    // Create credit history entry (same pattern as Stripe webhook)
    await prisma.creditHistory.create({
      data: {
        userId: user.id,
        amount: credits,
        transactionType: 'purchase',
        description: description || `Manually added ${credits} credits`
      }
    })

    // Fetch updated user to show new balance
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { creditsBalance: true }
    })

    console.log(`✓ Successfully added ${credits} credits`)
    console.log(`New balance: ${updatedUser?.creditsBalance} credits`)
  } catch (error) {
    console.error('Error adding credits:', error)
    process.exit(1)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


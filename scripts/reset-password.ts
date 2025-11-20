import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2)
  
  let email: string | undefined
  let username: string | undefined
  let newPassword: string | undefined

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email' && args[i + 1]) {
      email = args[i + 1]
      i++
    } else if (args[i] === '--username' && args[i + 1]) {
      username = args[i + 1]
      i++
    } else if (args[i] === '--password' && args[i + 1]) {
      newPassword = args[i + 1]
      i++
    }
  }

  // Validate required arguments
  if (!email && !username) {
    console.error('Error: Either --email or --username is required')
    console.log('\nUsage:')
    console.log('  npm run reset-password -- --email user@example.com --password newpassword123')
    console.log('  npm run reset-password -- --username myuser --password newpassword123')
    process.exit(1)
  }

  if (!newPassword || newPassword.length < 6) {
    console.error('Error: --password is required and must be at least 6 characters')
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
      }
    })

    if (!user) {
      console.error(`Error: User not found with ${email ? `email: ${email}` : `username: ${username}`}`)
      process.exit(1)
    }

    console.log(`Found user: ${user.username} (${user.email})`)
    console.log('Resetting password...')

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword
      }
    })

    console.log(`✓ Successfully reset password for ${user.username}`)
    console.log(`New password: ${newPassword}`)
    console.log('\n⚠️  IMPORTANT: Share this password securely with the user!')
  } catch (error) {
    console.error('Error resetting password:', error)
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




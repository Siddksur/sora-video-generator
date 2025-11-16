import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Example users - modify these with your actual user credentials
  const users = [
    {
      username: 'siddksur',
      email: 'siddksur@gmail.com',
      password: 'testuser123', // Change this!
    },
    {
      username: 'client2',
      email: 'client2@example.com',
      password: 'password123', // Change this!
    },
    // Add more users as needed
  ]

  for (const userData of users) {
    const hashedPassword = await bcrypt.hash(userData.password, 12)
    
    try {
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {
          passwordHash: hashedPassword,
        },
        create: {
          username: userData.username,
          email: userData.email,
          passwordHash: hashedPassword,
          creditsBalance: 0,
        },
      })
      
      console.log(`✓ Created/Updated user: ${user.username} (${user.email})`)
    } catch (error) {
      console.error(`✗ Failed to create user ${userData.username}:`, error)
    }
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


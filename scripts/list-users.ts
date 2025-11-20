import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        creditsBalance: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (users.length === 0) {
      console.log('No users found in the database.')
      return
    }

    console.log('\n📋 Users in Database:\n')
    console.log('─'.repeat(80))
    console.log(
      `${'Username'.padEnd(20)} | ${'Email'.padEnd(30)} | ${'Credits'.padEnd(10)} | Created`
    )
    console.log('─'.repeat(80))

    users.forEach((user) => {
      const date = new Date(user.createdAt).toLocaleDateString()
      console.log(
        `${user.username.padEnd(20)} | ${user.email.padEnd(30)} | ${user.creditsBalance.toString().padEnd(10)} | ${date}`
      )
    })

    console.log('─'.repeat(80))
    console.log(`\nTotal users: ${users.length}\n`)
  } catch (error) {
    console.error('Error fetching users:', error)
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




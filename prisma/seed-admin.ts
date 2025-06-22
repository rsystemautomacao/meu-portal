import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = 'richard_espanhol@hotmail.com'
  const user = await prisma.user.update({
    where: { email },
    data: { isAdmin: true }
  })
  console.log('Usuário promovido a admin:', user)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect()) 
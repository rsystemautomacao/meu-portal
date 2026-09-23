import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Uso: npx tsx prisma/seed-admin.ts email@dominio.com
async function main() {
  const email = process.argv[2]
  if (!email) {
    throw new Error('Informe o e-mail do usuário: npx tsx prisma/seed-admin.ts email@dominio.com')
  }
  const user = await prisma.user.update({
    where: { email },
    data: { isAdmin: true },
    select: { id: true, email: true, isAdmin: true }
  })
  console.log('Usuário promovido a admin:', user)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

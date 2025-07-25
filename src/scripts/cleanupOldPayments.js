const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Remove todos os pagamentos do model antigo Payment
  const deleted = await prisma.payment.deleteMany({});
  console.log(`Pagamentos antigos removidos: ${deleted.count}`);
}

main().finally(() => prisma.$disconnect()); 
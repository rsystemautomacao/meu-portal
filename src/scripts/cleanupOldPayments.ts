import { prisma } from '@/lib/prisma';

async function main() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  // Buscar todos os times
  const teams = await prisma.team.findMany({ select: { id: true } });
  let totalDeleted = 0;
  for (const team of teams) {
    // Deletar todas as mensalidades do sistema exceto a do mês/ano atual
    const deleted = await prisma.teamSystemPayment.deleteMany({
      where: {
        teamId: team.id,
        NOT: {
          month: currentMonth,
          year: currentYear
        }
      }
    });
    totalDeleted += deleted.count;
  }
  console.log(`Mensalidades antigas removidas: ${totalDeleted}`);
}

main().finally(() => prisma.$disconnect()); 
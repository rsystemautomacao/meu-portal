import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  // Buscar todos os times ativos
  const teams = await prisma.team.findMany({ where: { status: 'ACTIVE' } });
  const config = await prisma.systemConfig.findFirst();
  if (!config) {
    console.log('Configuração do sistema não encontrada.');
    return;
  }
  let count = 0;
  for (const team of teams) {
    // Calcular vencimento: 7 dias após a data de criação do time, ajustado para o mês corrente
    const createdAt = team.createdAt ? new Date(team.createdAt) : new Date();
    const vencimento = new Date(year, month - 1, createdAt.getDate() + 7);
    // Verificar se já existe mensalidade do sistema para este mês
    const exists = await prisma.teamSystemPayment.findFirst({
      where: { teamId: team.id, month, year }
    });
    if (!exists) {
      // Calcular a data de vencimento (último dia do mês)
      const dueDate = new Date(year, month, 0); // Último dia do mês
      await prisma.teamSystemPayment.create({
        data: {
          teamId: team.id,
          month,
          year,
          amount: config.monthlyValue,
          status: 'pending',
          dueDate,
        }
      });
      count++;
    }
  }
  console.log(`Mensalidades do sistema geradas para ${count} time(s) ativos.`);
}

main().finally(() => prisma.$disconnect()); 
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function populateLastAccess() {
  try {
    console.log('🔍 Buscando times para popular último acesso...');
    
    // Buscar todos os times
    const teams = await prisma.team.findMany({
      include: {
        users: {
          include: {
            user: {
              select: {
                sessions: {
                  orderBy: { expires: 'desc' },
                  take: 1
                }
              }
            }
          }
        },
        matches: {
          orderBy: { updatedAt: 'desc' },
          take: 1
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        players: {
          orderBy: { updatedAt: 'desc' },
          take: 1
        }
      }
    });

    console.log(`📊 Encontrados ${teams.length} times`);

    for (const team of teams) {
      console.log(`\n🔄 Processando: ${team.name}`);
      
      // Encontrar a data mais recente de atividade
      let lastActivityDate = null;
      
      // 1. Verificar sessões dos usuários
      for (const teamUser of team.users) {
        if (teamUser.user.sessions.length > 0) {
          const sessionDate = new Date(teamUser.user.sessions[0].expires);
          if (!lastActivityDate || sessionDate > lastActivityDate) {
            lastActivityDate = sessionDate;
          }
        }
      }
      
      // 2. Verificar última partida
      if (team.matches.length > 0) {
        const matchDate = new Date(team.matches[0].updatedAt);
        if (!lastActivityDate || matchDate > lastActivityDate) {
          lastActivityDate = matchDate;
        }
      }
      
      // 3. Verificar última transação
      if (team.transactions.length > 0) {
        const transactionDate = new Date(team.transactions[0].createdAt);
        if (!lastActivityDate || transactionDate > lastActivityDate) {
          lastActivityDate = transactionDate;
        }
      }
      
      // 4. Verificar último jogador atualizado
      if (team.players.length > 0) {
        const playerDate = new Date(team.players[0].updatedAt);
        if (!lastActivityDate || playerDate > lastActivityDate) {
          lastActivityDate = playerDate;
        }
      }
      
      // 5. Se não encontrou nada, usar a data de criação do time
      if (!lastActivityDate) {
        lastActivityDate = new Date(team.createdAt);
      }
      
      // Atualizar o campo lastAccess
      await prisma.team.update({
        where: { id: team.id },
        data: { lastAccess: lastActivityDate }
      });
      
      console.log(`  ✅ ${team.name}: ${lastActivityDate.toLocaleString('pt-BR')}`);
    }
    
    console.log('\n🎉 Processo concluído! Todos os times foram atualizados.');
    
  } catch (error) {
    console.error('❌ Erro ao popular último acesso:', error);
  } finally {
    await prisma.$disconnect();
  }
}

populateLastAccess(); 
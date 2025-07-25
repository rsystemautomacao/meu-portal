import { prisma } from '@/lib/prisma';

const PAYMENT_LINK = "https://mpago.li/2YzHBRt";
const HOJE = new Date();

async function main() {
  // Buscar todos os times ativos
  const teams = await prisma.team.findMany({ where: { status: 'ACTIVE' } });
  for (const team of teams) {
    // Calcular dias desde a criação
    const createdAt = new Date(team.createdAt);
    const diffMs = HOJE.getTime() - createdAt.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Enviar cobrança a partir do 3º dia até o 7º dia
    if (diffDays >= 3 && diffDays <= 7) {
      await fetch(`/api/admin/teams/${team.id}/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageType: 'payment_link' })
      });
      console.log(`Cobrança enviada para o time: ${team.name} (dia ${diffDays} após criação)`);
    }

    // Bloquear acesso no 8º dia se não houver pagamento
    if (diffDays === 8) {
      // Aqui você pode verificar se o pagamento foi feito (implementar lógica de verificação)
      // Se não pago, bloquear o time
      await fetch(`/api/admin/teams/${team.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'block' })
      });
      console.log(`Time ${team.name} bloqueado por não pagamento após 7 dias de teste.`);
    }
  }
}

main().catch(console.error).finally(() => process.exit()); 
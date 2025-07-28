const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAndFixSystemConfig() {
  try {
    console.log('🔍 Verificando configurações do sistema...');
    
    // Buscar configuração existente
    let config = await prisma.systemConfig.findFirst();
    
    if (!config) {
      console.log('❌ Nenhuma configuração encontrada. Criando configuração padrão...');
      
      config = await prisma.systemConfig.create({
        data: {
          paymentMessage: `Olá! Tudo bem? 👋
Estamos passando para avisar que sua assinatura do Meu Portal está prestes a vencer.

Para continuar aproveitando todos os recursos da plataforma, você precisará renovar manualmente sua assinatura até {vencimento}.
O valor da renovação é de {valor}, e o pagamento pode ser feito por Pix ou cartão através do link abaixo:

🔗 {link}

Se tiver qualquer dúvida ou precisar de ajuda com o pagamento, é só chamar a gente no WhatsApp: (11) 94395-0503.

Obrigado por fazer parte do Meu Portal! 💙`,
          paymentLink: 'https://mpago.li/2YzHBRt',
          welcomeMessage: 'Bem-vindo ao Meu Portal! 🎉',
          monthlyValue: 29.90,
        },
      });
      
      console.log('✅ Configuração padrão criada com sucesso!');
    } else {
      console.log('✅ Configuração encontrada:');
      console.log('  - paymentMessage:', config.paymentMessage ? '✅ Preenchida' : '❌ Vazia');
      console.log('  - paymentLink:', config.paymentLink ? '✅ Preenchida' : '❌ Vazia');
      console.log('  - welcomeMessage:', config.welcomeMessage ? '✅ Preenchida' : '❌ Vazia');
      console.log('  - monthlyValue:', config.monthlyValue ? `✅ R$ ${config.monthlyValue}` : '❌ Vazio');
      
      // Verificar se algum campo está vazio e corrigir
      let needsUpdate = false;
      const updates = {};
      
      if (!config.paymentMessage || config.paymentMessage.trim() === '') {
        updates.paymentMessage = `Olá! Tudo bem? 👋
Estamos passando para avisar que sua assinatura do Meu Portal está prestes a vencer.

Para continuar aproveitando todos os recursos da plataforma, você precisará renovar manualmente sua assinatura até {vencimento}.
O valor da renovação é de {valor}, e o pagamento pode ser feito por Pix ou cartão através do link abaixo:

🔗 {link}

Se tiver qualquer dúvida ou precisar de ajuda com o pagamento, é só chamar a gente no WhatsApp: (11) 94395-0503.

Obrigado por fazer parte do Meu Portal! 💙`;
        needsUpdate = true;
      }
      
      if (!config.paymentLink || config.paymentLink.trim() === '') {
        updates.paymentLink = 'https://mpago.li/2YzHBRt';
        needsUpdate = true;
      }
      
      if (!config.welcomeMessage || config.welcomeMessage.trim() === '') {
        updates.welcomeMessage = 'Bem-vindo ao Meu Portal! 🎉';
        needsUpdate = true;
      }
      
      if (!config.monthlyValue || config.monthlyValue === 0) {
        updates.monthlyValue = 29.90;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        console.log('🔄 Atualizando campos vazios...');
        
        await prisma.systemConfig.update({
          where: { id: config.id },
          data: updates,
        });
        
        console.log('✅ Configuração atualizada com sucesso!');
      } else {
        console.log('✅ Todos os campos estão preenchidos corretamente!');
      }
    }
    
    // Mostrar configuração final
    const finalConfig = await prisma.systemConfig.findFirst();
    console.log('\n📋 Configuração final:');
    console.log('  - paymentMessage:', finalConfig.paymentMessage.substring(0, 50) + '...');
    console.log('  - paymentLink:', finalConfig.paymentLink);
    console.log('  - welcomeMessage:', finalConfig.welcomeMessage);
    console.log('  - monthlyValue:', `R$ ${finalConfig.monthlyValue}`);
    
  } catch (error) {
    console.error('❌ Erro ao verificar/corrigir configurações:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndFixSystemConfig(); 
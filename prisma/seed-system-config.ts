import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Verificar se já existe configuração
  const existingConfig = await prisma.systemConfig.findFirst()
  
  if (!existingConfig) {
    // Criar configuração padrão
    const systemConfig = await prisma.systemConfig.create({
      data: {
        paymentMessage: `Olá! Tudo bem? 👋
Estamos passando para avisar que sua assinatura do Meu Portal está prestes a vencer.

Para continuar aproveitando todos os recursos da plataforma, você precisará renovar manualmente sua assinatura até {vencimento}.
O valor da renovação é de {valor}, e o pagamento pode ser feito por Pix ou cartão através do link abaixo:

🔗 {link}

Se tiver qualquer dúvida ou precisar de ajuda com o pagamento, é só chamar a gente no WhatsApp: (11) 94395-0503.

Obrigado por fazer parte do Meu Portal! 💙`,
        paymentLink: 'https://mpago.li/2YzHBRt',
        welcomeMessage: `Olá {team}! 👋

Bem-vindo ao Meu Portal! 🎉

Estamos muito felizes em ter você conosco. Sua conta foi criada com sucesso e você já pode começar a usar todas as funcionalidades da plataforma.

📱 **Recursos disponíveis:**
• Gerenciamento completo de times
• Controle de jogadores e partidas
• Sistema financeiro integrado
• Relatórios detalhados
• Aplicativo PWA para mobile

🚀 **Próximos passos:**
1. Configure seu time
2. Adicione seus jogadores
3. Comece a registrar partidas
4. Aproveite os relatórios

Se precisar de ajuda, estamos aqui para você!

Equipe Meu Portal 💙`,
        monthlyValue: 29.90
      }
    })
    
    console.log('✅ Configuração padrão do sistema criada:', systemConfig)
  } else {
    console.log('ℹ️ Configuração do sistema já existe')
  }
}

main()
  .catch(e => {
    console.error('❌ Erro ao criar configuração:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect()) 
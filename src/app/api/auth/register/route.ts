import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { MessagingService } from '@/lib/messaging'
import { logWelcomeMessage } from '@/lib/userLogs'

interface TeamData {
  name: string
  whatsapp?: string
  primaryColor: string
  secondaryColor: string
  logo?: string
}

interface RegisterData {
  email: string
  password: string
  team: TeamData
}

export async function POST(req: Request) {
  try {
    const { email, password, team }: RegisterData = await req.json()

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email já cadastrado' },
        { status: 400 }
      )
    }

    // Verificar se o nome do time já existe
    const existingTeam = await prisma.team.findFirst({
      where: { name: team.name }
    })

    if (existingTeam) {
      return NextResponse.json(
        { message: 'Nome do time já cadastrado' },
        { status: 400 }
      )
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12)

    console.log('Iniciando transação para criar usuário e time')

    try {
      // Criar usuário e time em uma única transação
      const result = await prisma.$transaction(async (tx) => {
        // Criar o usuário
        const user = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            name: team.name
          }
        })

        console.log('Usuário criado:', user.id)

        // Criar o time e a relação TeamUser
        const newTeam = await tx.team.create({
          data: {
            name: team.name,
            whatsapp: team.whatsapp,
            primaryColor: team.primaryColor,
            secondaryColor: team.secondaryColor,
            logo: team.logo
          }
        })

        console.log('Time criado:', newTeam.id)

        // Criar a relação entre usuário e time
        await tx.teamUser.create({
          data: {
            userId: user.id,
            teamId: newTeam.id,
            role: 'owner'
          }
        })

        return { user, team: newTeam }
      })

      console.log('Usuário e time criados com sucesso')

      // Enviar mensagem de boas-vindas automaticamente
      try {
        const systemConfig = await prisma.systemConfig.findFirst()
        if (systemConfig?.welcomeMessage) {
          const welcomeMessage = systemConfig.welcomeMessage
            .replace(/{team}/g, team.name)
            .replace(/{user}/g, team.name)

          const messageData = {
            teamId: result.team.id,
            teamName: result.team.name,
            whatsapp: result.team.whatsapp || undefined,
            subject: 'Bem-vindo ao Meu Portal! 🎉',
            message: welcomeMessage,
            messageType: 'welcome',
            sentAt: new Date().toISOString()
          }

          await MessagingService.sendNotification(messageData)

          // Criar notificação no banco
          await prisma.notification.create({
            data: {
              teamId: result.team.id,
              title: 'Bem-vindo ao Meu Portal! 🎉',
              message: welcomeMessage,
              type: 'welcome',
              isRead: false
            }
          })

          // Registrar log de mensagem de boas-vindas
          await logWelcomeMessage(result.user.id, `Mensagem de boas-vindas enviada para ${team.name}`)

          console.log('✅ Mensagem de boas-vindas enviada com sucesso')
        }
      } catch (welcomeError) {
        console.error('❌ Erro ao enviar mensagem de boas-vindas:', welcomeError)
        // Não falha o registro se a mensagem não for enviada
      }

      return NextResponse.json(
        { message: 'Usuário e time criados com sucesso' },
        { status: 201 }
      )
    } catch (transactionError) {
      console.error('Erro na transação:', transactionError)
      throw transactionError
    }
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    return NextResponse.json(
      { 
        message: 'Erro ao criar usuário',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
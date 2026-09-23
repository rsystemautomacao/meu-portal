import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { MessagingService } from '@/lib/messaging'
import { logWelcomeMessage } from '@/lib/userLogs'
import { ImageUploadError, uploadImage } from '@/lib/imageUpload'
import { getClientIp, rateLimit, tooManyRequestsBody } from '@/lib/rateLimit'

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida')

const registerSchema = z.object({
  email: z.string().email('E-mail inválido').max(254),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres').max(128),
  team: z.object({
    name: z.string().trim().min(2, 'Nome do time muito curto').max(80, 'Nome do time muito longo'),
    whatsapp: z.string().trim().max(30).optional(),
    primaryColor: hexColor.optional(),
    secondaryColor: hexColor.optional(),
  }),
})

// Aceita multipart/form-data (com a logo como arquivo) ou JSON (sem logo).
// A logo só é enviada ao Cloudinary depois de validar os dados, para que o
// cadastro não sirva de upload anônimo.
async function parseRequest(req: Request): Promise<{ data: unknown; logoFile: File | null }> {
  const contentType = req.headers.get('content-type') || ''
  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData()
    const text = (key: string) => {
      const value = form.get(key)
      return typeof value === 'string' && value !== '' ? value : undefined
    }
    const logo = form.get('logo')
    return {
      data: {
        email: text('email'),
        password: text('password'),
        team: {
          name: text('teamName'),
          whatsapp: text('whatsapp'),
          primaryColor: text('primaryColor'),
          secondaryColor: text('secondaryColor'),
        },
      },
      // Sem `instanceof File`: o global File não existe no Node 18
      logoFile: logo && typeof logo !== 'string' && logo.size > 0 ? logo : null,
    }
  }

  const body = await req.json()
  return { data: body, logoFile: null }
}

export async function POST(req: Request) {
  try {
    const limit = rateLimit(`register:${getClientIp(req.headers)}`, 5, 60 * 60 * 1000)
    if (!limit.ok) {
      return NextResponse.json({ message: tooManyRequestsBody(limit.retryAfterSec).error }, { status: 429 })
    }

    const { data, logoFile } = await parseRequest(req)
    const parsed = registerSchema.safeParse(data)
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || 'Dados inválidos' },
        { status: 400 }
      )
    }
    const { email, password, team } = parsed.data

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

    let logoUrl: string | undefined
    if (logoFile) {
      try {
        logoUrl = (await uploadImage(logoFile, 'team_logos')).secure_url
      } catch (uploadError) {
        const message = uploadError instanceof ImageUploadError ? uploadError.message : 'Erro ao fazer upload da logo'
        return NextResponse.json({ message }, { status: 400 })
      }
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
            logo: logoUrl
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
      { message: 'Erro ao criar usuário' },
      { status: 500 }
    )
  }
}

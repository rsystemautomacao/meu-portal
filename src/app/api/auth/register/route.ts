import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

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
    const { email, password, team } = (await req.json()) as RegisterData
    
    console.log('Tentando registrar usuário:', { email, team: team.name })

    try {
      // Verificar se o email já existe
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      console.log('Resultado da busca de usuário:', existingUser)

      if (existingUser) {
        console.log('Email já está em uso:', email)
        return NextResponse.json(
          { message: 'Este email já está em uso' },
          { status: 400 }
        )
      }
    } catch (dbError) {
      console.error('Erro ao verificar email:', dbError)
      // Continua mesmo com erro na verificação
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10)

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
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/adminAuth'

export async function GET(request: Request) {
  try {
    // Verificar se é admin
    const adminSession = await getAdminSession()
    if (!adminSession) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (email) {
      // Buscar usuário específico por email
      console.log('🔍 Buscando usuário por email:', email)
      
      // Verificar se há múltiplos usuários com este email
      const allUsersWithEmail = await prisma.user.findMany({
        where: { email }
      })
      
      console.log(`📊 Usuários encontrados com email ${email}: ${allUsersWithEmail.length}`)
      allUsersWithEmail.forEach((user, index) => {
        console.log(`   ${index + 1}. ID: ${user.id} | Email: ${user.email} | Nome: ${user.name}`)
      })
      
      // Usar o primeiro usuário encontrado (que é o correto)
      const user = allUsersWithEmail[0]
      
      if (!user) {
        console.log('❌ Usuário não encontrado para email:', email)
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
      }

      console.log('✅ Usuário encontrado:', user.id, user.email)
      console.log('📋 Dados completos do usuário:', JSON.stringify(user, null, 2))
      
      return NextResponse.json([user])
    }

    // Buscar todos os usuários
    const users = await prisma.user.findMany()

    // Mapear para o formato esperado
    const mappedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      ownedTeams: [], // Por enquanto vazio
      createdAt: user.createdAt
    }))

    return NextResponse.json(mappedUsers)
  } catch (error) {
    console.error('Erro ao buscar usuários:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 
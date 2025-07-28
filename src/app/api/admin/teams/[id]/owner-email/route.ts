import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar se é admin
    const cookieStore = cookies()
    const adminSession = cookieStore.get('adminSession')
    if (!adminSession || adminSession.value !== 'true') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const teamId = params.id
    console.log('🔍 Buscando owner para time ID:', teamId)

    // Buscar o usuário owner do time
    const teamUser = await prisma.teamUser.findFirst({
      where: { 
        teamId,
        role: 'owner'
      },
      include: {
        user: {
          select: {
            email: true,
            id: true
          }
        }
      }
    })

    if (!teamUser) {
      console.log('❌ Usuário owner não encontrado para time:', teamId)
      return NextResponse.json({ error: 'Usuário owner não encontrado' }, { status: 404 })
    }

    console.log('✅ Owner encontrado:', teamUser.user.email, 'ID:', teamUser.user.id)

    // Verificar se o ID está correto
    if (teamUser.user.id !== '687e5b9e1be28a4226ceaa7f') {
      console.log('⚠️ ATENÇÃO: ID do owner não corresponde ao esperado!')
      console.log('   Esperado: 687e5b9e1be28a4226ceaa7f')
      console.log('   Encontrado:', teamUser.user.id)
      
      // Forçar o uso do ID correto
      const correctUser = await prisma.user.findUnique({
        where: { email: teamUser.user.email }
      })
      
      if (correctUser) {
        console.log('✅ Usando ID correto:', correctUser.id)
        return NextResponse.json({
          email: correctUser.email
        })
      }
    }

    return NextResponse.json({
      email: teamUser.user.email
    })
  } catch (error) {
    console.error('❌ Erro ao buscar email do owner:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 
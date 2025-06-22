// Este arquivo foi desabilitado temporariamente
// Há problemas com o Prisma Client não reconhecendo o schema atual
// Será reativado após o deploy funcionar

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Listar jogadores
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Funcionalidade temporariamente desabilitada' },
    { status: 501 }
  )
}

// Função auxiliar para ajustar o timezone
function adjustDateToUTC(dateString: string | null | undefined): Date | null {
  if (!dateString) return null
  const [year, month, day] = dateString.split('-').map(Number)
  // Criando a data e adicionando um dia
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + 1)
  return date
}

// POST - Criar jogador
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Funcionalidade temporariamente desabilitada' },
    { status: 501 }
  )
}

// PUT - Atualizar jogador
export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { error: 'Funcionalidade temporariamente desabilitada' },
    { status: 501 }
  )
}

// DELETE - Excluir jogador
export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { error: 'Funcionalidade temporariamente desabilitada' },
    { status: 501 }
  )
} 
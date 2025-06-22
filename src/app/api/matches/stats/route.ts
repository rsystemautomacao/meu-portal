// Este arquivo foi desabilitado temporariamente
// O modelo matchStats foi removido do schema atual
// As estatísticas agora são gerenciadas através do modelo MatchEvent

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  return NextResponse.json(
    { error: 'Funcionalidade temporariamente desabilitada' },
    { status: 501 }
  )
}

export async function DELETE(request: Request) {
  return NextResponse.json(
    { error: 'Funcionalidade temporariamente desabilitada' },
    { status: 501 }
  )
} 
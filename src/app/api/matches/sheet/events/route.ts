// Este arquivo foi desabilitado temporariamente
// Depende do modelo matchSheet que foi removido do schema atual
// Será reativado após o deploy funcionar

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  return NextResponse.json(
    { error: 'Funcionalidade temporariamente desabilitada' },
    { status: 501 }
  )
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID do evento não fornecido' },
        { status: 400 }
      )
    }

    await prisma.matchEvent.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir evento:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir evento' },
      { status: 500 }
    )
  }
} 
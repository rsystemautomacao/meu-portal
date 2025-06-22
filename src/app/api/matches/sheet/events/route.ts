import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { matchSheetId, type, minute, playerName, playerNumber, teamSide, details } = data

    const event = await prisma.matchEvent.create({
      data: {
        matchSheetId,
        type,
        minute,
        playerName,
        playerNumber,
        teamSide,
        details
      }
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error('Erro ao criar evento:', error)
    return NextResponse.json(
      { error: 'Erro ao criar evento' },
      { status: 500 }
    )
  }
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
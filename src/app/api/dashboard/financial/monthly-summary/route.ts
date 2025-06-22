// Este arquivo foi desabilitado temporariamente
// Há problemas com o Prisma Client não reconhecendo o schema atual
// Será reativado após o deploy funcionar

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Payment, Player, MonthlyFeeException } from '@prisma/client'

interface PaymentWithPlayer extends Payment {
  player: Player & {
    monthlyFeeExceptions: MonthlyFeeException[]
  }
}

interface PendingPlayer {
  id: string
  name: string
  amount: number | null
  dueDate: Date | null
}

interface ExemptPlayer {
  id: string
  name: string
}

interface MonthlySummary {
  month: number
  year: number
  totalExpected: number
  totalReceived: number
  pendingAmount: number
  pendingPlayers: PendingPlayer[]
  exemptPlayers: ExemptPlayer[]
  totalPlayers: number
  paidPlayers: number
  pendingPlayersCount: number
  exemptPlayersCount: number
}

// GET - Buscar resumo mensal
export async function GET(req: Request) {
  return NextResponse.json(
    { error: 'Funcionalidade temporariamente desabilitada' },
    { status: 501 }
  )
} 
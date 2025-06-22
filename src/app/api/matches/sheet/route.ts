// Este arquivo foi desabilitado temporariamente
// O modelo matchSheet foi removido do schema atual
// Será reativado após o deploy funcionar

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Funcionalidade temporariamente desabilitada' },
    { status: 501 }
  )
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Funcionalidade temporariamente desabilitada' },
    { status: 501 }
  )
}

export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { error: 'Funcionalidade temporariamente desabilitada' },
    { status: 501 }
  )
} 
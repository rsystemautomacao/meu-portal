// Este arquivo foi desabilitado temporariamente
// Há problemas com o Prisma Client não reconhecendo o schema atual
// Será reativado após o deploy funcionar

import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  return NextResponse.json(
    { error: 'Funcionalidade temporariamente desabilitada' },
    { status: 501 }
  )
}

export async function POST(request: Request) {
  return NextResponse.json(
    { error: 'Funcionalidade temporariamente desabilitada' },
    { status: 501 }
  )
}

export async function PUT(request: Request) {
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
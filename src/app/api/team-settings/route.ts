// Este arquivo foi desabilitado temporariamente
// Há problemas com o Prisma Client não reconhecendo o schema atual
// Será reativado após o deploy funcionar

import { NextRequest, NextResponse } from 'next/server'

// GET: Buscar configurações do time
export async function GET(request: NextRequest) {
    return NextResponse.json(
        { error: 'Funcionalidade temporariamente desabilitada' },
        { status: 501 }
    )
}

// PATCH: Atualizar configurações do time
export async function PATCH(request: NextRequest) {
    return NextResponse.json(
        { error: 'Funcionalidade temporariamente desabilitada' },
        { status: 501 }
    )
}

// DELETE: Excluir o time
export async function DELETE(request: NextRequest) {
    return NextResponse.json(
        { error: 'Funcionalidade temporariamente desabilitada' },
        { status: 501 }
    )
} 
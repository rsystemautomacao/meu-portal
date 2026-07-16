import { cookies } from 'next/headers'

export const ADMIN_SESSION_COOKIE = 'adminSession'
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 // 24h

const encoder = new TextEncoder()

function base64UrlEncode(input: string): string {
  const bytes = encoder.encode(input)
  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function getSigningKey(): Promise<CryptoKey> {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET não está configurado')
  }
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
}

/** Cria o token assinado que vai no cookie de sessão do admin. */
export async function createAdminSessionToken(email: string): Promise<string> {
  const payload = base64UrlEncode(`${email}|${Date.now() + SESSION_DURATION_MS}`)
  const key = await getSigningKey()
  const signature = toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(payload)))
  return `${payload}.${signature}`
}

/** Verifica o token do cookie. Retorna o email autenticado ou null se inválido/expirado. */
export async function verifyAdminSessionToken(token: string | undefined | null): Promise<{ email: string } | null> {
  if (!token) return null
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null

  try {
    const key = await getSigningKey()
    const expectedSignature = toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(payload)))
    if (expectedSignature !== signature) return null

    const [email, expiresAtStr] = base64UrlDecode(payload).split('|')
    const expiresAt = Number(expiresAtStr)
    if (!email || !expiresAt || Date.now() > expiresAt) return null

    return { email }
  } catch {
    return null
  }
}

/** Para uso em Route Handlers (runtime Node): lê o cookie da requisição atual e valida. */
export async function getAdminSession(): Promise<{ email: string } | null> {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value
  return verifyAdminSessionToken(token)
}

/** Extrai o valor de um cookie a partir do header "cookie" bruto (usado no authorize() do NextAuth). */
export function getCookieValueFromHeader(cookieHeader: string | undefined | null, name: string): string | undefined {
  if (!cookieHeader) return undefined
  const match = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined
}

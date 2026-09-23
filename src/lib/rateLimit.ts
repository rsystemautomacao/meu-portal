// Rate limit simples em memória. Na Vercel cada instância serverless tem o seu
// próprio contador, então isto é uma barreira de melhor esforço contra força
// bruta; para um limite global, troque por um store compartilhado (ex.: Upstash Redis).

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()
const MAX_BUCKETS = 10000

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterSec: number } {
  const now = Date.now()

  if (buckets.size > MAX_BUCKETS) {
    buckets.forEach((bucket, k) => {
      if (bucket.resetAt <= now) buckets.delete(k)
    })
  }

  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, retryAfterSec: 0 }
  }

  bucket.count++
  if (bucket.count > limit) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) }
  }
  return { ok: true, retryAfterSec: 0 }
}

/** Aceita tanto `Headers` (Route Handlers) quanto o objeto simples que o NextAuth passa ao authorize(). */
export function getClientIp(headers: Headers | Record<string, any> | undefined | null): string {
  if (!headers) return 'unknown'
  const get = (name: string): string | undefined =>
    typeof (headers as Headers).get === 'function'
      ? (headers as Headers).get(name) ?? undefined
      : (headers as Record<string, any>)[name]

  const forwardedFor = get('x-forwarded-for')
  if (forwardedFor) return String(forwardedFor).split(',')[0].trim()
  return get('x-real-ip') || 'unknown'
}

export function tooManyRequestsBody(retryAfterSec: number) {
  return {
    error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
    retryAfter: retryAfterSec,
  }
}

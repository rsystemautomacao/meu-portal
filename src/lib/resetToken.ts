import crypto from 'crypto'

/** Hash do token de redefinição de senha. O token puro só existe no link enviado ao usuário. */
export function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

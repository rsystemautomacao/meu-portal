import { v2 as cloudinary } from 'cloudinary'

// Debug das variáveis de ambiente
const cloudName = process.env.CLOUDINARY_CLOUD_NAME
const apiKey = process.env.CLOUDINARY_API_KEY
const apiSecret = process.env.CLOUDINARY_API_SECRET

console.log('Cloudinary Config:', {
  cloud_name: cloudName,
  api_key: apiKey?.substring(0, 4) + '...',
  has_secret: !!apiSecret,
  env: process.env.NODE_ENV
})

if (!cloudName || !apiKey || !apiSecret) {
  throw new Error(`Cloudinary environment variables are missing:
    CLOUDINARY_CLOUD_NAME: ${!!cloudName}
    CLOUDINARY_API_KEY: ${!!apiKey}
    CLOUDINARY_API_SECRET: ${!!apiSecret}
  `)
}

// Configurar o Cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true
})

// Função para gerar assinatura
export function generateSignature(params: Record<string, any>) {
  const timestamp = Math.round(new Date().getTime() / 1000)
  const signature = cloudinary.utils.api_sign_request(
    { ...params, timestamp },
    apiSecret as string
  )
  return { timestamp, signature }
}

// Teste de conexão
cloudinary.uploader.upload(
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  { folder: 'test' },
  (error, result) => {
    if (error) {
      console.error('Erro ao conectar com Cloudinary:', error)
    } else {
      console.log('Conexão com Cloudinary estabelecida com sucesso')
    }
  }
)

export default cloudinary 
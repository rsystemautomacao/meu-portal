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

// Função para gerar assinatura
export function generateSignature(params: Record<string, any>) {
  if (!cloudName || !apiKey || !apiSecret) {
    console.warn('Cloudinary não configurado - generateSignature não disponível')
    return { timestamp: 0, signature: '' }
  }
  
  const timestamp = Math.round(new Date().getTime() / 1000)
  const signature = cloudinary.utils.api_sign_request(
    { ...params, timestamp },
    apiSecret as string
  )
  return { timestamp, signature }
}

// Configurar o Cloudinary apenas se as variáveis estiverem disponíveis
if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
  })

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
} else {
  console.warn('Cloudinary não configurado - variáveis de ambiente ausentes')
}

export default cloudinary 
const fetch = require('node-fetch')

async function testSimpleApi() {
  try {
    console.log('🔍 Testando API simples...')
    
    // Testar se o servidor está respondendo
    const response = await fetch('http://localhost:3000/api/admin/users')
    
    console.log(`📊 Status: ${response.status}`)
    
    if (response.ok) {
      const data = await response.json()
      console.log(`✅ Resposta: ${data.length} usuários`)
    } else {
      const error = await response.text()
      console.log(`❌ Erro: ${error}`)
    }
    
  } catch (error) {
    console.error('❌ Erro na requisição:', error)
  }
}

testSimpleApi() 
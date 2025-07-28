const fetch = require('node-fetch')

async function testLogsApi() {
  try {
    console.log('🔍 Testando API de logs...')
    
    const userId = '687e5b9e1be28a4226ceaa7f'
    const url = `http://localhost:3000/api/admin/users/${userId}/logs`
    
    console.log(`📡 Fazendo requisição para: ${url}`)
    
    const response = await fetch(url, {
      headers: {
        'Cookie': 'adminSession=true'
      }
    })
    
    console.log(`📊 Status da resposta: ${response.status}`)
    
    if (response.ok) {
      const logs = await response.json()
      console.log(`✅ Logs encontrados: ${logs.length}`)
      
      logs.forEach((log, index) => {
        console.log(`   ${index + 1}. ${log.action} (${log.type}) - ${log.createdAt}`)
      })
    } else {
      const error = await response.text()
      console.log(`❌ Erro: ${error}`)
    }
    
  } catch (error) {
    console.error('❌ Erro na requisição:', error)
  }
}

testLogsApi() 
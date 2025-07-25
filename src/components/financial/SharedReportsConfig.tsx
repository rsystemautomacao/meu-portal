'use client'

import { useState, useEffect } from 'react'
import { 
  ShareIcon, 
  LinkIcon, 
  EyeIcon, 
  EyeSlashIcon,
  ClipboardDocumentIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

interface SharedReportConfig {
  id?: string
  shareToken: string
  isActive: boolean
  enabledReports: string[]
}

const AVAILABLE_REPORTS = [
  { id: 'monthly_summary', name: 'Resumo Mensal', description: 'Receitas, despesas e saldo do mês' },
  { id: 'player_payments', name: 'Pagamentos dos Jogadores', description: 'Status de pagamento de cada jogador' },
  { id: 'transactions', name: 'Transações', description: 'Histórico de receitas e despesas' },
  { id: 'match_stats', name: 'Estatísticas das Partidas', description: 'Performance e resultados dos jogos' },
  { id: 'payment_details', name: 'Relatório Detalhado de Pagamentos', description: 'Análise detalhada dos pagamentos' }
]

export default function SharedReportsConfig() {
  const [config, setConfig] = useState<SharedReportConfig>({
    shareToken: '',
    isActive: false,
    enabledReports: []
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/team-settings/shared-reports')
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
      } else if (response.status === 404) {
        // Criar configuração inicial
        setConfig({
          shareToken: '',
          isActive: false,
          enabledReports: []
        })
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error)
      toast.error('Erro ao carregar configuração')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/team-settings/shared-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || 'Erro ao salvar')
      }

      const data = await response.json()
      setConfig(data)
      toast.success('Configuração salva com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar configuração:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar configuração')
    } finally {
      setSaving(false)
    }
  }

  const toggleReport = (reportId: string) => {
    setConfig(prev => ({
      ...prev,
      enabledReports: prev.enabledReports.includes(reportId)
        ? prev.enabledReports.filter(id => id !== reportId)
        : [...prev.enabledReports, reportId]
    }))
  }

  const copyShareLink = async () => {
    if (!config.shareToken) return
    
    const shareUrl = `${window.location.origin}/shared-reports/${config.shareToken}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success('Link copiado para a área de transferência!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Erro ao copiar link:', error)
      toast.error('Erro ao copiar link')
    }
  }

  const generateNewToken = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/team-settings/shared-reports/generate-token', {
        method: 'POST'
      })

      if (!response.ok) throw new Error('Erro ao gerar token')

      const data = await response.json()
      setConfig(prev => ({ ...prev, shareToken: data.shareToken }))
      toast.success('Novo link gerado com sucesso!')
    } catch (error) {
      console.error('Erro ao gerar token:', error)
      toast.error('Erro ao gerar novo link')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-xl shadow-lg border border-gray-200">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-xl shadow-lg border border-gray-200">
      <div className="border-b border-gray-200 pb-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center mb-2">
          <ShareIcon className="h-6 w-6 mr-3 text-indigo-600"/>
          Relatórios Compartilháveis
        </h2>
        <p className="text-gray-600 leading-relaxed">
          Configure quais relatórios financeiros serão visíveis para os jogadores através de link compartilhável.
        </p>
      </div>

      {/* Status do Link */}
      <div className="mb-8">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${config.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="font-medium">
              {config.isActive ? 'Link Ativo' : 'Link Inativo'}
            </span>
          </div>
          
          {config.shareToken && (
            <div className="flex items-center space-x-2">
              <button
                onClick={copyShareLink}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                {copied ? (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <ClipboardDocumentIcon className="h-4 w-4" />
                    <span>Copiar Link</span>
                  </>
                )}
              </button>
              <button
                onClick={generateNewToken}
                disabled={saving}
                className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                Novo Link
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Toggle Principal */}
      <div className="mb-6">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={config.isActive}
            onChange={(e) => setConfig(prev => ({ ...prev, isActive: e.target.checked }))}
            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <span className="font-medium text-gray-900">
            Ativar relatórios compartilháveis
          </span>
        </label>
        <p className="text-sm text-gray-500 mt-1 ml-7">
          Quando ativado, os jogadores poderão acessar os relatórios selecionados através do link compartilhável.
        </p>
      </div>

      {/* Lista de Relatórios */}
      <div className="space-y-4 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Relatórios Disponíveis</h3>
        
        {AVAILABLE_REPORTS.map((report) => (
          <div key={report.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={config.enabledReports.includes(report.id)}
                onChange={() => toggleReport(report.id)}
                disabled={!config.isActive}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 disabled:opacity-50"
              />
              <div>
                <div className="font-medium text-gray-900">{report.name}</div>
                <div className="text-sm text-gray-500">{report.description}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {config.enabledReports.includes(report.id) ? (
                <EyeIcon className="h-5 w-5 text-green-600" />
              ) : (
                <EyeSlashIcon className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-indigo-400 flex items-center"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Salvando...
            </>
          ) : (
            <>
              <LinkIcon className="h-4 w-4 mr-2" />
              Salvar Configuração
            </>
          )}
        </button>
      </div>

      {/* Informações Adicionais */}
      {config.isActive && config.enabledReports.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <LinkIcon className="h-5 w-5 text-blue-600 mt-0.5" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900">Como usar</h4>
              <p className="text-sm text-blue-700 mt-1">
                Compartilhe o link com os jogadores para que eles possam visualizar os relatórios selecionados. 
                Os jogadores terão acesso apenas para visualização, sem permissão para editar dados.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
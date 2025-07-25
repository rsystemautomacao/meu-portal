'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'

export default function AdminConfiguracoes() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    paymentMessage: '',
    paymentLink: '',
    welcomeMessage: '',
    monthlyValue: 0,
  });

  useEffect(() => {
    // Verificar se está logado como admin supremo
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      acc[key] = value
      return acc
    }, {} as Record<string, string>)
    if (!cookies.adminSession) {
      router.push('/admin/login')
      return
    }
    fetch('/api/admin/config')
      .then(res => res.json())
      .then(data => {
        setConfig(data)
        setLoading(false)
      })
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConfig({
      ...config,
      [name]: name === 'monthlyValue' ? parseFloat(value.replace(',', '.')) || 0 : value,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    await fetch('/api/admin/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaving(false);
    alert('Configurações salvas com sucesso!');
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen text-lg text-gray-600">Carregando configurações...</div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8 border-2 border-blue-200">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <span className="bg-gradient-to-r from-blue-500 to-blue-700 p-3 rounded-full shadow-lg">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" /></svg>
            </span>
            <h2 className="text-3xl font-extrabold text-blue-900">Configurações do Sistema</h2>
          </div>
          <p className="text-gray-600 text-center max-w-xl">Personalize as mensagens automáticas, valores e links do sistema. Essas configurações afetam apenas as comunicações e cobranças feitas pelo painel do administrador supremo.</p>
        </div>
        {/* Removido o botão Voltar, pois o menu global já faz a navegação */}
        <div className="space-y-6 mt-4">
          <div>
            <label className="block font-semibold mb-2 text-blue-800">Mensagem de Cobrança</label>
            <textarea name="paymentMessage" value={config.paymentMessage} onChange={handleChange} className="w-full border-2 border-blue-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-400 text-base min-h-[80px]" rows={3} placeholder="Digite a mensagem de cobrança padrão... Você pode usar {vencimento}, {link} e {valor} na mensagem." />
          </div>
          <div>
            <label className="block font-semibold mb-2 text-blue-800">Link de Cobrança (MercadoPago)</label>
            <input name="paymentLink" value={config.paymentLink} onChange={handleChange} className="w-full border-2 border-blue-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-400 text-base" placeholder="Cole aqui o link do MercadoPago..." />
          </div>
          <div>
            <label className="block font-semibold mb-2 text-blue-800">Mensagem de Boas-vindas</label>
            <textarea name="welcomeMessage" value={config.welcomeMessage} onChange={handleChange} className="w-full border-2 border-blue-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-400 text-base min-h-[80px]" rows={3} placeholder="Digite a mensagem de boas-vindas..." />
          </div>
          <div>
            <label className="block font-semibold mb-2 text-blue-800">Valor da Mensalidade (R$)</label>
            <input
              name="monthlyValue"
              type="number"
              min="0"
              step="0.01"
              value={config.monthlyValue}
              onChange={handleChange}
              className="w-full border-2 border-blue-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-400 text-base"
              placeholder="Ex: 24.99"
            />
          </div>
        </div>
        <div className="flex justify-end mt-8">
          <button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold text-lg shadow hover:bg-blue-700 transition-colors disabled:opacity-60">
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </div>
    </div>
  );
} 
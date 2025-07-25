'use client';
import { useState, useEffect } from 'react';

export default function AdminConfiguracoes() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    paymentMessage: '',
    paymentLink: '',
    welcomeMessage: '',
  });

  useEffect(() => {
    fetch('/api/admin/config')
      .then(res => res.json())
      .then(data => {
        setConfig(data);
        setLoading(false);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
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

  if (loading) return <div>Carregando configurações...</div>;

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-lg mt-8">
      <h2 className="text-2xl font-bold mb-4">Configurações do Sistema</h2>
      <div className="mb-4">
        <label className="block font-medium mb-1">Mensagem de Cobrança</label>
        <textarea name="paymentMessage" value={config.paymentMessage} onChange={handleChange} className="w-full border rounded p-2" rows={3} />
      </div>
      <div className="mb-4">
        <label className="block font-medium mb-1">Link de Cobrança (MercadoPago)</label>
        <input name="paymentLink" value={config.paymentLink} onChange={handleChange} className="w-full border rounded p-2" />
      </div>
      <div className="mb-4">
        <label className="block font-medium mb-1">Mensagem de Boas-vindas</label>
        <textarea name="welcomeMessage" value={config.welcomeMessage} onChange={handleChange} className="w-full border rounded p-2" rows={3} />
      </div>
      <button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        {saving ? 'Salvando...' : 'Salvar Configurações'}
      </button>
    </div>
  );
} 
// Página de controle de mensalidades para admin
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Team {
  id: string;
  name: string;
  status: string;
  whatsapp?: string;
}
interface Payment {
  id: string;
  month: number;
  year: number;
  status: string;
  amount: number;
}

const months = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export default function AdminFinanceiroPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [payments, setPayments] = useState<Record<string, Payment[]>>({});
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [generating, setGenerating] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  useEffect(() => {
    // Buscar times
    fetch('/api/admin/teams')
      .then(res => res.json())
      .then(data => {
        setTeams(data.teams || []);
        setSelectedTeam(data.teams?.[0]?.id || '');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      setLoading(true);
      fetch(`/api/admin/teams/${selectedTeam}/system-payments?year=${year}`)
        .then(res => res.json())
        .then(data => {
          setPayments(prev => ({ ...prev, [selectedTeam]: data.payments || [] }));
          setLoading(false);
        });
    }
  }, [selectedTeam, year]);

  const handleStatusChange = async (paymentId: string, status: string) => {
    await fetch(`/api/admin/system-payments/${paymentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    setPayments(prev => ({
      ...prev,
      [selectedTeam]: prev[selectedTeam].map(p => p.id === paymentId ? { ...p, status } : p)
    }));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    // Buscar valor da mensalidade do config
    const config = await fetch('/api/admin/config').then(res => res.json());
    await fetch(`/api/admin/teams/${selectedTeam}/system-payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year, amount: config.monthlyValue })
    });
    setGenerating(false);
    // Recarregar pagamentos
    fetch(`/api/admin/teams/${selectedTeam}/system-payments?year=${year}`)
      .then(res => res.json())
      .then(data => {
        setPayments(prev => ({ ...prev, [selectedTeam]: data.payments || [] }));
      });
  };

  // Geração manual para múltiplos times antigos
  const handleGenerateForSelected = async () => {
    setGenerating(true);
    const config = await fetch('/api/admin/config').then(res => res.json());
    for (const teamId of selectedTeams) {
      await fetch(`/api/admin/teams/${teamId}/system-payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, amount: config.monthlyValue })
      });
    }
    setGenerating(false);
    setSelectedTeams([]);
    // Recarregar pagamentos do time selecionado, se estiver na lista
    if (selectedTeams.includes(selectedTeam)) {
      fetch(`/api/admin/teams/${selectedTeam}/system-payments?year=${year}`)
        .then(res => res.json())
        .then(data => {
          setPayments(prev => ({ ...prev, [selectedTeam]: data.payments || [] }));
        });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-8 px-4">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl p-8 border-2 border-blue-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-extrabold text-blue-900">Controle de Mensalidades</h2>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-colors"
          >
            Voltar
          </button>
        </div>
        {/* Painel de geração manual para times antigos */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex flex-wrap gap-4 items-center mb-2">
            <span className="font-semibold text-blue-800">Gerar mensalidade para times antigos:</span>
            <select
              multiple
              value={selectedTeams}
              onChange={e => setSelectedTeams(Array.from(e.target.selectedOptions, opt => opt.value))}
              className="px-4 py-2 rounded-lg border-2 border-blue-300 text-blue-800 font-bold bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-base shadow min-w-[200px]"
              style={{ height: '80px' }}
            >
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
            <button
              onClick={handleGenerateForSelected}
              disabled={generating || selectedTeams.length === 0}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold shadow hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {generating ? 'Gerando...' : 'Gerar Mensalidade(s)'}
            </button>
          </div>
          <span className="text-xs text-gray-600">Selecione um ou mais times e clique para gerar a mensalidade do sistema para o ano/mês atual.</span>
        </div>
        <div className="flex flex-wrap gap-4 mb-6 items-center">
          <label className="font-semibold text-blue-800">Time:</label>
          <select
            value={selectedTeam}
            onChange={e => setSelectedTeam(e.target.value)}
            className="px-4 py-2 rounded-lg border-2 border-blue-300 text-blue-800 font-bold bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg shadow"
          >
            {teams.map(team => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
          <label className="font-semibold text-blue-800 ml-4">Ano:</label>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="px-4 py-2 rounded-lg border-2 border-blue-300 text-blue-800 font-bold bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg shadow"
          >
            {[...Array(3)].map((_, i) => {
              const y = new Date().getFullYear() - i;
              return <option key={y} value={y}>{y}</option>;
            })}
          </select>
        </div>
        <div className="overflow-x-auto">
          {(!payments[selectedTeam] || payments[selectedTeam].length === 0) && !loading && (
            <div className="mb-4 flex items-center gap-4">
              <span className="text-blue-700 font-semibold">Nenhuma mensalidade encontrada para este time/ano.</span>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold shadow hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                {generating ? 'Gerando...' : 'Gerar Mensalidades'}
              </button>
            </div>
          )}
          <table className="min-w-full border text-center rounded-lg overflow-hidden">
            <thead className="bg-blue-100">
              <tr>
                <th className="px-3 py-2">Mês</th>
                <th className="px-3 py-2">Valor</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Ação</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="py-8 text-blue-600">Carregando...</td></tr>
              ) : (
                (payments[selectedTeam] || []).map(payment => (
                  <tr key={payment.id} className="border-b">
                    <td className="px-3 py-2 font-semibold">{months[payment.month - 1]}/{payment.year}</td>
                    <td className="px-3 py-2">R$ {payment.amount.toFixed(2).replace('.', ',')}</td>
                    <td className="px-3 py-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold
                        ${payment.status === 'paid' ? 'bg-green-100 text-green-700' :
                          payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          payment.status === 'late' ? 'bg-orange-100 text-orange-700' :
                          payment.status === 'exempt' ? 'bg-gray-100 text-gray-700' :
                          'bg-red-100 text-red-700'}`}
                      >
                        {payment.status === 'paid' ? 'Pago' :
                          payment.status === 'pending' ? 'Pendente' :
                          payment.status === 'late' ? 'Em atraso' :
                          payment.status === 'exempt' ? 'Isento' :
                          payment.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 space-x-2">
                      <button
                        onClick={() => handleStatusChange(payment.id, 'paid')}
                        className="px-3 py-1 rounded bg-green-600 text-white text-xs font-bold hover:bg-green-700"
                      >Pago</button>
                      <button
                        onClick={() => handleStatusChange(payment.id, 'late')}
                        className="px-3 py-1 rounded bg-orange-500 text-white text-xs font-bold hover:bg-orange-600"
                      >Em atraso</button>
                      <button
                        onClick={() => handleStatusChange(payment.id, 'pending')}
                        className="px-3 py-1 rounded bg-yellow-500 text-white text-xs font-bold hover:bg-yellow-600"
                      >Pendente</button>
                      <button
                        onClick={() => handleStatusChange(payment.id, 'exempt')}
                        className="px-3 py-1 rounded bg-gray-400 text-white text-xs font-bold hover:bg-gray-500"
                      >Isento</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 
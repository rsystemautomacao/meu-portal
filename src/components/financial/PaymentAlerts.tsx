import { useEffect, useState } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PaymentAlert {
  id: string;
  message: string;
  playerName: string;
  daysLate: number;
  dueDate: string;
}

export default function PaymentAlerts() {
  const [alerts, setAlerts] = useState<PaymentAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/financial/check-payments');
        if (!response.ok) {
          throw new Error('Erro ao carregar alertas');
        }
        const data = await response.json();
        setAlerts(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar alertas');
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    // Atualiza a cada 5 minutos
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-4">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-4">
      <div className="flex items-center space-x-2 mb-4">
        <BellIcon className="h-5 w-5 text-yellow-500" />
        <h2 className="text-lg font-medium text-gray-900">Alertas de Pagamento</h2>
      </div>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={`${alert.id}-${alert.daysLate}`}
            className={`p-3 rounded-md ${
              alert.daysLate > 20
                ? 'bg-red-50 border border-red-200'
                : 'bg-yellow-50 border border-yellow-200'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-900">{alert.playerName}</p>
                <p className="text-sm text-gray-600">{alert.message}</p>
              </div>
              <div className="text-sm text-gray-500">
                Vencimento: {format(new Date(alert.dueDate), "dd 'de' MMMM", { locale: ptBR })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 
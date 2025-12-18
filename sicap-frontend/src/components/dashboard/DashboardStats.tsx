// components/dashboard/DashboardStats.tsx
import { useEffect, useState } from 'react';
import { getAllDeudores } from '../../services/deudores.service';
import type { Deudor } from '../../services/deudores.service';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface StatusData {
  name: string;
  value: number;
  [key: string]: any;
}

const STATUS_LABELS: { [key: string]: string } = {
  'pagado': 'Pagado',
  'adeudo': 'Adeudo',
  'rezagado': 'Rezagado',
  'corriente': 'Corriente'
};

const COLORS = ['#4ecd69ff', '#c545f8ff', '#f31212ff', '#ca781bff'];

export const DashboardStats = () => {
  const [statusData, setStatusData] = useState<StatusData[]>([]);
  const [top5Lowest, setTop5Lowest] = useState<Deudor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
  try {
    const response = await getAllDeudores();
    
    console.log('Response completa:', response);
    
    if (response.success && response.data) {
      // Ahora response.data ya es el array completo
      const deudoresArray = Array.isArray(response.data) ? response.data : [];
      
      console.log(`Total de deudores cargados: ${deudoresArray.length}`);
      
      if (deudoresArray.length === 0) {
        console.warn('No hay datos de deudores disponibles');
        setLoading(false);
        return;
      }

      // Procesar datos para el gráfico de pastel
      const statusCount: { [key: string]: number } = {};
      
      deudoresArray.forEach((deudor: Deudor) => {
        const status = deudor.estatus.toLowerCase();
        statusCount[status] = (statusCount[status] || 0) + 1;
      });

      const pieData: StatusData[] = Object.keys(statusCount).map(status => ({
        name: STATUS_LABELS[status] || status,
        value: statusCount[status]
      }));

      console.log('Pie data:', pieData);
      setStatusData(pieData);

      // Obtener top 5 con menor monto
      const sortedByAmount = [...deudoresArray]
        .sort((a, b) => a.monto_total - b.monto_total)
        .slice(0, 5);
      
      console.log('Top 5:', sortedByAmount);
      setTop5Lowest(sortedByAmount);
    } else {
      console.error('Error en la respuesta:', response.errors);
    }
  } catch (error) {
    console.error('Error cargando datos:', error);
  } finally {
    setLoading(false);
  }
};

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  if (loading) {
    return (
      <div className="dashboard-stats-container">
        <p style={{ color: '#fff', textAlign: 'center' }}>Cargando estadísticas...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-stats-container">
      <div className="stats-grid">
        {/* Top 5 - Lado Izquierdo */}
        <div className="top5-section">
          <h2 className="stats-title">Top 5 - Menor Cantidad Pagada</h2>
          <div className="top5-list">
            {top5Lowest.length > 0 ? (
              top5Lowest.map((deudor, index) => (
                <div key={deudor.id_cuentahabiente} className="top5-item">
                  <div className="rank-badge">{index + 1}</div>
                  <div className="deudor-info">
                    <p className="deudor-name">{deudor.nombre_cuentahabiente}</p>
                    <p className="deudor-colonia">{deudor.nombre_colonia}</p>
                  </div>
                  <div className="deudor-amount">
                    ${deudor.monto_total.toLocaleString('es-MX', { 
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2 
                    })}
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>No hay datos disponibles</p>
            )}
          </div>
        </div>

        {/* Gráfico de Pastel - Lado Derecho */}
        <div className="chart-section">
          <h2 className="stats-title">Distribución por Estatus</h2>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={120}
                  fill="#84a8d8ff"
                  dataKey="value"
                >
                  {statusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(170, 170, 170, 0.38)', 
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend 
                  wrapperStyle={{ color: '#fff' }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center' }}>
              No hay datos disponibles
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

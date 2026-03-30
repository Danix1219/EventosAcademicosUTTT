import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Users, CalendarCheck, Wrench, TrendingUp } from 'lucide-react';
import { clienteApi } from '../api/clienteApi';
import './Gestion.css';

export default function InicioDashboard() {
  const [estadisticas, setEstadisticas] = useState({
    totalEventos: 0,
    totalTalleres: 0,
    totalInscritos: 0,
    talleresPopulares: []
  });

  const [loading, setLoading] = useState(true);

  // Al cargar el componente, llamamos a la API real
  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      const response = await clienteApi.get('/Dashboard/estadisticas');
      setEstadisticas(response.data);
    } catch (error) {
      console.error('Error al cargar métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center" style={{ marginTop: '50px', color: '#6b7280' }}>Cargando métricas en tiempo real...</div>;

  return (
    <div className="gestion-container fade-in-up">
      
      {/* TARJETAS DE MÉTRICAS (KPIs) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
        
        <div className="form-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ backgroundColor: '#dbeafe', padding: '16px', borderRadius: '12px', color: '#2563eb' }}>
            <CalendarCheck size={28} />
          </div>
          <div>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase' }}>Eventos Activos</p>
            <h2 style={{ margin: 0, color: '#111827', fontSize: '32px', fontWeight: '800' }}>{estadisticas.totalEventos}</h2>
          </div>
        </div>

        <div className="form-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ backgroundColor: '#f3e8ff', padding: '16px', borderRadius: '12px', color: '#9333ea' }}>
            <Wrench size={28} />
          </div>
          <div>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase' }}>Talleres Registrados</p>
            <h2 style={{ margin: 0, color: '#111827', fontSize: '32px', fontWeight: '800' }}>{estadisticas.totalTalleres}</h2>
          </div>
        </div>

        <div className="form-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ backgroundColor: '#dcfce7', padding: '16px', borderRadius: '12px', color: '#16a34a' }}>
            <Users size={28} />
          </div>
          <div>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase' }}>Inscripciones Totales</p>
            <h2 style={{ margin: 0, color: '#111827', fontSize: '32px', fontWeight: '800' }}>{estadisticas.totalInscritos}</h2>
          </div>
        </div>

      </div>

      {/* GRÁFICA DE TALLERES MÁS POPULARES */}
      <div className="table-card fade-in-up" style={{ animationDelay: '0.2s' }}>
        <h3 className="section-title">
          <TrendingUp size={22} className="title-icon" />
          Ocupación de Talleres Principales
        </h3>
        
        <div style={{ width: '100%', height: 400, marginTop: '32px' }}>
          <ResponsiveContainer>
            <BarChart data={estadisticas.talleresPopulares} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="nombre" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 13 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 13 }} />
              <Tooltip 
                cursor={{ fill: '#f3f4f6' }} 
                contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="capacidad" name="Capacidad Máxima" fill="#e5e7eb" radius={[6, 6, 0, 0]} />
              <Bar dataKey="inscritos" name="Lugares Ocupados" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
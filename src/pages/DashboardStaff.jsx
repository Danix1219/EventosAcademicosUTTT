import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clienteApi } from '../api/clienteApi';
import { jwtDecode } from 'jwt-decode';
import { Scanner } from '@yudiel/react-qr-scanner';
import { LogOut, CheckCircle2, AlertCircle, ScanLine, UserCheck, History } from 'lucide-react';

export default function DashboardStaff() {
  const navigate = useNavigate();
  
  const [nombreStaff, setNombreStaff] = useState('');
  const [scaneando, setScaneando] = useState(true);
  const [resultado, setResultado] = useState(null); // { type: 'success' | 'error', message: '', alumno: '' }
  const [historial, setHistorial] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const decoded = jwtDecode(token);
      const nombre = decoded.unique_name || decoded.name || decoded.NombreCompleto || 'Staff'; 
      setNombreStaff(nombre.split(' ')[0]); // Solo el primer nombre
    } catch (error) {
      navigate('/login');
    }
  }, [navigate]);

  const handleScan = async (textoQr) => {
    // Si ya estamos procesando un código, ignoramos nuevas lecturas
    if (!scaneando) return;

    setScaneando(false); // Pausamos el escáner

    // Hacemos vibrar el celular (si el navegador lo soporta)
    if (navigator.vibrate) navigator.vibrate(100);

    try {
      // Llamamos a tu API de Asistencias (ajusta el nombre del campo según lo que espere tu DTO)
      const response = await clienteApi.post('/Asistencias', {
        codigoQr: textoQr
      });

      // Vibración de éxito: dos toques rápidos
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

      const mensajeExito = response.data.mensaje || 'Acceso concedido';
      const alumno = response.data.nombreAlumno || 'Estudiante validado'; // Si tu API devuelve el nombre, mejor

      setResultado({ type: 'success', message: mensajeExito, alumno: alumno });
      
      // Agregamos al historial local
      setHistorial(prev => [{ time: new Date(), status: 'success', text: alumno }, ...prev].slice(0, 5));

    } catch (error) {
      // Vibración de error: un toque largo
      if (navigator.vibrate) navigator.vibrate(500);

      const errorMsg = error.response?.data?.mensaje || error.response?.data?.error || "Código inválido o ya registrado.";
      
      setResultado({ type: 'error', message: errorMsg, alumno: 'Acceso Denegado' });
      setHistorial(prev => [{ time: new Date(), status: 'error', text: 'QR Inválido' }, ...prev].slice(0, 5));
    }

    // Auto-reanudamos el escáner después de 2.5 segundos
    setTimeout(() => {
      setResultado(null);
      setScaneando(true);
    }, 2500);
  };

  const cerrarSesion = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRol');
    navigate('/login');
  };

  return (
    <div style={{ backgroundColor: '#020617', minHeight: '100vh', color: 'white', fontFamily: "'Inter', system-ui, sans-serif", display: 'flex', flexDirection: 'column' }}>
      
      {/* HEADER STAFF */}
      <div style={{ backgroundColor: '#0f172a', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ backgroundColor: '#3b82f6', padding: '8px', borderRadius: '10px' }}>
            <ScanLine size={20} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '16px', margin: 0, fontWeight: '800' }}>Control de Acceso</h2>
            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Staff: {nombreStaff}</p>
          </div>
        </div>
        <button onClick={cerrarSesion} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px' }}>
          <LogOut size={22} />
        </button>
      </div>

      {/* ÁREA DE LA CÁMARA */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        
        {/* VISOR DE LA CÁMARA */}
        <div style={{ width: '100%', maxWidth: '400px', aspectRatio: '1/1', borderRadius: '24px', overflow: 'hidden', position: 'relative', border: '2px solid #334155', boxShadow: '0 0 40px rgba(0,0,0,0.5)' }}>
          
          {scaneando ? (
            <>
              <Scanner 
                onResult={(text, result) => handleScan(text)}
                onError={(error) => console.log(error?.message)}
                options={{
                  delayBetweenScanAttempts: 300, // Escanea súper rápido
                }}
                styles={{ container: { width: '100%', height: '100%' }, video: { objectFit: 'cover' } }}
              />
              {/* Marco apuntador */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '70%', height: '70%', border: '2px dashed rgba(255,255,255,0.5)', borderRadius: '16px', pointerEvents: 'none' }}></div>
              <div style={{ position: 'absolute', bottom: '20px', left: '0', right: '0', textAlign: 'center', zIndex: 10 }}>
                <span style={{ backgroundColor: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', backdropFilter: 'blur(4px)' }}>Apuntando al QR...</span>
              </div>
            </>
          ) : (
            // PANTALLA DE RESULTADO (Verde o Roja)
            <div style={{ 
              width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px', textAlign: 'center',
              backgroundColor: resultado?.type === 'success' ? '#166534' : '#991b1b', // Verde o Rojo fuerte
              animation: 'fadeIn 0.2s ease-in'
            }}>
              {resultado?.type === 'success' ? <CheckCircle2 size={80} color="white" /> : <AlertCircle size={80} color="white" />}
              
              <h3 style={{ margin: '15px 0 5px 0', fontSize: '24px', fontWeight: '800' }}>
                {resultado?.type === 'success' ? '¡ACCESO OK!' : 'DENEGADO'}
              </h3>
              <p style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '600' }}>{resultado?.alumno}</p>
              <p style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>{resultado?.message}</p>
              
              <div style={{ marginTop: '30px' }}>
                <Loader2 className="spinner" size={24} style={{ opacity: 0.5 }} />
              </div>
            </div>
          )}
        </div>
        
        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '14px', marginTop: '20px' }}>
          La cámara se reactiva automáticamente.
        </p>

      </div>

      {/* HISTORIAL RECIENTE (Opcional, muy útil para el staff) */}
      <div style={{ backgroundColor: '#0f172a', borderTop: '1px solid #1e293b', padding: '20px', height: '200px', overflowY: 'auto' }}>
        <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          <History size={16} /> Últimos Registros
        </h4>
        
        {historial.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#475569', textAlign: 'center', marginTop: '30px' }}>No hay escaneos recientes en esta sesión.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {historial.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', padding: '12px 15px', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.status === 'success' ? '#10b981' : '#ef4444' }}></div>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: item.status === 'success' ? '#f8fafc' : '#fca5a5' }}>{item.text}</span>
                </div>
                <span style={{ fontSize: '12px', color: '#64748b' }}>{item.time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Estilo para la animación de carga */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

    </div>
  );
}
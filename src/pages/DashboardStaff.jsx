import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { clienteApi } from '../api/clienteApi';
import { jwtDecode } from 'jwt-decode';
import { Scanner } from '@yudiel/react-qr-scanner';
import { LogOut, CheckCircle2, AlertCircle, ScanLine, History, Loader2 } from 'lucide-react';

export default function DashboardStaff() {
  const navigate = useNavigate();
  
  const [nombreStaff, setNombreStaff] = useState('');
  const [staffId, setStaffId] = useState('');
  const [scaneando, setScaneando] = useState(true);
  const [resultado, setResultado] = useState(null); 
  const [historial, setHistorial] = useState([]);
  
  const timerRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const decoded = jwtDecode(token);
      const nombre = decoded.unique_name || decoded.name || decoded.NombreCompleto || 'Staff'; 
      const id = decoded.nameid || decoded.sub || decoded.Id || decoded.nameidentifier; 
      
      setNombreStaff(nombre.split(' ')[0]); 
      setStaffId(id); 
    } catch (error) {
      navigate('/login');
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [navigate]);

  const handleScan = async (textoQr) => {
    const qrLimpio = textoQr?.trim();
    if (!scaneando || !qrLimpio) return;

    setScaneando(false); // Pausamos el escáner (pero no lo desmontamos)
    if (navigator.vibrate) navigator.vibrate(100);

    try {
      const response = await clienteApi.post('/Asistencias', {
        codigoQR: qrLimpio,
        staffId: staffId 
      });

      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

      const mensajeExito = response.data.mensaje || 'Acceso concedido';
      const alumno = response.data.nombreAlumno || 'Estudiante validado'; 

      setResultado({ type: 'success', message: mensajeExito, alumno: alumno });
      setHistorial(prev => [{ time: new Date(), status: 'success', text: alumno }, ...prev].slice(0, 5));

    } catch (error) {
      if (navigator.vibrate) navigator.vibrate(500);

      // Aquí atrapará mágicamente el error "Este boleto ya fue escaneado" del backend
      const errorMsg = error.response?.data?.mensaje || error.response?.data?.error || "Código inválido o error de conexión.";
      
      setResultado({ type: 'error', message: errorMsg, alumno: 'Acceso Denegado' });
      setHistorial(prev => [{ time: new Date(), status: 'error', text: 'QR Inválido o Duplicado' }, ...prev].slice(0, 5));
    }

    // Auto-reanudamos el escáner
    timerRef.current = setTimeout(() => {
      setResultado(null);
      setScaneando(true);
    }, 2500);
  };

  const cerrarSesion = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
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
        
        {/* CONTENEDOR DEL VISOR (Siempre Vivo) */}
        <div style={{ width: '100%', maxWidth: '400px', aspectRatio: '1/1', borderRadius: '24px', overflow: 'hidden', position: 'relative', border: '2px solid #334155', boxShadow: '0 0 40px rgba(0,0,0,0.5)', backgroundColor: '#000' }}>
          
          {/* 1. LA CÁMARA: Ahora siempre está montada para no perder permisos, solo se pausa */}
          <Scanner 
            onScan={(detectedCodes) => {
              if (detectedCodes && detectedCodes.length > 0) {
                handleScan(detectedCodes[0].rawValue);
              }
            }}
            onError={(error) => console.log("Scanner Error:", error?.message)}
            paused={!scaneando} // Mantiene el stream vivo, pero ignora los códigos
            scanDelay={300}
            styles={{ container: { width: '100%', height: '100%' }, video: { objectFit: 'cover' } }}
          />

          {/* 2. GUIAS VISUALES: Solo se muestran cuando está activo */}
          {scaneando && (
            <>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '70%', height: '70%', border: '2px dashed rgba(255,255,255,0.5)', borderRadius: '16px', pointerEvents: 'none' }}></div>
              <div style={{ position: 'absolute', bottom: '20px', left: '0', right: '0', textAlign: 'center', zIndex: 10 }}>
                <span style={{ backgroundColor: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', backdropFilter: 'blur(4px)' }}>Apuntando al QR...</span>
              </div>
            </>
          )}

          {/* 3. CAPA DE RESULTADO: Aparece por encima de la cámara */}
          {!scaneando && resultado && (
            <div style={{ 
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50,
              display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px', textAlign: 'center',
              backgroundColor: resultado.type === 'success' ? 'rgba(22, 101, 52, 0.95)' : 'rgba(153, 27, 27, 0.95)', // Colores semi-transparentes
              backdropFilter: 'blur(8px)',
              animation: 'fadeIn 0.15s ease-out'
            }}>
              {resultado.type === 'success' ? <CheckCircle2 size={80} color="white" /> : <AlertCircle size={80} color="white" />}
              
              <h3 style={{ margin: '15px 0 5px 0', fontSize: '24px', fontWeight: '800' }}>
                {resultado.type === 'success' ? '¡ACCESO OK!' : 'DENEGADO'}
              </h3>
              <p style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '600' }}>{resultado.alumno}</p>
              <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>{resultado.message}</p>
              
              <div style={{ marginTop: '30px' }}>
                <Loader2 className="spinner" size={24} style={{ opacity: 0.5 }} />
              </div>
            </div>
          )}
        </div>
        
        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '14px', marginTop: '20px' }}>
          La cámara se mantiene activa en segundo plano.
        </p>

      </div>

      {/* HISTORIAL RECIENTE */}
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
        @keyframes fadeIn { from { opacity: 0; transform: scale(1.05); } to { opacity: 1; transform: scale(1); } }
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

    </div>
  );
}
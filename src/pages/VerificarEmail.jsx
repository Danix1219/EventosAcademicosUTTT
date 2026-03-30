import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { clienteApi } from '../api/clienteApi';
import { CheckCircle2, XCircle, Loader2, ArrowLeft, Mail, Send } from 'lucide-react';
import './Login.css'; 

export default function VerificarEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [status, setStatus] = useState('loading'); 
  const [mensaje, setMensaje] = useState('');

  const [correo, setCorreo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [reenvioMsg, setReenvioMsg] = useState({ tipo: '', texto: '' }); 

  // 👇 NUEVO: Referencia para evitar que React llame a la API dos veces 👇
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMensaje('Enlace de verificación inválido o ausente.');
      return;
    }

    // 👇 Si ya se hizo la petición, no la vuelvas a hacer 👇
    if (hasFetched.current) return;
    hasFetched.current = true;

    const verificarCuenta = async () => {
      try {
        const response = await clienteApi.get(`/Usuarios/verificar-email?token=${token}`);
        setStatus('success');
        setMensaje(response.data.mensaje || '¡Tu cuenta ha sido verificada exitosamente!');
      } catch (err) {
        setStatus('error');
        setMensaje(err.response?.data?.mensaje || 'El enlace de verificación ha expirado o es inválido.');
      }
    };

    verificarCuenta();
  }, [token]);

  const handleReenviar = async (e) => {
    e.preventDefault();
    if (!correo) {
      setReenvioMsg({ tipo: 'error', texto: 'Por favor, ingresa tu correo institucional.' });
      return;
    }

    setEnviando(true);
    setReenvioMsg({ tipo: '', texto: '' });

    try {
      const response = await clienteApi.post('/Auth/reenviar-verificacion', { correo });
      setReenvioMsg({ tipo: 'success', texto: response.data.mensaje || 'Se ha enviado un nuevo enlace. Revisa tu bandeja.' });
      setCorreo(''); 
    } catch (err) {
      setReenvioMsg({ tipo: 'error', texto: err.response?.data?.mensaje || 'Error al reenviar el correo. Intenta de nuevo.' });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="split-layout-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="left-overlay"></div>
      
      <div className="login-card fade-in-up" style={{ textAlign: 'center', padding: '40px', maxWidth: '450px' }}>
        
        {/* ================= ESTADO: CARGANDO ================= */}
        {status === 'loading' && (
          <>
            <Loader2 className="spinner" size={48} style={{ color: '#2563eb', margin: '0 auto 20px' }} />
            <h2 className="login-logo">Verificando <span>Cuenta...</span></h2>
            <p style={{ color: '#64748b', marginTop: '10px' }}>Por favor espera un momento.</p>
          </>
        )}

        {/* ================= ESTADO: ÉXITO ================= */}
        {status === 'success' && (
          <>
            <CheckCircle2 size={56} style={{ color: '#16a34a', margin: '0 auto 20px' }} />
            <h2 className="login-logo">¡Cuenta <span>Verificada!</span></h2>
            <p style={{ color: '#64748b', marginTop: '10px', marginBottom: '30px' }}>{mensaje}</p>
            <button onClick={() => navigate('/login')} className="login-btn" style={{ width: '100%' }}>
              Ir a Iniciar Sesión
            </button>
          </>
        )}

        {/* ================= ESTADO: ERROR (Y REENVÍO) ================= */}
        {status === 'error' && (
          <>
            <XCircle size={56} style={{ color: '#dc2626', margin: '0 auto 15px' }} />
            <h2 className="login-logo">Error de <span>Verificación</span></h2>
            <p style={{ color: '#64748b', marginTop: '10px', marginBottom: '25px' }}>{mensaje}</p>

            {/* Caja para solicitar un nuevo enlace */}
            <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '16px', marginBottom: '25px', border: '1px solid #e2e8f0', textAlign: 'left' }}>
              <p style={{ fontSize: '13px', color: '#334155', marginBottom: '12px', fontWeight: '700', textAlign: 'center' }}>
                ¿Tu enlace expiró? Solicita uno nuevo:
              </p>
              
              <form onSubmit={handleReenviar} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="input-wrapper">
                  <Mail className="input-icon" size={18} />
                  <input
                    type="email"
                    placeholder="Tu correo institucional"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    required
                    disabled={enviando}
                    style={{ padding: '12px 12px 12px 42px', fontSize: '14px', width: '100%' }}
                  />
                </div>
                
                <button type="submit" className="login-btn" disabled={enviando} style={{ padding: '12px', fontSize: '14px', width: '100%' }}>
                  {enviando ? (
                    <><Loader2 className="spinner" size={16} /> Enviando...</>
                  ) : (
                    <><Send size={16} style={{marginRight: '8px'}}/> Enviar nuevo enlace</>
                  )}
                </button>
              </form>

              {/* Mensajes de éxito o error al reenviar */}
              {reenvioMsg.texto && (
                <div className={reenvioMsg.tipo === 'success' ? 'success-message' : 'error-message'} style={{ marginTop: '15px', fontSize: '12px', padding: '12px' }}>
                  {reenvioMsg.tipo === 'success' ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
                  <span>{reenvioMsg.texto}</span>
                </div>
              )}
            </div>

            <button onClick={() => navigate('/login')} className="toggle-mode-btn" style={{ fontSize: '14px' }}>
              <ArrowLeft size={16} style={{ marginRight: '5px', verticalAlign: 'middle' }} /> 
              Volver al inicio
            </button>
          </>
        )}
      </div>
    </div>
  );
}
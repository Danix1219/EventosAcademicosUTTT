import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { clienteApi } from '../api/clienteApi';
import { Lock, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import './Login.css';

export default function RestablecerPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError('Enlace inválido o ausente. Solicita uno nuevo.');
      return;
    }
    if (nuevaPassword !== confirmarPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (nuevaPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await clienteApi.post('/Auth/restablecer-password', {
        token: token,
        nuevaPassword: nuevaPassword
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'El enlace ha expirado o es inválido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="split-layout-container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div className="left-overlay"></div>
      
      <div className="login-card fade-in-up" style={{ maxWidth: '450px', padding: '40px' }}>
        <div className="login-header" style={{ marginBottom: '30px' }}>
          <h2 className="login-logo">Nueva <span>Contraseña</span></h2>
          <p className="login-subtitle" style={{ marginTop: '10px', color: '#64748b' }}>
            Ingresa tu nueva credencial de acceso para recuperar tu cuenta.
          </p>
        </div>

        {error && (
          <div className="error-message" style={{ marginBottom: '20px' }}>
            <AlertCircle size={18} /><span>{error}</span>
          </div>
        )}

        {success ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div className="success-message" style={{ justifyContent: 'center', padding: '15px', marginBottom: '25px' }}>
              <CheckCircle2 size={20} /><span>¡Contraseña actualizada con éxito!</span>
            </div>
            <button onClick={() => navigate('/login')} className="login-btn" style={{ width: '100%' }}>
              Ir a Iniciar Sesión
            </button>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="input-group">
              <label htmlFor="nuevaPassword" style={{ marginBottom: '8px', display: 'block', fontWeight: '600' }}>
                Nueva Contraseña
              </label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={20} />
                <input 
                  type="password" 
                  id="nuevaPassword" 
                  placeholder="Mínimo 6 caracteres" 
                  value={nuevaPassword} 
                  onChange={(e) => setNuevaPassword(e.target.value)} 
                  required 
                  disabled={loading} 
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="confirmarPassword" style={{ marginBottom: '8px', display: 'block', fontWeight: '600' }}>
                Confirmar Contraseña
              </label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={20} />
                <input 
                  type="password" 
                  id="confirmarPassword" 
                  placeholder="Repite tu contraseña" 
                  value={confirmarPassword} 
                  onChange={(e) => setConfirmarPassword(e.target.value)} 
                  required 
                  disabled={loading} 
                />
              </div>
            </div>

            <div style={{ marginTop: '10px' }}>
              <button type="submit" className="login-btn" disabled={loading} style={{ width: '100%', padding: '14px' }}>
                {loading ? (
                  <><Loader2 className="spinner" size={18} /> Guardando...</>
                ) : (
                  'Actualizar Contraseña'
                )}
              </button>
              
              <button 
                type="button" 
                onClick={() => navigate('/login')} 
                className="toggle-mode-btn" 
                style={{ width: '100%', marginTop: '15px', justifyContent: 'center' }}
              >
                <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Volver al Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
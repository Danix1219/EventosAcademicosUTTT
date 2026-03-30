import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clienteApi } from '../api/clienteApi';
import ReCAPTCHA from 'react-google-recaptcha';

// Iconos de Lucide
import { Mail, ArrowRight, Loader2, AlertCircle, User, Hash, Briefcase, CheckCircle2, Lock } from 'lucide-react';

// Assets
import logoCardenal from '../assets/Cardenal_Logo.png';
import utSoyLogo from '../assets/delautsoy2.png';
import mascotaCardenal from '../assets/cardi2.png'; 

import './Login.css';

export default function Login() {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaToken, setCaptchaToken] = useState(null); 
  
  // Manejo de vistas
  const [viewMode, setViewMode] = useState('login'); // 'login' | 'register' | 'forgot'
  
  // ESTADOS PARA REENVÍO DE CORREO
  const [mostrarReenviar, setMostrarReenviar] = useState(false);
  const [enviandoCorreo, setEnviandoCorreo] = useState(false);

  const [matricula, setMatricula] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [rol, setRol] = useState(''); 
  const [successMsg, setSuccessMsg] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones extra manuales antes de enviar al servidor
    if (viewMode === 'register') {
      if (matricula.length !== 7 || isNaN(matricula)) {
        setError('La matrícula debe contener exactamente 7 números.');
        return;
      }
      if (nombreCompleto.trim().length < 3) {
        setError('Por favor, ingresa un nombre válido.');
        return;
      }
    }

    if (!captchaToken && viewMode !== 'forgot') {
      setError('Por favor, verifica que no eres un robot.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');
    setMostrarReenviar(false);

    try {
      if (viewMode === 'register') {
        await clienteApi.post('/Usuarios/registro', {
          matricula,
          nombreCompleto: nombreCompleto.trim(), // Limpiamos espacios extra
          correoInstitucional: correo.trim(),
          rol,
          password
        });

        setSuccessMsg('Cuenta creada. Revisa tu correo electrónico para verificarla.');
        
        setMatricula('');
        setNombreCompleto('');
        setRol('');
        setPassword('');
        setCaptchaToken(null);
        setViewMode('login'); 
        
      } else if (viewMode === 'login') {
        const response = await clienteApi.post('/Auth/login', { correo: correo.trim(), password });
        const { token, rol: userRol } = response.data;

        localStorage.setItem('userToken', token);
        localStorage.setItem('userRol', userRol);
        
        if (userRol === 'Estudiante') {
          navigate('/dashboard-estudiante');
        } else if (userRol === 'Staff') {
          navigate('/dashboard-staff'); 
        } else {
          navigate('/dashboard'); 
        }

      } else if (viewMode === 'forgot') {
        await clienteApi.post('/Auth/solicitar-recuperacion', { correo: correo.trim() });
        
        setSuccessMsg('Si el correo está registrado, te enviamos un enlace de recuperación. Revisa tu bandeja de entrada.');
        setPassword(''); 
        setViewMode('login'); 
      }

    } catch (err) {
      const mensajeError = err.response?.data?.mensaje || err.response?.data?.error || 'Ocurrió un error al procesar tu solicitud. Intenta nuevamente.';
      setError(mensajeError);

      if (mensajeError.toLowerCase().includes('verificar tu correo')) {
        setMostrarReenviar(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReenviarVerificacion = async () => {
    if (!correo) {
      setError("Por favor, ingresa tu correo institucional arriba.");
      return;
    }
    
    setEnviandoCorreo(true);
    setError('');
    
    try {
      const response = await clienteApi.post('/Auth/reenviar-verificacion', { correo: correo.trim() });
      setSuccessMsg(response.data.mensaje || 'Enlace reenviado exitosamente.');
      setMostrarReenviar(false); 
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al reenviar el correo. Intenta de nuevo.');
    } finally {
      setEnviandoCorreo(false);
    }
  };

  const onCaptchaChange = (token) => {
    setCaptchaToken(token);
    if (error === 'Por favor, verifica que no eres un robot.') setError('');
  };

  const changeMode = (mode) => {
    setViewMode(mode);
    setError('');
    setSuccessMsg('');
    setCaptchaToken(null);
    setPassword(''); 
    setMostrarReenviar(false);
  };

  const renderTitle = () => {
    if (viewMode === 'login') return <>Acceso <span>Administrativo</span></>;
    if (viewMode === 'register') return <>Crear <span>Cuenta</span></>;
    if (viewMode === 'forgot') return <>Recuperar <span>Contraseña</span></>;
  };

  // Función auxiliar para forzar solo números en la matrícula
  const handleMatriculaChange = (e) => {
    const valor = e.target.value;
    // Solo actualiza si es vacío o si son solo números
    if (valor === '' || /^[0-9\b]+$/.test(valor)) {
      setMatricula(valor);
    }
  };

  return (
    <div className="split-layout-container">
      
      <div className="split-left">
        <div className="left-overlay"></div>
        <div className="left-content fade-in-left">
          <h1 className="welcome-title">Bienvenido a<br/><span>Eventos Académicos</span></h1>
          <p className="welcome-description">
            Gestiona, organiza y lleva el control de todos los talleres, conferencias y actividades de la Universidad Tecnológica de Tula - Tepeji en un solo lugar.
          </p>
          <img src={utSoyLogo} alt="De la UT Soy" className="ut-soy-logo" />
        </div>
      </div>

      <div className="split-right">
        <div className="login-wrapper">
          
          <div className="login-card fade-in-up">
            <div className="login-header">
              <img src={logoCardenal} alt="Cardenales UTTT" className="brand-logo" />
              <h2 className="login-logo">{renderTitle()}</h2>
              {viewMode === 'forgot' && (
                <p style={{fontSize: '12px', color: '#64748b', marginTop: '8px', textAlign: 'center'}}>
                  Ingresa tu correo institucional y te enviaremos las instrucciones.
                </p>
              )}
            </div>

            {error && (
              <div className="error-message" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={18} /><span>{error}</span>
                </div>
                {mostrarReenviar && (
                  <button 
                    type="button" 
                    onClick={handleReenviarVerificacion} 
                    disabled={enviandoCorreo}
                    style={{
                      marginTop: '8px', padding: '6px 12px', backgroundColor: '#fee2e2', 
                      color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: '6px', 
                      fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
                    }}>
                    {enviandoCorreo ? <Loader2 className="spinner" size={14} /> : <Mail size={14} />}
                    {enviandoCorreo ? 'Enviando...' : 'Reenviar enlace de verificación'}
                  </button>
                )}
              </div>
            )}
            
            {successMsg && (
              <div className="success-message">
                <CheckCircle2 size={18} /><span>{successMsg}</span>
              </div>
            )}

            <form className="login-form" onSubmit={handleSubmit}>
              
              {viewMode === 'register' && (
                <>
                  <div className="input-group slide-down">
                    <label htmlFor="matricula">Matrícula</label>
                    <div className="input-wrapper">
                      <Hash className="input-icon" size={20} />
                      <input 
                        type="text" 
                        id="matricula" 
                        placeholder="Ej. 2130000" 
                        value={matricula} 
                        onChange={handleMatriculaChange} 
                        required 
                        disabled={loading}
                        maxLength={7}
                        minLength={7}
                        pattern="[0-9]{7}"
                        title="La matrícula debe ser exactamente de 7 números"
                      />
                      {/* 👇 CONTADOR DE MATRÍCULA 👇 */}
                      <span className="char-counter">{matricula.length}/7</span>
                    </div>
                  </div>

                  <div className="input-group slide-down">
                    <label htmlFor="nombreCompleto">Nombre Completo</label>
                    <div className="input-wrapper">
                      <User className="input-icon" size={20} />
                      <input 
                        type="text" 
                        id="nombreCompleto" 
                        placeholder="Juan Pérez" 
                        value={nombreCompleto} 
                        onChange={(e) => setNombreCompleto(e.target.value)} 
                        required 
                        disabled={loading}
                        maxLength={50}
                      />
                      {/* 👇 CONTADOR DE NOMBRE 👇 */}
                      <span className="char-counter">{nombreCompleto.length}/50</span>
                    </div>
                  </div>
                </>
              )}

              <div className="input-group">
                <label htmlFor="correo">Correo Institucional</label>
                <div className="input-wrapper">
                  <Mail className="input-icon" size={20} />
                  <input 
                    type="email" 
                    id="correo" 
                    placeholder="admin@uttt.edu.mx" 
                    value={correo} 
                    onChange={(e) => setCorreo(e.target.value)} 
                    required 
                    disabled={loading} 
                    autoComplete="email"
                    maxLength={50}
                  />
                  {/* 👇 CONTADOR DE CORREO 👇 */}
                  <span className="char-counter">{correo.length}/50</span>
                </div>
              </div>

              {viewMode === 'register' && (
                <div className="input-group slide-down">
                  <label htmlFor="rol">Rol del Usuario</label>
                  <div className="input-wrapper">
                    <Briefcase className="input-icon" size={20} />
                    <select id="rol" value={rol} onChange={(e) => setRol(e.target.value)} required disabled={loading} className={`select-input ${rol === '' ? 'placeholder-color' : ''}`}>
                      <option value="" disabled>Seleccione un rol...</option>
                      <option value="Estudiante">Estudiante</option>
                      <option value="Staff">Staff</option>
                      <option value="Administrador">Administrador</option>
                    </select>
                  </div>
                </div>
              )}

              {viewMode !== 'forgot' && (
                <div className="input-group slide-down">
                  <label htmlFor="password">Contraseña</label>
                  <div className="input-wrapper">
                    <Lock className="input-icon" size={20} />
                    <input 
                      type="password" 
                      id="password" 
                      placeholder="••••••••" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                      disabled={loading} 
                      autoComplete={viewMode === 'login' ? 'current-password' : 'new-password'}
                      maxLength={20}
                    />
                    {/* 👇 CONTADOR DE CONTRASEÑA 👇 */}
                    <span className="char-counter">{password.length}/20</span>
                  </div>
                </div>
              )}

              {viewMode === 'login' && (
                <div className="forgot-password-container">
                  <button type="button" onClick={() => changeMode('forgot')} className="forgot-password-btn" disabled={loading}>
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              )}

              {viewMode !== 'forgot' && (
                <div className="recaptcha-container">
                  <ReCAPTCHA sitekey="6Lf9sp0sAAAAAD0slJXGNxAjM78U9u7x2WRow0Tf" onChange={onCaptchaChange} theme="light" />
                </div>
              )}

              <button type="submit" className="login-btn" disabled={loading || (!captchaToken && viewMode !== 'forgot') || enviandoCorreo}>
                {loading ? (
                  <>
                    <Loader2 className="spinner" size={18} /> 
                    {viewMode === 'register' ? 'Registrando...' : viewMode === 'forgot' ? 'Enviando...' : 'Autenticando...'}
                  </>
                ) : (
                  <>
                    {viewMode === 'register' ? 'Registrarse' : viewMode === 'forgot' ? 'Enviar Enlace' : 'Iniciar Sesión'} 
                    <ArrowRight size={18} className="btn-icon" />
                  </>
                )}
              </button>

              <div className="toggle-mode-container">
                <p>
                  {viewMode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes una cuenta?'}
                  <button type="button" onClick={() => changeMode(viewMode === 'login' ? 'register' : 'login')} className="toggle-mode-btn" disabled={loading || enviandoCorreo}>
                    {viewMode === 'login' ? ' Regístrate aquí' : ' Inicia Sesión aquí'}
                  </button>
                </p>
              </div>

            </form>
          </div>

          <div className="mascota-container mascot-entrance">
            <img src={mascotaCardenal} alt="Mascota Cardenal" className="mascota-img" />
          </div>

        </div>
      </div>
    </div>
  );
}
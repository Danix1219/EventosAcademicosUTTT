import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clienteApi } from '../api/clienteApi';
import { jwtDecode } from 'jwt-decode';
import { CalendarDays, QrCode, Award, LogOut, Loader2, Clock, CheckCircle2, FileText, AlertCircle, Users, MapPin, Download } from 'lucide-react';
import './DashboardEstudiante.css';

export default function DashboardEstudiante() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('agenda');
  const [loading, setLoading] = useState(false);
  
  // Datos del Usuario
  const [usuarioId, setUsuarioId] = useState('');
  const [nombreAlumno, setNombreAlumno] = useState('');
  
  // Datos de la API
  const [eventos, setEventos] = useState([]);
  const [talleres, setTalleres] = useState([]); 
  const [eventoSeleccionado, setEventoSeleccionado] = useState('');
  const [misInscripciones, setMisInscripciones] = useState([]);

  // Estado del Modal Corregido (Solo usamos strings/booleanos, no componentes React)
  const [modal, setModal] = useState({ 
    show: false, title: '', message: '', type: 'info', 
    showDownload: false, downloadUrl: '' 
  });

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      navigate('/login');
      return;
    }
    
    try {
      const decoded = jwtDecode(token);
      const id = decoded.nameid || decoded.sub || decoded.Id || decoded.nameidentifier;
      const nombre = decoded.unique_name || decoded.name || decoded.NombreCompleto || 'Estudiante'; 
      
      setUsuarioId(id);
      setNombreAlumno(nombre);
      
      cargarDatosIniciales(id);
    } catch (error) {
      cerrarSesion();
    }
  }, []);

  const cargarDatosIniciales = async (id) => {
    setLoading(true);
    try {
      const resInscripciones = await clienteApi.get(`/Inscripciones/mis-inscripciones/${id}`);
      setMisInscripciones(Array.isArray(resInscripciones.data) ? resInscripciones.data : []);

      const resEventos = await clienteApi.get('/Eventos');
      const eventosActivos = Array.isArray(resEventos.data) ? resEventos.data : [];
      setEventos(eventosActivos);

      if (eventosActivos.length > 0) {
        setEventoSeleccionado(eventosActivos[0].id);
        await cargarTalleresPorEvento(eventosActivos[0].id);
      }
    } catch (error) {
      setMisInscripciones([]);
    } finally {
      setLoading(false);
    }
  };

  const cargarTalleresPorEvento = async (eventoId) => {
    setLoading(true);
    try {
      const response = await clienteApi.get(`/Talleres/evento/${eventoId}`);
      setTalleres(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setTalleres([]); 
    } finally {
      setLoading(false);
    }
  };

  const handleEventoChange = async (e) => {
    const evId = e.target.value;
    setEventoSeleccionado(evId);
    await cargarTalleresPorEvento(evId);
  };

  const handleInscribirse = async (taller) => {
    setLoading(true);
    try {
      await clienteApi.post('/Inscripciones', { usuarioId, tallerId: taller.id });
      setModal({ show: true, title: '¡Inscripción Exitosa!', message: `Tienes un lugar asegurado para: ${taller.titulo}.`, type: 'success' });
      await cargarDatosIniciales(usuarioId);
    } catch (error) {
      const errorMsg = error.response?.data?.error || "No se pudo realizar la inscripción.";
      setModal({ show: true, title: 'Error de Inscripción', message: errorMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDescargarConstancia = async (eventoNombre) => {
    const eventoReferencia = eventos.find(e => e.nombre === eventoNombre);
    const idEvento = eventoReferencia ? eventoReferencia.id : 0;

    if(idEvento === 0) return;

    setModal({ show: true, title: 'Procesando...', message: 'Generando tu documento, por favor espera...', type: 'loading' });
    
    try {
      const response = await clienteApi.post('/Constancias', {
        usuarioId, eventoId: idEvento, nombreAlumno, nombreEvento: eventoNombre
      });

      const urlPDF = response.data.urlDescarga || response.data.UrlDescarga;

      setModal({
        show: true, title: '¡Constancia Lista!', message: response.data.mensaje, type: 'success',
        showDownload: true, downloadUrl: urlPDF
      });
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Asegúrate de tener tu asistencia registrada en los talleres.";
      setModal({ show: true, title: 'No se pudo generar', message: errorMsg, type: 'error' });
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRol');
    navigate('/login');
  };

  const estaInscrito = (tallerId) => misInscripciones.some(ins => ins.tallerId === tallerId);
  
  const formatearFecha = (fechaISO) => {
    if(!fechaISO) return 'Por definir';
    try {
      return new Date(fechaISO).toLocaleDateString('es-MX', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return 'Fecha no disponible'; }
  };

  const eventosInscritosUnicos = [...new Set(misInscripciones.map(ins => ins.nombreEvento))];

  return (
    <div className="dashboard-layout">
      
      {/* ================= MODAL MEJORADO Y SEGURO ================= */}
      {modal.show && (
        <div className="modal-overlay">
          <div className="modal-content">
            {modal.type === 'success' && <CheckCircle2 size={60} color="#10b981" style={{ margin: '0 auto 15px' }} />}
            {modal.type === 'error' && <AlertCircle size={60} color="#ef4444" style={{ margin: '0 auto 15px' }} />}
            {modal.type === 'loading' && <Loader2 className="spinner" size={60} color="#3b82f6" style={{ margin: '0 auto 15px' }} />}
            
            <h3 style={{ margin: '0 0 10px 0', color: '#0f172a', fontSize: '22px' }}>{modal.title}</h3>
            <p style={{ color: '#475569', fontSize: '15px', lineHeight: '1.5', marginBottom: '25px' }}>{modal.message}</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {modal.showDownload && (
                <button 
                  onClick={() => { window.open(modal.downloadUrl, '_blank'); setModal({ show: false }); }}
                  style={{ padding: '14px', borderRadius: '12px', background: '#2563eb', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                >
                  <Download size={18}/> Descargar PDF Ahora
                </button>
              )}
              {modal.type !== 'loading' && (
                <button 
                  onClick={() => setModal({ show: false })}
                  style={{ padding: '14px', borderRadius: '12px', background: modal.showDownload ? '#f1f5f9' : '#2563eb', color: modal.showDownload ? '#475569' : 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                >
                  {modal.showDownload ? 'Cerrar' : 'Entendido'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= SIDEBAR (ESCRITORIO) ================= */}
      <aside className="desktop-sidebar">
        <div className="sidebar-header">
          <h2 style={{ fontSize: '22px', margin: 0, fontWeight: '800' }}>Eventos <span style={{ color: '#10b981' }}>UTTT</span></h2>
          <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>{nombreAlumno}</p>
        </div>
        <div className="nav-menu">
          <button className={`nav-item ${activeTab === 'agenda' ? 'active' : ''}`} onClick={() => setActiveTab('agenda')}>
            <CalendarDays size={20}/> Agenda de Talleres
          </button>
          <button className={`nav-item ${activeTab === 'qr' ? 'active' : ''}`} onClick={() => setActiveTab('qr')}>
            <QrCode size={20}/> Mis Accesos QR
          </button>
          <button className={`nav-item ${activeTab === 'constancias' ? 'active' : ''}`} onClick={() => setActiveTab('constancias')}>
            <Award size={20}/> Constancias
          </button>
        </div>
        <div style={{ padding: '20px' }}>
          <button onClick={cerrarSesion} style={{ width: '100%', padding: '12px', background: '#1e293b', color: '#cbd5e1', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}>
            <LogOut size={18}/> Salir
          </button>
        </div>
      </aside>

      {/* ================= HEADER (MÓVIL) ================= */}
      <header className="mobile-header">
        <h2 style={{ fontSize: '18px', margin: 0, fontWeight: '800' }}>Eventos <span style={{ color: '#10b981' }}>UTTT</span></h2>
        <button onClick={cerrarSesion} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}><LogOut size={22} /></button>
      </header>

      {/* ================= CONTENIDO PRINCIPAL ================= */}
      <main className="main-content">
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          
          {loading && talleres.length === 0 && misInscripciones.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '100px', color: '#64748b' }}>
              <Loader2 className="spinner" size={48} color="#2563eb" style={{ marginBottom: '20px' }} />
              <p style={{ fontWeight: '500' }}>Sincronizando información...</p>
            </div>
          ) : (
            <>
              {/* VISTA 1: AGENDA */}
              {activeTab === 'agenda' && (
                <div className="fade-in-up">
                  
                  {/* TOOLBAR ELEGANTE PARA FILTROS */}
                  <div className="page-toolbar">
                    <div>
                      <h1 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: '26px', fontWeight: '800' }}>Explorar Talleres</h1>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '15px' }}>Inscríbete para asegurar tu lugar.</p>
                    </div>
                    <div style={{ minWidth: '250px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>Temporada Activa</label>
                      <select 
                        value={eventoSeleccionado || ''} 
                        onChange={handleEventoChange}
                        style={{ width: '100%', padding: '12px 15px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '15px', fontWeight: '600', cursor: 'pointer', outline: 'none' }}
                      >
                        {eventos.length === 0 ? <option>Sin eventos</option> : eventos.map(ev => (
                          <option key={ev.id} value={ev.id}>{ev.nombre}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {talleres.length === 0 ? (
                      <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px', backgroundColor: 'white', borderRadius: '20px', border: '1px dashed #cbd5e1' }}>
                        <CalendarDays size={48} color="#94a3b8" style={{ margin: '0 auto 15px' }} />
                        <p style={{ fontSize: '16px', color: '#475569', fontWeight: '500' }}>No hay talleres en este evento.</p>
                      </div>
                    ) : (
                      talleres.map(t => {
                        const yaInscrito = estaInscrito(t.id);
                        const sinCupo = t.lugaresDisponibles <= 0;
                        
                        return (
                          <div key={t.id} style={{ backgroundColor: 'white', padding: '25px', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                              <h4 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: '800', lineHeight: '1.3' }}>{t.titulo}</h4>
                              {yaInscrito && <span style={{ backgroundColor: '#10b981', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', height: 'fit-content' }}>Inscrito</span>}
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: '#475569', marginBottom: '25px', flex: 1 }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={18} color="#3b82f6"/> {formatearFecha(t.horarioInicio)}</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: sinCupo && !yaInscrito ? '#ef4444' : '#475569', fontWeight: '500' }}>
                                <Users size={18} color={sinCupo && !yaInscrito ? "#ef4444" : "#16a34a"}/> 
                                {sinCupo ? 'Lugares Agotados' : `${t.lugaresDisponibles} de ${t.capacidadMaxima} libres`}
                              </span>
                            </div>

                            {!yaInscrito ? (
                              <button 
                                onClick={() => handleInscribirse(t)}
                                disabled={loading || sinCupo}
                                style={{ width: '100%', padding: '14px', borderRadius: '10px', fontWeight: '700', border: 'none', backgroundColor: sinCupo ? '#f1f5f9' : '#2563eb', color: sinCupo ? '#94a3b8' : 'white', cursor: sinCupo ? 'not-allowed' : 'pointer' }}
                              >
                                {sinCupo ? 'Agotado' : 'Inscribirme Ahora'}
                              </button>
                            ) : (
                              <div style={{ padding: '14px', backgroundColor: '#f0fdf4', color: '#166534', borderRadius: '10px', fontWeight: '700', textAlign: 'center', border: '1px solid #bbf7d0' }}>
                                Lugar Asegurado
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* VISTA 2: CÓDIGOS QR (CON IMAGEN NATIVA) */}
              {activeTab === 'qr' && (
                <div className="fade-in-up">
                  <div className="page-toolbar">
                    <h1 style={{ margin: 0, color: '#0f172a', fontSize: '26px', fontWeight: '800' }}>Boletos Digitales</h1>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
                    {misInscripciones.length === 0 ? (
                      <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', backgroundColor: 'white', borderRadius: '20px', border: '1px dashed #cbd5e1' }}>
                        <QrCode size={64} style={{ opacity: 0.2, margin: '0 auto 15px' }} />
                        <p style={{ fontSize: '18px', fontWeight: '600', color: '#334155', margin: '0 0 5px 0' }}>Cartera Vacía</p>
                        <p style={{ fontSize: '15px', color: '#64748b' }}>Inscríbete a un taller para generar tu código.</p>
                      </div>
                    ) : (
                      misInscripciones.map(ins => (
                        <div key={ins.id} style={{ backgroundColor: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
                          <div style={{ backgroundColor: '#0f172a', padding: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ backgroundColor: '#10b981', padding: '8px', borderRadius: '10px' }}><MapPin size={20} color="white"/></div>
                              <div>
                                <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Evento Oficial</p>
                                <h4 style={{ margin: 0, fontSize: '16px', color: 'white', fontWeight: '600' }}>{ins.nombreEvento}</h4>
                              </div>
                            </div>
                          </div>
                          <div style={{ padding: '35px 25px', textAlign: 'center' }}>
                            <h3 style={{ margin: '0 0 25px 0', fontSize: '20px', color: '#0f172a', fontWeight: '800' }}>{ins.tituloTaller}</h3>
                            <div style={{ background: 'white', padding: '15px', display: 'inline-block', borderRadius: '16px', border: '2px solid #e2e8f0' }}>
                              
                              {/* 👇 USO DE IMAGEN EXTERNA (EVITA EL ERROR DE REACT-QR-CODE) 👇 */}
                              {ins.codigoQr ? (
                                <img 
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${ins.codigoQr}&color=0f172a`} 
                                  alt="Código QR" 
                                  style={{ width: '180px', height: '180px', display: 'block', borderRadius: '4px' }} 
                                />
                              ) : (
                                <div style={{ width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', color: '#ef4444', fontWeight: 'bold' }}>QR Dañado</div>
                              )}
                              
                            </div>
                            <p style={{ marginTop: '25px', fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Presenta este código al Staff en la entrada.</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* VISTA 3: CONSTANCIAS */}
              {activeTab === 'constancias' && (
                <div className="fade-in-up">
                  <div className="page-toolbar">
                    <h1 style={{ margin: 0, color: '#0f172a', fontSize: '26px', fontWeight: '800' }}>Portafolio de Constancias</h1>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                    {eventosInscritosUnicos.length === 0 ? (
                      <div style={{ gridColumn: '1 / -1', padding: '60px 20px', backgroundColor: 'white', borderRadius: '20px', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
                        <Award size={64} color="#e2e8f0" style={{ margin: '0 auto 15px' }} />
                        <p style={{ color: '#475569', fontSize: '16px', fontWeight: '500', margin: 0 }}>Tu portafolio está vacío.</p>
                      </div>
                    ) : (
                      eventosInscritosUnicos.map((nombreEv, index) => (
                        <div key={index} style={{ backgroundColor: 'white', padding: '25px', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                            <div style={{ backgroundColor: '#eff6ff', padding: '15px', borderRadius: '14px' }}><Award size={32} color="#2563eb" /></div>
                            <div>
                              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0', fontWeight: '700', textTransform: 'uppercase' }}>Constancia Curricular</p>
                              <h4 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: '800' }}>{nombreEv}</h4>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleDescargarConstancia(nombreEv)}
                            style={{ width: '100%', padding: '14px', borderRadius: '12px', fontWeight: '700', border: '2px solid #2563eb', backgroundColor: 'transparent', color: '#2563eb', cursor: 'pointer', fontSize: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                          >
                            <FileText size={18}/> Procesar y Descargar
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* ================= BOTTOM NAV (MÓVIL) ================= */}
      <nav className="mobile-bottom-nav">
        <button className={`mobile-nav-btn ${activeTab === 'agenda' ? 'active' : ''}`} onClick={() => setActiveTab('agenda')}>
          <div className="icon-wrapper"><CalendarDays size={24}/></div>
          <span style={{ fontSize: '11px', fontWeight: activeTab==='agenda'?'800':'600', marginTop: '4px' }}>Agenda</span>
        </button>
        <button className={`mobile-nav-btn ${activeTab === 'qr' ? 'active' : ''}`} onClick={() => setActiveTab('qr')}>
          <div className="icon-wrapper"><QrCode size={24}/></div>
          <span style={{ fontSize: '11px', fontWeight: activeTab==='qr'?'800':'600', marginTop: '4px' }}>Boletos</span>
        </button>
        <button className={`mobile-nav-btn ${activeTab === 'constancias' ? 'active' : ''}`} onClick={() => setActiveTab('constancias')}>
          <div className="icon-wrapper"><Award size={24}/></div>
          <span style={{ fontSize: '11px', fontWeight: activeTab==='constancias'?'800':'600', marginTop: '4px' }}>Logros</span>
        </button>
      </nav>

    </div>
  );
}
import { useState, useEffect } from 'react';
import { clienteApi } from '../api/clienteApi';
import { 
  Wrench, CalendarDays, CalendarClock, PlusCircle, LayoutList, 
  Users, MousePointerClick, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Edit, Trash2, X // 👈 Iconos para las nuevas acciones
} from 'lucide-react';
import Swal from 'sweetalert2';
import './Gestion.css'; 

export default function GestionTalleres() {
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState('');
  
  const [talleres, setTalleres] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Campos del formulario
  const [titulo, setTitulo] = useState('');
  const [capacidadMaxima, setCapacidadMaxima] = useState('');
  const [horarioInicio, setHorarioInicio] = useState('');
  const [horarioFin, setHorarioFin] = useState('');

  // 👇 ESTADOS PARA EDICIÓN 👇
  const [modoEdicion, setModoEdicion] = useState(false);
  const [tallerIdEdicion, setTallerIdEdicion] = useState(null);

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const talleresPorPagina = 5;

  // 1. Al cargar la pantalla, traemos los eventos
  useEffect(() => {
    const cargarEventos = async () => {
      try {
        const response = await clienteApi.get('/Eventos');
        setEventos(response.data);
      } catch (error) {
        console.error('Error al cargar eventos:', error);
      }
    };
    cargarEventos();
  }, []);

  // 2. Cada vez que el usuario cambia de Evento, buscamos sus talleres y limpiamos la edición
  useEffect(() => {
    if (eventoSeleccionado) {
      cargarTalleres(eventoSeleccionado);
      cancelarEdicion(); // Si cambia de evento, limpiamos el formulario
    } else {
      setTalleres([]); 
    }
  }, [eventoSeleccionado]);

  const cargarTalleres = async (eventoId) => {
    try {
      const response = await clienteApi.get(`/Talleres/evento/${eventoId}`);
      setTalleres(response.data.reverse());
      setPaginaActual(1);
    } catch (error) {
      console.error('Error al cargar talleres:', error);
    }
  };

  // Función para adaptar la fecha de la BD al input datetime-local
  const formatoParaInput = (fechaString) => {
    if (!fechaString) return '';
    return fechaString.substring(0, 16); 
  };

  // 👇 PREPARAR EL FORMULARIO PARA EDITAR 👇
  const prepararEdicion = (taller) => {
    setTitulo(taller.titulo);
    setCapacidadMaxima(taller.capacidadMaxima);
    setHorarioInicio(formatoParaInput(taller.horarioInicio));
    setHorarioFin(formatoParaInput(taller.horarioFin));
    setTallerIdEdicion(taller.id);
    setModoEdicion(true);
    
    // Scroll hacia arriba
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 👇 CANCELAR LA EDICIÓN 👇
  const cancelarEdicion = () => {
    setTitulo('');
    setCapacidadMaxima('');
    setHorarioInicio('');
    setHorarioFin('');
    setTallerIdEdicion(null);
    setModoEdicion(false);
  };

  // 👇 GUARDAR O ACTUALIZAR TALLER 👇
  const guardarTaller = async (e) => {
    e.preventDefault();

    // Validaciones
    if (new Date(horarioFin) <= new Date(horarioInicio)) {
      Swal.fire({
        icon: 'warning', title: 'Revisa las fechas', text: 'El fin del taller no puede ser antes del inicio.',
        confirmButtonText: 'Entendido', customClass: { popup: 'modern-swal-popup', confirmButton: 'modern-swal-confirm' }
      });
      return;
    }

    if (capacidadMaxima <= 0) {
      Swal.fire({
        icon: 'warning', title: 'Capacidad Inválida', text: 'El taller debe tener capacidad para al menos 1 persona.',
        confirmButtonText: 'Entendido', customClass: { popup: 'modern-swal-popup', confirmButton: 'modern-swal-confirm' }
      });
      return;
    }

    const confirmacion = await Swal.fire({
      title: modoEdicion ? '¿Guardar cambios?' : '¿Confirmar nuevo taller?',
      html: `Se ${modoEdicion ? 'actualizará' : 'abrirá'} el taller: <br><strong style="color: #2563eb; font-size: 1.1em;">${titulo}</strong> <br>Capacidad: ${capacidadMaxima} personas.`,
      icon: 'info', showCancelButton: true, confirmButtonText: modoEdicion ? 'Sí, actualizar' : 'Sí, crear taller', cancelButtonText: 'Cancelar', reverseButtons: true,
      customClass: { popup: 'modern-swal-popup', confirmButton: 'modern-swal-confirm', cancelButton: 'modern-swal-cancel' }
    });

    if (!confirmacion.isConfirmed) return;

    setLoading(true);
    try {
      if (modoEdicion) {
        // MODO ACTUALIZAR (PUT)
        await clienteApi.put(`/Talleres/${tallerIdEdicion}`, {
          id: tallerIdEdicion,
          titulo: titulo,
          capacidadMaxima: parseInt(capacidadMaxima),
          horarioInicio: horarioInicio + ':00', 
          horarioFin: horarioFin + ':00'
        });
      } else {
        // MODO CREAR (POST)
        await clienteApi.post('/Talleres', {
          eventoId: parseInt(eventoSeleccionado),
          titulo: titulo,
          capacidadMaxima: parseInt(capacidadMaxima),
          horarioInicio: horarioInicio + ':00', 
          horarioFin: horarioFin + ':00'
        });
      }
      
      cancelarEdicion(); // Limpiamos el formulario
      cargarTalleres(eventoSeleccionado); // Recargamos la tabla

      Swal.fire({
        icon: 'success', title: modoEdicion ? '¡Actualizado!' : '¡Taller Creado!', 
        text: modoEdicion ? 'Los cambios se guardaron correctamente.' : 'El taller ha sido asignado al evento exitosamente.', 
        timer: 2000, showConfirmButton: false, customClass: { popup: 'modern-swal-popup', title: 'modern-swal-title' }
      });

    } catch (error) {
      console.error('Error al guardar taller:', error);
      Swal.fire({
        icon: 'error', title: 'Ocurrió un error', text: 'No se pudo guardar el taller. Verifica tu conexión.', confirmButtonText: 'Cerrar',
        customClass: { popup: 'modern-swal-popup', confirmButton: 'modern-swal-confirm' }
      });
    } finally {
      setLoading(false);
    }
  };

  // 👇 ELIMINAR TALLER 👇
  const eliminarTaller = async (id, tituloTaller) => {
    const confirmacion = await Swal.fire({
      title: '¿Estás completamente seguro?',
      html: `Estás a punto de eliminar el taller:<br><strong>${tituloTaller}</strong><br><br><span style="color:#ef4444; font-size:0.9em;">Esta acción no se puede deshacer.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      reverseButtons: true,
      customClass: { popup: 'modern-swal-popup', confirmButton: 'modern-swal-confirm', cancelButton: 'modern-swal-cancel', title: 'modern-swal-title' }
    });

    if (confirmacion.isConfirmed) {
      try {
        await clienteApi.delete(`/Talleres/${id}`);
        cargarTalleres(eventoSeleccionado);
        
        // Si borramos el que estamos editando, cancelamos la edición
        if (id === tallerIdEdicion) cancelarEdicion();

        Swal.fire({
          icon: 'success', title: 'Eliminado', text: 'El taller fue borrado exitosamente.', timer: 2000, showConfirmButton: false,
          customClass: { popup: 'modern-swal-popup', title: 'modern-swal-title' }
        });
      } catch (error) {
        console.error('Error al eliminar:', error);
        Swal.fire({
          icon: 'error', title: 'Error', text: 'Hubo un problema al intentar eliminar el taller. (Asegúrate de que no tenga alumnos inscritos).', confirmButtonText: 'Cerrar',
          customClass: { popup: 'modern-swal-popup', confirmButton: 'modern-swal-confirm' }
        });
      }
    }
  };

  const formatearFecha = (fechaString) => {
    const opciones = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
    return new Date(fechaString).toLocaleString('es-MX', opciones);
  };

  // Paginación matemática
  const indiceUltimoTaller = paginaActual * talleresPorPagina;
  const indicePrimerTaller = indiceUltimoTaller - talleresPorPagina;
  const talleresActuales = talleres.slice(indicePrimerTaller, indiceUltimoTaller);
  const totalPaginas = Math.ceil(talleres.length / talleresPorPagina);

  return (
    <div className="gestion-container fade-in-up">
      
      {/* SELECTOR DE EVENTO SUPERIOR */}
      <div className="form-card" style={{ padding: '24px 32px' }}>
        <div className="input-group">
          <label style={{ color: '#2563eb' }}>Selecciona el Evento a gestionar</label>
          <div className="input-with-icon">
            <MousePointerClick className="input-icon" size={18} style={{ color: '#2563eb' }} />
            <select 
              className="modern-select" 
              value={eventoSeleccionado} 
              onChange={(e) => setEventoSeleccionado(e.target.value)}
            >
              <option value="">-- Elige un evento de la lista --</option>
              {eventos.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.nombre}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!eventoSeleccionado ? (
        <div className="table-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Wrench size={48} color="#9ca3af" style={{ marginBottom: '16px', opacity: 0.5 }} />
          <h3 style={{ color: '#6b7280', border: 'none' }}>Selecciona un evento arriba para ver y crear sus talleres</h3>
        </div>
      ) : (
        <>
          {/* FORMULARIO DE TALLER */}
          <div className="form-card fade-in-up" style={modoEdicion ? { border: '2px solid #3b82f6', backgroundColor: '#f0f9ff' } : {}}>
            <h3 className="section-title">
              {modoEdicion ? <Edit size={22} className="title-icon" /> : <PlusCircle size={22} className="title-icon" />}
              {modoEdicion ? 'Editando Taller' : 'Aperturar Nuevo Taller'}
            </h3>
            <form onSubmit={guardarTaller} className="gestion-form">
              <div className="form-row">
                
                <div className="input-group" style={{ flex: 2 }}>
                  <label>Título del Taller</label>
                  <div className="input-with-icon">
                    <Wrench className="input-icon" size={18} />
                    <input type="text" placeholder="Ej. Taller de Robótica Básica" value={titulo} onChange={e => setTitulo(e.target.value)} required />
                  </div>
                </div>

                <div className="input-group" style={{ flex: 1 }}>
                  <label>Capacidad Max.</label>
                  <div className="input-with-icon">
                    <Users className="input-icon" size={18} />
                    <input type="number" min="1" placeholder="Ej. 30" value={capacidadMaxima} onChange={e => setCapacidadMaxima(e.target.value)} required />
                  </div>
                </div>

                <div className="input-group" style={{ flex: 1.5 }}>
                  <label>Inicio del Taller</label>
                  <div className="input-with-icon datetime-wrapper">
                    <CalendarDays className="input-icon" size={18} />
                    <input type="datetime-local" className="modern-datetime" value={horarioInicio} onChange={e => setHorarioInicio(e.target.value)} required />
                  </div>
                </div>

                <div className="input-group" style={{ flex: 1.5 }}>
                  <label>Fin del Taller</label>
                  <div className="input-with-icon datetime-wrapper">
                    <CalendarClock className="input-icon" size={18} />
                    <input type="datetime-local" className="modern-datetime" value={horarioFin} onChange={e => setHorarioFin(e.target.value)} required />
                  </div>
                </div>

                <div className="input-group btn-group" style={{ flexDirection: 'row', gap: '10px' }}>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Procesando...' : (
                      <>
                        {modoEdicion ? <Edit size={18} /> : <Wrench size={18} />}
                        {modoEdicion ? 'Guardar' : 'Crear Taller'}
                      </>
                    )}
                  </button>

                  {/* Botón de cancelar edición */}
                  {modoEdicion && (
                    <button type="button" className="btn-secondary" onClick={cancelarEdicion}>
                      <X size={18} /> Cancelar
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* TABLA DE TALLERES */}
          <div className="table-card fade-in-up">
            <h3 className="section-title">
              <LayoutList size={22} className="title-icon" />
              Talleres Disponibles en este Evento
            </h3>
            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Título del Taller</th>
                    <th>Capacidad</th>
                    <th>Inicio</th>
                    <th>Fin</th>
                    <th style={{ textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {talleresActuales.length === 0 ? (
                    <tr><td colSpan="5" className="text-center empty-state">No hay talleres registrados para este evento.</td></tr>
                  ) : (
                    talleresActuales.map(taller => (
                      <tr key={taller.id}>
                        <td className="fw-bold text-highlight">{taller.titulo}</td>
                        <td>
                          <span style={{ backgroundColor: '#dbeafe', color: '#1d4ed8', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                            {taller.capacidadMaxima} pax
                          </span>
                        </td>
                        <td>{formatearFecha(taller.horarioInicio)}</td>
                        <td>{formatearFecha(taller.horarioFin)}</td>
                        <td>
                          {/* 👇 BOTONES DE ACCIÓN 👇 */}
                          <div className="action-buttons">
                            <button 
                              onClick={() => prepararEdicion(taller)} 
                              className="btn-action btn-edit"
                              title="Editar taller"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={() => eliminarTaller(taller.id, taller.titulo)} 
                              className="btn-action btn-delete"
                              title="Eliminar taller"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* CONTROLES DE PAGINACIÓN */}
            {totalPaginas > 0 && (
              <div className="pagination-wrapper">
                <span className="pagination-info">
                  Mostrando <strong>{indicePrimerTaller + 1}</strong> a <strong>{Math.min(indiceUltimoTaller, talleres.length)}</strong> de <strong>{talleres.length}</strong> talleres
                </span>
                <div className="pagination-controls">
                  <button className="btn-page" onClick={() => setPaginaActual(1)} disabled={paginaActual === 1}><ChevronsLeft size={18} /></button>
                  <button className="btn-page" onClick={() => setPaginaActual(paginaActual - 1)} disabled={paginaActual === 1}><ChevronLeft size={18} /></button>
                  <div className="page-indicator">Página {paginaActual} de {totalPaginas}</div>
                  <button className="btn-page" onClick={() => setPaginaActual(paginaActual + 1)} disabled={paginaActual === totalPaginas}><ChevronRight size={18} /></button>
                  <button className="btn-page" onClick={() => setPaginaActual(totalPaginas)} disabled={paginaActual === totalPaginas}><ChevronsRight size={18} /></button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
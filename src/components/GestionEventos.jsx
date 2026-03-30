import { useState, useEffect } from 'react';
import { clienteApi } from '../api/clienteApi';
import { 
  Ticket, CalendarDays, CalendarClock, PlusCircle, LayoutList, CalendarPlus, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Edit, Trash2, X // 👈 Nuevos iconos para editar, eliminar y cancelar
} from 'lucide-react';
import Swal from 'sweetalert2';
import './Gestion.css'; 

export default function GestionEventos() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Estados del formulario
  const [nombre, setNombre] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // 👇 ESTADOS PARA EDICIÓN 👇
  const [modoEdicion, setModoEdicion] = useState(false);
  const [eventoIdEdicion, setEventoIdEdicion] = useState(null);

  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const eventosPorPagina = 5;

  useEffect(() => {
    cargarEventos();
  }, []);

  const cargarEventos = async () => {
    try {
      const response = await clienteApi.get('/Eventos');
      setEventos(response.data.reverse()); 
    } catch (error) {
      console.error('Error al cargar eventos:', error);
    }
  };

  // Función para adaptar la fecha de la BD al input datetime-local
  const formatoParaInput = (fechaString) => {
    if (!fechaString) return '';
    // Cortamos los segundos y milisegundos que manda SQL Server (ej. 2026-03-30T15:30:00 -> 2026-03-30T15:30)
    return fechaString.substring(0, 16); 
  };

  // 👇 FUNCIÓN PARA PREPARAR EL FORMULARIO PARA EDITAR 👇
  const prepararEdicion = (evento) => {
    setNombre(evento.nombre);
    setFechaInicio(formatoParaInput(evento.fechaInicio));
    setFechaFin(formatoParaInput(evento.fechaFin));
    setEventoIdEdicion(evento.id);
    setModoEdicion(true);
    
    // Hacemos scroll suave hacia arriba para que el usuario vea el formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 👇 FUNCIÓN PARA CANCELAR LA EDICIÓN 👇
  const cancelarEdicion = () => {
    setNombre('');
    setFechaInicio('');
    setFechaFin('');
    setEventoIdEdicion(null);
    setModoEdicion(false);
  };

  // 👇 GUARDAR O ACTUALIZAR EVENTO 👇
  const guardarEvento = async (e) => {
    e.preventDefault();

    if (new Date(fechaFin) <= new Date(fechaInicio)) {
      Swal.fire({
        icon: 'warning', title: 'Revisa las fechas', text: 'La fecha de finalización no puede ser anterior a la de inicio.',
        confirmButtonText: 'Entendido', customClass: { popup: 'modern-swal-popup', confirmButton: 'modern-swal-confirm' }
      });
      return;
    }

    const confirmacion = await Swal.fire({
      title: modoEdicion ? '¿Guardar cambios?' : '¿Confirmar nuevo evento?',
      html: `Se ${modoEdicion ? 'actualizará' : 'programará'}: <br><strong style="color: #2563eb; font-size: 1.1em; display: inline-block; margin-top: 8px;">${nombre}</strong>`,
      icon: 'info', showCancelButton: true, confirmButtonText: modoEdicion ? 'Sí, actualizar' : 'Sí, crear', cancelButtonText: 'Cancelar', reverseButtons: true,
      customClass: { popup: 'modern-swal-popup', confirmButton: 'modern-swal-confirm', cancelButton: 'modern-swal-cancel' }
    });

    if (!confirmacion.isConfirmed) return;

    setLoading(true);
    try {
      if (modoEdicion) {
        // MODO ACTUALIZAR (PUT)
        await clienteApi.put(`/Eventos/${eventoIdEdicion}`, {
          id: eventoIdEdicion,
          nombre: nombre,
          fechaInicio: fechaInicio + ':00', 
          fechaFin: fechaFin + ':00'
        });
      } else {
        // MODO CREAR (POST)
        await clienteApi.post('/Eventos', {
          nombre: nombre,
          fechaInicio: fechaInicio + ':00', 
          fechaFin: fechaFin + ':00'
        });
        setPaginaActual(1);
      }
      
      cancelarEdicion(); // Limpiamos el formulario
      cargarEventos(); // Recargamos la tabla

      Swal.fire({
        icon: 'success', title: modoEdicion ? '¡Actualizado!' : '¡Creado!', 
        text: modoEdicion ? 'Los cambios se guardaron correctamente.' : 'Ya está disponible en la plataforma.', 
        timer: 2000, showConfirmButton: false, customClass: { popup: 'modern-swal-popup', title: 'modern-swal-title' }
      });

    } catch (error) {
      console.error('Error al guardar evento:', error);
      Swal.fire({
        icon: 'error', title: 'Ocurrió un error', text: 'No se pudo guardar el evento. Verifica tu conexión.', confirmButtonText: 'Cerrar',
        customClass: { popup: 'modern-swal-popup', confirmButton: 'modern-swal-confirm' }
      });
    } finally {
      setLoading(false);
    }
  };

  // 👇 ELIMINAR EVENTO 👇
  const eliminarEvento = async (id, nombreEvento) => {
    const confirmacion = await Swal.fire({
      title: '¿Estás completamente seguro?',
      html: `Estás a punto de eliminar el evento:<br><strong>${nombreEvento}</strong><br><br><span style="color:#ef4444; font-size:0.9em;">Esta acción no se puede deshacer.</span>`,
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
        await clienteApi.delete(`/Eventos/${id}`);
        cargarEventos();
        
        // Si borramos el que estamos editando, cancelamos la edición
        if (id === eventoIdEdicion) cancelarEdicion();

        Swal.fire({
          icon: 'success', title: 'Eliminado', text: 'El evento fue borrado exitosamente.', timer: 2000, showConfirmButton: false,
          customClass: { popup: 'modern-swal-popup', title: 'modern-swal-title' }
        });
      } catch (error) {
        console.error('Error al eliminar:', error);
        Swal.fire({
          icon: 'error', title: 'Error', text: 'Hubo un problema al intentar eliminar el evento.', confirmButtonText: 'Cerrar',
          customClass: { popup: 'modern-swal-popup', confirmButton: 'modern-swal-confirm' }
        });
      }
    }
  };

  const formatearFecha = (fechaString) => {
    const opciones = { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
    return new Date(fechaString).toLocaleString('es-MX', opciones);
  };

  const indiceUltimoEvento = paginaActual * eventosPorPagina;
  const indicePrimerEvento = indiceUltimoEvento - eventosPorPagina;
  const eventosActuales = eventos.slice(indicePrimerEvento, indiceUltimoEvento);
  const totalPaginas = Math.ceil(eventos.length / eventosPorPagina);

  return (
    <div className="gestion-container fade-in-up">
      {/* FORMULARIO */}
      <div className="form-card" style={modoEdicion ? { border: '2px solid #3b82f6', backgroundColor: '#f0f9ff' } : {}}>
        <h3 className="section-title">
          {modoEdicion ? <Edit size={22} className="title-icon" /> : <PlusCircle size={22} className="title-icon" />}
          {modoEdicion ? 'Editando Evento' : 'Programar Nuevo Evento'}
        </h3>
        <form onSubmit={guardarEvento} className="gestion-form">
          <div className="form-row">
            
            <div className="input-group">
              <label>Nombre del Evento</label>
              <div className="input-with-icon">
                <Ticket className="input-icon" size={18} />
                <input type="text" placeholder="Ej. Congreso de Sistemas" value={nombre} onChange={e => setNombre(e.target.value)} required />
              </div>
            </div>

            <div className="input-group">
              <label>Fecha y hora de inicio</label>
              <div className="input-with-icon datetime-wrapper">
                <CalendarDays className="input-icon" size={18} />
                <input type="datetime-local" className="modern-datetime" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} required />
              </div>
            </div>

            <div className="input-group">
              <label>Fecha y hora de fin</label>
              <div className="input-with-icon datetime-wrapper">
                <CalendarClock className="input-icon" size={18} />
                <input type="datetime-local" className="modern-datetime" value={fechaFin} onChange={e => setFechaFin(e.target.value)} required />
              </div>
            </div>

            <div className="input-group btn-group" style={{ flexDirection: 'row', gap: '10px' }}>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Procesando...' : (
                  <>
                    {modoEdicion ? <Edit size={18} /> : <CalendarPlus size={18} />}
                    {modoEdicion ? 'Guardar Cambios' : 'Crear Evento'}
                  </>
                )}
              </button>
              
              {/* Botón para cancelar edición */}
              {modoEdicion && (
                <button type="button" className="btn-secondary" onClick={cancelarEdicion}>
                  <X size={18} /> Cancelar
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* TABLA CON PAGINACIÓN Y ACCIONES */}
      <div className="table-card">
        <h3 className="section-title">
          <LayoutList size={22} className="title-icon" />
          Eventos Programados
        </h3>
        <div className="table-responsive">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Nombre del Evento</th>
                <th>Inicio Programado</th>
                <th>Fin Programado</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {eventosActuales.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center empty-state">
                    No hay eventos registrados en este momento.
                  </td>
                </tr>
              ) : (
                eventosActuales.map(evento => (
                  <tr key={evento.id}>
                    <td className="fw-bold text-highlight">{evento.nombre}</td>
                    <td>{formatearFecha(evento.fechaInicio)}</td>
                    <td>{formatearFecha(evento.fechaFin)}</td>
                    <td>
                      {/* 👇 BOTONES DE ACCIÓN 👇 */}
                      <div className="action-buttons">
                        <button 
                          onClick={() => prepararEdicion(evento)} 
                          className="btn-action btn-edit"
                          title="Editar evento"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => eliminarEvento(evento.id, evento.nombre)} 
                          className="btn-action btn-delete"
                          title="Eliminar evento"
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
              Mostrando <strong>{indicePrimerEvento + 1}</strong> a <strong>{Math.min(indiceUltimoEvento, eventos.length)}</strong> de <strong>{eventos.length}</strong> eventos
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
    </div>
  );
}
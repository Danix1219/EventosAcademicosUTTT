import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GestionEventos from '../components/GestionEventos'; 
import GestionTalleres from '../components/GestionTalleres'; 
import InicioDashboard from '../components/InicioDashboard'; 
// 🚀 NUEVO: Importamos los iconos Menu y X para el responsive
import { CalendarDays, Wrench, LogOut, LayoutDashboard, Menu, X } from 'lucide-react';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [seccionActiva, setSeccionActiva] = useState('inicio');
  
  // 🚀 NUEVO: Estado para controlar si el menú lateral está abierto en móviles
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Protección de ruta
  useEffect(() => {
    const token = localStorage.getItem('userToken');
    const rol = localStorage.getItem('userRol');

    if (!token || rol !== 'Administrador') {
      navigate('/');
    }
  }, [navigate]);

  const handleCerrarSesion = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRol');
    navigate('/');
  };

  const getTituloHeader = () => {
    switch(seccionActiva) {
      case 'inicio': return 'Panel de Estadísticas';
      case 'eventos': return 'Gestión de Eventos';
      case 'talleres': return 'Gestión de Talleres';
      default: return 'Panel de Control';
    }
  };

  // 🚀 NUEVO: Función para cambiar de sección y cerrar el menú en móviles
  const handleNavegacion = (seccion) => {
    setSeccionActiva(seccion);
    setMenuAbierto(false); // Cierra el menú automáticamente
  };

  return (
    <div className="dashboard-layout">
      
      {/* 🚀 NUEVO: Overlay oscuro que aparece detrás del menú en móviles */}
      {menuAbierto && (
        <div className="sidebar-overlay" onClick={() => setMenuAbierto(false)}></div>
      )}

      {/* BARRA LATERAL */}
      {/* 🚀 NUEVO: Añadimos la clase 'open' basada en el estado */}
      <aside className={`dashboard-sidebar ${menuAbierto ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-logo">Eventos <span>UTTT</span></h2>
          {/* 🚀 NUEVO: Botón para cerrar el menú en móviles */}
          <button className="close-menu-btn" onClick={() => setMenuAbierto(false)}>
            <X size={24} />
          </button>
        </div>
        
        <nav className="sidebar-menu">
          <button 
            className={`menu-item ${seccionActiva === 'inicio' ? 'active' : ''}`}
            onClick={() => handleNavegacion('inicio')}
          >
            <LayoutDashboard size={20} />
            Panel Principal
          </button>

          <button 
            className={`menu-item ${seccionActiva === 'eventos' ? 'active' : ''}`}
            onClick={() => handleNavegacion('eventos')}
          >
            <CalendarDays size={20} />
            Gestión de Eventos
          </button>
          
          <button 
            className={`menu-item ${seccionActiva === 'talleres' ? 'active' : ''}`}
            onClick={() => handleNavegacion('talleres')}
          >
            <Wrench size={20} />
            Gestión de Talleres
          </button>
        </nav>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="dashboard-main">
        
        {/* BARRA SUPERIOR */}
        <header className="dashboard-header">
          <div className="header-left">
            {/* 🚀 NUEVO: Botón de hamburguesa para móviles */}
            <button className="menu-toggle-btn" onClick={() => setMenuAbierto(true)}>
              <Menu size={24} />
            </button>
            <h1 className="header-title">{getTituloHeader()}</h1>
          </div>

          <button className="logout-btn" onClick={handleCerrarSesion}>
            <LogOut size={18} />
            <span className="logout-text">Cerrar Sesión</span> {/* 🚀 NUEVO: Texto envuelto en span */}
          </button>
        </header>

        {/* CONTENIDO DINÁMICO */}
        <div className="dashboard-content">
          {seccionActiva === 'inicio' && <InicioDashboard />}
          {seccionActiva === 'eventos' && <GestionEventos />}
          {seccionActiva === 'talleres' && <GestionTalleres />}
        </div>
      </main>

    </div>
  );
}
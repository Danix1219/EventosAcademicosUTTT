import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DashboardEstudiante from './pages/DashboardEstudiante';
import DashboardStaff from './pages/DashboardStaff';

// 👇 1. IMPORTAMOS LAS NUEVAS PÁGINAS 👇
import VerificarEmail from './pages/VerificarEmail';
import RestablecerPassword from './pages/RestablecerPassword';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas principales */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        
        {/* 👇 2. REGISTRAMOS LAS RUTAS DE LOS CORREOS 👇 */}
        <Route path="/verificar-email" element={<VerificarEmail />} />
        <Route path="/restablecer-password" element={<RestablecerPassword />} />
        
        {/* Ruta del panel */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard-estudiante" element={<DashboardEstudiante />} />
        <Route path="/dashboard-staff" element={<DashboardStaff />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
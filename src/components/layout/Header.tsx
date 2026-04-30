import { useLocation } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import './Header.css';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/equipment': 'Catálogo de Equipos',
  '/templates': 'Plantillas de Servicio',
  '/templates/new': 'Nueva Plantilla',
  '/reports': 'Historial de Reportes',
  '/reports/new': 'Nuevo Reporte',
  '/settings': 'Configuración',
};

export default function Header() {
  const location = useLocation();
  const { toggleSidebar } = useAppStore();

  const getTitle = () => {
    const exact = PAGE_TITLES[location.pathname];
    if (exact) return exact;
    if (location.pathname.startsWith('/equipment/')) return 'Detalle de Equipo';
    if (location.pathname.match(/\/templates\/.+\/edit/)) return 'Editar Plantilla';
    if (location.pathname.startsWith('/reports/') && location.pathname !== '/reports/new') return 'Ver Reporte';
    return 'Reports Creator';
  };

  return (
    <header className="header">
      <div className="header__left">
        <button className="header__menu-btn" onClick={toggleSidebar} aria-label="Toggle menu">
          <Menu size={20} />
        </button>
        <div className="header__title-group">
          <h1 className="header__title">{getTitle()}</h1>
        </div>
      </div>
      <div className="header__right">
        <button className="header__icon-btn" aria-label="Notifications">
          <Bell size={20} />
          <span className="header__badge">3</span>
        </button>
        <div className="header__avatar">
          <span>TC</span>
        </div>
      </div>
    </header>
  );
}

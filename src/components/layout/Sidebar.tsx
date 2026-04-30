import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Cpu,
  FileText,
  ClipboardList,
  Settings,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import './Sidebar.css';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/equipment', icon: Cpu, label: 'Equipos' },
  { path: '/templates', icon: FileText, label: 'Plantillas' },
  { path: '/reports/new', icon: ClipboardList, label: 'Nuevo Reporte' },
  { path: '/reports', icon: FileText, label: 'Historial' },
  { path: '/settings', icon: Settings, label: 'Configuración' },
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const location = useLocation();

  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'sidebar--collapsed' : ''}`}>
      {/* Brand */}
      <div className="sidebar__brand">
        <div className="sidebar__logo">
          <Stethoscope size={28} strokeWidth={2} />
        </div>
        {!sidebarCollapsed && (
          <div className="sidebar__brand-text">
            <span className="sidebar__brand-name">Reports</span>
            <span className="sidebar__brand-sub">Creator</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar__nav">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = path === '/'
            ? location.pathname === '/'
            : path === '/reports'
              ? location.pathname === '/reports'
              : location.pathname.startsWith(path);

          return (
            <NavLink
              key={path}
              to={path}
              className={`sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
              title={sidebarCollapsed ? label : undefined}
            >
              <Icon size={20} strokeWidth={1.8} />
              {!sidebarCollapsed && <span>{label}</span>}
              {isActive && <div className="sidebar__link-indicator" />}
            </NavLink>
          );
        })}
      </nav>

      {/* Toggle */}
      <button className="sidebar__toggle" onClick={toggleSidebar} title="Toggle sidebar">
        {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </aside>
  );
}

import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAppStore } from '../../store/appStore';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import './AppShell.css';

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export default function AppShell() {
  const { sidebarCollapsed, toasts, removeToast } = useAppStore();

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'app-shell--collapsed' : ''}`}>
      <Sidebar />
      <div className="app-shell__wrapper">
        <Header />
        <main className="app-shell__content">
          <Outlet />
        </main>
      </div>

      {/* Toast notifications */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map(toast => {
            const Icon = toastIcons[toast.type];
            return (
              <div key={toast.id} className={`toast toast--${toast.type}`}>
                <Icon size={18} />
                <span className="toast__message">{toast.message}</span>
                <button className="toast__close" onClick={() => removeToast(toast.id)}>
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

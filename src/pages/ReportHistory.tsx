import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Eye,
  Trash2,
  FileText,
  Clock,
  X,
} from 'lucide-react';
import { useReportStore } from '../store/reportStore';
import { useAppStore } from '../store/appStore';
import { REPORT_STATUS_LABELS, SERVICE_TYPE_LABELS } from '../types';
import type { ReportStatus, ServiceType } from '../types';
import './ReportHistory.css';

export default function ReportHistory() {
  const navigate = useNavigate();
  const { items, loading, fetch, remove } = useReportStore();
  const { addToast } = useAppStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { fetch(); }, []);

  const filtered = items.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      r.reportNumber.toLowerCase().includes(q) ||
      r.equipmentName.toLowerCase().includes(q) ||
      r.technician.toLowerCase().includes(q);
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleDelete = async (id: string, num: string) => {
    if (confirm(`¿Eliminar reporte ${num}?`)) {
      try {
        await remove(id);
        addToast('Reporte eliminado');
      } catch {
        addToast('Error al eliminar', 'error');
      }
    }
  };

  return (
    <div className="history page-enter">
      {/* Toolbar */}
      <div className="history__toolbar">
        <div className="equipment-page__search" style={{ flex: 1 }}>
          <Search size={18} className="equipment-page__search-icon" />
          <input
            className="equipment-page__search-input"
            placeholder="Buscar por número, equipo o técnico..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="equipment-page__search-clear" onClick={() => setSearch('')}>
              <X size={14} />
            </button>
          )}
        </div>
        <select
          className="form-input"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ width: 'auto' }}
        >
          <option value="">Todos los estados</option>
          <option value="draft">Borradores</option>
          <option value="completed">Completados</option>
          <option value="approved">Aprobados</option>
        </select>
      </div>

      <div className="history__count">
        {filtered.length} reporte{filtered.length !== 1 ? 's' : ''}
      </div>

      {loading ? (
        <div className="equipment-page__loading">
          <div className="spinner" />
          <p>Cargando reportes...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="equipment-page__empty">
          <FileText size={48} />
          <h3>No hay reportes</h3>
          <p>Crea tu primer reporte de servicio</p>
          <button className="btn btn--primary" onClick={() => navigate('/reports/new')}>
            Nuevo Reporte
          </button>
        </div>
      ) : (
        <div className="history__table-wrap">
          <table className="history__table">
            <thead>
              <tr>
                <th>N° Reporte</th>
                <th>Equipo</th>
                <th>Tipo de Servicio</th>
                <th>Técnico</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(report => (
                <tr key={report.id} onClick={() => navigate(`/reports/${report.id}`)}>
                  <td>
                    <span className="text-mono" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                      {report.reportNumber}
                    </span>
                  </td>
                  <td><strong>{report.equipmentName}</strong></td>
                  <td className="text-muted">
                    {SERVICE_TYPE_LABELS[report.serviceType as ServiceType] || report.serviceType}
                  </td>
                  <td>{report.technician}</td>
                  <td className="text-muted">{report.serviceDate}</td>
                  <td>
                    <span className={`report-row__status report-row__status--${report.status}`}>
                      {REPORT_STATUS_LABELS[report.status as ReportStatus] || report.status}
                    </span>
                  </td>
                  <td>
                    <div className="history__actions" onClick={e => e.stopPropagation()}>
                      <button className="btn btn--ghost btn--sm" onClick={() => navigate(`/reports/${report.id}`)}>
                        <Eye size={14} />
                      </button>
                      <button className="btn btn--ghost btn--sm" onClick={() => handleDelete(report.id, report.reportNumber)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

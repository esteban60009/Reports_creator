import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cpu,
  FileText,
  ClipboardCheck,
  TrendingUp,
  Plus,
  ArrowRight,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useEquipmentStore } from '../store/equipmentStore';
import { useReportStore } from '../store/reportStore';
import { useTemplateStore } from '../store/templateStore';
import { REPORT_STATUS_LABELS } from '../types';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const { items: equipment, fetch: fetchEquipment } = useEquipmentStore();
  const { items: reports, fetch: fetchReports } = useReportStore();
  const { items: templates, fetch: fetchTemplates } = useTemplateStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchEquipment(), fetchReports(), fetchTemplates()])
      .finally(() => setLoading(false));
  }, []);

  const recentReports = reports.slice(0, 5);
  const draftReports = reports.filter(r => r.status === 'draft');

  if (loading) {
    return (
      <div className="dashboard page-enter">
        <div className="dashboard__loading">
          <div className="spinner" />
          <p>Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard page-enter">
      {/* Stats Cards */}
      <div className="dashboard__stats">
        <div className="stat-card stat-card--primary" onClick={() => navigate('/equipment')}>
          <div className="stat-card__icon">
            <Cpu size={24} />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__value">{equipment.length}</span>
            <span className="stat-card__label">Equipos Registrados</span>
          </div>
          <ArrowRight size={18} className="stat-card__arrow" />
        </div>

        <div className="stat-card stat-card--blue" onClick={() => navigate('/templates')}>
          <div className="stat-card__icon">
            <FileText size={24} />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__value">{templates.length}</span>
            <span className="stat-card__label">Plantillas Activas</span>
          </div>
          <ArrowRight size={18} className="stat-card__arrow" />
        </div>

        <div className="stat-card stat-card--green" onClick={() => navigate('/reports')}>
          <div className="stat-card__icon">
            <ClipboardCheck size={24} />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__value">{reports.filter(r => r.status === 'completed').length}</span>
            <span className="stat-card__label">Reportes Completados</span>
          </div>
          <ArrowRight size={18} className="stat-card__arrow" />
        </div>

        <div className="stat-card stat-card--amber">
          <div className="stat-card__icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__value">{draftReports.length}</span>
            <span className="stat-card__label">Borradores Pendientes</span>
          </div>
          <ArrowRight size={18} className="stat-card__arrow" />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard__actions">
        <h2 className="dashboard__section-title">Acciones Rápidas</h2>
        <div className="dashboard__action-grid">
          <button className="action-card" onClick={() => navigate('/reports/new')}>
            <div className="action-card__icon action-card__icon--primary">
              <Plus size={24} />
            </div>
            <span className="action-card__label">Nuevo Reporte</span>
            <span className="action-card__desc">Crear un reporte de servicio</span>
          </button>

          <button className="action-card" onClick={() => navigate('/equipment')}>
            <div className="action-card__icon action-card__icon--blue">
              <Cpu size={24} />
            </div>
            <span className="action-card__label">Agregar Equipo</span>
            <span className="action-card__desc">Registrar nuevo equipo</span>
          </button>

          <button className="action-card" onClick={() => navigate('/templates')}>
            <div className="action-card__icon action-card__icon--green">
              <FileText size={24} />
            </div>
            <span className="action-card__label">Crear Plantilla</span>
            <span className="action-card__desc">Diseñar nueva plantilla</span>
          </button>
        </div>
      </div>

      {/* Recent Reports & Drafts */}
      <div className="dashboard__grid">
        <div className="dashboard__card">
          <div className="dashboard__card-header">
            <h2 className="dashboard__section-title">
              <Clock size={18} />
              Reportes Recientes
            </h2>
            <button className="dashboard__view-all" onClick={() => navigate('/reports')}>
              Ver todos <ArrowRight size={14} />
            </button>
          </div>
          {recentReports.length === 0 ? (
            <div className="dashboard__empty">
              <AlertCircle size={40} />
              <p>No hay reportes aún</p>
              <button className="btn btn--primary btn--sm" onClick={() => navigate('/reports/new')}>
                Crear primer reporte
              </button>
            </div>
          ) : (
            <div className="dashboard__report-list">
              {recentReports.map(report => (
                <div
                  key={report.id}
                  className="report-row"
                  onClick={() => navigate(`/reports/${report.id}`)}
                >
                  <div className="report-row__info">
                    <span className="report-row__number text-mono">{report.reportNumber}</span>
                    <span className="report-row__equipment">{report.equipmentName}</span>
                  </div>
                  <div className="report-row__meta">
                    <span className={`report-row__status report-row__status--${report.status}`}>
                      {REPORT_STATUS_LABELS[report.status as keyof typeof REPORT_STATUS_LABELS] || report.status}
                    </span>
                    <span className="report-row__date">{report.serviceDate}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Equipment by category */}
        <div className="dashboard__card">
          <div className="dashboard__card-header">
            <h2 className="dashboard__section-title">
              <Cpu size={18} />
              Equipos por Categoría
            </h2>
          </div>
          <div className="dashboard__category-list">
            {Object.entries(
              equipment.reduce((acc, eq) => {
                acc[eq.category] = (acc[eq.category] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
              <div key={cat} className="category-row">
                <span className="category-row__name">{cat}</span>
                <div className="category-row__bar-wrapper">
                  <div
                    className="category-row__bar"
                    style={{ width: `${(count / equipment.length) * 100}%` }}
                  />
                </div>
                <span className="category-row__count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

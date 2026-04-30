import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Cpu,
  MapPin,
  FileText,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  Hash,
} from 'lucide-react';
import { useEquipmentStore } from '../store/equipmentStore';
import { useTemplateStore } from '../store/templateStore';
import { EQUIPMENT_CATEGORY_LABELS, SERVICE_TYPE_LABELS } from '../types';
import type { Equipment, EquipmentCategory, Template, ServiceType } from '../types';
import { useAppStore } from '../store/appStore';
import './EquipmentDetail.css';

export default function EquipmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { items: equipment, fetch: fetchEquipment } = useEquipmentStore();
  const { items: templates, fetch: fetchTemplates, remove: removeTemplate } = useTemplateStore();
  const { addToast } = useAppStore();
  const [eq, setEq] = useState<Equipment | null>(null);

  useEffect(() => {
    fetchEquipment().then(() => {});
    if (id) fetchTemplates(id);
  }, [id]);

  useEffect(() => {
    if (equipment.length > 0 && id) {
      const found = equipment.find(e => e.id === id);
      setEq(found || null);
    }
  }, [equipment, id]);

  if (!eq) {
    return (
      <div className="detail-page page-enter">
        <div className="detail-page__loading">
          <div className="spinner" />
          <p>Cargando equipo...</p>
        </div>
      </div>
    );
  }

  const eqTemplates = templates.filter(t => t.equipmentId === id);

  return (
    <div className="detail-page page-enter">
      {/* Back */}
      <button className="detail-page__back" onClick={() => navigate('/equipment')}>
        <ArrowLeft size={18} /> Volver al catálogo
      </button>

      {/* Equipment Info Card */}
      <div className="detail-card">
        <div className="detail-card__header">
          <div className="detail-card__icon">
            <Cpu size={32} />
          </div>
          <div className="detail-card__info">
            <span className="detail-card__category">
              {EQUIPMENT_CATEGORY_LABELS[eq.category as EquipmentCategory] || eq.category}
            </span>
            <h2 className="detail-card__name">{eq.name}</h2>
            <p className="detail-card__brand">{eq.brand} — {eq.model}</p>
          </div>
        </div>
        <div className="detail-card__meta">
          {eq.serialNumber && (
            <div className="detail-meta-item">
              <Hash size={14} /> <span>Serie: {eq.serialNumber}</span>
            </div>
          )}
          {eq.location && (
            <div className="detail-meta-item">
              <MapPin size={14} /> <span>{eq.location}</span>
            </div>
          )}
          <div className="detail-meta-item">
            <Calendar size={14} /> <span>Registrado: {new Date(eq.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        {eq.description && (
          <p className="detail-card__desc">{eq.description}</p>
        )}
      </div>

      {/* Templates Section */}
      <div className="detail-section">
        <div className="detail-section__header">
          <h3 className="detail-section__title">
            <FileText size={18} /> Plantillas de Servicio ({eqTemplates.length})
          </h3>
          <button className="btn btn--primary btn--sm" onClick={() => navigate(`/templates/new?equipmentId=${id}`)}>
            <Plus size={16} /> Nueva Plantilla
          </button>
        </div>

        {eqTemplates.length === 0 ? (
          <div className="detail-section__empty">
            <FileText size={40} />
            <p>No hay plantillas para este equipo</p>
            <button className="btn btn--outline btn--sm" onClick={() => navigate(`/templates/new?equipmentId=${id}`)}>
              Crear primera plantilla
            </button>
          </div>
        ) : (
          <div className="template-list">
            {eqTemplates.map(tpl => (
              <div key={tpl.id} className="template-item">
                <div className="template-item__info">
                  <h4 className="template-item__name">{tpl.name}</h4>
                  <div className="template-item__meta">
                    <span className="template-item__type">
                      {SERVICE_TYPE_LABELS[tpl.serviceType as ServiceType] || tpl.serviceType}
                    </span>
                    <span className="template-item__blocks">
                      {tpl.blocks.length} bloques
                    </span>
                    {tpl.isDefault && <span className="template-item__default">Predeterminada</span>}
                  </div>
                </div>
                <div className="template-item__actions">
                  <button
                    className="btn btn--outline btn--sm"
                    onClick={() => navigate(`/reports/new?equipmentId=${id}&templateId=${tpl.id}`)}
                  >
                    Usar para reporte
                  </button>
                  <button
                    className="btn btn--ghost btn--sm"
                    onClick={() => navigate(`/templates/${tpl.id}/edit`)}
                    title="Editar plantilla"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    className="btn btn--ghost btn--sm"
                    onClick={async () => {
                      if (confirm('¿Eliminar esta plantilla?')) {
                        await removeTemplate(tpl.id);
                        addToast('Plantilla eliminada');
                        fetchTemplates(id!);
                      }
                    }}
                    title="Eliminar plantilla"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

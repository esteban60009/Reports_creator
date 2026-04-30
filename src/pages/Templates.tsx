import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  FileText,
  Trash2,
  Edit3,
  Cpu,
  X,
} from 'lucide-react';
import { useTemplateStore } from '../store/templateStore';
import { useEquipmentStore } from '../store/equipmentStore';
import { useAppStore } from '../store/appStore';
import { SERVICE_TYPE_LABELS } from '../types';
import type { ServiceType, Template } from '../types';
import './Templates.css';

export default function Templates() {
  const navigate = useNavigate();
  const { items: templates, loading, fetch: fetchTemplates, remove } = useTemplateStore();
  const { items: equipment, fetch: fetchEquipment } = useEquipmentStore();
  const { addToast } = useAppStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTemplates();
    fetchEquipment();
  }, []);

  const getEquipmentName = (eqId: string) => {
    const eq = equipment.find(e => e.id === eqId);
    return eq?.name || 'Equipo desconocido';
  };

  const filtered = templates.filter(t => {
    const q = search.toLowerCase();
    return !search ||
      t.name.toLowerCase().includes(q) ||
      getEquipmentName(t.equipmentId).toLowerCase().includes(q);
  });

  const handleDelete = async (tpl: Template) => {
    if (confirm(`¿Eliminar plantilla "${tpl.name}"?`)) {
      try {
        await remove(tpl.id);
        addToast('Plantilla eliminada');
      } catch {
        addToast('Error al eliminar', 'error');
      }
    }
  };

  return (
    <div className="templates-page page-enter">
      <div className="equipment-page__toolbar">
        <div className="equipment-page__search" style={{ flex: 1 }}>
          <Search size={18} className="equipment-page__search-icon" />
          <input
            className="equipment-page__search-input"
            placeholder="Buscar plantillas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="equipment-page__search-clear" onClick={() => setSearch('')}>
              <X size={14} />
            </button>
          )}
        </div>
        <button className="btn btn--primary" onClick={() => navigate('/templates/new')}>
          <Plus size={18} /> Nueva Plantilla
        </button>
      </div>

      <div className="equipment-page__results">
        {filtered.length} plantilla{filtered.length !== 1 ? 's' : ''}
      </div>

      {loading ? (
        <div className="equipment-page__loading">
          <div className="spinner" /><p>Cargando plantillas...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="equipment-page__empty">
          <FileText size={48} />
          <h3>No hay plantillas</h3>
          <p>Las plantillas se crean desde el detalle de cada equipo</p>
          <button className="btn btn--primary" onClick={() => navigate('/equipment')}>
            Ir a Equipos
          </button>
        </div>
      ) : (
        <div className="templates-grid">
          {filtered.map((tpl, i) => (
            <div
              key={tpl.id}
              className="template-card animate-slide-up"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="template-card__header">
                <FileText size={20} className="template-card__icon" />
                {tpl.isDefault && <span className="template-item__default">Predeterminada</span>}
              </div>
              <div className="template-card__body">
                <h3 className="template-card__name">{tpl.name}</h3>
                <div className="template-card__meta">
                  <span className="template-card__equipment">
                    <Cpu size={12} /> {getEquipmentName(tpl.equipmentId)}
                  </span>
                  <span className="template-card__type">
                    {SERVICE_TYPE_LABELS[tpl.serviceType as ServiceType]}
                  </span>
                  <span>{tpl.blocks.length} bloques · v{tpl.version}</span>
                </div>
              </div>
              <div className="template-card__footer">
                <button className="btn btn--primary btn--sm" onClick={() => navigate(`/reports/new?templateId=${tpl.id}&equipmentId=${tpl.equipmentId}`)}>
                  Usar para reporte
                </button>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button className="btn btn--ghost btn--sm" onClick={() => navigate(`/templates/${tpl.id}/edit`)} title="Editar">
                    <Edit3 size={14} />
                  </button>
                  <button className="btn btn--ghost btn--sm" onClick={() => handleDelete(tpl)} title="Eliminar">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

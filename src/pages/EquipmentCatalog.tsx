import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Filter,
  Cpu,
  MapPin,
  ChevronRight,
  Trash2,
  X,
} from 'lucide-react';
import { useEquipmentStore } from '../store/equipmentStore';
import { EQUIPMENT_CATEGORY_LABELS, type EquipmentCategory, type Equipment } from '../types';
import { useAppStore } from '../store/appStore';
import './EquipmentCatalog.css';

export default function EquipmentCatalog() {
  const navigate = useNavigate();
  const {
    loading, fetch, filtered, create, remove,
    searchQuery, setSearchQuery, categoryFilter, setCategoryFilter,
  } = useEquipmentStore();
  const { addToast } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', brand: '', model: '', category: 'hematology' as EquipmentCategory,
    serialNumber: '', location: '', description: '',
  });

  useEffect(() => { fetch(); }, []);

  const handleCreate = async () => {
    if (!formData.name || !formData.brand || !formData.model) {
      addToast('Completa los campos requeridos', 'warning');
      return;
    }
    try {
      await create(formData);
      addToast('Equipo registrado exitosamente', 'success');
      setShowForm(false);
      setFormData({ name: '', brand: '', model: '', category: 'hematology', serialNumber: '', location: '', description: '' });
    } catch {
      addToast('Error al crear equipo', 'error');
    }
  };

  const handleDelete = async (e: React.MouseEvent, eq: Equipment) => {
    e.stopPropagation();
    if (confirm(`¿Eliminar ${eq.name}?`)) {
      try {
        await remove(eq.id);
        addToast('Equipo eliminado', 'success');
      } catch {
        addToast('Error al eliminar equipo', 'error');
      }
    }
  };

  const displayItems = filtered();
  const categories = Object.entries(EQUIPMENT_CATEGORY_LABELS);

  return (
    <div className="equipment-page page-enter">
      {/* Toolbar */}
      <div className="equipment-page__toolbar">
        <div className="equipment-page__search">
          <Search size={18} className="equipment-page__search-icon" />
          <input
            type="text"
            placeholder="Buscar por nombre, marca o modelo..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="equipment-page__search-input"
          />
          {searchQuery && (
            <button className="equipment-page__search-clear" onClick={() => setSearchQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>
        <div className="equipment-page__filters">
          <div className="equipment-page__filter-select">
            <Filter size={16} />
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {categories.map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          <button className="btn btn--primary" onClick={() => setShowForm(true)}>
            <Plus size={18} /> Nuevo Equipo
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className="equipment-page__results">
        <span>{displayItems.length} equipo{displayItems.length !== 1 ? 's' : ''}</span>
        {categoryFilter && (
          <button className="equipment-page__clear-filter" onClick={() => setCategoryFilter('')}>
            <X size={12} /> Limpiar filtro
          </button>
        )}
      </div>

      {/* Equipment Grid */}
      {loading ? (
        <div className="equipment-page__loading">
          <div className="spinner" />
          <p>Cargando equipos...</p>
        </div>
      ) : displayItems.length === 0 ? (
        <div className="equipment-page__empty">
          <Cpu size={48} />
          <h3>No se encontraron equipos</h3>
          <p>Agrega tu primer equipo para comenzar</p>
          <button className="btn btn--primary" onClick={() => setShowForm(true)}>
            <Plus size={18} /> Agregar Equipo
          </button>
        </div>
      ) : (
        <div className="equipment-grid">
          {displayItems.map((eq, i) => (
            <div
              key={eq.id}
              className="equipment-card animate-slide-up"
              style={{ animationDelay: `${i * 40}ms` }}
              onClick={() => navigate(`/equipment/${eq.id}`)}
            >
              <div className="equipment-card__header">
                <div className="equipment-card__icon">
                  <Cpu size={22} />
                </div>
                <div className="equipment-card__actions">
                  <button
                    className="equipment-card__action"
                    onClick={e => handleDelete(e, eq)}
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="equipment-card__body">
                <span className="equipment-card__category">
                  {EQUIPMENT_CATEGORY_LABELS[eq.category as EquipmentCategory] || eq.category}
                </span>
                <h3 className="equipment-card__name">{eq.name}</h3>
                <p className="equipment-card__brand">{eq.brand} — {eq.model}</p>
                {eq.location && (
                  <div className="equipment-card__location">
                    <MapPin size={12} />
                    <span>{eq.location}</span>
                  </div>
                )}
              </div>
              <div className="equipment-card__footer">
                <span className="equipment-card__link">
                  Ver detalles <ChevronRight size={14} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Nuevo Equipo</h2>
              <button className="modal__close" onClick={() => setShowForm(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal__body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Nombre del equipo *</label>
                  <input
                    className="form-input"
                    placeholder="Ej: Mindray BC-5150"
                    value={formData.name}
                    onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Marca *</label>
                  <input
                    className="form-input"
                    placeholder="Ej: Mindray"
                    value={formData.brand}
                    onChange={e => setFormData(f => ({ ...f, brand: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Modelo *</label>
                  <input
                    className="form-input"
                    placeholder="Ej: BC-5150"
                    value={formData.model}
                    onChange={e => setFormData(f => ({ ...f, model: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Categoría</label>
                  <select
                    className="form-input"
                    value={formData.category}
                    onChange={e => setFormData(f => ({ ...f, category: e.target.value as EquipmentCategory }))}
                  >
                    {categories.map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Número de Serie</label>
                  <input
                    className="form-input"
                    placeholder="Opcional"
                    value={formData.serialNumber}
                    onChange={e => setFormData(f => ({ ...f, serialNumber: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Ubicación</label>
                  <input
                    className="form-input"
                    placeholder="Ej: Laboratorio Central"
                    value={formData.location}
                    onChange={e => setFormData(f => ({ ...f, location: e.target.value }))}
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
                <label className="form-label">Descripción</label>
                <textarea
                  className="form-input form-textarea"
                  placeholder="Descripción del equipo..."
                  value={formData.description}
                  onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--outline" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn btn--primary" onClick={handleCreate}>Registrar Equipo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

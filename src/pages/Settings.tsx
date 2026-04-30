import { useEffect, useState, useRef } from 'react';
import {
  Building2,
  Upload,
  Save,
  User,
  Palette,
  Plus,
  Trash2,
  Edit3,
  X,
  Eye,
  Type,
  Layout,
  Columns,
  AlignLeft,
  AlignCenter,
  Grid3X3,
  Minus,
  FileText,
} from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { api } from '../services/api';
import { useAppStore } from '../store/appStore';
import type { CompanySettings, Technician, ReportLayout } from '../types';
import './Settings.css';

export default function Settings() {
  const { addToast } = useAppStore();
  const [tab, setTab] = useState<'company' | 'technicians'>('company');

  // Company
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [saving, setSaving] = useState(false);

  // Technicians
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [showTechForm, setShowTechForm] = useState(false);
  const [editingTech, setEditingTech] = useState<Technician | null>(null);
  const [techForm, setTechForm] = useState({ name: '', role: '', email: '', phone: '' });
  const techSigRef = useRef<SignatureCanvas | null>(null);

  // Layout
  const [layouts, setLayouts] = useState<ReportLayout[]>([]);
  const [activeLayout, setActiveLayout] = useState<ReportLayout | null>(null);

  useEffect(() => {
    api.settings.getCompany().then(setSettings);
    api.settings.getTechnicians().then(setTechnicians);
    api.settings.getLayouts().then(data => {
      setLayouts(data);
      if (data.length > 0) setActiveLayout(data[0]);
    });
  }, []);

  // --- Company ---
  const handleSaveCompany = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await api.settings.updateCompany(settings);
      setSettings(updated);
      addToast('Configuración guardada', 'success');
    } catch {
      addToast('Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { logoUrl } = await api.settings.uploadLogo(file);
      setSettings(s => s ? { ...s, logoUrl } : s);
      addToast('Logo actualizado', 'success');
    } catch {
      addToast('Error al subir logo', 'error');
    }
  };

  // --- Technicians ---
  const handleSaveTech = async () => {
    if (!techForm.name.trim()) {
      addToast('El nombre es requerido', 'warning');
      return;
    }
    const signature = techSigRef.current?.isEmpty() ? '' : techSigRef.current?.toDataURL() || '';
    try {
      if (editingTech) {
        const updated = await api.settings.updateTechnician(editingTech.id, { ...techForm, signature });
        setTechnicians(prev => prev.map(t => t.id === editingTech.id ? updated : t));
        addToast('Técnico actualizado');
      } else {
        const created = await api.settings.createTechnician({ ...techForm, signature });
        setTechnicians(prev => [...prev, created]);
        addToast('Técnico registrado');
      }
      closeTechForm();
    } catch {
      addToast('Error al guardar técnico', 'error');
    }
  };

  const handleDeleteTech = async (id: string) => {
    if (confirm('¿Eliminar este técnico?')) {
      try {
        await api.settings.deleteTechnician(id);
        setTechnicians(prev => prev.filter(t => t.id !== id));
        addToast('Técnico eliminado');
      } catch {
        addToast('Error al eliminar', 'error');
      }
    }
  };

  const openEditTech = (tech: Technician) => {
    setEditingTech(tech);
    setTechForm({ name: tech.name, role: tech.role, email: tech.email, phone: tech.phone });
    setShowTechForm(true);
  };

  const closeTechForm = () => {
    setShowTechForm(false);
    setEditingTech(null);
    setTechForm({ name: '', role: '', email: '', phone: '' });
  };

  // --- Layout ---
  const handleSaveLayout = async () => {
    if (!activeLayout) return;
    setSaving(true);
    try {
      const updated = await api.settings.updateLayout(activeLayout.id, activeLayout);
      setActiveLayout(updated);
      addToast('Diseño de reporte guardado', 'success');
    } catch {
      addToast('Error al guardar diseño', 'error');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'company' as const, label: 'Empresa', icon: Building2 },
    { id: 'technicians' as const, label: 'Técnicos', icon: User },
  ];

  return (
    <div className="settings page-enter">
      <div className="settings__tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`settings__tab ${tab === t.id ? 'settings__tab--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* ===== COMPANY ===== */}
      {tab === 'company' && settings && (
        <div className="settings__panel animate-slide-up">
          <h2 className="settings__panel-title">Datos de la Empresa</h2>
          <p className="settings__panel-desc">Esta información aparecerá en los encabezados de los reportes</p>

          <div className="settings__logo-section">
            <div className="settings__logo-preview">
              {settings.logoUrl ? (
                <img src={`http://localhost:3001${settings.logoUrl}`} alt="Logo" />
              ) : (
                <div className="settings__logo-placeholder">
                  <Upload size={24} />
                  <span>Sin logo</span>
                </div>
              )}
            </div>
            <div>
              <label className="btn btn--outline btn--sm">
                <Upload size={14} /> Subir Logo
                <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
              </label>
              <p className="settings__hint">PNG o JPG, máximo 5MB</p>
            </div>
          </div>

          <div className="form-grid" style={{ marginTop: 'var(--space-6)' }}>
            <div className="form-group">
              <label className="form-label">Nombre de la empresa</label>
              <input className="form-input" value={settings.companyName} onChange={e => setSettings(s => s ? { ...s, companyName: e.target.value } : s)} />
            </div>
            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input className="form-input" value={settings.phone} onChange={e => setSettings(s => s ? { ...s, phone: e.target.value } : s)} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={settings.email} onChange={e => setSettings(s => s ? { ...s, email: e.target.value } : s)} />
            </div>
            <div className="form-group">
              <label className="form-label">Sitio Web</label>
              <input className="form-input" value={settings.website} onChange={e => setSettings(s => s ? { ...s, website: e.target.value } : s)} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Dirección</label>
              <input className="form-input" value={settings.address} onChange={e => setSettings(s => s ? { ...s, address: e.target.value } : s)} />
            </div>
            <div className="form-group">
              <label className="form-label">Prefijo de Reportes</label>
              <input className="form-input" value={settings.reportPrefix} onChange={e => setSettings(s => s ? { ...s, reportPrefix: e.target.value } : s)} placeholder="SVC" />
            </div>
            <div className="form-group">
              <label className="form-label">Texto de Pie de Página</label>
              <input className="form-input" value={settings.footerText} onChange={e => setSettings(s => s ? { ...s, footerText: e.target.value } : s)} />
            </div>
          </div>

          <h3 className="settings__subtitle">Colores del Reporte</h3>
          <div className="settings__colors">
            <div className="settings__color-item">
              <label className="form-label">Color Primario</label>
              <div className="settings__color-input">
                <input type="color" value={settings.primaryColor} onChange={e => setSettings(s => s ? { ...s, primaryColor: e.target.value } : s)} />
                <span className="text-mono">{settings.primaryColor}</span>
              </div>
            </div>
            <div className="settings__color-item">
              <label className="form-label">Color Secundario</label>
              <div className="settings__color-input">
                <input type="color" value={settings.secondaryColor} onChange={e => setSettings(s => s ? { ...s, secondaryColor: e.target.value } : s)} />
                <span className="text-mono">{settings.secondaryColor}</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 'var(--space-6)' }}>
            <button className="btn btn--primary" onClick={handleSaveCompany} disabled={saving}>
              <Save size={16} /> {saving ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </div>
      )}

      {/* ===== TECHNICIANS ===== */}
      {tab === 'technicians' && (
        <div className="settings__panel animate-slide-up">
          <div className="settings__panel-header-row">
            <div>
              <h2 className="settings__panel-title">Técnicos Registrados</h2>
              <p className="settings__panel-desc">Gestiona los técnicos que realizan los servicios</p>
            </div>
            <button className="btn btn--primary btn--sm" onClick={() => { closeTechForm(); setShowTechForm(true); }}>
              <Plus size={16} /> Nuevo Técnico
            </button>
          </div>

          {technicians.length === 0 && !showTechForm ? (
            <div className="settings__empty">
              <User size={40} />
              <p>No hay técnicos registrados</p>
              <button className="btn btn--outline btn--sm" onClick={() => setShowTechForm(true)}>
                <Plus size={14} /> Agregar primer técnico
              </button>
            </div>
          ) : (
            <div className="tech-list">
              {technicians.map(tech => (
                <div key={tech.id} className="tech-card">
                  <div className="tech-card__avatar">
                    {tech.signature ? (
                      <img src={tech.signature} alt="Firma" className="tech-card__sig-preview" />
                    ) : (
                      <span>{tech.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="tech-card__info">
                    <span className="tech-card__name">{tech.name}</span>
                    <span className="tech-card__role">{tech.role || 'Sin rol asignado'}</span>
                    {tech.email && <span className="tech-card__contact">{tech.email}</span>}
                  </div>
                  <div className="tech-card__status">
                    <span className={`tech-card__badge ${tech.isActive ? 'tech-card__badge--active' : 'tech-card__badge--inactive'}`}>
                      {tech.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <div className="tech-card__actions">
                    <button className="btn btn--ghost btn--sm" onClick={() => openEditTech(tech)}>
                      <Edit3 size={14} />
                    </button>
                    <button className="btn btn--ghost btn--sm" onClick={() => handleDeleteTech(tech.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tech Form Modal */}
          {showTechForm && (
            <div className="modal-overlay" onClick={closeTechForm}>
              <div className="modal animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="modal__header">
                  <h2>{editingTech ? 'Editar Técnico' : 'Nuevo Técnico'}</h2>
                  <button className="modal__close" onClick={closeTechForm}><X size={20} /></button>
                </div>
                <div className="modal__body">
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Nombre completo *</label>
                      <input className="form-input" value={techForm.name} onChange={e => setTechForm(f => ({ ...f, name: e.target.value }))} placeholder="Juan Pérez" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Rol / Cargo</label>
                      <input className="form-input" value={techForm.role} onChange={e => setTechForm(f => ({ ...f, role: e.target.value }))} placeholder="Ingeniero Biomédico" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input className="form-input" type="email" value={techForm.email} onChange={e => setTechForm(f => ({ ...f, email: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Teléfono</label>
                      <input className="form-input" value={techForm.phone} onChange={e => setTechForm(f => ({ ...f, phone: e.target.value }))} />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: 'var(--space-5)' }}>
                    <label className="form-label">Firma Digital (con dedo o mouse)</label>
                    <div className="settings__sig-area">
                      <SignatureCanvas
                        ref={techSigRef}
                        penColor="#1C1C1E"
                        canvasProps={{ className: 'settings__sig-canvas', width: 480, height: 160 }}
                      />
                      <button className="btn btn--ghost btn--sm" onClick={() => techSigRef.current?.clear()}>
                        Limpiar firma
                      </button>
                    </div>
                  </div>
                </div>
                <div className="modal__footer">
                  <button className="btn btn--outline" onClick={closeTechForm}>Cancelar</button>
                  <button className="btn btn--primary" onClick={handleSaveTech}>
                    {editingTech ? 'Actualizar' : 'Registrar'} Técnico
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

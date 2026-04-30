import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, GripVertical, Save, Sparkles,
  Type, Hash, ToggleLeft, Calendar, CheckSquare, List,
  AlignLeft, AlignCenter, AlignRight, PenTool, Ruler, MousePointer,
  Copy, ChevronUp, ChevronDown, Minus, StickyNote, Image, Settings2,
  Square,
} from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { useEquipmentStore } from '../store/equipmentStore';
import { useTemplateStore } from '../store/templateStore';
import { useAppStore } from '../store/appStore';
import { SERVICE_TYPE_LABELS, VARIABLE_TYPE_LABELS } from '../types';
import type { TemplateBlock, TemplateVariable, ServiceType, VariableType } from '../types';
import AIPDFImport from '../components/AIPDFImport';
import './TemplateBuilder.css';

// ── Types ──
interface Section extends TemplateBlock {
  color?: string;
  align?: 'left' | 'center' | 'right';
  borderStyle?: 'default' | 'none' | 'full' | 'bottom';
}

// ── Constants ──
const FIELD_TYPES: { type: VariableType; icon: typeof Type; label: string; category?: string }[] = [
  { type: 'pass_fail', icon: ToggleLeft, label: 'Aprobado/Falla' },
  { type: 'text', icon: Type, label: 'Texto' },
  { type: 'measurement', icon: Ruler, label: 'Medición' },
  { type: 'checkbox', icon: CheckSquare, label: 'Casilla' },
  { type: 'number', icon: Hash, label: 'Número' },
  { type: 'select', icon: List, label: 'Lista' },
  { type: 'textarea', icon: AlignLeft, label: 'Párrafo' },
  { type: 'date', icon: Calendar, label: 'Fecha' },
  { type: 'signature', icon: PenTool, label: 'Firma' },
  { type: 'image', icon: Image, label: 'Foto/Imagen' },
];

const LAYOUT_TYPES: { type: VariableType; icon: typeof Type; label: string }[] = [
  { type: 'divider', icon: Minus, label: 'Línea Divisoria' },
  { type: 'note', icon: StickyNote, label: 'Nota / Texto' },
];

const ACCENT_COLORS = ['#c8102e','#1d4ed8','#15803d','#b91c1c','#7c3aed','#0f766e','#1e293b','#ea580c'];

const SECTION_COLORS = ['#c8102e','#2563eb','#16a34a','#ea580c','#7c3aed','#0891b2','#374151'];

const FIELD_SAMPLE: Record<string, string> = {
  pass_fail: '✅  ❌',
  text: '________________',
  measurement: '___ unidad',
  checkbox: '☐',
  number: '0',
  select: '▼ Opción',
  textarea: 'Observaciones...',
  date: 'DD/MM/YYYY',
  signature: '✍',
  image: '🖼',
  divider: '',
  note: '📝 Nota',
  watermark: '◈ BORRADOR',
};

function makeVar(type: VariableType = 'text'): TemplateVariable {
  return { id: uuid(), label: '', type, options: [], unit: '', defaultValue: '', isRequired: false, placeholder: '' };
}

function makeSection(order: number): Section {
  return { id: uuid(), title: '', description: '', order, variables: [], isRequired: true, color: SECTION_COLORS[order % SECTION_COLORS.length] };
}

// ── Main Component ──
export default function TemplateBuilder() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { items: equipment, fetch: fetchEquipment } = useEquipmentStore();
  const { create, update, getById } = useTemplateStore();
  const { addToast } = useAppStore();

  const isEditing = !!id;
  const [equipmentId, setEquipmentId] = useState(searchParams.get('equipmentId') || '');
  const [name, setName] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('preventive_maintenance');
  const [sections, setSections] = useState<Section[]>([]);
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [activeField, setActiveField] = useState<{ sectionId: string; fieldId: string } | null>(null);
  // Global paper settings
  const [watermarkText, setWatermarkText] = useState('');
  const [accentColor, setAccentColor] = useState('#c8102e');
  const [showPaperSettings, setShowPaperSettings] = useState(false);

  useEffect(() => { fetchEquipment(); }, []);

  useEffect(() => {
    if (id) {
      getById(id).then(tpl => {
        setEquipmentId(tpl.equipmentId);
        setName(tpl.name);
        setServiceType(tpl.serviceType as ServiceType);
        setSections(tpl.blocks.map((b, i) => ({ ...b, color: SECTION_COLORS[i % SECTION_COLORS.length] })));
        setIsDefault(tpl.isDefault);
      });
    }
  }, [id]);

  // ── Section ops ──
  const addSection = () => {
    const s = makeSection(sections.length);
    setSections(p => [...p, s]);
    setActiveSection(s.id);
    setActiveField(null);
  };

  const updateSection = (sId: string, data: Partial<Section>) =>
    setSections(p => p.map(s => s.id === sId ? { ...s, ...data } : s));

  const deleteSection = (sId: string) => {
    setSections(p => p.filter(s => s.id !== sId).map((s, i) => ({ ...s, order: i + 1 })));
    if (activeSection === sId) setActiveSection(null);
    if (activeField?.sectionId === sId) setActiveField(null);
  };

  const moveSection = (sId: string, dir: -1 | 1) => {
    setSections(p => {
      const idx = p.findIndex(s => s.id === sId);
      if (idx + dir < 0 || idx + dir >= p.length) return p;
      const arr = [...p];
      [arr[idx], arr[idx + dir]] = [arr[idx + dir], arr[idx]];
      return arr.map((s, i) => ({ ...s, order: i + 1 }));
    });
  };

  const duplicateSection = (s: Section) => {
    const ns: Section = { ...s, id: uuid(), title: `${s.title} (copia)`, order: sections.length + 1, variables: s.variables.map(v => ({ ...v, id: uuid() })) };
    setSections(p => [...p, ns]);
  };

  // ── Field ops ──
  const addField = (sId: string, type: VariableType) => {
    const v = makeVar(type);
    setSections(p => p.map(s => s.id === sId ? { ...s, variables: [...s.variables, v] } : s));
    setActiveSection(sId);
    setActiveField({ sectionId: sId, fieldId: v.id });
  };

  const updateField = (sId: string, fId: string, data: Partial<TemplateVariable>) =>
    setSections(p => p.map(s => s.id === sId ? { ...s, variables: s.variables.map(v => v.id === fId ? { ...v, ...data } : v) } : s));

  const deleteField = (sId: string, fId: string) => {
    setSections(p => p.map(s => s.id === sId ? { ...s, variables: s.variables.filter(v => v.id !== fId) } : s));
    if (activeField?.fieldId === fId) setActiveField(null);
  };


  // ── AI Import ──
  const handleAIImport = (blocks: TemplateBlock[]) => {
    const offset = sections.length;
    setSections(p => [...p, ...blocks.map((b, i) => ({ ...b, order: offset + i + 1, color: SECTION_COLORS[(offset + i) % SECTION_COLORS.length] }))]);
    setShowAI(false);
    addToast(`${blocks.length} secciones importadas`, 'success');
  };

  // ── Save ──
  const handleSave = async () => {
    if (!equipmentId) { addToast('Selecciona un equipo', 'warning'); return; }
    if (!name.trim()) { addToast('Agrega un nombre a la plantilla', 'warning'); return; }
    if (sections.length === 0) { addToast('Agrega al menos una sección', 'warning'); return; }
    setSaving(true);
    try {
      const data = { equipmentId, name, serviceType, isDefault, blocks: sections.map(({ color, ...s }, i) => ({ ...s, order: i + 1 })) };
      if (isEditing) { await update(id!, data); addToast('Plantilla actualizada', 'success'); }
      else { await create(data); addToast('Plantilla creada', 'success'); }
      navigate(equipmentId ? `/equipment/${equipmentId}` : '/templates');
    } catch { addToast('Error al guardar', 'error'); }
    finally { setSaving(false); }
  };

  // ── Derived ──
  const selectedEq = equipment.find(e => e.id === equipmentId);
  const activeSec = sections.find(s => s.id === activeSection);
  const activeFieldData = activeField ? activeSec?.variables.find(v => v.id === activeField.fieldId) : null;

  return (
    <div className="tb">
      {/* ── Toolbar ── */}
      <div className="tb__toolbar">
        <div className="tb__toolbar-left">
          <button className="btn btn--ghost btn--sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
          </button>
          <input
            className="tb__title-input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nombre de la plantilla..."
          />
        </div>
        <div className="tb__toolbar-center">
          <select className="tb__eq-select" value={equipmentId} onChange={e => setEquipmentId(e.target.value)} disabled={isEditing}>
            <option value="">Seleccionar equipo...</option>
            {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
          </select>
          <select className="tb__type-select" value={serviceType} onChange={e => setServiceType(e.target.value as ServiceType)}>
            {Object.entries(SERVICE_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="tb__toolbar-right">
          <button className="tb__ai-btn" onClick={() => setShowPaperSettings(p => !p)} title="Configuración del formato" style={showPaperSettings ? { background: 'rgba(139,92,246,0.18)' } : undefined}>
            <Settings2 size={14} /> Formato
          </button>
          <button className="tb__ai-btn" onClick={() => setShowAI(true)}>
            <Sparkles size={14} /> IA: Leer PDF
          </button>
          <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
            <Save size={15} /> {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="tb__body">
        {/* LEFT palette */}
        <div className="tb__palette">
          <div>
            <div className="tb__palette-section-title">Campos de datos</div>
            <div className="tb__palette-grid">
              {FIELD_TYPES.map(ft => {
                const Icon = ft.icon;
                return (
                  <button
                    key={ft.type}
                    className="tb__palette-item"
                    onClick={() => {
                      if (sections.length === 0) { addSection(); return; }
                      const target = activeSection || sections[sections.length - 1]?.id;
                      if (target) addField(target, ft.type);
                      else addToast('Agrega una sección primero', 'warning');
                    }}
                    title={ft.label}
                  >
                    <Icon size={16} />
                    {ft.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="tb__palette-section-title">Diseño y layout</div>
            <div className="tb__palette-grid">
              {LAYOUT_TYPES.map(ft => {
                const Icon = ft.icon;
                return (
                  <button
                    key={ft.type}
                    className="tb__palette-item"
                    onClick={() => {
                      if (sections.length === 0) { addSection(); return; }
                      const target = activeSection || sections[sections.length - 1]?.id;
                      if (target) addField(target, ft.type);
                      else addToast('Agrega una sección primero', 'warning');
                    }}
                    title={ft.label}
                  >
                    <Icon size={16} />
                    {ft.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="tb__palette-section-title">Estructura</div>
            <button className="tb__palette-add-section" onClick={addSection}>
              <Plus size={13} /> Nueva Sección
            </button>
          </div>
        </div>

        {/* CENTER canvas */}
        <div className="tb__canvas-area" onClick={() => { setActiveSection(null); setActiveField(null); }}>
          <div className="tb__paper" onClick={e => e.stopPropagation()}>
            {/* Watermark overlay */}
            {watermarkText && (
              <div className="tb__watermark-overlay">
                <span className="tb__watermark-text" style={{ color: `${accentColor}10` }}>{watermarkText}</span>
              </div>
            )}

            {/* Paper header */}
            <div className="tb__paper-header" style={{ borderBottomColor: accentColor }}>
              <div className="tb__paper-header-inner">
                <div className="tb__paper-logo-area">
                  <div className="tb__paper-logo">LOGO</div>
                  <div>
                    <div className="tb__paper-company">Mi Empresa S.A.</div>
                    <div className="tb__paper-title" style={{ color: accentColor }}>REPORTE DE SERVICIO</div>
                    <div className="tb__paper-number">SVC-2026-XXXX</div>
                  </div>
                </div>
                <div className="tb__paper-badge">COMPLETADO</div>
              </div>
            </div>

            {/* Info row */}
            <div className="tb__paper-info">
              {[
                { label: 'Equipo', value: selectedEq?.name || 'Nombre del equipo' },
                { label: 'Tipo de servicio', value: SERVICE_TYPE_LABELS[serviceType] || serviceType },
                { label: 'Técnico', value: 'Juan Pérez' },
                { label: 'Fecha', value: new Date().toLocaleDateString('es-MX') },
              ].map(c => (
                <div key={c.label} className="tb__paper-info-cell">
                  <div className="tb__paper-info-label">{c.label}</div>
                  <div className="tb__paper-info-value">{c.value}</div>
                </div>
              ))}
            </div>

            {/* Sections */}
            <div className="tb__sections">
              {sections.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#bbb' }}>
                  <MousePointer size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
                  <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Tu reporte aparecerá aquí</p>
                  <p style={{ fontSize: 11 }}>Agrega una sección desde la izquierda o haz clic en<br />"Nueva Sección"</p>
                  <button className="tb__add-section-btn" style={{ marginTop: 16 }} onClick={addSection}>
                    <Plus size={14} /> Agregar primera sección
                  </button>
                </div>
              ) : (
                <>
                  {sections.map((sec, si) => (
                    <div
                      key={sec.id}
                      className={`tb__section ${activeSection === sec.id && !activeField ? 'tb__section--active' : ''} ${sec.align ? `tb__section--align-${sec.align}` : ''} ${sec.borderStyle && sec.borderStyle !== 'default' ? `tb__section--border-${sec.borderStyle}` : ''}`}
                      onClick={() => { setActiveSection(sec.id); setActiveField(null); }}
                    >
                      <div className="tb__section-header" style={{ borderLeft: `3px solid ${sec.color}` }}>
                        <div className="tb__section-drag" title="Reordenar">
                          <GripVertical size={14} />
                        </div>
                        <span className="tb__section-num" style={{ background: sec.color }}>{si + 1}</span>
                        <input
                          className="tb__section-title-input"
                          value={sec.title}
                          onClick={e => e.stopPropagation()}
                          onChange={e => updateSection(sec.id, { title: e.target.value })}
                          placeholder="Nombre de la sección..."
                        />
                        <div className="tb__section-actions">
                          <button className="tb__section-action" onClick={e => { e.stopPropagation(); moveSection(sec.id, -1); }} title="Subir" disabled={si === 0}><ChevronUp size={12} /></button>
                          <button className="tb__section-action" onClick={e => { e.stopPropagation(); moveSection(sec.id, 1); }} title="Bajar" disabled={si === sections.length - 1}><ChevronDown size={12} /></button>
                          <button className="tb__section-action" onClick={e => { e.stopPropagation(); duplicateSection(sec); }} title="Duplicar"><Copy size={12} /></button>
                          <button className="tb__section-action tb__section-action--danger" onClick={e => { e.stopPropagation(); deleteSection(sec.id); }} title="Eliminar"><Trash2 size={12} /></button>
                        </div>
                      </div>

                      {/* Fields */}
                      <div className="tb__fields">
                        {sec.variables.map((field) => {
                          const allTypes = [...FIELD_TYPES, ...LAYOUT_TYPES];
                          const FIcon = allTypes.find(f => f.type === field.type)?.icon || Type;
                          const isActive = activeField?.fieldId === field.id;

                          // Divider special rendering
                          if (field.type === 'divider') {
                            return (
                              <div key={field.id}
                                className={`tb__field tb__field--divider ${isActive ? 'tb__field--active' : ''}`}
                                onClick={e => { e.stopPropagation(); setActiveSection(sec.id); setActiveField({ sectionId: sec.id, fieldId: field.id }); }}
                              >
                                <div className="tb__field-divider-line" />
                                <button className="tb__field-delete" onClick={e => { e.stopPropagation(); deleteField(sec.id, field.id); }}><Trash2 size={10} /></button>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={field.id}
                              className={`tb__field ${field.type === 'note' ? 'tb__field--note' : ''} ${field.type === 'watermark' ? 'tb__field--watermark' : ''} ${isActive ? 'tb__field--active' : ''}`}
                              onClick={e => { e.stopPropagation(); setActiveSection(sec.id); setActiveField({ sectionId: sec.id, fieldId: field.id }); }}
                            >
                              <div className="tb__field-drag"><GripVertical size={11} /></div>
                              <div className="tb__field-icon" style={{ background: `${sec.color}18`, color: sec.color }}>
                                <FIcon size={11} />
                              </div>
                              <span className={`tb__field-label ${!field.label ? 'tb__field-label--empty' : ''}`}>
                                {field.label || `${VARIABLE_TYPE_LABELS[field.type] || field.type}`}
                                {field.isRequired && <span style={{ color: '#c8102e', marginLeft: 2 }}>*</span>}
                                {field.unit && <span style={{ color: '#aaa', fontWeight: 400 }}> ({field.unit})</span>}
                              </span>
                              <span className="tb__field-value">{FIELD_SAMPLE[field.type] ?? ''}</span>
                              <button className="tb__field-delete" onClick={e => { e.stopPropagation(); deleteField(sec.id, field.id); }}><Trash2 size={10} /></button>
                            </div>
                          );
                        })}
                        {/* Add field hint */}
                        <div className="tb__section-add-hint" onClick={e => { e.stopPropagation(); setActiveSection(sec.id); }}>
                          <Plus size={12} /> Haz clic en un campo del panel izquierdo para agregar aquí
                        </div>
                      </div>
                    </div>
                  ))}
                  <button className="tb__add-section-btn" onClick={addSection}>
                    <Plus size={14} /> Agregar sección
                  </button>
                </>
              )}
            </div>

            {/* Signatures */}
            {sections.length > 0 && (
              <>
                <div className="tb__paper-sigs">
                  {['Técnico Responsable', 'Supervisor / Aprobador'].map(label => (
                    <div key={label} className="tb__paper-sig">
                      <div className="tb__paper-sig-line" />
                      <span className="tb__paper-sig-label">{label}</span>
                    </div>
                  ))}
                </div>
                <div className="tb__paper-footer">
                  <span>Generado por Reports Creator</span>
                  <span>Página 1 de 1</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT properties panel */}
        <div className="tb__props">
          <div className="tb__props-header">
            {activeFieldData ? 'Propiedades del campo' : activeSec ? 'Propiedades de la sección' : 'Propiedades'}
          </div>
          <div className="tb__props-body">
            {/* Field properties */}
            {activeFieldData && activeField && (
              <>
                {/* Divider has no label */}
                {activeFieldData.type !== 'divider' && (
                  <div className="tb__prop-group">
                    <div className="tb__prop-label">{activeFieldData.type === 'note' ? 'Contenido de la nota' : activeFieldData.type === 'watermark' ? 'Texto de marca de agua' : 'Etiqueta del campo'}</div>
                    <input
                      className="tb__prop-input"
                      value={activeFieldData.label}
                      onChange={e => updateField(activeField.sectionId, activeField.fieldId, { label: e.target.value })}
                      placeholder={activeFieldData.type === 'note' ? 'Ej: Verificar antes de proceder...' : activeFieldData.type === 'watermark' ? 'BORRADOR, CONFIDENCIAL...' : 'Ej: Estado de carcasa...'}
                      autoFocus
                    />
                  </div>
                )}

                {/* Only show type grid for data fields */}
                {!['divider','note','watermark'].includes(activeFieldData.type) && (
                  <div className="tb__prop-group">
                    <div className="tb__prop-label">Tipo de campo</div>
                    <div className="tb__prop-type-grid">
                      {FIELD_TYPES.map(ft => {
                        const Icon = ft.icon;
                        return (
                          <button key={ft.type} className={`tb__prop-type-btn ${activeFieldData.type === ft.type ? 'tb__prop-type-btn--active' : ''}`} onClick={() => updateField(activeField.sectionId, activeField.fieldId, { type: ft.type })}>
                            <Icon size={13} />{ft.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="tb__prop-divider" />

                {activeFieldData.type === 'measurement' && (
                  <div className="tb__prop-group">
                    <div className="tb__prop-label">Unidad</div>
                    <input className="tb__prop-input" value={activeFieldData.unit} onChange={e => updateField(activeField.sectionId, activeField.fieldId, { unit: e.target.value })} placeholder="Ej: kPa, g/dL, °C" />
                  </div>
                )}

                {activeFieldData.type === 'select' && (
                  <div className="tb__prop-group">
                    <div className="tb__prop-label">Opciones (una por línea)</div>
                    <textarea
                      className="tb__prop-input"
                      rows={4}
                      value={activeFieldData.options.join('\n')}
                      onChange={e => updateField(activeField.sectionId, activeField.fieldId, { options: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })}
                      placeholder={"Opción 1\nOpción 2\nOpción 3"}
                      style={{ resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  </div>
                )}

                {['text', 'textarea', 'number', 'measurement'].includes(activeFieldData.type) && (
                  <div className="tb__prop-group">
                    <div className="tb__prop-label">Texto de ayuda</div>
                    <input className="tb__prop-input" value={activeFieldData.placeholder} onChange={e => updateField(activeField.sectionId, activeField.fieldId, { placeholder: e.target.value })} placeholder="Ej: Ingrese el valor medido..." />
                  </div>
                )}

                <div className="tb__prop-row">
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>Campo requerido</span>
                  <label className="tb__prop-toggle">
                    <input type="checkbox" checked={activeFieldData.isRequired} onChange={e => updateField(activeField.sectionId, activeField.fieldId, { isRequired: e.target.checked })} />
                    <div className="tb__prop-toggle-track" />
                  </label>
                </div>

                <div className="tb__prop-divider" />
                <button className="btn btn--outline btn--sm" style={{ color: '#c00', borderColor: '#fca5a5' }} onClick={() => deleteField(activeField.sectionId, activeField.fieldId)}>
                  <Trash2 size={13} /> Eliminar campo
                </button>
              </>
            )}

            {/* Section properties */}
            {!activeFieldData && activeSec && (
              <>
                <div className="tb__prop-group">
                  <div className="tb__prop-label">Nombre de la sección</div>
                  <input className="tb__prop-input" value={activeSec.title} onChange={e => updateSection(activeSec.id, { title: e.target.value })} placeholder="Ej: Inspección Visual..." autoFocus />
                </div>
                <div className="tb__prop-group">
                  <div className="tb__prop-label">Descripción</div>
                  <input className="tb__prop-input" value={activeSec.description} onChange={e => updateSection(activeSec.id, { description: e.target.value })} placeholder="Descripción opcional..." />
                </div>
                <div className="tb__prop-divider" />

                <div className="tb__prop-group">
                  <div className="tb__prop-label">Alineación del título</div>
                  <div className="tb__prop-type-grid">
                    {([['left', AlignLeft, 'Izquierda'], ['center', AlignCenter, 'Centro'], ['right', AlignRight, 'Derecha']] as const).map(([val, Icon, lbl]) => (
                      <button key={val} className={`tb__prop-type-btn ${(activeSec.align || 'left') === val ? 'tb__prop-type-btn--active' : ''}`} onClick={() => updateSection(activeSec.id, { align: val } as any)}>
                        <Icon size={14} />{lbl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="tb__prop-group">
                  <div className="tb__prop-label">Estilo del borde</div>
                  <div className="tb__prop-type-grid">
                    {([['default', 'Normal'], ['none', 'Sin borde'], ['full', 'Con marco'], ['bottom', 'Solo inferior']] as const).map(([val, lbl]) => (
                      <button key={val} className={`tb__prop-type-btn ${(activeSec.borderStyle || 'default') === val ? 'tb__prop-type-btn--active' : ''}`} onClick={() => updateSection(activeSec.id, { borderStyle: val } as any)}>
                        <Square size={12} />{lbl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="tb__prop-group">
                  <div className="tb__prop-label">Color</div>
                  <div className="tb__prop-color-row">
                    {SECTION_COLORS.map(c => (
                      <button key={c} className={`tb__prop-color ${activeSec.color === c ? 'tb__prop-color--active' : ''}`} style={{ background: c }} onClick={() => updateSection(activeSec.id, { color: c } as any)} />
                    ))}
                  </div>
                </div>

                <div className="tb__prop-row">
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Sección requerida</span>
                  <label className="tb__prop-toggle">
                    <input type="checkbox" checked={activeSec.isRequired} onChange={e => updateSection(activeSec.id, { isRequired: e.target.checked })} />
                    <div className="tb__prop-toggle-track" />
                  </label>
                </div>
                <div className="tb__prop-divider" />
                <div className="tb__prop-group">
                  <div className="tb__prop-label">Agregar campo rápido</div>
                  <div className="tb__prop-type-grid">
                    {FIELD_TYPES.slice(0, 6).map(ft => {
                      const Icon = ft.icon;
                      return (
                        <button key={ft.type} className="tb__prop-type-btn" onClick={() => addField(activeSec.id, ft.type)}>
                          <Icon size={14} />{ft.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="tb__prop-divider" />
                <button className="btn btn--outline btn--sm" style={{ color: '#c00', borderColor: '#fca5a5' }} onClick={() => deleteSection(activeSec.id)}>
                  <Trash2 size={13} /> Eliminar sección
                </button>
              </>
            )}

            {/* Empty / Paper settings state */}
            {!activeFieldData && !activeSec && (
              <div className="tb__props-body" style={{ gap: 'var(--space-3)' }}>
                <div className="tb__prop-group">
                  <div className="tb__prop-label">Color de acento</div>
                  <div className="tb__prop-color-row">
                    {ACCENT_COLORS.map(c => (
                      <button key={c} className={`tb__prop-color ${accentColor === c ? 'tb__prop-color--active' : ''}`} style={{ background: c }} onClick={() => setAccentColor(c)} />
                    ))}
                  </div>
                </div>
                <div className="tb__prop-group">
                  <div className="tb__prop-label">Marca de agua</div>
                  <input className="tb__prop-input" value={watermarkText} onChange={e => setWatermarkText(e.target.value)} placeholder="Ej: BORRADOR, CONFIDENCIAL..." />
                </div>
                <div className="tb__prop-divider" />
                <div style={{ textAlign: 'center', color: '#aaa', fontSize: 11, lineHeight: 1.5 }}>
                  <MousePointer size={24} style={{ opacity: 0.3, margin: '0 auto 8px', display: 'block' }} />
                  Selecciona una sección o campo para ver sus propiedades
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Panel modal */}
      {showAI && (
        <div className="tb__ai-panel">
          <div className="tb__ai-panel-inner">
            <AIPDFImport
              equipmentName={selectedEq?.name || 'Equipo médico'}
              onImport={handleAIImport}
              onClose={() => setShowAI(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

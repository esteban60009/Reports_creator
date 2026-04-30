import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, GripVertical,
  ChevronDown, ChevronUp, Save, Eye, EyeOff,
  Copy, Settings2, Type, Hash, ToggleLeft,
  Calendar, CheckSquare, List, AlignLeft,
  PenTool, Image, Ruler, Sparkles, HelpCircle,
} from 'lucide-react';
import {
  DndContext, closestCenter, KeyboardSensor,
  PointerSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { v4 as uuid } from 'uuid';
import { useEquipmentStore } from '../store/equipmentStore';
import { useTemplateStore } from '../store/templateStore';
import { useAppStore } from '../store/appStore';
import { SERVICE_TYPE_LABELS, VARIABLE_TYPE_LABELS } from '../types';
import type { TemplateBlock, TemplateVariable, ServiceType, VariableType } from '../types';
import AIPDFImport from '../components/AIPDFImport';
import TemplateLivePreview from '../components/TemplateLivePreview';
import './TemplateEditor.css';

const VARIABLE_TYPE_ICONS: Record<VariableType, typeof Type> = {
  text: Type, textarea: AlignLeft, number: Hash, measurement: Ruler,
  select: List, checkbox: CheckSquare, date: Calendar,
  pass_fail: ToggleLeft, signature: PenTool, image: Image,
};

const BLOCK_COLORS = [
  { label: 'Rojo', value: '#c8102e' },
  { label: 'Azul', value: '#2563eb' },
  { label: 'Verde', value: '#16a34a' },
  { label: 'Naranja', value: '#ea580c' },
  { label: 'Violeta', value: '#7c3aed' },
  { label: 'Gris', value: '#6b7280' },
];

/* ─── Sortable Block ─── */
function SortableBlock({
  block, index, isExpanded, onToggle, onUpdate,
  onDelete, onDuplicate, onAddVariable, onUpdateVariable, onDeleteVariable,
}: {
  block: TemplateBlock; index: number; isExpanded: boolean;
  onToggle: () => void; onUpdate: (d: Partial<TemplateBlock>) => void;
  onDelete: () => void; onDuplicate: () => void;
  onAddVariable: () => void;
  onUpdateVariable: (id: string, d: Partial<TemplateVariable>) => void;
  onDeleteVariable: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.45 : 1, zIndex: isDragging ? 99 : 1 };
  const accent = (block as any).color || '#c8102e';

  return (
    <div ref={setNodeRef} style={style} className={`te-block ${isExpanded ? 'te-block--expanded' : ''}`}>
      <div className="te-block__header" style={{ borderLeft: `3px solid ${accent}` }}>
        <div className="te-block__header-left">
          <button className="te-block__drag" {...attributes} {...listeners} title="Arrastrar">
            <GripVertical size={15} />
          </button>
          <span className="te-block__number" style={{ background: accent }}>{index + 1}</span>
          <input
            className="te-block__title-input"
            value={block.title}
            onChange={e => onUpdate({ title: e.target.value })}
            placeholder="Nombre del bloque..."
          />
        </div>
        <div className="te-block__header-right">
          {/* Color picker */}
          <div className="te-block__colors">
            {BLOCK_COLORS.map(c => (
              <button
                key={c.value}
                className={`te-block__color-dot ${accent === c.value ? 'te-block__color-dot--active' : ''}`}
                style={{ background: c.value }}
                title={c.label}
                onClick={() => onUpdate({ ...block, color: c.value } as any)}
              />
            ))}
          </div>
          <label className="te-block__required">
            <input type="checkbox" checked={block.isRequired} onChange={e => onUpdate({ isRequired: e.target.checked })} />
            <span>Req.</span>
          </label>
          <span className="te-block__var-count">{block.variables.length} var.</span>
          <button className="te-block__btn" onClick={onDuplicate} title="Duplicar bloque"><Copy size={13} /></button>
          <button className="te-block__btn te-block__btn--danger" onClick={onDelete} title="Eliminar"><Trash2 size={13} /></button>
          <button className="te-block__btn" onClick={onToggle}>
            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="te-block__body">
          <input
            className="form-input te-block__desc-input"
            value={block.description}
            onChange={e => onUpdate({ description: e.target.value })}
            placeholder="Descripción del bloque (opcional)..."
          />

          <div className="te-vars">
            <div className="te-vars__header">
              <span className="te-vars__title">Variables ({block.variables.length})</span>
              <button className="btn btn--primary btn--sm" onClick={onAddVariable}>
                <Plus size={13} /> Variable
              </button>
            </div>

            {block.variables.length === 0 ? (
              <div className="te-vars__empty">
                <p>Sin variables. Presiona <strong>+ Variable</strong> para agregar campos.</p>
              </div>
            ) : (
              <div className="te-vars__list">
                {block.variables.map(v => {
                  const VIcon = VARIABLE_TYPE_ICONS[v.type] || Type;
                  return (
                    <div key={v.id} className="te-var">
                      <div className="te-var__row">
                        <div className="te-var__icon" style={{ color: accent }}><VIcon size={13} /></div>
                        <input
                          className="te-var__label-input"
                          value={v.label}
                          onChange={e => onUpdateVariable(v.id, { label: e.target.value })}
                          placeholder="Nombre del campo..."
                        />
                        <select
                          className="te-var__type-select"
                          value={v.type}
                          onChange={e => onUpdateVariable(v.id, { type: e.target.value as VariableType })}
                        >
                          {Object.entries(VARIABLE_TYPE_LABELS).map(([val, lbl]) => (
                            <option key={val} value={val}>{lbl}</option>
                          ))}
                        </select>
                        <label className="te-var__req" title="Campo requerido">
                          <input type="checkbox" checked={v.isRequired} onChange={e => onUpdateVariable(v.id, { isRequired: e.target.checked })} />
                          <span>Req.</span>
                        </label>
                        <button className="te-var__delete" onClick={() => onDeleteVariable(v.id)}><Trash2 size={12} /></button>
                      </div>

                      {/* Variable extended options */}
                      <div className="te-var__options">
                        {/* Help text for all */}
                        <div className="te-var__option">
                          <label title="Texto de ayuda"><HelpCircle size={11} /></label>
                          <input
                            className="te-var__mini-input"
                            value={v.placeholder}
                            onChange={e => onUpdateVariable(v.id, { placeholder: e.target.value })}
                            placeholder="Texto de ayuda..."
                          />
                        </div>

                        {v.type === 'measurement' && (
                          <div className="te-var__option">
                            <label>Unidad</label>
                            <input
                              className="te-var__mini-input te-var__mini-input--short"
                              value={v.unit}
                              onChange={e => onUpdateVariable(v.id, { unit: e.target.value })}
                              placeholder="kPa, g/dL..."
                            />
                          </div>
                        )}

                        {v.type === 'select' && (
                          <div className="te-var__option te-var__option--full">
                            <label>Opciones</label>
                            <input
                              className="te-var__mini-input te-var__mini-input--wide"
                              value={v.options.join(', ')}
                              onChange={e => onUpdateVariable(v.id, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                              placeholder="Opción 1, Opción 2, Opción 3"
                            />
                          </div>
                        )}

                        {(v.type === 'text' || v.type === 'number' || v.type === 'select') && (
                          <div className="te-var__option">
                            <label>Default</label>
                            <input
                              className="te-var__mini-input"
                              value={v.defaultValue}
                              onChange={e => onUpdateVariable(v.id, { defaultValue: e.target.value })}
                              placeholder="Valor por defecto"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Template Editor ─── */
export default function TemplateEditor() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { items: equipment, fetch: fetchEquipment } = useEquipmentStore();
  const { create: createTemplate, update: updateTemplate, getById } = useTemplateStore();
  const { addToast } = useAppStore();

  const isEditing = !!id;
  const preselectedEquipmentId = searchParams.get('equipmentId') || '';

  const [equipmentId, setEquipmentId] = useState(preselectedEquipmentId);
  const [name, setName] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('preventive_maintenance');
  const [blocks, setBlocks] = useState<TemplateBlock[]>([]);
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showAI, setShowAI] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => { fetchEquipment(); }, []);

  useEffect(() => {
    if (id) {
      getById(id).then(tpl => {
        setEquipmentId(tpl.equipmentId);
        setName(tpl.name);
        setServiceType(tpl.serviceType as ServiceType);
        setBlocks(tpl.blocks);
        setIsDefault(tpl.isDefault);
        setExpandedBlocks(new Set(tpl.blocks.map(b => b.id)));
      });
    }
  }, [id]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setBlocks(prev => {
        const oi = prev.findIndex(b => b.id === active.id);
        const ni = prev.findIndex(b => b.id === over.id);
        return arrayMove(prev, oi, ni).map((b, i) => ({ ...b, order: i + 1 }));
      });
    }
  };

  const addBlock = () => {
    const b: TemplateBlock = {
      id: uuid(), title: '', description: '',
      order: blocks.length + 1, variables: [], isRequired: true,
    };
    setBlocks(prev => [...prev, b]);
    setExpandedBlocks(prev => new Set([...prev, b.id]));
  };

  const updateBlock = (blockId: string, data: Partial<TemplateBlock>) =>
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, ...data } : b));

  const deleteBlock = (blockId: string) => {
    if (confirm('¿Eliminar este bloque y todas sus variables?'))
      setBlocks(prev => prev.filter(b => b.id !== blockId).map((b, i) => ({ ...b, order: i + 1 })));
  };

  const duplicateBlock = (block: TemplateBlock) => {
    const nb: TemplateBlock = {
      ...block, id: uuid(),
      title: `${block.title} (copia)`,
      order: blocks.length + 1,
      variables: block.variables.map(v => ({ ...v, id: uuid() })),
    };
    setBlocks(prev => [...prev, nb]);
    setExpandedBlocks(prev => new Set([...prev, nb.id]));
    addToast('Bloque duplicado');
  };

  const addVariable = (blockId: string) => {
    const v: TemplateVariable = {
      id: uuid(), label: '', type: 'text',
      options: [], unit: '', defaultValue: '', isRequired: false, placeholder: '',
    };
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, variables: [...b.variables, v] } : b));
  };

  const updateVariable = (blockId: string, varId: string, data: Partial<TemplateVariable>) =>
    setBlocks(prev => prev.map(b => b.id === blockId
      ? { ...b, variables: b.variables.map(v => v.id === varId ? { ...v, ...data } : v) }
      : b
    ));

  const deleteVariable = (blockId: string, varId: string) =>
    setBlocks(prev => prev.map(b => b.id === blockId
      ? { ...b, variables: b.variables.filter(v => v.id !== varId) }
      : b
    ));

  const handleAIImport = (importedBlocks: TemplateBlock[]) => {
    const offset = blocks.length;
    const numbered = importedBlocks.map((b, i) => ({ ...b, order: offset + i + 1 }));
    setBlocks(prev => [...prev, ...numbered]);
    setExpandedBlocks(prev => new Set([...prev, ...numbered.map(b => b.id)]));
    setShowAI(false);
    addToast(`${numbered.length} bloques importados desde el PDF`, 'success');
  };

  const toggleBlock = (blockId: string) => {
    setExpandedBlocks(prev => {
      const next = new Set(prev);
      next.has(blockId) ? next.delete(blockId) : next.add(blockId);
      return next;
    });
  };

  const handleSave = async () => {
    if (!equipmentId) { addToast('Selecciona un equipo', 'warning'); return; }
    if (!name.trim()) { addToast('Ingresa un nombre para la plantilla', 'warning'); return; }
    if (blocks.length === 0) { addToast('Agrega al menos un bloque', 'warning'); return; }
    if (blocks.some(b => !b.title.trim())) { addToast('Todos los bloques deben tener nombre', 'warning'); return; }

    setSaving(true);
    try {
      const data = { equipmentId, name, serviceType, blocks, isDefault };
      if (isEditing) {
        await updateTemplate(id!, data);
        addToast('Plantilla actualizada', 'success');
      } else {
        await createTemplate(data);
        addToast('Plantilla creada exitosamente', 'success');
      }
      navigate(equipmentId ? `/equipment/${equipmentId}` : '/templates');
    } catch {
      addToast('Error al guardar plantilla', 'error');
    } finally {
      setSaving(false);
    }
  };

  const totalVars = blocks.reduce((s, b) => s + b.variables.length, 0);
  const selectedEq = equipment.find(e => e.id === equipmentId);

  return (
    <div className="te page-enter">
      {/* Back */}
      <button className="detail-page__back" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} /> Volver
      </button>

      {/* Header */}
      <div className="te__header">
        <div>
          <h1 className="te__title">{isEditing ? 'Editar Plantilla' : 'Nueva Plantilla'}</h1>
          <p className="te__subtitle">{blocks.length} bloques · {totalVars} variables</p>
        </div>
        <div className="te__header-actions">
          <button
            className={`btn btn--outline te__ai-btn`}
            onClick={() => setShowAI(v => !v)}
            title="Importar desde PDF del proveedor con IA"
          >
            <Sparkles size={15} />
            {showAI ? 'Cerrar IA' : 'IA: Leer PDF'}
          </button>
          <button className="btn btn--outline" onClick={() => setShowPreview(v => !v)}>
            {showPreview ? <EyeOff size={15} /> : <Eye size={15} />}
            {showPreview ? 'Ocultar Preview' : 'Ver Preview'}
          </button>
          <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
            <Save size={15} /> {saving ? 'Guardando...' : 'Guardar Plantilla'}
          </button>
        </div>
      </div>

      {/* AI Import Panel */}
      {showAI && (
        <AIPDFImport
          equipmentName={selectedEq?.name || 'Equipo médico'}
          onImport={handleAIImport}
          onClose={() => setShowAI(false)}
        />
      )}

      {/* Main layout: editor + preview */}
      <div className={`te__layout ${showPreview ? 'te__layout--with-preview' : ''}`}>
        {/* ── Editor Column ── */}
        <div className="te__editor">
          {/* General Info */}
          <div className="te__info-card">
            <h3><Settings2 size={15} /> Información General</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Equipo *</label>
                <select className="form-input" value={equipmentId} onChange={e => setEquipmentId(e.target.value)} disabled={isEditing}>
                  <option value="">Seleccionar equipo...</option>
                  {equipment.map(eq => (
                    <option key={eq.id} value={eq.id}>{eq.name} ({eq.brand})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tipo de Servicio *</label>
                <select className="form-input" value={serviceType} onChange={e => setServiceType(e.target.value as ServiceType)}>
                  {Object.entries(SERVICE_TYPE_LABELS).map(([val, lbl]) => (
                    <option key={val} value={val}>{lbl}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Nombre de la Plantilla *</label>
                <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Mantenimiento Preventivo Mensual" />
              </div>
              <div className="form-group te__default-check">
                <label className="te-block__required">
                  <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} />
                  <span>Plantilla predeterminada</span>
                </label>
              </div>
            </div>
          </div>

          {/* Blocks header */}
          <div className="te__blocks-header">
            <h3>Bloques del Reporte</h3>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              {blocks.length > 0 && (
                <>
                  <button className="btn btn--ghost btn--sm" onClick={() => setExpandedBlocks(new Set(blocks.map(b => b.id)))}>
                    Expandir todos
                  </button>
                  <button className="btn btn--ghost btn--sm" onClick={() => setExpandedBlocks(new Set())}>
                    Colapsar todos
                  </button>
                </>
              )}
              <button className="btn btn--primary btn--sm" onClick={addBlock}>
                <Plus size={14} /> Agregar Bloque
              </button>
            </div>
          </div>

          {/* Blocks list */}
          {blocks.length === 0 ? (
            <div className="te__empty-blocks">
              <div className="te__empty-blocks-inner">
                <Plus size={38} />
                <h3>Sin bloques</h3>
                <p>Los bloques son las secciones del reporte.<br />Agrega bloques manualmente o usa la IA para importarlos desde el PDF del proveedor.</p>
                <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
                  <button className="btn btn--outline" onClick={() => setShowAI(true)}>
                    <Sparkles size={15} /> Importar con IA
                  </button>
                  <button className="btn btn--primary" onClick={addBlock}>
                    <Plus size={15} /> Primer Bloque
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                <div className="te__blocks">
                  {[...blocks].sort((a, b) => a.order - b.order).map((block, idx) => (
                    <SortableBlock
                      key={block.id}
                      block={block}
                      index={idx}
                      isExpanded={expandedBlocks.has(block.id)}
                      onToggle={() => toggleBlock(block.id)}
                      onUpdate={data => updateBlock(block.id, data)}
                      onDelete={() => deleteBlock(block.id)}
                      onDuplicate={() => duplicateBlock(block)}
                      onAddVariable={() => addVariable(block.id)}
                      onUpdateVariable={(varId, data) => updateVariable(block.id, varId, data)}
                      onDeleteVariable={varId => deleteVariable(block.id, varId)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          <button className="te__add-block-bottom" onClick={addBlock}>
            <Plus size={16} /> Agregar Bloque
          </button>
        </div>

        {/* ── Preview Column ── */}
        {showPreview && (
          <div className="te__preview-col">
            <div className="te__preview-label">
              <Eye size={13} /> Vista Previa del PDF
            </div>
            <TemplateLivePreview
              blocks={blocks}
              templateName={name}
              equipmentName={selectedEq?.name || ''}
              serviceType={serviceType}
            />
          </div>
        )}
      </div>
    </div>
  );
}

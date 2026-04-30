import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Save,
  FileText,
} from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { useEquipmentStore } from '../store/equipmentStore';
import { useTemplateStore } from '../store/templateStore';
import { useReportStore } from '../store/reportStore';
import { useAppStore } from '../store/appStore';
import { api } from '../services/api';
import {
  SERVICE_TYPE_LABELS,
  EQUIPMENT_CATEGORY_LABELS,
} from '../types';
import type {
  Equipment,
  Template,
  Technician,
  TemplateBlock,
  ReportBlock,
  ReportVariableValue,
  ServiceType,
  EquipmentCategory,
} from '../types';
import './ReportBuilder.css';

type Step = 1 | 2 | 3;

export default function ReportBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { items: equipment, fetch: fetchEquipment } = useEquipmentStore();
  const { items: templates, fetch: fetchTemplates } = useTemplateStore();
  const { create: createReport } = useReportStore();
  const { addToast } = useAppStore();

  const [step, setStep] = useState<Step>(1);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [technician, setTechnician] = useState('');
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextServiceDate, setNextServiceDate] = useState('');
  const [blocks, setBlocks] = useState<ReportBlock[]>([]);
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
  const [generalObservations, setGeneralObservations] = useState('');
  const [supervisorName, setSupervisorName] = useState('');
  const [saving, setSaving] = useState(false);
  const [equipSearch, setEquipSearch] = useState('');
  const [techniciansList, setTechniciansList] = useState<Technician[]>([]);

  const signatureRefs = useRef<Record<string, SignatureCanvas | null>>({});

  useEffect(() => {
    fetchEquipment();
    fetchTemplates();
    api.settings.getTechnicians().then(setTechniciansList).catch(() => {});
  }, []);

  // Auto-select from URL params
  useEffect(() => {
    const eqId = searchParams.get('equipmentId');
    const tplId = searchParams.get('templateId');
    if (eqId && equipment.length > 0) {
      const eq = equipment.find(e => e.id === eqId);
      if (eq) setSelectedEquipment(eq);
    }
    if (tplId && templates.length > 0) {
      const tpl = templates.find(t => t.id === tplId);
      if (tpl) handleSelectTemplate(tpl);
    }
  }, [equipment, templates, searchParams]);

  const handleSelectTemplate = (tpl: Template) => {
    setSelectedTemplate(tpl);
    const reportBlocks: ReportBlock[] = tpl.blocks.map(block => ({
      templateBlockId: block.id,
      title: block.title,
      order: block.order,
      blockNotes: '',
      values: block.variables.map(v => ({
        templateVariableId: v.id,
        label: v.label,
        type: v.type,
        value: v.type === 'checkbox' ? false : v.defaultValue || '',
        unit: v.unit,
      })),
    }));
    setBlocks(reportBlocks);
    setExpandedBlocks(new Set(tpl.blocks.map(b => b.id)));
  };

  const updateValue = (blockId: string, varId: string, value: any) => {
    setBlocks(prev => prev.map(b => {
      if (b.templateBlockId !== blockId) return b;
      return {
        ...b,
        values: b.values.map(v =>
          v.templateVariableId === varId ? { ...v, value } : v
        ),
      };
    }));
  };

  const toggleBlock = (blockId: string) => {
    setExpandedBlocks(prev => {
      const next = new Set(prev);
      next.has(blockId) ? next.delete(blockId) : next.add(blockId);
      return next;
    });
  };

  const getBlockProgress = (block: ReportBlock) => {
    const total = block.values.length;
    const filled = block.values.filter(v => {
      if (v.type === 'checkbox') return v.value === true;
      return v.value !== '' && v.value !== undefined && v.value !== null;
    }).length;
    return { filled, total, percent: total > 0 ? Math.round((filled / total) * 100) : 0 };
  };

  const getTotalProgress = () => {
    const allValues = blocks.flatMap(b => b.values);
    const total = allValues.length;
    const filled = allValues.filter(v => {
      if (v.type === 'checkbox') return v.value === true;
      return v.value !== '' && v.value !== undefined && v.value !== null;
    }).length;
    return { filled, total, percent: total > 0 ? Math.round((filled / total) * 100) : 0 };
  };

  const handleSave = async (status: 'draft' | 'completed') => {
    if (!selectedEquipment || !selectedTemplate) return;

    // Capture signatures
    const finalBlocks = blocks.map(block => ({
      ...block,
      values: block.values.map(v => {
        if (v.type === 'signature' && signatureRefs.current[v.templateVariableId]) {
          const canvas = signatureRefs.current[v.templateVariableId];
          return { ...v, value: canvas?.isEmpty() ? '' : canvas?.toDataURL() || '' };
        }
        return v;
      }),
    }));

    setSaving(true);
    try {
      const report = await createReport({
        equipmentId: selectedEquipment.id,
        equipmentName: selectedEquipment.name,
        templateId: selectedTemplate.id,
        templateName: selectedTemplate.name,
        serviceType: selectedTemplate.serviceType,
        status,
        technician,
        supervisorName,
        serviceDate,
        nextServiceDate,
        generalObservations,
        blocks: finalBlocks,
      });
      addToast(
        status === 'draft'
          ? 'Borrador guardado exitosamente'
          : 'Reporte completado exitosamente',
        'success'
      );
      navigate(`/reports/${report.id}`);
    } catch {
      addToast('Error al guardar el reporte', 'error');
    } finally {
      setSaving(false);
    }
  };

  const filteredEquipment = equipment.filter(e =>
    !equipSearch || e.name.toLowerCase().includes(equipSearch.toLowerCase()) ||
    e.brand.toLowerCase().includes(equipSearch.toLowerCase())
  );

  const equipTemplates = selectedEquipment
    ? templates.filter(t => t.equipmentId === selectedEquipment.id)
    : [];

  const canGoStep2 = selectedEquipment && selectedTemplate && technician && serviceDate;
  const progress = getTotalProgress();

  return (
    <div className="builder page-enter">
      {/* Steps indicator */}
      <div className="builder__steps">
        {[
          { n: 1, label: 'Selección' },
          { n: 2, label: 'Llenado' },
          { n: 3, label: 'Revisión' },
        ].map(({ n, label }) => (
          <div
            key={n}
            className={`builder__step ${step === n ? 'builder__step--active' : ''} ${step > n ? 'builder__step--done' : ''}`}
          >
            <div className="builder__step-number">
              {step > n ? <Check size={14} /> : n}
            </div>
            <span className="builder__step-label">{label}</span>
          </div>
        ))}
        <div className="builder__step-line" />
      </div>

      {/* Step 1: Selection */}
      {step === 1 && (
        <div className="builder__panel animate-slide-up">
          <h2 className="builder__panel-title">Selecciona Equipo y Plantilla</h2>

          {/* Equipment Selection */}
          <div className="builder__section">
            <label className="form-label">Equipo *</label>
            <input
              className="form-input"
              placeholder="Buscar equipo..."
              value={equipSearch}
              onChange={e => setEquipSearch(e.target.value)}
            />
            <div className="builder__eq-grid">
              {filteredEquipment.slice(0, 12).map(eq => (
                <button
                  key={eq.id}
                  className={`builder__eq-card ${selectedEquipment?.id === eq.id ? 'builder__eq-card--selected' : ''}`}
                  onClick={() => {
                    setSelectedEquipment(eq);
                    setSelectedTemplate(null);
                    setBlocks([]);
                  }}
                >
                  <span className="builder__eq-name">{eq.name}</span>
                  <span className="builder__eq-cat">
                    {EQUIPMENT_CATEGORY_LABELS[eq.category as EquipmentCategory] || eq.category}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Template Selection */}
          {selectedEquipment && (
            <div className="builder__section animate-slide-up">
              <label className="form-label">Plantilla de Servicio *</label>
              {equipTemplates.length === 0 ? (
                <div className="builder__no-templates">
                  <p>No hay plantillas para {selectedEquipment.name}</p>
                  <button className="btn btn--outline btn--sm" onClick={() => navigate(`/templates/new?equipmentId=${selectedEquipment.id}`)}>
                    Crear plantilla
                  </button>
                </div>
              ) : (
                <div className="builder__tpl-list">
                  {equipTemplates.map(tpl => (
                    <button
                      key={tpl.id}
                      className={`builder__tpl-card ${selectedTemplate?.id === tpl.id ? 'builder__tpl-card--selected' : ''}`}
                      onClick={() => handleSelectTemplate(tpl)}
                    >
                      <FileText size={18} />
                      <div>
                        <span className="builder__tpl-name">{tpl.name}</span>
                        <span className="builder__tpl-info">
                          {SERVICE_TYPE_LABELS[tpl.serviceType as ServiceType]} · {tpl.blocks.length} bloques
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Service Info */}
          {selectedTemplate && (
            <div className="builder__section animate-slide-up">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Técnico Responsable *</label>
                  {techniciansList.length > 0 ? (
                    <select className="form-input" value={technician} onChange={e => setTechnician(e.target.value)}>
                      <option value="">Seleccionar técnico...</option>
                      {techniciansList.filter(t => t.isActive).map(t => (
                        <option key={t.id} value={t.name}>{t.name} — {t.role}</option>
                      ))}
                    </select>
                  ) : (
                    <input className="form-input" placeholder="Nombre del técnico" value={technician} onChange={e => setTechnician(e.target.value)} />
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha del Servicio *</label>
                  <input className="form-input" type="date" value={serviceDate} onChange={e => setServiceDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Próximo Servicio</label>
                  <input className="form-input" type="date" value={nextServiceDate} onChange={e => setNextServiceDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Supervisor (opcional)</label>
                  <input className="form-input" placeholder="Nombre del supervisor" value={supervisorName} onChange={e => setSupervisorName(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Next */}
          <div className="builder__actions">
            <div />
            <button className="btn btn--primary" disabled={!canGoStep2} onClick={() => setStep(2)}>
              Continuar <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Fill Blocks */}
      {step === 2 && (
        <div className="builder__panel animate-slide-up">
          <div className="builder__panel-header">
            <h2 className="builder__panel-title">Llenado del Reporte</h2>
            <div className="builder__progress">
              <div className="builder__progress-bar">
                <div className="builder__progress-fill" style={{ width: `${progress.percent}%` }} />
              </div>
              <span className="builder__progress-text">{progress.filled}/{progress.total} ({progress.percent}%)</span>
            </div>
          </div>

          {/* Blocks */}
          <div className="builder__blocks">
            {blocks.sort((a, b) => a.order - b.order).map((block, blockIndex) => {
              const bp = getBlockProgress(block);
              const isExpanded = expandedBlocks.has(block.templateBlockId);
              const tplBlock = selectedTemplate?.blocks.find(b => b.id === block.templateBlockId);

              return (
                <div key={block.templateBlockId} className={`block ${isExpanded ? 'block--expanded' : ''}`}>
                  <button className="block__header" onClick={() => toggleBlock(block.templateBlockId)}>
                    <div className="block__header-left">
                      <span className="block__number">{blockIndex + 1}</span>
                      <div>
                        <span className="block__title">{block.title}</span>
                        {tplBlock?.description && (
                          <span className="block__desc">{tplBlock.description}</span>
                        )}
                      </div>
                    </div>
                    <div className="block__header-right">
                      <span className={`block__badge ${bp.percent === 100 ? 'block__badge--done' : ''}`}>
                        {bp.filled}/{bp.total}
                      </span>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="block__body animate-slide-down">
                      {block.values.map(v => (
                        <div key={v.templateVariableId} className="variable">
                          <label className="variable__label">
                            {v.label}
                            {v.unit && <span className="variable__unit">({v.unit})</span>}
                          </label>
                          {renderVariable(v, block.templateBlockId, tplBlock)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="builder__actions">
            <button className="btn btn--outline" onClick={() => setStep(1)}>
              <ArrowLeft size={16} /> Anterior
            </button>
            <div className="builder__actions-right">
              <button className="btn btn--outline" onClick={() => handleSave('draft')} disabled={saving}>
                <Save size={16} /> Guardar Borrador
              </button>
              <button className="btn btn--primary" onClick={() => setStep(3)}>
                Revisar <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="builder__panel animate-slide-up">
          <h2 className="builder__panel-title">Revisión Final</h2>

          <div className="review">
            <div className="review__header">
              <div>
                <span className="review__label">Equipo</span>
                <span className="review__value">{selectedEquipment?.name}</span>
              </div>
              <div>
                <span className="review__label">Plantilla</span>
                <span className="review__value">{selectedTemplate?.name}</span>
              </div>
              <div>
                <span className="review__label">Técnico</span>
                <span className="review__value">{technician}</span>
              </div>
              <div>
                <span className="review__label">Fecha</span>
                <span className="review__value">{serviceDate}</span>
              </div>
            </div>

            <div className="review__blocks">
              {blocks.sort((a, b) => a.order - b.order).map((block, i) => (
                <div key={block.templateBlockId} className="review__block">
                  <h4 className="review__block-title">{i + 1}. {block.title}</h4>
                  <div className="review__vars">
                    {block.values.map(v => (
                      <div key={v.templateVariableId} className="review__var">
                        <span className="review__var-label">{v.label}</span>
                        <span className="review__var-value">
                          {renderReviewValue(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="form-group" style={{ marginTop: 'var(--space-5)' }}>
              <label className="form-label">Observaciones Generales</label>
              <textarea
                className="form-input form-textarea"
                value={generalObservations}
                onChange={e => setGeneralObservations(e.target.value)}
                placeholder="Notas adicionales sobre el servicio realizado..."
                rows={4}
              />
            </div>
          </div>

          <div className="builder__actions">
            <button className="btn btn--outline" onClick={() => setStep(2)}>
              <ArrowLeft size={16} /> Anterior
            </button>
            <div className="builder__actions-right">
              <button className="btn btn--outline" onClick={() => handleSave('draft')} disabled={saving}>
                <Save size={16} /> Guardar Borrador
              </button>
              <button className="btn btn--primary" onClick={() => handleSave('completed')} disabled={saving}>
                <CheckCircle size={16} /> Completar Reporte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function renderVariable(v: ReportVariableValue, blockId: string, tplBlock?: TemplateBlock) {
    const tplVar = tplBlock?.variables.find(tv => tv.id === v.templateVariableId);

    switch (v.type) {
      case 'pass_fail':
        return (
          <div className="variable__pass-fail">
            <button
              className={`pf-btn pf-btn--pass ${v.value === 'pass' ? 'pf-btn--active' : ''}`}
              onClick={() => updateValue(blockId, v.templateVariableId, v.value === 'pass' ? '' : 'pass')}
            >
              <CheckCircle size={18} /> APROBADO
            </button>
            <button
              className={`pf-btn pf-btn--fail ${v.value === 'fail' ? 'pf-btn--active' : ''}`}
              onClick={() => updateValue(blockId, v.templateVariableId, v.value === 'fail' ? '' : 'fail')}
            >
              <XCircle size={18} /> FALLA
            </button>
          </div>
        );

      case 'checkbox':
        return (
          <label className="variable__checkbox">
            <input
              type="checkbox"
              checked={!!v.value}
              onChange={e => updateValue(blockId, v.templateVariableId, e.target.checked)}
            />
            <span className="variable__checkbox-mark" />
            <span>{v.value ? 'Realizado' : 'Pendiente'}</span>
          </label>
        );

      case 'select':
        return (
          <select
            className="form-input"
            value={String(v.value)}
            onChange={e => updateValue(blockId, v.templateVariableId, e.target.value)}
          >
            <option value="">Seleccionar...</option>
            {tplVar?.options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );

      case 'measurement':
        return (
          <div className="variable__measurement">
            <input
              type="number"
              step="0.01"
              className="form-input"
              placeholder={tplVar?.placeholder || '0.00'}
              value={String(v.value)}
              onChange={e => updateValue(blockId, v.templateVariableId, e.target.value)}
            />
            <span className="variable__unit-badge">{v.unit}</span>
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            className="form-input"
            placeholder={tplVar?.placeholder || '0'}
            value={String(v.value)}
            onChange={e => updateValue(blockId, v.templateVariableId, e.target.value)}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            className="form-input"
            value={String(v.value)}
            onChange={e => updateValue(blockId, v.templateVariableId, e.target.value)}
          />
        );

      case 'textarea':
        return (
          <textarea
            className="form-input form-textarea"
            placeholder={tplVar?.placeholder || ''}
            value={String(v.value)}
            onChange={e => updateValue(blockId, v.templateVariableId, e.target.value)}
            rows={3}
          />
        );

      case 'signature':
        return (
          <div className="variable__signature">
            <SignatureCanvas
              ref={(ref) => { signatureRefs.current[v.templateVariableId] = ref; }}
              penColor="#1C1C1E"
              canvasProps={{
                className: 'variable__sig-canvas',
                width: 400,
                height: 150,
              }}
            />
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => signatureRefs.current[v.templateVariableId]?.clear()}
            >
              Limpiar firma
            </button>
          </div>
        );

      default:
        return (
          <input
            className="form-input"
            placeholder={tplVar?.placeholder || ''}
            value={String(v.value)}
            onChange={e => updateValue(blockId, v.templateVariableId, e.target.value)}
          />
        );
    }
  }

  function renderReviewValue(v: ReportVariableValue) {
    if (v.type === 'pass_fail') {
      if (v.value === 'pass') return <span className="review__pass">✅ APROBADO</span>;
      if (v.value === 'fail') return <span className="review__fail">❌ FALLA</span>;
      return <span className="review__empty">—</span>;
    }
    if (v.type === 'checkbox') {
      return v.value ? '✓ Realizado' : '○ Pendiente';
    }
    if (v.type === 'measurement') {
      return v.value ? `${v.value} ${v.unit}` : '—';
    }
    if (v.type === 'signature') {
      return v.value ? '✍️ Firmado' : '—';
    }
    return String(v.value) || '—';
  }
}

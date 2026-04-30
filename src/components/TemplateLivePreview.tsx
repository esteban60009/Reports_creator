import type { TemplateBlock } from '../types';
import './TemplateLivePreview.css';

interface Props {
  blocks: TemplateBlock[];
  templateName: string;
  equipmentName: string;
  serviceType: string;
}

const TYPE_SAMPLE: Record<string, () => JSX.Element> = {
  pass_fail: () => (
    <div className="lp-pf">
      <span className="lp-pf__pass">✅ APROBADO</span>
      <span className="lp-pf__fail">❌ FALLA</span>
    </div>
  ),
  checkbox: () => <span className="lp-sample lp-sample--check">☐ Pendiente</span>,
  measurement: () => <span className="lp-sample">___ <span className="lp-sample__unit">unidad</span></span>,
  text: () => <span className="lp-sample lp-sample--input">Texto libre...</span>,
  textarea: () => <span className="lp-sample lp-sample--textarea">Observaciones...</span>,
  select: () => <span className="lp-sample lp-sample--select">▼ Seleccionar opción</span>,
  date: () => <span className="lp-sample lp-sample--input">DD/MM/YYYY</span>,
  number: () => <span className="lp-sample lp-sample--input">0</span>,
  signature: () => <div className="lp-sig"><span>✍️ Área de firma</span></div>,
  image: () => <div className="lp-img"><span>🖼 Imagen</span></div>,
};

export default function TemplateLivePreview({ blocks, templateName, equipmentName, serviceType }: Props) {
  const today = new Date().toLocaleDateString('es-MX');

  return (
    <div className="lp">
      {/* PDF Sheet simulation */}
      <div className="lp__sheet">
        {/* Header */}
        <div className="lp__header">
          <div className="lp__header-left">
            <div className="lp__logo-box">LOGO</div>
            <div>
              <div className="lp__company">Mi Empresa S.A.</div>
              <div className="lp__report-title">REPORTE DE SERVICIO</div>
              <div className="lp__report-number">SVC-2026-XXXX</div>
            </div>
          </div>
          <div className="lp__header-right">
            <span className="lp__badge">COMPLETADO</span>
          </div>
        </div>

        {/* Info grid */}
        <div className="lp__info">
          <div className="lp__info-item">
            <span className="lp__info-label">EQUIPO</span>
            <span className="lp__info-value">{equipmentName || 'Nombre del equipo'}</span>
          </div>
          <div className="lp__info-item">
            <span className="lp__info-label">TIPO DE SERVICIO</span>
            <span className="lp__info-value">{serviceType.replace(/_/g, ' ')}</span>
          </div>
          <div className="lp__info-item">
            <span className="lp__info-label">TÉCNICO</span>
            <span className="lp__info-value">Juan Pérez</span>
          </div>
          <div className="lp__info-item">
            <span className="lp__info-label">FECHA</span>
            <span className="lp__info-value">{today}</span>
          </div>
        </div>

        {/* Template name band */}
        {templateName && (
          <div className="lp__tpl-name">Plantilla: {templateName}</div>
        )}

        {/* Blocks */}
        {blocks.length === 0 ? (
          <div className="lp__empty">
            <p>Agrega bloques para ver la vista previa</p>
          </div>
        ) : (
          <div className="lp__blocks">
            {[...blocks].sort((a, b) => a.order - b.order).map((block, bi) => (
              <div key={block.id} className="lp__block">
                <div className="lp__block-title">
                  <span className="lp__block-num">{bi + 1}</span>
                  <span>{block.title || '(Sin nombre)'}</span>
                  {block.isRequired && <span className="lp__required-badge">Requerido</span>}
                </div>
                {block.description && (
                  <p className="lp__block-desc">{block.description}</p>
                )}
                {block.variables.length === 0 ? (
                  <p className="lp__no-vars">Sin variables definidas</p>
                ) : (
                  <div className="lp__vars">
                    {block.variables.map((v, vi) => {
                      const SampleRenderer = TYPE_SAMPLE[v.type] || (() => <span className="lp-sample">—</span>);
                      return (
                        <div key={v.id} className={`lp__var ${vi % 2 === 0 ? '' : 'lp__var--alt'}`}>
                          <span className="lp__var-label">
                            {v.label || '(Sin nombre)'}
                            {v.isRequired && <span className="lp__var-req">*</span>}
                            {v.unit && <span className="lp__var-unit"> ({v.unit})</span>}
                          </span>
                          <span className="lp__var-value"><SampleRenderer /></span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Signature area */}
        {blocks.length > 0 && (
          <div className="lp__sigs">
            <div className="lp__sig">
              <div className="lp__sig-line" />
              <span>Técnico Responsable</span>
            </div>
            <div className="lp__sig">
              <div className="lp__sig-line" />
              <span>Supervisor</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="lp__footer">
          <span>Generado por Reports Creator</span>
          <span>Página 1 de 1</span>
        </div>
      </div>
    </div>
  );
}

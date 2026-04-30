import { useState, useRef } from 'react';
import {
  FileUp, Sparkles, X, Check, AlertCircle,
  ChevronDown, ChevronUp, Loader2,
} from 'lucide-react';
import { api } from '../services/api';
import { v4 as uuid } from 'uuid';
import type { TemplateBlock, TemplateVariable } from '../types';
import './AIPDFImport.css';

interface Props {
  equipmentName: string;
  onImport: (blocks: TemplateBlock[]) => void;
  onClose: () => void;
}

interface RawBlock {
  title: string;
  description?: string;
  isRequired?: boolean;
  variables?: Array<{
    label: string;
    type: string;
    isRequired?: boolean;
    unit?: string;
    options?: string[];
    placeholder?: string;
    defaultValue?: string;
  }>;
}

export default function AIPDFImport({ equipmentName, onImport, onClose }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ blocks: RawBlock[]; message?: string } | null>(null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);
  const [selectedBlocks, setSelectedBlocks] = useState<Set<number>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (f.type !== 'application/pdf') { setError('Solo se permiten archivos PDF'); return; }
    if (f.size > 20 * 1024 * 1024) { setError('El archivo no debe superar 20 MB'); return; }
    setFile(f);
    setError('');
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.ai.analyzePDF(file, equipmentName);
      setResult(data);
      const allIdx = new Set<number>(data.blocks.map((_: any, i: number) => i));
      setSelectedBlocks(allIdx);
    } catch (err: any) {
      setError(err.message || 'Error al analizar el PDF');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (idx: number) => {
    setSelectedBlocks(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const importSelected = () => {
    if (!result) return;
    const selected = result.blocks.filter((_, i) => selectedBlocks.has(i));
    const blocks: TemplateBlock[] = selected.map((raw, i) => ({
      id: uuid(),
      title: raw.title || 'Bloque sin nombre',
      description: raw.description || '',
      order: i + 1,
      isRequired: raw.isRequired !== false,
      variables: (raw.variables || []).map((v): TemplateVariable => ({
        id: uuid(),
        label: v.label || 'Variable',
        type: (v.type as any) || 'text',
        isRequired: v.isRequired !== false,
        unit: v.unit || '',
        options: v.options || [],
        placeholder: v.placeholder || '',
        defaultValue: v.defaultValue || '',
      })),
    }));
    onImport(blocks);
  };

  return (
    <div className="ai-import">
      <div className="ai-import__header">
        <div className="ai-import__title">
          <Sparkles size={18} className="ai-import__icon" />
          <span>Importar desde PDF del Proveedor</span>
        </div>
        <button className="ai-import__close" onClick={onClose}><X size={18} /></button>
      </div>

      {!result ? (
        <div className="ai-import__body">
          <p className="ai-import__desc">
            Sube el manual de servicio del equipo. La IA leerá el documento y extraerá
            automáticamente las fases de mantenimiento como bloques y variables para tu plantilla.
          </p>

          {/* Drop zone */}
          <div
            className={`ai-drop ${file ? 'ai-drop--has-file' : ''}`}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              style={{ display: 'none' }}
              onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
            />
            {file ? (
              <div className="ai-drop__file">
                <FileUp size={28} />
                <span className="ai-drop__filename">{file.name}</span>
                <span className="ai-drop__size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            ) : (
              <div className="ai-drop__empty">
                <FileUp size={36} />
                <span>Arrastra el PDF aquí o haz clic para seleccionar</span>
                <span className="ai-drop__hint">Máximo 20 MB · Solo PDF</span>
              </div>
            )}
          </div>

          {error && (
            <div className="ai-import__error">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div className="ai-import__actions">
            <button className="btn btn--outline" onClick={onClose}>Cancelar</button>
            <button
              className="btn btn--primary"
              onClick={analyze}
              disabled={!file || loading}
            >
              {loading ? <><Loader2 size={16} className="spin" /> Analizando PDF...</> : <><Sparkles size={16} /> Analizar con IA</>}
            </button>
          </div>
        </div>
      ) : (
        <div className="ai-import__body">
          {result.message && (
            <div className="ai-import__info">
              <AlertCircle size={14} /> {result.message}
            </div>
          )}

          <div className="ai-result__header">
            <span className="ai-result__count">
              Se encontraron <strong>{result.blocks.length} bloques</strong>. Selecciona los que deseas importar:
            </span>
            <div className="ai-result__header-actions">
              <button className="btn btn--ghost btn--sm" onClick={() => setSelectedBlocks(new Set(result.blocks.map((_, i) => i)))}>
                Todos
              </button>
              <button className="btn btn--ghost btn--sm" onClick={() => setSelectedBlocks(new Set())}>
                Ninguno
              </button>
            </div>
          </div>

          <div className="ai-blocks">
            {result.blocks.map((block, idx) => (
              <div
                key={idx}
                className={`ai-block ${selectedBlocks.has(idx) ? 'ai-block--selected' : ''}`}
              >
                <div className="ai-block__header" onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}>
                  <label className="ai-block__check" onClick={e => { e.stopPropagation(); toggleSelect(idx); }}>
                    <div className={`ai-block__checkbox ${selectedBlocks.has(idx) ? 'ai-block__checkbox--checked' : ''}`}>
                      {selectedBlocks.has(idx) && <Check size={11} />}
                    </div>
                  </label>
                  <span className="ai-block__title">{block.title}</span>
                  <span className="ai-block__vars-count">{block.variables?.length || 0} var.</span>
                  {expandedIdx === idx ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
                {expandedIdx === idx && block.variables && (
                  <div className="ai-block__vars">
                    {block.variables.map((v, vi) => (
                      <div key={vi} className="ai-block__var">
                        <span className="ai-block__var-label">{v.label}</span>
                        <span className="ai-block__var-type">{v.type}</span>
                        {v.unit && <span className="ai-block__var-unit">{v.unit}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="ai-import__actions">
            <button className="btn btn--outline" onClick={() => { setResult(null); setFile(null); }}>
              ← Nuevo PDF
            </button>
            <button
              className="btn btn--primary"
              onClick={importSelected}
              disabled={selectedBlocks.size === 0}
            >
              <Check size={16} /> Importar {selectedBlocks.size} bloques
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

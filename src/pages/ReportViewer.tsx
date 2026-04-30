import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Download,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Cpu,
  FileText,
  Edit3,
  Copy,
} from 'lucide-react';
import { useReportStore } from '../store/reportStore';
import { useAppStore } from '../store/appStore';
import { SERVICE_TYPE_LABELS, REPORT_STATUS_LABELS } from '../types';
import type { Report, ServiceType, ReportStatus, ReportVariableValue } from '../types';
import type { CompanySettings, ReportLayout } from '../types';
import { useReactToPrint } from 'react-to-print';
import { generateReportPDF } from '../services/pdfExport';
import { api } from '../services/api';
import './ReportViewer.css';

export default function ReportViewer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getById, update } = useReportStore();
  const { addToast } = useAppStore();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [layout, setLayout] = useState<ReportLayout | null>(null);
  const [downloading, setDownloading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: report ? `Reporte ${report.reportNumber}` : 'Reporte',
  });

  useEffect(() => {
    // Load settings for PDF/print
    api.settings.getCompany().then(setCompany).catch(() => {});
    api.settings.getLayouts().then(data => {
      if (data.length > 0) setLayout(data[0]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (id) {
      getById(id)
        .then(r => setReport(r))
        .catch(() => addToast('Reporte no encontrado', 'error'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleApprove = async () => {
    if (!report) return;
    try {
      const updated = await update(report.id, { status: 'approved' });
      setReport(updated);
      addToast('Reporte aprobado', 'success');
    } catch {
      addToast('Error al aprobar', 'error');
    }
  };

  const handleDownloadPDF = async () => {
    if (!report) return;
    setDownloading(true);
    try {
      const doc = await generateReportPDF({ report, company, layout });
      doc.save(`${report.reportNumber}.pdf`);
      addToast('PDF descargado exitosamente', 'success');
    } catch (err) {
      console.error('PDF export error:', err);
      addToast('Error al generar PDF', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handleDuplicate = async () => {
    if (!report) return;
    try {
      const newReport = await api.reports.create({
        ...report,
        id: undefined,
        reportNumber: undefined,
        status: 'draft',
        createdAt: undefined,
        updatedAt: undefined,
      });
      addToast('Reporte duplicado como borrador', 'success');
      navigate(`/reports/${newReport.id}`);
    } catch {
      addToast('Error al duplicar', 'error');
    }
  };

  if (loading) {
    return (
      <div className="viewer page-enter">
        <div className="equipment-page__loading">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="viewer page-enter">
        <div className="equipment-page__empty">
          <FileText size={48} />
          <h3>Reporte no encontrado</h3>
          <p>El reporte solicitado no existe o fue eliminado</p>
          <button className="btn btn--primary" onClick={() => navigate('/reports')}>Volver al historial</button>
        </div>
      </div>
    );
  }

  return (
    <div className="viewer page-enter">
      {/* Toolbar */}
      <div className="viewer__toolbar">
        <button className="detail-page__back" onClick={() => navigate('/reports')}>
          <ArrowLeft size={18} /> Volver al historial
        </button>
        <div className="viewer__toolbar-actions">
          {report.status === 'completed' && (
            <button className="btn btn--outline" onClick={handleApprove}>
              <CheckCircle size={16} /> Aprobar
            </button>
          )}
          <button className="btn btn--outline" onClick={handleDuplicate}>
            <Copy size={16} /> Duplicar
          </button>
          <button className="btn btn--outline" onClick={() => handlePrint()}>
            <Printer size={16} /> Imprimir
          </button>
          <button className="btn btn--primary" onClick={handleDownloadPDF} disabled={downloading}>
            <Download size={16} /> {downloading ? 'Generando...' : 'Descargar PDF'}
          </button>
        </div>
      </div>

      {/* Print-ready view */}
      <div ref={printRef} className="print-report">
        {/* Header with company info */}
        <div className="print-report__header">
          <div className="print-report__header-left">
            {company?.logoUrl && (
              <img src={`http://localhost:3001${company.logoUrl}`} alt="Logo" className="print-report__logo" />
            )}
            <div>
              {company?.companyName && (
                <span className="print-report__company">{company.companyName}</span>
              )}
              <h1 className="print-report__title">REPORTE DE SERVICIO</h1>
              <span className="print-report__number text-mono">{report.reportNumber}</span>
            </div>
          </div>
          <div className="print-report__header-right">
            <span className={`report-row__status report-row__status--${report.status}`}>
              {REPORT_STATUS_LABELS[report.status as ReportStatus]}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="print-report__info">
          <div className="print-report__info-item">
            <Cpu size={14} />
            <div>
              <span className="print-report__info-label">Equipo</span>
              <span className="print-report__info-value">{report.equipmentName}</span>
            </div>
          </div>
          <div className="print-report__info-item">
            <FileText size={14} />
            <div>
              <span className="print-report__info-label">Tipo de Servicio</span>
              <span className="print-report__info-value">
                {SERVICE_TYPE_LABELS[report.serviceType as ServiceType] || report.serviceType}
              </span>
            </div>
          </div>
          <div className="print-report__info-item">
            <User size={14} />
            <div>
              <span className="print-report__info-label">Técnico</span>
              <span className="print-report__info-value">{report.technician}</span>
            </div>
          </div>
          <div className="print-report__info-item">
            <Calendar size={14} />
            <div>
              <span className="print-report__info-label">Fecha del Servicio</span>
              <span className="print-report__info-value">{report.serviceDate}</span>
            </div>
          </div>
          {report.supervisorName && (
            <div className="print-report__info-item">
              <User size={14} />
              <div>
                <span className="print-report__info-label">Supervisor</span>
                <span className="print-report__info-value">{report.supervisorName}</span>
              </div>
            </div>
          )}
          {report.nextServiceDate && (
            <div className="print-report__info-item">
              <Calendar size={14} />
              <div>
                <span className="print-report__info-label">Próximo Servicio</span>
                <span className="print-report__info-value">{report.nextServiceDate}</span>
              </div>
            </div>
          )}
        </div>

        {/* Blocks */}
        <div className="print-report__blocks">
          {report.blocks.sort((a, b) => a.order - b.order).map((block, i) => (
            <div key={block.templateBlockId} className="print-block">
              <h3 className="print-block__title">
                <span className="print-block__num">{i + 1}</span>
                {block.title}
              </h3>
              <div className="print-block__vars">
                {block.values.map(v => (
                  <div key={v.templateVariableId} className="print-var">
                    <span className="print-var__label">{v.label}</span>
                    <span className="print-var__value">{renderValue(v)}</span>
                  </div>
                ))}
              </div>
              {block.blockNotes && (
                <p className="print-block__notes">Notas: {block.blockNotes}</p>
              )}
            </div>
          ))}
        </div>

        {/* Observations */}
        {report.generalObservations && (
          <div className="print-report__observations">
            <h3>Observaciones Generales</h3>
            <p>{report.generalObservations}</p>
          </div>
        )}

        {/* Signature area */}
        <div className="print-report__signatures">
          <div className="print-sig">
            <div className="print-sig__line" />
            <span>Técnico: {report.technician}</span>
          </div>
          {report.supervisorName && (
            <div className="print-sig">
              <div className="print-sig__line" />
              <span>Supervisor: {report.supervisorName}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        {company?.footerText && (
          <div className="print-report__footer">
            <span>{company.footerText}</span>
          </div>
        )}
      </div>
    </div>
  );

  function renderValue(v: ReportVariableValue) {
    if (v.type === 'pass_fail') {
      if (v.value === 'pass') return <span style={{ color: '#1B8D36' }}>✅ APROBADO</span>;
      if (v.value === 'fail') return <span style={{ color: '#FF3B30' }}>❌ FALLA</span>;
      return '—';
    }
    if (v.type === 'checkbox') return v.value ? '✓ Realizado' : '○ Pendiente';
    if (v.type === 'measurement') return v.value ? `${v.value} ${v.unit}` : '—';
    if (v.type === 'signature' && v.value && typeof v.value === 'string' && v.value.startsWith('data:')) {
      return <img src={v.value as string} alt="Firma" style={{ height: 60 }} />;
    }
    return String(v.value) || '—';
  }
}

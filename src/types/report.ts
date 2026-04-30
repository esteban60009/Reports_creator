import type { VariableType } from './template';

export interface Report {
  id: string;
  reportNumber: string;
  equipmentId: string;
  equipmentName: string;
  templateId: string;
  templateName: string;
  serviceType: string;
  status: ReportStatus;
  technician: string;
  supervisorName: string;
  serviceDate: string;
  nextServiceDate: string;
  generalObservations: string;
  blocks: ReportBlock[];
  createdAt: string;
  updatedAt: string;
}

export type ReportStatus = 'draft' | 'completed' | 'approved';

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  draft: 'Borrador',
  completed: 'Completado',
  approved: 'Aprobado',
};

export interface ReportBlock {
  templateBlockId: string;
  title: string;
  order: number;
  values: ReportVariableValue[];
  blockNotes: string;
}

export interface ReportVariableValue {
  templateVariableId: string;
  label: string;
  type: VariableType;
  value: string | boolean | number;
  unit: string;
}

export type CreateReportDTO = Omit<Report, 'id' | 'reportNumber' | 'createdAt' | 'updatedAt'>;
export type UpdateReportDTO = Partial<CreateReportDTO>;

export interface Template {
  id: string;
  equipmentId: string;
  name: string;
  serviceType: ServiceType;
  blocks: TemplateBlock[];
  version: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ServiceType =
  | 'preventive_maintenance'
  | 'corrective_maintenance'
  | 'installation'
  | 'calibration'
  | 'validation'
  | 'inspection'
  | 'training';

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  preventive_maintenance: 'Mantenimiento Preventivo',
  corrective_maintenance: 'Mantenimiento Correctivo',
  installation: 'Instalación',
  calibration: 'Calibración',
  validation: 'Validación',
  inspection: 'Inspección',
  training: 'Capacitación',
};

export interface TemplateBlock {
  id: string;
  title: string;
  description: string;
  order: number;
  variables: TemplateVariable[];
  isRequired: boolean;
}

export interface TemplateVariable {
  id: string;
  label: string;
  type: VariableType;
  options: string[];
  unit: string;
  defaultValue: string;
  isRequired: boolean;
  placeholder: string;
}

export type VariableType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'measurement'
  | 'select'
  | 'checkbox'
  | 'date'
  | 'pass_fail'
  | 'signature'
  | 'image'
  | 'divider'
  | 'note'
  | 'watermark';

export const VARIABLE_TYPE_LABELS: Record<VariableType, string> = {
  text: 'Texto',
  textarea: 'Texto Largo',
  number: 'Número',
  measurement: 'Medición (valor + unidad)',
  select: 'Selección',
  checkbox: 'Casilla',
  date: 'Fecha',
  pass_fail: 'Aprobado / Falla',
  signature: 'Firma Digital',
  image: 'Imagen / Foto',
  divider: 'Línea Divisoria',
  note: 'Nota',
  watermark: 'Marca de Agua',
};

export type CreateTemplateDTO = Omit<Template, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateTemplateDTO = Partial<CreateTemplateDTO>;

export interface Equipment {
  id: string;
  name: string;
  brand: string;
  model: string;
  category: EquipmentCategory;
  serialNumber: string;
  location: string;
  imageUrl: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export type EquipmentCategory =
  | 'hematology'
  | 'chemistry'
  | 'immunology'
  | 'serology'
  | 'urinalysis'
  | 'coagulation'
  | 'blood_bank'
  | 'microbiology'
  | 'molecular'
  | 'point_of_care'
  | 'imaging'
  | 'gases'
  | 'other';

export const EQUIPMENT_CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  hematology: 'Hematología',
  chemistry: 'Química Clínica',
  immunology: 'Inmunología',
  serology: 'Serología',
  urinalysis: 'Uroanálisis',
  coagulation: 'Coagulación',
  blood_bank: 'Banco de Sangre',
  microbiology: 'Microbiología',
  molecular: 'Biología Molecular',
  point_of_care: 'Point of Care',
  imaging: 'Imagenología',
  gases: 'Gases Arteriales',
  other: 'Otros',
};

export type CreateEquipmentDTO = Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateEquipmentDTO = Partial<CreateEquipmentDTO>;

export interface CompanySettings {
  id: string;
  companyName: string;
  logoUrl: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  reportPrefix: string;
  primaryColor: string;
  secondaryColor: string;
  footerText: string;
}

export interface Technician {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  signature: string;
  isActive: boolean;
}

export interface ReportLayout {
  id: string;
  name: string;
  showLogo: boolean;
  showCompanyInfo: boolean;
  showEquipmentImage: boolean;
  showBlockNumbers: boolean;
  showSignatureLines: boolean;
  headerLayout: 'centered' | 'left-aligned' | 'two-column';
  blockStyle: 'card' | 'table' | 'minimal';
  fontSize: 'small' | 'medium' | 'large';
  pageSize: 'letter' | 'a4';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  customCSS: string;
}

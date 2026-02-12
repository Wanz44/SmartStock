
export interface Site {
  id: string;
  name: string;
  location: string;
  capacity: number;
  status: 'Opérationnel' | 'Maintenance' | 'Saturé';
  manager: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  category: string;
  rating: number;
  email: string;
  leadTimeDays: number;
}

export interface AppSettings {
  enterpriseName: string;
  locationId: string;
  exchangeRate: number;
  primaryCurrency: 'Fc' | '$';
  defaultSafetyMargin: number;
  autoBackup: boolean;
  units: string[];
  printHeader: string;
  printFooter: string;
  maskSensitiveData: boolean;
  printModel: 'classic' | 'excel-green' | 'modern-dark';
  showPageNumbers: boolean;
  printFontFamily: 'Calibri' | 'Inter' | 'Plus Jakarta Sans' | 'Courier New';
  printFontSize: number;
  printBoldHeaders: boolean;
  printThemeColor: string;
  printStripeColor: string;
  printBorderWidth: number;
  printConditionalFormatting: boolean;
  printCellPadding: number;
  notificationsEnabled: boolean;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  monthlyNeed: number;
  unit: string;
  unitPrice: number;
  currency: 'Fc' | '$';
  siteId: string;
  lastInventoryDate: string;
}

export interface Furniture {
  id: string;
  code: string;
  name: string;
  siteId: string;
  currentCount: number;
  condition: 'Neuf' | 'Bon' | 'Usé' | 'Endommagé';
  lastChecked: string;
  comment?: string;
}

export interface FurnitureAuditItem {
  furnitureId: string;
  furnitureName: string;
  furnitureCode: string;
  previousCount: number;
  actualCount: number;
  difference: number;
  condition: 'Neuf' | 'Bon' | 'Usé' | 'Endommagé';
  observation: string;
}

export interface FurnitureAuditSession {
  id: string;
  date: string;
  siteId: string;
  siteName: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  year: number;
  items: FurnitureAuditItem[];
  status: 'En cours' | 'Clôturé';
  totalDifference: number;
}

export interface InventoryLog {
  id: string;
  date: string;
  type: 'entry' | 'exit' | 'transfer' | 'adjustment';
  productId: string;
  productName: string;
  changeAmount: number;
  finalStock: number;
  siteId: string;
  targetSiteId?: string;
  reason?: string;
  responsible: string;
  isAnomaly?: boolean;
}

export interface NeedItem {
  productId: string;
  productName: string;
  standardNeed: number;
  currentStock: number;
  quantityToOrder: number;
  unitPrice: number;
  currency: 'Fc' | '$';
  totalCost: number;
}

export interface NeedReport {
  id: string;
  date: string;
  siteId: string;
  siteName: string;
  items: NeedItem[];
  totalValueFc: number;
  status: 'Brouillon' | 'Validé' | 'Commandé';
}

export interface Task {
  id: string;
  title: string;
  date: string;
  time: string;
  day: string;
  priority: 'Haute' | 'Moyenne' | 'Basse';
  status: 'En attente' | 'Terminée';
  isAlerted?: boolean;
}

export type ViewType = 
  | 'dashboard' 
  | 'inventory' 
  | 'furniture' 
  | 'sites' 
  | 'suppliers' 
  | 'audit'
  | 'traceability' 
  | 'tasks'
  | 'needs_list' 
  | 'analytics' 
  | 'settings'
  | 'movements'
  | 'trash';

export interface RapportAutomatique {
  summary: string;
  criticalAlerts: string[];
  recommendations: string[];
  financialProjection: string;
  chartData: { label: string; valeur: number }[];
  topConsumption: { label: string; valeur: number }[];
  siteValueData: { label: string; valeur: number }[];
  siteExpenseData: { label: string; valeur: number }[];
  monthlyExpenseData: { label: string; valeur: number }[];
  healthIndicators: { siteName: string; status: 'green' | 'orange' | 'red'; score: number }[];
  balanceAnalysis: { isPositive: boolean; message: string; ratio: number };
  generatedAt: string;
}

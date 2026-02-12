
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
  defaultSafetyMargin: number; // en %
  autoBackup: boolean;
  units: string[]; // Liste des unités gérables
}

export interface Product {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  monthlyNeed: number; // Besoin Standard
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
  id: string; // ID_Transaction
  date: string;
  type: 'entry' | 'exit' | 'transfer' | 'adjustment';
  productId: string;
  productName: string;
  changeAmount: number;
  finalStock: number;
  siteId: string;
  targetSiteId?: string; // Pour les transferts
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
  | 'movements'
  | 'furniture' 
  | 'traceability' 
  | 'needs_list' 
  | 'suppliers' 
  | 'sites' 
  | 'analytics' 
  | 'import' 
  | 'settings'
  | 'audit_session'
  | 'transfers'
  | 'tasks';

export interface RapportAutomatique {
  summary: string;
  criticalAlerts: string[];
  recommendations: string[];
  financialProjection: string;
  chartData: { label: string; valeur: number }[]; // Valeur par catégorie
  topConsumption: { label: string; valeur: number }[]; // Plus consommés
  siteValueData: { label: string; valeur: number }[]; // Valeur par site
  siteExpenseData: { label: string; valeur: number }[]; // Dépenses par site
  monthlyExpenseData: { label: string; valeur: number }[]; // Dépenses par mois
  healthIndicators: { siteName: string; status: 'green' | 'orange' | 'red'; score: number }[];
  balanceAnalysis: { isPositive: boolean; message: string; ratio: number };
  generatedAt: string;
}


export interface Site {
  id: string;
  name: string;
  location?: string;
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
  supplier?: string;
  siteId: string;
  lastInventoryDate: string;
  imageUrl?: string;
}

export interface Furniture {
  id: string;
  code: string;
  name: string;
  siteId: string;
  currentCount: number;
  previousCount: number;
  condition: 'Neuf' | 'Bon' | 'Usé' | 'Endommagé';
  lastChecked: string;
  observation?: string;
  purchasePrice?: number;
  purchaseDate?: string;
  assignedTo?: string;
  imageUrl?: string;
}

export interface InventoryLog {
  id: string;
  date: string;
  type: 'entry' | 'exit' | 'transfer' | 'furniture_check' | 'refill' | 'archive' | 'adjustment';
  productId: string;
  productName: string;
  changeAmount: number;
  finalStock: number;
  reason?: string;
  responsible?: string;
}

export interface RapportAutomatique {
  summary: string;
  criticalAlerts: string[];
  recommendations: string[];
  financialProjection: string;
  chartData: { label: string; valeur: number }[];
  generatedAt: string;
  sources?: { title: string; uri: string }[];
}

export type ViewType = 'dashboard' | 'inventory' | 'furniture' | 'replenishment' | 'history' | 'settings' | 'monthly_report' | 'studio' | 'import';

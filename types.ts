
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
}

export interface InventoryLog {
  id: string;
  date: string;
  type: 'entry' | 'exit' | 'transfer' | 'furniture_check' | 'refill';
  productId: string;
  productName: string;
  fromSiteId?: string;
  toSiteId?: string;
  changeAmount: number;
  finalStock: number;
  reason?: string;
  responsible?: string;
}

export type ViewType = 'dashboard' | 'inventory' | 'furniture' | 'transfers' | 'replenishment' | 'history' | 'settings' | 'ai';

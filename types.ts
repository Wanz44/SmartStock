
export interface Product {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  monthlyNeed: number; // Quantité consommée en moyenne par mois
  unit: string;
  unitPrice: number;
  currency: 'Fc' | '$'; // Devise du prix
  supplier?: string;
  lastInventoryDate: string;
}

export interface InventoryLog {
  id: string;
  date: string;
  type: 'manual_update' | 'refill' | 'inventory_check';
  productId: string;
  productName: string;
  changeAmount: number;
  finalStock: number;
  reason?: string;
}

export interface InventorySnapshot {
  id: string;
  date: string;
  items: {
    productId: string;
    quantity: number;
  }[];
}

export type ViewType = 'dashboard' | 'inventory' | 'replenishment' | 'history' | 'ai' | 'settings';

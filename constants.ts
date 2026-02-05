
import { Product } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: "Bonbons",
    category: "Alimentaire",
    currentStock: 15,
    minStock: 20,
    monthlyNeed: 20,
    unit: 'sacs',
    unitPrice: 2500,
    currency: 'Fc',
    supplier: "Fournisseur A",
    siteId: 'S1',
    lastInventoryDate: new Date().toISOString()
  },
  {
    id: '2',
    name: "Biscuits",
    category: "Alimentaire",
    currentStock: 8,
    minStock: 15,
    monthlyNeed: 20,
    unit: 'paquets',
    unitPrice: 1500,
    currency: 'Fc',
    supplier: "Fournisseur A",
    siteId: 'S1',
    lastInventoryDate: new Date().toISOString()
  },
  {
    id: '3',
    name: "Jus de fruit",
    category: "Boisson",
    currentStock: 12,
    minStock: 10,
    monthlyNeed: 15,
    unit: 'litres',
    unitPrice: 8500,
    currency: 'Fc',
    supplier: "Fournisseur B",
    siteId: 'S1',
    lastInventoryDate: new Date().toISOString()
  },
  {
    id: '4',
    name: "Assiettes jetables",
    category: "Matériel",
    currentStock: 50,
    minStock: 30,
    monthlyNeed: 40,
    unit: 'unités',
    unitPrice: 500,
    currency: 'Fc',
    supplier: "Fournisseur C",
    siteId: 'S1',
    lastInventoryDate: new Date().toISOString()
  },
  {
    id: '5',
    name: "Nappes",
    category: "Décoration",
    currentStock: 10,
    minStock: 5,
    monthlyNeed: 8,
    unit: 'unités',
    unitPrice: 25000,
    currency: 'Fc',
    supplier: "Fournisseur D",
    siteId: 'S1',
    lastInventoryDate: new Date().toISOString()
  }
];

export const INITIAL_CATEGORIES = [
  "Alimentaire",
  "Boisson",
  "Matériel",
  "Mobilier",
  "Décoration",
  "Autre"
];

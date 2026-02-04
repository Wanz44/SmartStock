
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
    unitPrice: 2.5,
    currency: '$',
    supplier: "Fournisseur A",
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
    unitPrice: 3.0,
    currency: '$',
    supplier: "Fournisseur A",
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
    unitPrice: 4.5,
    currency: '$',
    supplier: "Fournisseur B",
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
    unitPrice: 0.5,
    currency: '$',
    supplier: "Fournisseur C",
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
    unitPrice: 12.0,
    currency: '$',
    supplier: "Fournisseur D",
    lastInventoryDate: new Date().toISOString()
  }
];

export const CATEGORIES = [
  "Alimentaire",
  "Boisson",
  "Matériel",
  "Mobilier",
  "Décoration",
  "Autre"
];

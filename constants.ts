
import { Product, Furniture } from './types';

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

export const INITIAL_FURNITURE: Furniture[] = [
  {
    id: 'f1',
    code: 'AST-2024-001',
    name: 'Bureau Ergonomique Pro',
    siteId: 'S1',
    currentCount: 12,
    previousCount: 12,
    condition: 'Neuf',
    lastChecked: new Date().toISOString(),
    assignedTo: 'Département RH',
    purchasePrice: 450000,
    purchaseDate: '2024-01-15'
  },
  {
    id: 'f2',
    code: 'AST-2024-045',
    name: 'Chaise de Bureau Mesh',
    siteId: 'S1',
    currentCount: 45,
    previousCount: 48,
    condition: 'Bon',
    lastChecked: new Date().toISOString(),
    assignedTo: 'Open Space A',
    purchasePrice: 120000,
    purchaseDate: '2023-11-20'
  },
  {
    id: 'f3',
    code: 'IT-SRV-001',
    name: 'Serveur Rack 2U Dell',
    siteId: 'S2',
    currentCount: 2,
    previousCount: 2,
    condition: 'Neuf',
    lastChecked: new Date().toISOString(),
    assignedTo: 'Salle Serveur',
    purchasePrice: 8500000,
    purchaseDate: '2024-02-10'
  }
];

export const INITIAL_CATEGORIES = [
  "Alimentaire",
  "Boisson",
  "Matériel",
  "Mobilier",
  "Décoration",
  "Informatique",
  "Autre"
];

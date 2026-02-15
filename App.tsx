
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, Box, History as HistoryIcon, Activity, LogOut, 
  Settings, CheckSquare, FileBarChart, X,
  MapPin, Lamp, Truck, Database,
  Plus, Save, Trash2, ShoppingCart, Edit3, RotateCcw, Cpu, Search, Command, ChevronRight,
  CheckCircle2, AlertCircle, Info
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  Product, InventoryLog, ViewType, Task, AppSettings, NeedReport, 
  Site, Furniture, FurnitureAuditSession, Supplier, RapportAutomatique 
} from './types';
import { INITIAL_CATEGORIES, INITIAL_UNITS } from './constants';

// Vues
import { DashboardView } from './DashboardView';
import { InventoryView } from './InventoryView';
import { GlobalHistoryView } from './GlobalHistoryView';
import { TraceabilityView } from './TraceabilityView';
import { TasksView } from './TasksView';
import { AnalyticsView } from './AnalyticsView';
import { AuditView } from './AuditView';
import { NeedsReportView } from './NeedsReportView';
import { SettingsView } from './SettingsView';
import { LoginView } from './LoginView';
import { SitesView } from './SitesView';
import { FurnitureView } from './FurnitureView';
import { MovementsView } from './MovementsView';
import { SuppliersView } from './SuppliersView';
import { TrashView } from './TrashView';

// Services
import { getAutomatedAnalysis } from './services/analysisService';
import { getAutomatedReport } from './services/automationService';

const getStored = <T,>(key: string, defaultValue: T): T => {
  const saved = localStorage.getItem(key);
  if (!saved) return defaultValue;
  try { return JSON.parse(saved); } catch (e) { return defaultValue; }
};

const DEFAULT_SETTINGS: AppSettings = {
  enterpriseName: 'SmartStock Pro',
  locationId: 'RDC_HQ_01',
  exchangeRate: 2800,
  primaryCurrency: 'Fc',
  defaultSafetyMargin: 20,
  autoBackup: true,
  units: INITIAL_UNITS,
  categories: INITIAL_CATEGORIES,
  printHeader: 'REGISTRE OFFICIEL DE STOCK ET PATRIMOINE',
  printFooter: 'Document généré par SmartStock Pro ERP System',
  maskSensitiveData: false,
  printModel: 'excel-green',
  showPageNumbers: true,
  printFontFamily: 'Calibri',
  printFontSize: 10,
  printBoldHeaders: true,
  printThemeColor: '#1a3a22',
  printStripeColor: '#f0fdf4',
  printBorderWidth: 1,
  printConditionalFormatting: true,
  printCellPadding: 8,
  notificationsEnabled: true
};

const getViewTitle = (view: ViewType): string => {
  switch (view) {
    case 'dashboard': return 'Tableau de Bord';
    case 'inventory': return 'Consommables';
    case 'furniture': return 'Mobilier';
    case 'sites': return 'Sites Logistiques';
    case 'suppliers': return 'Fournisseurs';
    case 'audit': return 'Audit & Écarts';
    case 'traceability': return 'Historique Mouvements';
    case 'tasks': return 'Agenda Tâches';
    case 'needs_list': return 'État de Besoins';
    case 'analytics': return 'Moteur Algorithmique';
    case 'trash': return 'Corbeille Archive';
    case 'settings': return 'Paramètres';
    case 'movements': return 'Mouvements Stock';
    default: return 'SmartStock ERP';
  }
};

interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

const NavItem = ({ active, onClick, icon: Icon, label, alertCount = 0 }: any) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center justify-between px-5 py-3 rounded-xl font-bold text-[9px] uppercase tracking-wider transition-all duration-200 mb-1 ${
      active 
        ? 'nav-item-active bg-white text-[#1a3a22] shadow-md scale-[1.02]' 
        : 'text-slate-300 hover:text-white hover:bg-white/10'
    }`}
  >
    <div className="flex items-center gap-3">
      <Icon className={`w-4 h-4 ${active ? 'text-[#1a3a22]' : ''}`} />
      <span className="truncate">{label}</span>
    </div>
    {alertCount > 0 && (
      <span className="bg-rose-500 text-white min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[7px] animate-pulse">
        {alertCount}
      </span>
    )}
  </button>
);

export default function App() {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(getStored('isLoggedIn', false));
  const [settings, setSettings] = useState<AppSettings>(getStored('ss_settings', DEFAULT_SETTINGS));
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const [products, setProducts] = useState<Product[]>(getStored('ss_products', []));
  const [deletedProducts, setDeletedProducts] = useState<Product[]>(getStored('ss_deleted_products', []));
  const [furniture, setFurniture] = useState<Furniture[]>(getStored('ss_furniture', []));
  const [deletedFurniture, setDeletedFurniture] = useState<Furniture[]>(getStored('ss_deleted_furniture', []));
  
  const [furnitureAudits, setFurnitureAudits] = useState<FurnitureAuditSession[]>(getStored('ss_furniture_audits', []));
  const [history, setHistory] = useState<InventoryLog[]>(getStored('ss_history', []));
  const [tasks, setTasks] = useState<Task[]>(getStored('ss_tasks', []));
  const [needsHistory, setNeedsHistory] = useState<NeedReport[]>(getStored('ss_needs_history', []));
  const [sites, setSites] = useState<Site[]>(getStored('ss_sites', []));
  const [suppliers, setSuppliers] = useState<Supplier[]>(getStored('ss_suppliers', []));
  
  const [logisticsBalance, setLogisticsBalance] = useState<number>(getStored('ss_logistics_balance', 0));
  
  const [autoReport, setAutoReport] = useState<RapportAutomatique | null>(null);
  const [autoAnalysis, setAutoAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // État pour la pré-sélection du site dans les besoins
  const [preselectedSiteId, setPreselectedSiteId] = useState<string>('');

  // Clipboard state for products (array for multiple copy/paste)
  const [copiedProducts, setCopiedProducts] = useState<Product[]>([]);

  // Global Search State
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [newProductData, setNewProductData] = useState({
    id: '', name: '', category: settings.categories[0] || 'Alimentaire', unitPrice: 0, currency: 'Fc' as 'Fc' | '$', 
    minStock: 10, targetStock: 50, unit: settings.units[0] || 'PIÈCE', initialStock: 0, siteId: '',
    monthlyNeed: 20
  });

  const [editProductData, setEditProductData] = useState<Product | null>(null);

  const [isFirstLaunch, setIsFirstLaunch] = useState(() => products.length === 0 && sites.length === 0);

  // Synchronisation du défaut de catégorie si les paramètres changent
  useEffect(() => {
    if (!settings.categories.includes(newProductData.category) && settings.categories.length > 0) {
      setNewProductData(prev => ({ ...prev, category: settings.categories[0] }));
    }
  }, [settings.categories]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsGlobalSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when search modal opens
  useEffect(() => {
    if (isGlobalSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setGlobalSearchQuery('');
    }
  }, [isGlobalSearchOpen]);

  const notify = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  };

  const handleHardReset = () => {
    if (confirm("⚠️ ALERTE CRITIQUE : Cette action va effacer TOUS les stocks, l'historique, les sites et remettre le solde à zéro. Confirmer la purge ?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleLogout = () => {
    if (confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
      setIsLoggedIn(false);
    }
  };

  const handleCopyProducts = (ps: Product[]) => {
    setCopiedProducts(ps);
    notify(`${ps.length} article(s) copié(s) dans le presse-papiers.`);
  };

  const handlePasteProducts = (siteId: string) => {
    if (copiedProducts.length === 0) return;
    const site = sites.find(s => s.id === siteId);
    if (!site) return;

    const siteExistingProductNames = products
      .filter(p => p.siteId === siteId)
      .map(p => p.name.toUpperCase());

    const productsToPaste = copiedProducts.filter(p => !siteExistingProductNames.includes(p.name.toUpperCase()));
    const skipCount = copiedProducts.length - productsToPaste.length;

    if (productsToPaste.length === 0) {
      return notify(`Tous ces articles existent déjà sur le site ${site.name}`, "warning");
    }

    const newClones: Product[] = productsToPaste.map(p => ({
      ...p,
      id: `PRD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      siteId,
      currentStock: 0,
      lastInventoryDate: new Date().toISOString()
    }));

    setProducts([...newClones, ...products]);
    
    if (skipCount > 0) {
      notify(`${newClones.length} articles ajoutés sur ${site.name}, ${skipCount} déjà présents ignorés.`, "info");
    } else {
      notify(`${newClones.length} articles ajoutés sur ${site.name}.`, "success");
    }
  };

  const runAutomatedAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const report = await getAutomatedReport(products, history, settings.exchangeRate, sites);
      const analysis = await getAutomatedAnalysis(products, history);
      setAutoReport(report);
      setAutoAnalysis(analysis);
    } catch (err) {
      notify("Échec de l'exécution du script d'analyse", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (activeView === 'analytics' && !autoReport && !isAnalyzing) {
      runAutomatedAnalysis();
    }
  }, [activeView, autoReport, isAnalyzing, products, history, sites, settings.exchangeRate]);

  const handleTransaction = (prodId: string, amount: number, reason: string, type: 'entry' | 'exit' | 'adjustment' | 'transfer' | 'manual_update' = 'adjustment') => {
    const product = products.find(p => p.id === prodId);
    if (!product) return;
    const finalStock = product.currentStock + amount;
    if (finalStock < 0) return notify(`Stock insuffisant pour ${product.name}`, "error");

    if (type === 'entry') {
      const priceFc = product.currency === '$' ? product.unitPrice * settings.exchangeRate : product.unitPrice;
      const totalCost = Math.abs(amount) * priceFc;
      setLogisticsBalance(prev => prev - totalCost);
    }

    setProducts(products.map(p => p.id === prodId ? { ...p, currentStock: finalStock, lastInventoryDate: new Date().toISOString() } : p));
    
    if (settings.notificationsEnabled && finalStock <= product.minStock) {
      notify(`Alerte Stock Bas : ${product.name} (${finalStock} ${product.unit} restant)`, 'warning');
    }

    const newLog: InventoryLog = { 
      id: `LOG-${Date.now()}`.toUpperCase(),
      date: new Date().toISOString(), type, productId: prodId, productName: product.name, 
      changeAmount: amount, finalStock, reason: reason || 'Transaction manuelle', responsible: 'ADMIN', siteId: product.siteId 
    };
    setHistory([newLog, ...history]);
  };

  const handleQuickInventory = (prodId: string) => {
    const product = products.find(p => p.id === prodId);
    if (!product) return;
    const difference = product.targetStock - product.currentStock;
    if (difference === 0) return notify(`Le stock de ${product.name} est déjà conforme au cible.`, "info");
    
    handleTransaction(prodId, difference, "Inventaire rapide", "manual_update");
    notify(`Stock de "${product.name}" synchronisé sur ${product.targetStock} ${product.unit}.`);
  };

  const handleImportProducts = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length <= 1) return notify("Fichier vide ou invalide", "error");

      const newProducts = [...products];
      const newSites = [...sites];
      let importCount = 0;
      let skipCount = 0;

      jsonData.slice(1).forEach((row: any) => {
        if (Array.isArray(row) && row.length >= 1) {
          const name = (row[0] || '').toString().toUpperCase().trim();
          if (!name) return;

          const siteName = (row[6] || 'MAGASIN CENTRAL').toString().trim().toUpperCase();
          
          // Trouver ou créer le site
          let siteObj = newSites.find(s => s.name.toUpperCase() === siteName);
          if (!siteObj) {
            siteObj = { 
              id: `S-${Date.now()}-${Math.random().toString(36).substr(2,3)}`.toUpperCase(), 
              name: siteName, 
              location: 'Local', 
              capacity: 2000, 
              status: 'Opérationnel', 
              manager: 'Admin' 
            };
            newSites.push(siteObj);
          }

          // VÉRIFICATION ANTI-DOUBLON (Nom + Site)
          const isDuplicate = newProducts.some(p => p.name.toUpperCase() === name && p.siteId === siteObj!.id);
          if (isDuplicate) {
            skipCount++;
            return;
          }

          const category = row[1] || settings.categories[0] || 'Alimentaire';
          const stock = parseInt(row[2]) || 0;
          const minStock = parseInt(row[3]) || 5;
          const unit = row[4] || settings.units[0] || 'PIÈCE';
          const price = parseFloat(row[5]) || 0;
          const targetStock = parseInt(row[7]) || stock || 50;

          const id = `PRD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
          newProducts.push({
            id, name, category, currentStock: stock, minStock, targetStock, monthlyNeed: minStock * 2,
            unit, unitPrice: price, currency: 'Fc', siteId: siteObj.id, lastInventoryDate: new Date().toISOString()
          });
          importCount++;
        }
      });

      setSites(newSites);
      setProducts(newProducts);
      if (skipCount > 0) {
        notify(`${importCount} produits importés, ${skipCount} doublons ignorés.`, "info");
      } else {
        notify(`${importCount} produits importés depuis ${file.name}.`);
      }
    } catch (err) {
      console.error(err);
      notify("Erreur lors de la lecture du fichier Excel/CSV", "error");
    }

    if (e.target) e.target.value = '';
  };

  const handleImportFurniture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length <= 1) return notify("Fichier vide ou invalide", "error");

      const newFurniture = [...furniture];
      const newSites = [...sites];
      let importCount = 0;

      // Structure attendue : 0:Service, 1:Article, 2:Réf, 3:Quantité, 4:État, 5:Observation
      jsonData.slice(1).forEach((row: any) => {
        if (Array.isArray(row) && row.length >= 1) {
          const siteNameInput = (row[0] || 'NON CLASSÉ').toString().trim().toUpperCase();
          const name = (row[1] || '').toString().trim().toUpperCase();
          if (!name) return;

          const code = (row[2] || `MOB-${Math.random().toString(36).substr(2, 6).toUpperCase()}`).toString().trim();
          const qty = parseInt(row[3]) || 1;
          
          let conditionInput = (row[4] || 'Bon').toString().trim();
          // Normalisation de l'état
          let condition: any = 'Bon';
          if (/neuf/i.test(conditionInput)) condition = 'Neuf';
          else if (/use|usé/i.test(conditionInput)) condition = 'Usé';
          else if (/dommage|hs|mort/i.test(conditionInput)) condition = 'Endommagé';

          const observation = row[5] || '';

          // Gestion automatique du Site
          let siteObj = newSites.find(s => s.name.toUpperCase() === siteNameInput);
          if (!siteObj) {
            siteObj = { 
              id: `S-${Date.now()}-${Math.random().toString(36).substr(2,3)}`.toUpperCase(), 
              name: siteNameInput, 
              location: 'Auto-généré', 
              capacity: 1000, 
              status: 'Opérationnel', 
              manager: 'Admin Logistique' 
            };
            newSites.push(siteObj);
          }

          // Éviter les doublons par code
          if (!newFurniture.find(f => f.code === code)) {
            newFurniture.push({
              id: `F-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`.toUpperCase(),
              code,
              name,
              siteId: siteObj.id,
              currentCount: qty,
              condition,
              lastChecked: new Date().toISOString(),
              comment: observation
            });
            importCount++;
          }
        }
      });

      setSites(newSites);
      setFurniture(newFurniture);
      notify(`${importCount} mobiliers classés et importés depuis ${file.name}.`);
    } catch (err) {
      console.error(err);
      notify("Erreur lors de l'importation du registre mobilier", "error");
    }

    if (e.target) e.target.value = '';
  };

  useEffect(() => {
    const storageKeys = {
      'ss_products': products,
      'ss_deleted_products': deletedProducts,
      'ss_furniture': furniture,
      'ss_deleted_furniture': deletedFurniture,
      'ss_sites': sites,
      'ss_history': history,
      'ss_tasks': tasks,
      'ss_settings': settings,
      'ss_suppliers': suppliers,
      'ss_furniture_audits': furnitureAudits,
      'ss_needs_history': needsHistory,
      'ss_logistics_balance': logisticsBalance,
      'isLoggedIn': isLoggedIn
    };
    Object.entries(storageKeys).forEach(([key, val]) => localStorage.setItem(key, JSON.stringify(val)));
  }, [products, deletedProducts, furniture, deletedFurniture, history, tasks, isLoggedIn, settings, sites, suppliers, furnitureAudits, needsHistory, logisticsBalance]);

  const handleAddProduct = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (sites.length === 0) return notify("Créez un site d'abord", "error");

    const targetSiteId = newProductData.siteId || sites[0].id;
    const nameUpper = newProductData.name.toUpperCase();
    
    // 1. VÉRIFICATION DU DOUBLON NOM + SITE
    const isDuplicateName = products.some(p => p.name.toUpperCase() === nameUpper && p.siteId === targetSiteId);
    if (isDuplicateName) {
      return notify(`L'article "${nameUpper}" existe déjà sur ce site.`, "error");
    }

    // 2. VÉRIFICATION DE L'ID (si saisi manuellement)
    if (newProductData.id) {
        const isDuplicateId = products.some(p => p.id === newProductData.id);
        if (isDuplicateId) {
            return notify(`La référence "${newProductData.id}" est déjà utilisée.`, "error");
        }
    }

    const id = newProductData.id || `RÉF-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const product: Product = {
      id, name: nameUpper, category: newProductData.category, 
      currentStock: Number(newProductData.initialStock), minStock: Number(newProductData.minStock), 
      targetStock: Number(newProductData.targetStock),
      monthlyNeed: Number(newProductData.monthlyNeed) || 20, unit: newProductData.unit, 
      unitPrice: Number(newProductData.unitPrice), currency: newProductData.currency,
      siteId: targetSiteId, lastInventoryDate: new Date().toISOString()
    };
    setProducts([product, ...products]);
    if (product.currentStock > 0) handleTransaction(id, product.currentStock, 'Initialisation', 'entry');
    setIsAddModalOpen(false);
    setNewProductData({ id: '', name: '', category: settings.categories[0] || 'Alimentaire', unitPrice: 0, currency: 'Fc', minStock: 10, targetStock: 50, unit: settings.units[0] || 'PIÈCE', initialStock: 0, siteId: '', monthlyNeed: 20 });
    notify(`Produit "${product.name}" ajouté.`);
  };

  const handleUpdateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProductData) return;

    // VÉRIFICATION ANTI-DOUBLON LORS DE LA MODIFICATION
    const isDuplicate = products.some(p => 
        p.id !== editProductData.id && // Ne pas se comparer à soi-même
        p.name.toUpperCase() === editProductData.name.toUpperCase() && 
        p.siteId === editProductData.siteId
    );

    if (isDuplicate) {
        return notify(`Un autre article porte déjà le nom "${editProductData.name}" sur ce site.`, "error");
    }

    setProducts(products.map(p => p.id === editProductData.id ? editProductData : p));
    setIsEditModalOpen(false);
    setEditProductData(null);
    notify(`Produit "${editProductData.name}" mis à jour.`);
  };

  // Global Search Logic
  const globalSearchResults = useMemo(() => {
    if (globalSearchQuery.length < 2) return null;
    const query = globalSearchQuery.toLowerCase();
    
    return {
      products: products.filter(p => p.name.toLowerCase().includes(query) || p.id.toLowerCase().includes(query)).slice(0, 5),
      sites: sites.filter(s => s.name.toLowerCase().includes(query) || s.location.toLowerCase().includes(query)).slice(0, 5),
      suppliers: suppliers.filter(s => s.name.toLowerCase().includes(query) || s.category.toLowerCase().includes(query)).slice(0, 5),
      tasks: tasks.filter(t => t.title.toLowerCase().includes(query)).slice(0, 5)
    };
  }, [globalSearchQuery, products, sites, suppliers, tasks]);

  const navigateToResult = (view: ViewType) => {
    setActiveView(view);
    setIsGlobalSearchOpen(false);
    setGlobalSearchQuery('');
  };

  if (isFirstLaunch) return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a3a22] p-6">
      <div className="bg-white w-full max-w-md rounded-[3rem] p-12 shadow-2xl text-center">
        <Database className="w-16 h-16 text-emerald-600 mx-auto mb-6" />
        <h2 className="text-2xl font-black uppercase text-[#1a3a22]">Initialisation Système</h2>
        <button onClick={() => { setSites([{ id: 'SITE-01', name: 'Magasin Central', location: 'Local', capacity: 5000, status: 'Opérationnel', manager: 'Admin' }]); setIsFirstLaunch(false); setIsLoggedIn(true); }} className="w-full mt-8 bg-emerald-600 text-white py-6 rounded-2xl font-black uppercase shadow-xl hover:bg-emerald-700 transition-all">Lancer la Plateforme</button>
      </div>
    </div>
  );

  if (!isLoggedIn) return <LoginView enterpriseName={settings.enterpriseName} onLogin={() => setIsLoggedIn(true)} />;

  return (
    <div className={`min-h-screen flex bg-[#f8fafc] model-${settings.printModel} ${settings.showPageNumbers ? 'show-page-numbers' : ''}`}>
      <aside className="sidebar-float no-print">
        <div className="flex items-center gap-3 mb-6 px-2">
          <Activity className="w-8 h-8 text-emerald-400" />
          <h1 className="text-white text-lg font-black uppercase tracking-tighter italic">SmartStock <span className="text-emerald-400">Pro</span></h1>
        </div>

        {/* Global Search Trigger */}
        <div className="px-2 mb-8">
           <button 
             onClick={() => setIsGlobalSearchOpen(true)}
             className="w-full flex items-center justify-between px-4 py-3 bg-white/10 border border-white/5 rounded-2xl text-slate-400 hover:bg-white/20 transition-all group"
           >
              <div className="flex items-center gap-3">
                 <Search className="w-4 h-4 text-emerald-400" />
                 <span className="text-[10px] font-bold uppercase tracking-widest italic group-hover:text-white transition-colors">Recherche...</span>
              </div>
              <div className="flex items-center gap-1 opacity-40">
                 <Command className="w-2.5 h-2.5" />
                 <span className="text-[8px] font-black">K</span>
              </div>
           </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
          <NavItem active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} icon={LayoutDashboard} label="Tableau de bord" />
          <NavItem active={activeView === 'inventory'} onClick={() => setActiveView('inventory')} icon={Box} label="Consommables" />
          <NavItem active={activeView === 'furniture'} onClick={() => setActiveView('furniture')} icon={Lamp} label="Mobilier" />
          <NavItem active={activeView === 'sites'} onClick={() => setActiveView('sites')} icon={MapPin} label="Sites" />
          <NavItem active={activeView === 'suppliers'} onClick={() => setActiveView('suppliers')} icon={Truck} label="Fournisseurs" />
          <NavItem active={activeView === 'audit'} onClick={() => setActiveView('audit')} icon={CheckSquare} label="Audit & Écarts" />
          <NavItem active={activeView === 'traceability'} onClick={() => setActiveView('traceability')} icon={HistoryIcon} label="Historique" />
          <NavItem active={activeView === 'tasks'} onClick={() => setActiveView('tasks')} icon={CheckSquare} label="Agenda" alertCount={tasks.filter(t => t.status === 'En attente').length} />
          <NavItem active={activeView === 'needs_list'} onClick={() => setActiveView('needs_list')} icon={ShoppingCart} label="Besoins" />
          <NavItem active={activeView === 'analytics'} onClick={() => setActiveView('analytics')} icon={Cpu} label="Algorithmes" />
          <NavItem active={activeView === 'trash'} onClick={() => setActiveView('trash')} icon={Trash2} label="Corbeille" alertCount={deletedProducts.length + deletedFurniture.length} />
          <NavItem active={activeView === 'settings'} onClick={() => setActiveView('settings')} icon={Settings} label="Paramètres" />
        </nav>
        <button onClick={handleLogout} className="mt-8 flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/5 text-slate-400 font-bold text-[10px] uppercase hover:bg-rose-600 hover:text-white transition-all">
          <LogOut className="w-4 h-4" /> Déconnexion
        </button>
      </aside>

      <main className="flex-1 ml-[300px] p-12 pr-16 relative">
        <header className="mb-10 flex justify-between items-end no-print">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">{settings.enterpriseName}</p>
            <h2 className="text-[44px] font-header text-slate-900 leading-none italic uppercase">
              {getViewTitle(activeView)}
            </h2>
          </div>
        </header>

        <section className="animate-fade-in">
          {activeView === 'dashboard' && <DashboardView products={products} furniture={furniture} history={history} exchangeRate={settings.exchangeRate} setView={setActiveView} logisticsBalance={logisticsBalance} />}
          {activeView === 'inventory' && <InventoryView products={products} sites={sites} settings={settings} onMovement={(p, val) => handleTransaction(p.id, val, "Mise à jour rapide", "adjustment")} onQuickInventory={handleQuickInventory} onEdit={(p) => { setEditProductData(p); setIsEditModalOpen(true); }} onImport={handleImportProducts} onAdd={() => setIsAddModalOpen(true)} onDelete={(id) => setProducts(products.filter(p => p.id !== id))} onCopyProducts={handleCopyProducts} />}
          {activeView === 'furniture' && <FurnitureView furniture={furniture} setFurniture={setFurniture} furnitureAudits={furnitureAudits} setFurnitureAudits={setFurnitureAudits} sites={sites} notify={notify} onImportFurniture={handleImportFurniture} />}
          {activeView === 'sites' && (
            <SitesView 
              sites={sites} 
              setSites={setSites} 
              products={products} 
              setProducts={setProducts}
              furniture={furniture}
              setFurniture={setFurniture}
              onAddProduct={(sid) => { setNewProductData({...newProductData, siteId: sid}); setIsAddModalOpen(true); }} 
              onAddFurniture={(sid) => { setActiveView('furniture'); }} 
              // Nouveau bouton pour lancer les besoins depuis un site
              onGenerateNeeds={(sid) => { setPreselectedSiteId(sid); setActiveView('needs_list'); }}
              notify={notify}
              onTransaction={handleTransaction}
              onPasteProducts={handlePasteProducts}
              copiedCount={copiedProducts.length}
              onQuickInventory={handleQuickInventory}
              onDeleteProduct={(id) => setProducts(products.filter(p => p.id !== id))}
            />
          )}
          {activeView === 'suppliers' && <SuppliersView suppliers={suppliers} setSuppliers={setSuppliers} notify={notify} />}
          {activeView === 'audit' && <AuditView products={products} sites={sites} settings={settings} exchangeRate={settings.exchangeRate} onUpdateStock={handleTransaction} notify={notify} />}
          {activeView === 'traceability' && <TraceabilityView history={history} settings={settings} sites={sites} />}
          {activeView === 'tasks' && <TasksView tasks={tasks} setTasks={setTasks} notify={notify} />}
          {activeView === 'needs_list' && <NeedsReportView products={products} settings={settings} needsHistory={needsHistory} onSaveReport={(r) => setNeedsHistory([r, ...needsHistory])} onDeleteReport={(id) => setNeedsHistory(needsHistory.filter(n => n.id !== id))} sites={sites} initialSiteId={preselectedSiteId} />}
          {activeView === 'analytics' && <AnalyticsView products={products} history={history} exchangeRate={settings.exchangeRate} sites={sites} report={autoReport} analysis={autoAnalysis} isAnalyzing={isAnalyzing} onRefresh={runAutomatedAnalysis} />}
          {activeView === 'trash' && <TrashView products={deletedProducts} furniture={deletedFurniture} onRestoreProduct={(id) => {}} onDeleteProduct={(id) => {}} onRestoreFurniture={(id) => {}} onDeleteFurniture={(id) => {}} />}
          {activeView === 'settings' && <SettingsView settings={settings} onUpdateSettings={setSettings} onResetSystem={handleHardReset} notify={notify} />}
          {activeView === 'movements' && <MovementsView products={products} sites={sites} history={history} onTransaction={handleTransaction} />}
        </section>

        {/* MODAL AJOUT PRODUIT */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
            <form onSubmit={handleAddProduct} className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl p-12 space-y-10 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                   <div className="p-4 bg-emerald-50 rounded-[1.5rem] text-emerald-600">
                      <Box className="w-6 h-6" />
                   </div>
                   <h3 className="text-3xl font-header italic uppercase">Nouveau Consommable</h3>
                </div>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-all"><X className="w-6 h-6 text-slate-400" /></button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="col-span-2 space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Désignation du Produit</label>
                  <input required type="text" value={newProductData.name} onChange={(e) => setNewProductData({...newProductData, name: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase italic outline-none focus:ring-2 focus:ring-[#1a3a22]" placeholder="EX: RAMETTE PAPIER A4" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Catégorie</label>
                  <select required value={newProductData.category} onChange={(e) => setNewProductData({...newProductData, category: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase outline-none focus:ring-2 focus:ring-[#1a3a22]">
                    {settings.categories.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Unité de mesure</label>
                  <select required value={newProductData.unit} onChange={(e) => setNewProductData({...newProductData, unit: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase outline-none focus:ring-2 focus:ring-[#1a3a22]">
                    {settings.units.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Stock Initial</label>
                  <input required type="number" value={newProductData.initialStock} onChange={(e) => setNewProductData({...newProductData, initialStock: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-2xl font-header italic outline-none focus:ring-2 focus:ring-[#1a3a22]" />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Seuil Minimum (Alerte)</label>
                  <input required type="number" value={newProductData.minStock} onChange={(e) => setNewProductData({...newProductData, minStock: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-2xl font-header italic outline-none focus:ring-2 focus:ring-[#1a3a22]" />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Stock Cible (Optimale)</label>
                  <input required type="number" value={newProductData.targetStock} onChange={(e) => setNewProductData({...newProductData, targetStock: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-2xl font-header italic outline-none focus:ring-2 focus:ring-[#1a3a22]" />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Prix Unitaire</label>
                  <div className="flex gap-2">
                    <input required type="number" value={newProductData.unitPrice} onChange={(e) => setNewProductData({...newProductData, unitPrice: Number(e.target.value)})} className="flex-1 bg-slate-50 border border-slate-100 p-5 rounded-2xl text-xl font-header italic outline-none" />
                    <select value={newProductData.currency} onChange={(e) => setNewProductData({...newProductData, currency: e.target.value as any})} className="bg-slate-50 border border-slate-100 px-4 rounded-2xl font-black">
                      <option value="Fc">FC</option>
                      <option value="$">$</option>
                    </select>
                  </div>
                </div>

                <div className="col-span-2 space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Affectation au Site</label>
                  <select required value={newProductData.siteId} onChange={(e) => setNewProductData({...newProductData, siteId: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase outline-none focus:ring-2 focus:ring-[#1a3a22]">
                    {sites.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full bg-[#1a3a22] text-white py-8 rounded-[2.5rem] font-black text-[13px] uppercase shadow-2xl hover:bg-emerald-900 transition-all">
                Enregistrer l'Article
              </button>
            </form>
          </div>
        )}

        {/* MODAL EDIT PRODUIT */}
        {isEditModalOpen && editProductData && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
            <form onSubmit={handleUpdateProduct} className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl p-12 space-y-10 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                   <div className="p-4 bg-blue-50 rounded-[1.5rem] text-blue-600">
                      <Edit3 className="w-6 h-6" />
                   </div>
                   <h3 className="text-3xl font-header italic uppercase">Modifier la Fiche</h3>
                </div>
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-all"><X className="w-6 h-6 text-slate-400" /></button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="col-span-2 space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Désignation du Produit</label>
                  <input required type="text" value={editProductData.name} onChange={(e) => setEditProductData({...editProductData, name: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase italic outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Catégorie</label>
                  <select required value={editProductData.category} onChange={(e) => setEditProductData({...editProductData, category: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase outline-none focus:ring-2 focus:ring-blue-500">
                    {settings.categories.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Unité de mesure</label>
                  <select required value={editProductData.unit} onChange={(e) => setEditProductData({...editProductData, unit: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase outline-none focus:ring-2 focus:ring-blue-500">
                    {settings.units.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Seuil Minimum (Alerte)</label>
                  <input required type="number" value={editProductData.minStock} onChange={(e) => setEditProductData({...editProductData, minStock: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-2xl font-header italic outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Stock Cible</label>
                  <input required type="number" value={editProductData.targetStock} onChange={(e) => setEditProductData({...editProductData, targetStock: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-2xl font-header italic outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Prix Unitaire</label>
                  <div className="flex gap-2">
                    <input required type="number" value={editProductData.unitPrice} onChange={(e) => setEditProductData({...editProductData, unitPrice: Number(e.target.value)})} className="flex-1 bg-slate-50 border border-slate-100 p-5 rounded-2xl text-xl font-header italic outline-none" />
                    <select value={editProductData.currency} onChange={(e) => setEditProductData({...editProductData, currency: e.target.value as any})} className="bg-slate-50 border border-slate-100 px-4 rounded-2xl font-black">
                      <option value="Fc">FC</option>
                      <option value="$">$</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Consommation Mensuelle Est.</label>
                  <input required type="number" value={editProductData.monthlyNeed} onChange={(e) => setEditProductData({...editProductData, monthlyNeed: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-2xl font-header italic outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div className="col-span-2 space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Affectation au Site</label>
                  <select required value={editProductData.siteId} onChange={(e) => setEditProductData({...editProductData, siteId: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase outline-none focus:ring-2 focus:ring-blue-500">
                    {sites.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white py-8 rounded-[2.5rem] font-black text-[13px] uppercase shadow-2xl hover:bg-blue-800 transition-all">
                Actualiser la Base
              </button>
            </form>
          </div>
        )}

        {/* Global Search Modal */}
        {isGlobalSearchOpen && (
          <div className="fixed inset-0 z-[5000] flex items-start justify-center pt-[15vh] px-6 bg-slate-900/60 backdrop-blur-md animate-fade-in no-print" onClick={() => setIsGlobalSearchOpen(false)}>
             <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-slide-in flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-8 border-b border-slate-100 flex items-center gap-6">
                   <Search className="w-6 h-6 text-emerald-500" />
                   <input 
                      ref={searchInputRef}
                      type="text" 
                      placeholder="Rechercher partout dans l'ERP..." 
                      className="flex-1 bg-transparent text-xl font-header italic outline-none text-[#1a3a22] placeholder:text-slate-300"
                      value={globalSearchQuery}
                      onChange={(e) => setGlobalSearchQuery(e.target.value)}
                   />
                   <div className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-400 uppercase">ESC</div>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[60vh] p-4 custom-scrollbar">
                   {!globalSearchResults ? (
                      <div className="py-12 text-center">
                         <Command className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                         <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Saisissez au moins 2 caractères...</p>
                      </div>
                   ) : Object.values(globalSearchResults).every((arr: any) => arr.length === 0) ? (
                      <div className="py-12 text-center">
                         <X className="w-12 h-12 text-rose-100 mx-auto mb-4" />
                         <p className="text-[10px] font-black uppercase text-rose-300 tracking-widest">Aucun résultat trouvé pour "{globalSearchQuery}"</p>
                      </div>
                   ) : (
                      <div className="space-y-6">
                         {globalSearchResults.products.length > 0 && (
                            <div>
                               <h4 className="px-4 text-[9px] font-black uppercase text-slate-400 tracking-widest mb-3">Consommables</h4>
                               {globalSearchResults.products.map(p => (
                                  <button key={p.id} onClick={() => navigateToResult('inventory')} className="w-full p-4 hover:bg-slate-50 rounded-2xl flex items-center justify-between group transition-all text-left">
                                     <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Box className="w-5 h-5" /></div>
                                        <div>
                                           <p className="text-[12px] font-black uppercase italic text-slate-900 group-hover:text-emerald-700">{p.name}</p>
                                           <p className="text-[8px] font-bold text-slate-300 tracking-widest">Stock: {p.currentStock} {p.unit}</p>
                                        </div>
                                     </div>
                                     <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                                  </button>
                               ))}
                            </div>
                         )}
                         {globalSearchResults.sites.length > 0 && (
                            <div>
                               <h4 className="px-4 text-[9px] font-black uppercase text-slate-400 tracking-widest mb-3">Sites</h4>
                               {globalSearchResults.sites.map(s => (
                                  <button key={s.id} onClick={() => navigateToResult('sites')} className="w-full p-4 hover:bg-slate-50 rounded-2xl flex items-center justify-between group transition-all text-left">
                                     <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><MapPin className="w-5 h-5" /></div>
                                        <div>
                                           <p className="text-[12px] font-black uppercase italic text-slate-900 group-hover:text-indigo-700">{s.name}</p>
                                           <p className="text-[8px] font-bold text-slate-300 tracking-widest">{s.location}</p>
                                        </div>
                                     </div>
                                     <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                                  </button>
                               ))}
                            </div>
                         )}
                      </div>
                   )}
                </div>
             </div>
          </div>
        )}

        <div className="fixed bottom-12 right-12 z-[5000] flex flex-col gap-4 no-print pointer-events-none">
          {notifications.map(n => (
            <div key={n.id} className={`pointer-events-auto px-8 py-5 rounded-[2rem] shadow-2xl flex items-center gap-4 animate-slide-in border-l-8 ${
              n.type === 'success' ? 'bg-[#1a3a22] text-white border-emerald-500' : 
              n.type === 'warning' ? 'bg-amber-500 text-white border-white/20' :
              n.type === 'error' ? 'bg-rose-600 text-white border-white/20' :
              'bg-blue-600 text-white border-white/20'
            }`}>
               {n.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : 
                n.type === 'warning' ? <AlertCircle className="w-5 h-5" /> :
                n.type === 'error' ? <Trash2 className="w-5 h-5" /> : <Info className="w-5 h-5" />}
               <span className="text-[11px] font-black uppercase italic tracking-widest">{n.message}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

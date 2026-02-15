
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

// Vues (Utilisation de chemins relatifs standards pour compatibilité ES Modules)
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

  const [preselectedSiteId, setPreselectedSiteId] = useState<string>('');
  const [copiedProducts, setCopiedProducts] = useState<Product[]>([]);
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

  useEffect(() => {
    if (!settings.categories.includes(newProductData.category) && settings.categories.length > 0) {
      setNewProductData(prev => ({ ...prev, category: settings.categories[0] }));
    }
  }, [settings.categories]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen(true);
      }
      if (e.key === 'Escape') setIsGlobalSearchOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    if (confirm("Purge totale du système ?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleLogout = () => {
    if (confirm("Déconnexion ?")) setIsLoggedIn(false);
  };

  // --- GESTION CORBEILLE ET SUPPRESSION ---
  
  const moveToTrashProduct = (id: string) => {
    const product = products.find(p => p.id === id);
    if (product) {
      setDeletedProducts([product, ...deletedProducts]);
      setProducts(products.filter(p => p.id !== id));
      notify(`"${product.name}" déplacé dans la corbeille.`, "info");
    }
  };

  const handleRestoreProduct = (id: string) => {
    const product = deletedProducts.find(p => p.id === id);
    if (product) {
      setProducts([product, ...products]);
      setDeletedProducts(deletedProducts.filter(p => p.id !== id));
      notify(`"${product.name}" restauré.`);
    }
  };

  const handlePermanentDeleteProduct = (id: string) => {
    setDeletedProducts(deletedProducts.filter(p => p.id !== id));
    notify("Article supprimé définitivement.", "error");
  };

  const moveToTrashFurniture = (id: string) => {
    const item = furniture.find(f => f.id === id);
    if (item) {
      setDeletedFurniture([item, ...deletedFurniture]);
      setFurniture(furniture.filter(f => f.id !== id));
      notify(`Actif "${item.name}" déplacé dans la corbeille.`, "info");
    }
  };

  const handleRestoreFurniture = (id: string) => {
    const item = deletedFurniture.find(f => f.id === id);
    if (item) {
      setFurniture([item, ...furniture]);
      setDeletedFurniture(deletedFurniture.filter(f => f.id !== id));
      notify(`"${item.name}" restauré.`);
    }
  };

  const handlePermanentDeleteFurniture = (id: string) => {
    setDeletedFurniture(deletedFurniture.filter(f => f.id !== id));
    notify("Actif supprimé définitivement.", "error");
  };

  // --- FIN GESTION CORBEILLE ---

  const handleCopyProducts = (ps: Product[]) => {
    setCopiedProducts(ps);
    notify(`${ps.length} article(s) copié(s).`);
  };

  const handlePasteProducts = (siteId: string) => {
    if (copiedProducts.length === 0) return;
    const site = sites.find(s => s.id === siteId);
    if (!site) return;
    const siteExistingProductNames = products.filter(p => p.siteId === siteId).map(p => p.name.toUpperCase());
    const productsToPaste = copiedProducts.filter(p => !siteExistingProductNames.includes(p.name.toUpperCase()));
    const skipCount = copiedProducts.length - productsToPaste.length;
    if (productsToPaste.length === 0) return notify(`Tous ces articles existent déjà sur ${site.name}`, "warning");
    const newClones: Product[] = productsToPaste.map(p => ({
      ...p, id: `PRD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`, siteId, currentStock: 0, lastInventoryDate: new Date().toISOString()
    }));
    setProducts([...newClones, ...products]);
    notify(`${newClones.length} articles ajoutés sur ${site.name}. ${skipCount > 0 ? skipCount + ' ignorés.' : ''}`);
  };

  const handleTransaction = (prodId: string, amount: number, reason: string, type: any = 'adjustment') => {
    const product = products.find(p => p.id === prodId);
    if (!product) return;
    const finalStock = product.currentStock + amount;
    if (finalStock < 0) return notify(`Stock insuffisant pour ${product.name}`, "error");

    if (type === 'entry') {
      const priceFc = product.currency === '$' ? product.unitPrice * settings.exchangeRate : product.unitPrice;
      setLogisticsBalance(prev => prev - (Math.abs(amount) * priceFc));
    }

    setProducts(products.map(p => p.id === prodId ? { ...p, currentStock: finalStock, lastInventoryDate: new Date().toISOString() } : p));
    if (settings.notificationsEnabled && finalStock <= product.minStock) notify(`Alerte Stock Bas : ${product.name}`, 'warning');

    const newLog: InventoryLog = { 
      id: `LOG-${Date.now()}`.toUpperCase(), date: new Date().toISOString(), type, productId: prodId, productName: product.name, 
      changeAmount: amount, finalStock, reason: reason || 'Audit manuel', responsible: 'ADMIN', siteId: product.siteId 
    };
    setHistory([newLog, ...history]);
  };

  const handleQuickInventory = (prodId: string) => {
    const product = products.find(p => p.id === prodId);
    if (!product) return;
    handleTransaction(prodId, product.targetStock - product.currentStock, "Inventaire rapide", "manual_update");
    notify(`Stock de "${product.name}" synchronisé.`);
  };

  useEffect(() => {
    const storageKeys = {
      'ss_products': products, 'ss_deleted_products': deletedProducts, 'ss_furniture': furniture, 'ss_deleted_furniture': deletedFurniture,
      'ss_sites': sites, 'ss_history': history, 'ss_tasks': tasks, 'ss_settings': settings, 'ss_suppliers': suppliers,
      'ss_furniture_audits': furnitureAudits, 'ss_needs_history': needsHistory, 'ss_logistics_balance': logisticsBalance, 'isLoggedIn': isLoggedIn
    };
    Object.entries(storageKeys).forEach(([key, val]) => localStorage.setItem(key, JSON.stringify(val)));
  }, [products, deletedProducts, furniture, deletedFurniture, history, tasks, isLoggedIn, settings, sites, suppliers, furnitureAudits, needsHistory, logisticsBalance]);

  const handleAddProduct = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetSiteId = newProductData.siteId || sites[0].id;
    const nameUpper = newProductData.name.toUpperCase();
    if (products.some(p => p.name.toUpperCase() === nameUpper && p.siteId === targetSiteId)) return notify(`L'article existe déjà sur ce site.`, "error");

    const id = newProductData.id || `RÉF-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const product: Product = {
      id, name: nameUpper, category: newProductData.category, currentStock: Number(newProductData.initialStock), 
      minStock: Number(newProductData.minStock), targetStock: Number(newProductData.targetStock),
      monthlyNeed: Number(newProductData.monthlyNeed) || 20, unit: newProductData.unit, 
      unitPrice: Number(newProductData.unitPrice), currency: newProductData.currency, siteId: targetSiteId, lastInventoryDate: new Date().toISOString()
    };
    setProducts([product, ...products]);
    if (product.currentStock > 0) handleTransaction(id, product.currentStock, 'Initialisation', 'entry');
    setIsAddModalOpen(false);
    setNewProductData({ id: '', name: '', category: settings.categories[0] || 'Alimentaire', unitPrice: 0, currency: 'Fc', minStock: 10, targetStock: 50, unit: settings.units[0] || 'PIÈCE', initialStock: 0, siteId: '', monthlyNeed: 20 });
    notify(`Produit ajouté.`);
  };

  const handleUpdateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProductData) return;
    if (products.some(p => p.id !== editProductData.id && p.name.toUpperCase() === editProductData.name.toUpperCase() && p.siteId === editProductData.siteId)) return notify(`Doublon détecté sur ce site.`, "error");
    setProducts(products.map(p => p.id === editProductData.id ? editProductData : p));
    setIsEditModalOpen(false);
    setEditProductData(null);
    notify(`Fiche mise à jour.`);
  };

  if (isFirstLaunch) return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a3a22] p-6">
      <div className="bg-white w-full max-w-md rounded-[3rem] p-12 shadow-2xl text-center">
        <Database className="w-16 h-16 text-emerald-600 mx-auto mb-6" />
        <h2 className="text-2xl font-black uppercase text-[#1a3a22]">Initialisation Système</h2>
        <button onClick={() => { setSites([{ id: 'SITE-01', name: 'Magasin Central', location: 'Local', capacity: 5000, status: 'Opérationnel', manager: 'Admin' }]); setIsFirstLaunch(false); setIsLoggedIn(true); }} className="w-full mt-8 bg-emerald-600 text-white py-6 rounded-2xl font-black uppercase shadow-xl">Lancer</button>
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
        <div className="px-2 mb-8">
           <button onClick={() => setIsGlobalSearchOpen(true)} className="w-full flex items-center justify-between px-4 py-3 bg-white/10 border border-white/5 rounded-2xl text-slate-400 hover:bg-white/20 transition-all group">
              <div className="flex items-center gap-3"><Search className="w-4 h-4 text-emerald-400" /><span className="text-[10px] font-bold uppercase tracking-widest italic group-hover:text-white">Recherche...</span></div>
              <div className="flex items-center gap-1 opacity-40"><Command className="w-2.5 h-2.5" /><span className="text-[8px] font-black">K</span></div>
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
        <button onClick={handleLogout} className="mt-8 flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/5 text-slate-400 font-bold text-[10px] uppercase hover:bg-rose-600 hover:text-white transition-all"><LogOut className="w-4 h-4" /> Déconnexion</button>
      </aside>

      <main className="flex-1 ml-[300px] p-12 pr-16 relative">
        <header className="mb-10 flex justify-between items-end no-print">
          <div><p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">{settings.enterpriseName}</p><h2 className="text-[44px] font-header text-slate-900 leading-none italic uppercase">{getViewTitle(activeView)}</h2></div>
        </header>
        <section className="animate-fade-in">
          {activeView === 'dashboard' && <DashboardView products={products} sites={sites} furniture={furniture} history={history} exchangeRate={settings.exchangeRate} setView={setActiveView} logisticsBalance={logisticsBalance} settings={settings} />}
          {activeView === 'inventory' && <InventoryView products={products} sites={sites} settings={settings} onMovement={(p, val) => handleTransaction(p.id, val, "Mise à jour rapide", "adjustment")} onQuickInventory={handleQuickInventory} onEdit={(p) => { setEditProductData(p); setIsEditModalOpen(true); }} onImport={(e) => {}} onAdd={() => setIsAddModalOpen(true)} onDelete={moveToTrashProduct} onCopyProducts={handleCopyProducts} />}
          {activeView === 'furniture' && <FurnitureView furniture={furniture} setFurniture={setFurniture} furnitureAudits={furnitureAudits} setFurnitureAudits={setFurnitureAudits} sites={sites} notify={notify} onImportFurniture={(e) => {}} />}
          {activeView === 'sites' && <SitesView sites={sites} setSites={setSites} products={products} setProducts={setProducts} furniture={furniture} setFurniture={setFurniture} onAddProduct={(sid) => { setNewProductData({...newProductData, siteId: sid}); setIsAddModalOpen(true); }} onAddFurniture={() => setActiveView('furniture')} onGenerateNeeds={(sid) => { setPreselectedSiteId(sid); setActiveView('needs_list'); }} notify={notify} onTransaction={handleTransaction} onPasteProducts={handlePasteProducts} copiedCount={copiedProducts.length} onQuickInventory={handleQuickInventory} onDeleteProduct={moveToTrashProduct} />}
          {activeView === 'suppliers' && <SuppliersView suppliers={suppliers} setSuppliers={setSuppliers} notify={notify} />}
          {activeView === 'audit' && <AuditView products={products} sites={sites} settings={settings} exchangeRate={settings.exchangeRate} onUpdateStock={handleTransaction} notify={notify} />}
          {activeView === 'traceability' && <TraceabilityView history={history} settings={settings} sites={sites} />}
          {activeView === 'tasks' && <TasksView tasks={tasks} setTasks={setTasks} notify={notify} />}
          {activeView === 'needs_list' && <NeedsReportView products={products} settings={settings} needsHistory={needsHistory} onSaveReport={(r) => setNeedsHistory([r, ...needsHistory])} onDeleteReport={(id) => setNeedsHistory(needsHistory.filter(n => n.id !== id))} sites={sites} initialSiteId={preselectedSiteId} />}
          {activeView === 'analytics' && <AnalyticsView products={products} history={history} sites={sites} settings={settings} />}
          {activeView === 'trash' && <TrashView products={deletedProducts} furniture={deletedFurniture} onRestoreProduct={handleRestoreProduct} onDeleteProduct={handlePermanentDeleteProduct} onRestoreFurniture={handleRestoreFurniture} onDeleteFurniture={handlePermanentDeleteFurniture} />}
          {activeView === 'settings' && <SettingsView settings={settings} onUpdateSettings={setSettings} onResetSystem={handleHardReset} notify={notify} />}
          {activeView === 'movements' && <MovementsView products={products} sites={sites} history={history} onTransaction={handleTransaction} />}
        </section>

        {isAddModalOpen && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
            <form onSubmit={handleAddProduct} className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl p-12 space-y-10 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center"><div className="flex items-center gap-4"><div className="p-4 bg-emerald-50 rounded-[1.5rem] text-emerald-600"><Box className="w-6 h-6" /></div><h3 className="text-3xl font-header italic uppercase">Nouveau Consommable</h3></div><button type="button" onClick={() => setIsAddModalOpen(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-all"><X className="w-6 h-6 text-slate-400" /></button></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="col-span-2 space-y-2"><label className="text-[9px] font-black uppercase text-slate-400 ml-4">Désignation</label><input required type="text" value={newProductData.name} onChange={(e) => setNewProductData({...newProductData, name: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase italic outline-none focus:ring-2 focus:ring-[#1a3a22]" /></div>
                <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400 ml-4">Catégorie</label><select required value={newProductData.category} onChange={(e) => setNewProductData({...newProductData, category: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase outline-none">{settings.categories.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}</select></div>
                <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400 ml-4">Unité</label><select required value={newProductData.unit} onChange={(e) => setNewProductData({...newProductData, unit: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase outline-none">{settings.units.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}</select></div>
                <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400 ml-4">Stock Initial</label><input required type="number" value={newProductData.initialStock} onChange={(e) => setNewProductData({...newProductData, initialStock: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-2xl font-header italic outline-none" /></div>
                <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400 ml-4">Seuil Minimum</label><input required type="number" value={newProductData.minStock} onChange={(e) => setNewProductData({...newProductData, minStock: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-2xl font-header italic outline-none" /></div>
                <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400 ml-4">Stock Cible</label><input required type="number" value={newProductData.targetStock} onChange={(e) => setNewProductData({...newProductData, targetStock: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-2xl font-header italic outline-none" /></div>
                <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400 ml-4">Prix Unitaire</label><div className="flex gap-2"><input required type="number" value={newProductData.unitPrice} onChange={(e) => setNewProductData({...newProductData, unitPrice: Number(e.target.value)})} className="flex-1 bg-slate-50 border border-slate-100 p-5 rounded-2xl text-xl font-header italic outline-none" /><select value={newProductData.currency} onChange={(e) => setNewProductData({...newProductData, currency: e.target.value as any})} className="bg-slate-50 border border-slate-100 px-4 rounded-2xl font-black"><option value="Fc">FC</option><option value="$">$</option></select></div></div>
                <div className="col-span-2 space-y-2"><label className="text-[9px] font-black uppercase text-slate-400 ml-4">Affectation Site</label><select required value={newProductData.siteId} onChange={(e) => setNewProductData({...newProductData, siteId: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase outline-none">{sites.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}</select></div>
              </div>
              <button type="submit" className="w-full bg-[#1a3a22] text-white py-8 rounded-[2.5rem] font-black text-[13px] uppercase shadow-2xl hover:bg-emerald-900 transition-all">Enregistrer</button>
            </form>
          </div>
        )}

        {isEditModalOpen && editProductData && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
            <form onSubmit={handleUpdateProduct} className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl p-12 space-y-10 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center"><div className="flex items-center gap-4"><div className="p-4 bg-blue-50 rounded-[1.5rem] text-blue-600"><Edit3 className="w-6 h-6" /></div><h3 className="text-3xl font-header italic uppercase">Modifier la Fiche</h3></div><button type="button" onClick={() => setIsEditModalOpen(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-all"><X className="w-6 h-6 text-slate-400" /></button></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="col-span-2 space-y-2"><label className="text-[9px] font-black uppercase text-slate-400 ml-4">Désignation</label><input required type="text" value={editProductData.name} onChange={(e) => setEditProductData({...editProductData, name: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase italic outline-none" /></div>
                <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400 ml-4">Stock Minimum</label><input required type="number" value={editProductData.minStock} onChange={(e) => setEditProductData({...editProductData, minStock: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-2xl font-header italic outline-none" /></div>
                <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400 ml-4">Stock Cible</label><input required type="number" value={editProductData.targetStock} onChange={(e) => setEditProductData({...editProductData, targetStock: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-2xl font-header italic outline-none" /></div>
                <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400 ml-4">Consommation Mensuelle</label><input required type="number" value={editProductData.monthlyNeed} onChange={(e) => setEditProductData({...editProductData, monthlyNeed: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-2xl font-header italic outline-none" /></div>
                <div className="col-span-2 space-y-2"><label className="text-[9px] font-black uppercase text-slate-400 ml-4">Site</label><select required value={editProductData.siteId} onChange={(e) => setEditProductData({...editProductData, siteId: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase outline-none">{sites.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}</select></div>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-8 rounded-[2.5rem] font-black text-[13px] uppercase shadow-2xl hover:bg-blue-800 transition-all">Actualiser</button>
            </form>
          </div>
        )}

        {isGlobalSearchOpen && (
          <div className="fixed inset-0 z-[5000] flex items-start justify-center pt-[15vh] px-6 bg-slate-900/60 backdrop-blur-md animate-fade-in no-print" onClick={() => setIsGlobalSearchOpen(false)}>
             <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-slide-in flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-8 border-b border-slate-100 flex items-center gap-6"><Search className="w-6 h-6 text-emerald-500" /><input ref={searchInputRef} type="text" placeholder="Recherche..." className="flex-1 bg-transparent text-xl font-header italic outline-none" value={globalSearchQuery} onChange={(e) => setGlobalSearchQuery(e.target.value)} /></div>
                <div className="flex-1 overflow-y-auto max-h-[60vh] p-4">
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
            }`}><span className="text-[11px] font-black uppercase italic tracking-widest">{n.message}</span></div>
          ))}
        </div>
      </main>
    </div>
  );
}

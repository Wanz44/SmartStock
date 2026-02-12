
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  LayoutDashboard, Box, History as HistoryIcon, Activity, LogOut, 
  Settings, CheckSquare, FileBarChart, ListChecks, Globe, X, RefreshCw,
  MapPin, CheckCircle2, Info, Lamp, ArrowLeftRight,
  Search, Truck, Command, AlertTriangle, Database,
  Plus, Save, ChevronRight, ClipboardCheck, ShoppingCart, Calculator
} from 'lucide-react';
import { 
  Product, InventoryLog, ViewType, Task, AppSettings, NeedReport, 
  Site, Furniture, FurnitureAuditSession, Supplier, RapportAutomatique 
} from './types';
import { INITIAL_CATEGORIES, INITIAL_UNITS } from './constants';

// Importation des vues modulaires
import { DashboardView } from './DashboardView';
import { InventoryView } from './InventoryView';
import { GlobalHistoryView } from './GlobalHistoryView';
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
  printHeader: 'REGISTRE OFFICIEL DE STOCK ET PATRIMOINE',
  printFooter: 'Document généré par SmartStock Pro ERP System',
  maskSensitiveData: false,
  printModel: 'excel-green',
  showPageNumbers: true,
  // Advanced Print Settings
  printFontFamily: 'Calibri',
  printFontSize: 10,
  printBoldHeaders: true,
  printThemeColor: '#1a3a22',
  printStripeColor: '#f0fdf4',
  printBorderWidth: 1,
  printConditionalFormatting: true,
  printCellPadding: 8
};

const getViewTitle = (view: ViewType): string => {
  switch (view) {
    case 'dashboard': return 'Tableau de Bord';
    case 'inventory': return 'Inventaire Consommables';
    case 'furniture': return 'Inventaire Mobilier';
    case 'sites': return 'Gestion Sites';
    case 'suppliers': return 'Gestion Fournisseurs';
    case 'audit': return 'Audit / Écarts';
    case 'traceability': return 'Historique Complet';
    case 'tasks': return 'Agenda Tâches';
    case 'needs_list': return 'État de Besoins';
    case 'analytics': return 'Analyses Auto';
    case 'settings': return 'Paramètres';
    case 'movements': return 'Entrées & Sorties';
    default: return 'SmartStock ERP';
  }
};

interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
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
      <span className="bg-rose-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[7px] animate-pulse">
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
  const [furniture, setFurniture] = useState<Furniture[]>(getStored('ss_furniture', []));
  const [furnitureAudits, setFurnitureAudits] = useState<FurnitureAuditSession[]>(getStored('ss_furniture_audits', []));
  const [history, setHistory] = useState<InventoryLog[]>(getStored('ss_history', []));
  const [tasks, setTasks] = useState<Task[]>(getStored('ss_tasks', []));
  const [needsHistory, setNeedsHistory] = useState<NeedReport[]>(getStored('ss_needs_history', []));
  const [sites, setSites] = useState<Site[]>(getStored('ss_sites', []));
  const [suppliers, setSuppliers] = useState<Supplier[]>(getStored('ss_suppliers', []));
  
  const [autoReport, setAutoReport] = useState<RapportAutomatique | null>(null);
  const [autoAnalysis, setAutoAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const [newProductData, setNewProductData] = useState({
    id: '', name: '', category: 'Alimentaire', unitPrice: 0, currency: 'Fc' as 'Fc' | '$', 
    minStock: 10, unit: settings.units[0] || 'PIÈCE', initialStock: 0, siteId: '',
    monthlyNeed: 20
  });

  const [isFirstLaunch, setIsFirstLaunch] = useState(() => {
    return products.length === 0 && sites.length === 0;
  });

  const notify = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000);
  };

  const handleTransaction = (prodId: string, amount: number, reason: string, type: 'entry' | 'exit' | 'adjustment' = 'adjustment') => {
    const product = products.find(p => p.id === prodId);
    if (!product) return;
    const finalStock = product.currentStock + amount;
    if (finalStock < 0) return notify(`Stock insuffisant pour ${product.name}`, "error");

    const updated = products.map(p => p.id === prodId ? { ...p, currentStock: finalStock, lastInventoryDate: new Date().toISOString() } : p);
    setProducts(updated);
    
    const newLog: InventoryLog = { 
      id: `LOG-${Date.now()}`.toUpperCase(),
      date: new Date().toISOString(), type, productId: prodId, productName: product.name, 
      changeAmount: amount, finalStock, reason: reason || 'Transaction manuelle', responsible: 'ADMIN', siteId: product.siteId 
    };
    setHistory([newLog, ...history]);
    notify(`${amount > 0 ? 'Entrée' : 'Sortie'} validée pour ${product.name}`);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>, targetSiteId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length <= 1) return;

      const newProducts = [...products];
      const timestamp = new Date().toISOString();
      let count = 0;
      let updatedCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(s => s.trim().replace(/^"|"$/g, ''));
        if (parts.length < 2) continue;
        const [id, name, cat, stock, min, unit, price, cur] = parts;
        
        const existingIdx = newProducts.findIndex(p => p.id === id || (p.name.toUpperCase() === name.toUpperCase() && p.siteId === (targetSiteId || sites[0]?.id)));
        
        if (existingIdx === -1) {
          newProducts.push({
            id: id || `SKU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            name: name.toUpperCase(), category: cat || 'Autre', currentStock: parseInt(stock) || 0,
            minStock: parseInt(min) || 10, monthlyNeed: (parseInt(min) || 10) * 2, unit: unit || 'PIÈCE',
            unitPrice: parseFloat(price) || 0, currency: (cur as any) || 'Fc',
            siteId: targetSiteId || sites[0]?.id || '1', lastInventoryDate: timestamp
          });
          count++;
        } else {
          // Mise à jour si l'article existe
          newProducts[existingIdx] = {
            ...newProducts[existingIdx],
            currentStock: parseInt(stock) || newProducts[existingIdx].currentStock,
            unitPrice: parseFloat(price) || newProducts[existingIdx].unitPrice,
            lastInventoryDate: timestamp
          };
          updatedCount++;
        }
      }
      setProducts(newProducts);
      notify(`${count} articles créés, ${updatedCount} mis à jour.`);
    };
    reader.readAsText(file);
    if(e.target) e.target.value = '';
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (sites.length === 0) return notify("Veuillez créer un site d'abord", "error");
    if (!newProductData.name) return notify("Nom requis", "error");
    
    const id = newProductData.id || `SKU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // Vérifier doublon
    if (products.some(p => p.id === id)) return notify("Cet identifiant SKU existe déjà.", "error");

    const product: Product = {
      id, 
      name: newProductData.name.toUpperCase(), 
      category: newProductData.category, 
      currentStock: newProductData.initialStock, 
      minStock: newProductData.minStock, 
      monthlyNeed: newProductData.monthlyNeed || (newProductData.minStock * 2),
      unit: newProductData.unit, 
      unitPrice: newProductData.unitPrice, 
      currency: newProductData.currency,
      siteId: newProductData.siteId || sites[0].id, 
      lastInventoryDate: new Date().toISOString()
    };
    
    setProducts([product, ...products]);
    if (product.currentStock > 0) {
      handleTransaction(id, product.currentStock, 'Stock initial à la création', 'entry');
    }
    
    setIsAddModalOpen(false);
    setNewProductData({
      id: '', name: '', category: 'Alimentaire', unitPrice: 0, currency: 'Fc' as 'Fc' | '$', 
      minStock: 10, unit: settings.units[0] || 'PIÈCE', initialStock: 0, siteId: '',
      monthlyNeed: 20
    });
    notify(`Produit "${product.name}" ajouté à l'inventaire.`);
  };

  const runAutomatedAnalysis = async () => {
    if (products.length === 0) return;
    setIsAnalyzing(true);
    try {
      const report = await getAutomatedReport(products, history, settings.exchangeRate, sites);
      const analysis = await getAutomatedAnalysis(products, history);
      setAutoReport(report);
      setAutoAnalysis(analysis);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (activeView === 'analytics') runAutomatedAnalysis();
  }, [activeView]);

  useEffect(() => {
    localStorage.setItem('ss_products', JSON.stringify(products));
    localStorage.setItem('ss_sites', JSON.stringify(sites));
    localStorage.setItem('ss_history', JSON.stringify(history));
    localStorage.setItem('ss_tasks', JSON.stringify(tasks));
    localStorage.setItem('ss_settings', JSON.stringify(settings));
    localStorage.setItem('isLoggedIn', JSON.stringify(isLoggedIn));
    localStorage.setItem('ss_furniture', JSON.stringify(furniture));
    localStorage.setItem('ss_suppliers', JSON.stringify(suppliers));
  }, [products, history, tasks, isLoggedIn, settings, sites, furniture, suppliers]);

  if (isFirstLaunch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a3a22] p-6">
        <div className="bg-white w-full max-w-md rounded-[3rem] p-12 shadow-2xl text-center">
          <Database className="w-16 h-16 text-emerald-600 mx-auto mb-6" />
          <h2 className="text-2xl font-black uppercase text-[#1a3a22]">Installation SmartStock</h2>
          <p className="text-[10px] font-bold text-slate-400 mt-2 mb-8 uppercase">Initialisation des paramètres usine</p>
          <button
            onClick={() => {
              const s: Site = { id: 'SITE-01', name: 'Magasin Central', location: 'Local', capacity: 5000, status: 'Opérationnel', manager: 'Admin' };
              setSites([s]); setIsFirstLaunch(false); setIsLoggedIn(true);
            }}
            className="w-full bg-emerald-600 text-white py-6 rounded-2xl font-black uppercase shadow-xl hover:bg-emerald-700 transition-all"
          >
            Lancer la Plateforme
          </button>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) return <LoginView enterpriseName={settings.enterpriseName} onLogin={() => setIsLoggedIn(true)} />;

  return (
    <div className={`min-h-screen flex bg-[#f8fafc] model-${settings.printModel} ${settings.showPageNumbers ? 'show-page-numbers' : ''}`}>
      {/* Styles d'impression dynamiques basés sur les réglages avancés */}
      <style>{`
        @media print {
          .excel-table {
            font-family: "${settings.printFontFamily}", sans-serif !important;
            font-size: ${settings.printFontSize}pt !important;
          }
          .excel-table th {
            background-color: ${settings.printThemeColor} !important;
            color: white !important;
            font-weight: ${settings.printBoldHeaders ? '900' : 'normal'} !important;
            border: ${settings.printBorderWidth}px solid #333 !important;
            padding: ${settings.printCellPadding}px !important;
          }
          .excel-table td {
            border: ${settings.printBorderWidth}px solid #ccc !important;
            padding: ${settings.printCellPadding}px !important;
          }
          .excel-table tr:nth-child(even) {
            background-color: ${settings.printStripeColor} !important;
          }
          /* Mise en forme conditionnelle Print */
          ${settings.printConditionalFormatting ? `
            .stock-critical { background-color: #fee2e2 !important; color: #b91c1c !important; font-weight: bold !important; }
            .stock-optimal { background-color: #d1fae5 !important; color: #065f46 !important; }
          ` : ''}
        }
      `}</style>

      <aside className="sidebar-float no-print">
        <div className="flex items-center gap-3 mb-10 px-2">
          <Activity className="w-8 h-8 text-emerald-400" />
          <h1 className="text-white text-lg font-black uppercase tracking-tighter italic">SmartStock <span className="text-emerald-400">Pro</span></h1>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
          <NavItem active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} icon={LayoutDashboard} label="Tableau de bord" />
          <NavItem active={activeView === 'inventory'} onClick={() => setActiveView('inventory')} icon={Box} label="Inventaire Consommables" />
          <NavItem active={activeView === 'furniture'} onClick={() => setActiveView('furniture')} icon={Lamp} label="Inventaire Mobilier" />
          <NavItem active={activeView === 'sites'} onClick={() => setActiveView('sites')} icon={MapPin} label="Gestion Sites" />
          <NavItem active={activeView === 'suppliers'} onClick={() => setActiveView('suppliers')} icon={Truck} label="Fournisseurs" />
          <NavItem active={activeView === 'audit'} onClick={() => setActiveView('audit')} icon={ClipboardCheck} label="Audit / Écarts" />
          <NavItem active={activeView === 'traceability'} onClick={() => setActiveView('traceability')} icon={HistoryIcon} label="Historique Complet" />
          <NavItem active={activeView === 'tasks'} onClick={() => setActiveView('tasks')} icon={CheckSquare} label="Agenda Tâches" alertCount={tasks.filter(t => t.status === 'En attente').length} />
          <NavItem active={activeView === 'needs_list'} onClick={() => setActiveView('needs_list')} icon={ShoppingCart} label="État de Besoins" />
          <NavItem active={activeView === 'analytics'} onClick={() => setActiveView('analytics')} icon={FileBarChart} label="Analyses Auto" />
          <NavItem active={activeView === 'settings'} onClick={() => setActiveView('settings')} icon={Settings} label="Paramètres" />
        </nav>

        <button onClick={() => setIsLogoutModalOpen(true)} className="mt-8 flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/5 text-slate-400 font-bold text-[10px] uppercase hover:bg-rose-600 hover:text-white transition-all">
          <LogOut className="w-4 h-4" /> Clôturer Session
        </button>
      </aside>

      <main className="flex-1 ml-[300px] p-12 pr-16 relative">
        <header className="mb-10 flex justify-between items-end no-print">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">{settings.enterpriseName}</p>
            <h2 className="text-[44px] font-header text-slate-900 leading-none italic uppercase">{getViewTitle(activeView)}</h2>
          </div>
          <div className="bg-white px-5 py-3 rounded-2xl border border-slate-100 flex items-center gap-3 shadow-sm">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">{settings.locationId}</span>
          </div>
        </header>

        <section className="animate-fade-in">
          {activeView === 'dashboard' && <DashboardView products={products} furniture={furniture} history={history} exchangeRate={settings.exchangeRate} setView={setActiveView} />}
          {activeView === 'inventory' && <InventoryView products={products} sites={sites} settings={settings} onMovement={(p, t) => setActiveView('movements')} onEdit={() => {}} onImport={handleImportCSV} onAdd={() => setIsAddModalOpen(true)} onDelete={(id) => setProducts(products.filter(p => p.id !== id))} />}
          {activeView === 'furniture' && <FurnitureView furniture={furniture} setFurniture={setFurniture} furnitureAudits={furnitureAudits} setFurnitureAudits={setFurnitureAudits} sites={sites} notify={notify} />}
          {activeView === 'sites' && <SitesView sites={sites} setSites={setSites} products={products} onCopyData={() => {}} onImportCSV={handleImportCSV} />}
          {activeView === 'suppliers' && <SuppliersView suppliers={suppliers} setSuppliers={setSuppliers} notify={notify} />}
          {activeView === 'audit' && <AuditView products={products} sites={sites} exchangeRate={settings.exchangeRate} onUpdateStock={handleTransaction} notify={notify} />}
          {activeView === 'traceability' && <GlobalHistoryView history={history} needsHistory={needsHistory} furnitureAudits={furnitureAudits} sites={sites} products={products} settings={settings} />}
          {activeView === 'tasks' && <TasksView tasks={tasks} setTasks={setTasks} notify={notify} />}
          {activeView === 'needs_list' && <NeedsReportView products={products} settings={settings} needsHistory={needsHistory} onSaveReport={(r) => setNeedsHistory([r, ...needsHistory])} onDeleteReport={(id) => setNeedsHistory(needsHistory.filter(n => n.id !== id))} sites={sites} />}
          {activeView === 'analytics' && <AnalyticsView products={products} history={history} exchangeRate={settings.exchangeRate} sites={sites} report={autoReport} analysis={autoAnalysis} isAnalyzing={isAnalyzing} onRefresh={runAutomatedAnalysis} />}
          {activeView === 'settings' && <SettingsView settings={settings} onUpdateSettings={setSettings} onResetSystem={() => localStorage.clear()} />}
          {activeView === 'movements' && <MovementsView products={products} sites={sites} history={history} onTransaction={handleTransaction} />}
        </section>

        {isLogoutModalOpen && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
            <div className="bg-white w-full max-sm rounded-[3rem] p-12 text-center shadow-2xl">
              <LogOut className="w-12 h-12 text-rose-500 mx-auto mb-6" />
              <h3 className="text-2xl font-black uppercase text-slate-900 mb-2 italic">Quitter ?</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-8 leading-relaxed">Voulez-vous clôturer votre session de gestion actuelle ?</p>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => { setIsLoggedIn(false); setIsLogoutModalOpen(false); }} className="bg-rose-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] shadow-lg">Confirmer</button>
                <button onClick={() => setIsLogoutModalOpen(false)} className="bg-slate-100 text-slate-600 py-4 rounded-2xl font-black uppercase text-[10px]">Annuler</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL AJOUT MANUEL AVANCÉ */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
            <form onSubmit={handleAddProduct} className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] p-12 space-y-8 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 shadow-inner">
                    <Plus className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-header italic uppercase leading-none">Nouvelle Référence</h3>
                    <p className="text-[10px] font-black uppercase text-slate-400 mt-1 tracking-widest">Enregistrement manuel dans la BDD</p>
                  </div>
                </div>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="p-3 bg-slate-100 rounded-full hover:bg-slate-200 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="col-span-1 space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-3">SKU / Identifiant Unique</label>
                  <input 
                    type="text" 
                    placeholder="AUTO-GÉNÉRÉ SI VIDE"
                    value={newProductData.id} 
                    onChange={(e) => setNewProductData({...newProductData, id: e.target.value.toUpperCase()})} 
                    className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase tracking-wider outline-none focus:ring-4 focus:ring-emerald-500/10" 
                  />
                </div>

                <div className="col-span-1 space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-3">Désignation de l'Article</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="EX: RAMETTE PAPIER A4..."
                    value={newProductData.name} 
                    onChange={(e) => setNewProductData({...newProductData, name: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase italic outline-none focus:ring-4 focus:ring-[#1a3a22]/10" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-3">Catégorie</label>
                  <select 
                    value={newProductData.category} 
                    onChange={(e) => setNewProductData({...newProductData, category: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[11px] font-black uppercase outline-none"
                  >
                    {INITIAL_CATEGORIES.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-3">Site d'Affectation</label>
                  <select 
                    value={newProductData.siteId} 
                    onChange={(e) => setNewProductData({...newProductData, siteId: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[11px] font-black uppercase outline-none"
                  >
                    <option value="">SÉLECTIONNER UN SITE...</option>
                    {sites.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-3">Unité de Mesure</label>
                  <select 
                    value={newProductData.unit} 
                    onChange={(e) => setNewProductData({...newProductData, unit: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[11px] font-black uppercase outline-none"
                  >
                    {settings.units.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-3">Prix Unitaire HT</label>
                  <div className="flex gap-2">
                    <input 
                      required 
                      type="number" 
                      step="0.01"
                      placeholder="0.00"
                      value={newProductData.unitPrice} 
                      onChange={(e) => setNewProductData({...newProductData, unitPrice: Number(e.target.value)})} 
                      className="flex-1 bg-slate-50 border border-slate-100 p-5 rounded-2xl text-xl font-header italic outline-none" 
                    />
                    <select 
                      value={newProductData.currency} 
                      onChange={(e) => setNewProductData({...newProductData, currency: e.target.value as any})} 
                      className="w-24 bg-slate-900 text-white p-5 rounded-2xl text-[10px] font-black uppercase"
                    >
                      <option value="Fc">FC</option>
                      <option value="$">$</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-3">Stock Physique Actuel</label>
                  <input 
                    type="number" 
                    value={newProductData.initialStock} 
                    onChange={(e) => setNewProductData({...newProductData, initialStock: Number(e.target.value)})} 
                    className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-2xl font-header italic outline-none focus:ring-4 focus:ring-emerald-500/10 text-emerald-600" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-3">Stock de Sécurité (Seuil)</label>
                  <input 
                    type="number" 
                    value={newProductData.minStock} 
                    onChange={(e) => setNewProductData({...newProductData, minStock: Number(e.target.value)})} 
                    className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-2xl font-header italic outline-none focus:ring-4 focus:ring-rose-500/10 text-rose-500" 
                  />
                </div>
                
                <div className="col-span-full bg-slate-50 p-6 rounded-3xl flex items-center gap-4">
                  <Calculator className="w-6 h-6 text-slate-400" />
                  <div className="flex-1">
                    <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Besoin Mensuel Estimé (Théorique)</p>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number"
                        value={newProductData.monthlyNeed}
                        onChange={(e) => setNewProductData({...newProductData, monthlyNeed: Number(e.target.value)})}
                        className="bg-white border border-slate-100 px-4 py-2 rounded-xl text-lg font-header italic w-24 outline-none"
                      />
                      <span className="text-[10px] font-bold text-slate-400 uppercase italic">Basé sur une rotation de 2x le seuil de sécurité</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  className="w-full bg-[#1a3a22] text-white py-8 rounded-[2.5rem] font-black text-[13px] uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-900 transition-all flex items-center justify-center gap-4 active:scale-95"
                >
                  <Save className="w-6 h-6" /> Intégrer dans la BDD Consommables
                </button>
              </div>
            </form>
          </div>
        )}

        {notifications.map(n => (
          <div key={n.id} className={`fixed top-12 right-12 z-[3000] px-8 py-5 rounded-3xl shadow-2xl animate-slide-in flex items-center gap-4 ${n.type === 'success' ? 'bg-[#1a3a22] text-white' : 'bg-rose-600 text-white'}`}>
             <div className="w-2 h-2 rounded-full bg-white animate-ping"></div>
             <p className="text-[11px] font-black uppercase italic tracking-widest">{n.message}</p>
          </div>
        ))}
      </main>
    </div>
  );
}

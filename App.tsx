
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

  const notify = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
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

  const parseCSV = (text: string) => {
    const cleanText = text.replace(/^\uFEFF/, '');
    const lines = cleanText.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length === 0) return [];
    const firstLine = lines[0];
    const delimiter = firstLine.includes(';') ? ';' : ',';
    return lines.map(line => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === delimiter && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>, targetSiteId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = parseCSV(event.target?.result as string);
      if (data.length <= 1) return notify("Le fichier est vide ou mal formé", "error");

      const headers = data[0].map(h => h.toUpperCase().trim());
      const rows = data.slice(1);
      
      const newProducts = [...products];
      const newSites = [...sites];
      let count = 0;
      let updatedCount = 0;
      let errorCount = 0;
      const timestamp = new Date().toISOString();

      rows.forEach((row) => {
        try {
          const getVal = (keys: string[]) => {
            for (const key of keys) {
              const idx = headers.findIndex(h => h === key || h.includes(key));
              if (idx !== -1) return row[idx];
            }
            return '';
          };

          const name = getVal(['PRODUIT', 'DESIGNATION', 'NOM', 'ARTICLE']);
          if (!name) throw new Error("Champ produit manquant");

          const id = getVal(['ID', 'REF', 'SKU', 'CODE']) || `SKU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
          const category = getVal(['CATEGORIE', 'TYPE', 'CLASSE']) || 'Autre';
          const stock = parseInt(getVal(['QUANTITE', 'QTE', 'STOCK'])) || 0;
          const price = parseFloat(getVal(['PRIX UNITAIRE', 'P.U', 'UNIT PRICE', 'PU', 'PRIX'])) || 0;
          const siteName = getVal(['SITE', 'LIEU', 'EMPLACEMENT', 'LOCALISATION']);

          let siteId = targetSiteId;
          if (!siteId && siteName) {
             let site = newSites.find(s => s.name.toUpperCase() === siteName.toUpperCase());
             if (!site) {
                site = { id: `SITE-${Date.now()}-${Math.random().toString(36).substr(2, 2)}`.toUpperCase(), name: siteName.toUpperCase(), location: 'Importé', capacity: 5000, status: 'Opérationnel', manager: 'Admin' };
                newSites.push(site);
             }
             siteId = site.id;
          } else if (!siteId) {
             if (newSites.length === 0) {
                const s = { id: 'SITE-01', name: 'Magasin Central', location: 'Siège', capacity: 5000, status: 'Opérationnel', manager: 'Admin' } as Site;
                newSites.push(s);
                siteId = s.id;
             } else {
                siteId = newSites[0].id;
             }
          }

          const productData: Product = {
            id,
            name: name.toUpperCase(),
            category,
            currentStock: stock,
            minStock: 10,
            monthlyNeed: stock > 0 ? stock * 1.5 : 20,
            unit: 'PIÈCE',
            unitPrice: price,
            currency: 'Fc',
            siteId: siteId,
            lastInventoryDate: timestamp
          };

          const existingIdx = newProducts.findIndex(p => p.id === id || (p.name === productData.name && p.siteId === siteId));
          if (existingIdx === -1) { newProducts.push(productData); count++; }
          else { newProducts[existingIdx] = { ...newProducts[existingIdx], ...productData }; updatedCount++; }
        } catch (err) { errorCount++; }
      });

      setSites(newSites);
      setProducts(newProducts);
      notify(`${count} articles créés, ${updatedCount} mis à jour. ${errorCount > 0 ? errorCount + ' erreurs.' : ''}`, errorCount > 0 ? 'warning' : 'success');
    };
    reader.readAsText(file);
    if(e.target) e.target.value = '';
  };

  const handleImportFurniture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = parseCSV(event.target?.result as string);
      if (data.length <= 1) return notify("Fichier invalide", "error");
      const headers = data[0].map(h => h.toUpperCase());
      const rows = data.slice(1);
      const newFurniture = [...furniture];
      const newSites = [...sites];
      let count = 0;

      rows.forEach((row, idx) => {
        try {
          const getVal = (keys: string[]) => {
            for (const key of keys) {
              const hIdx = headers.findIndex(h => h === key || h.includes(key));
              if (hIdx !== -1) return row[hIdx];
            }
            return '';
          };
          const name = getVal(['PRODUIT', 'NOM', 'MEUBLE']);
          if (!name) return;
          const siteName = getVal(['SITE', 'LIEU']);
          let site = newSites.find(s => s.name.toUpperCase() === (siteName?.toUpperCase() || ''));
          if (!site) {
            site = { id: `SITE-MOB-${Date.now()}-${idx}`, name: siteName || 'SITE-MOB', location: 'Import', capacity: 1000, status: 'Opérationnel', manager: 'Auto' } as Site;
            newSites.push(site);
          }
          newFurniture.push({
            id: `F-${Date.now()}-${idx}`,
            code: getVal(['ID', 'CODE']) || `MOB-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
            name: name.toUpperCase(),
            siteId: site.id,
            currentCount: parseInt(getVal(['QUANTITE', 'QTE'])) || 1,
            condition: 'Bon',
            lastChecked: new Date().toISOString()
          });
          count++;
        } catch (e) {}
      });
      setSites(newSites);
      setFurniture(newFurniture);
      notify(`${count} mobiliers importés.`);
    };
    reader.readAsText(file);
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (sites.length === 0) return notify("Créez un site d'abord", "error");
    const id = newProductData.id || `SKU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const product: Product = {
      id, name: newProductData.name.toUpperCase(), category: newProductData.category, 
      currentStock: newProductData.initialStock, minStock: newProductData.minStock, 
      monthlyNeed: newProductData.monthlyNeed || 20, unit: newProductData.unit, 
      unitPrice: newProductData.unitPrice, currency: newProductData.currency,
      siteId: newProductData.siteId || sites[0].id, lastInventoryDate: new Date().toISOString()
    };
    setProducts([product, ...products]);
    if (product.currentStock > 0) handleTransaction(id, product.currentStock, 'Initialisation', 'entry');
    setIsAddModalOpen(false);
    setNewProductData({ id: '', name: '', category: 'Alimentaire', unitPrice: 0, currency: 'Fc', minStock: 10, unit: 'PIÈCE', initialStock: 0, siteId: '', monthlyNeed: 20 });
    notify(`Produit "${product.name}" ajouté.`);
  };

  const runAutomatedAnalysis = async () => {
    if (products.length === 0) return;
    setIsAnalyzing(true);
    try {
      const report = await getAutomatedReport(products, history, settings.exchangeRate, sites);
      const analysis = await getAutomatedAnalysis(products, history);
      setAutoReport(report);
      setAutoAnalysis(analysis);
    } finally { setIsAnalyzing(false); }
  };

  useEffect(() => {
    if (activeView === 'analytics') runAutomatedAnalysis();
  }, [activeView]);

  // ADAPTATEUR LOCALSTORAGE GLOBAL
  useEffect(() => {
    localStorage.setItem('ss_products', JSON.stringify(products));
    localStorage.setItem('ss_sites', JSON.stringify(sites));
    localStorage.setItem('ss_history', JSON.stringify(history));
    localStorage.setItem('ss_tasks', JSON.stringify(tasks));
    localStorage.setItem('ss_settings', JSON.stringify(settings));
    localStorage.setItem('ss_furniture', JSON.stringify(furniture));
    localStorage.setItem('ss_suppliers', JSON.stringify(suppliers));
    localStorage.setItem('ss_furniture_audits', JSON.stringify(furnitureAudits));
    localStorage.setItem('ss_needs_history', JSON.stringify(needsHistory));
    localStorage.setItem('isLoggedIn', JSON.stringify(isLoggedIn));
  }, [products, history, tasks, isLoggedIn, settings, sites, furniture, suppliers, furnitureAudits, needsHistory]);

  if (isFirstLaunch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a3a22] p-6">
        <div className="bg-white w-full max-w-md rounded-[3rem] p-12 shadow-2xl text-center">
          <Database className="w-16 h-16 text-emerald-600 mx-auto mb-6" />
          <h2 className="text-2xl font-black uppercase text-[#1a3a22]">Initialisation Système</h2>
          <p className="text-[10px] font-bold text-slate-400 mt-2 mb-8 uppercase">Préparation de l'ERP SmartStock Pro</p>
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
          {activeView === 'furniture' && <FurnitureView furniture={furniture} setFurniture={setFurniture} furnitureAudits={furnitureAudits} setFurnitureAudits={setFurnitureAudits} sites={sites} notify={notify} onImportFurniture={handleImportFurniture} />}
          {activeView === 'sites' && <SitesView sites={sites} setSites={setSites} products={products} onCopyData={() => {}} onImportCSV={handleImportCSV} />}
          {activeView === 'suppliers' && <SuppliersView suppliers={suppliers} setSuppliers={setSuppliers} notify={notify} />}
          {activeView === 'audit' && <AuditView products={products} sites={sites} exchangeRate={settings.exchangeRate} onUpdateStock={handleTransaction} notify={notify} />}
          {activeView === 'traceability' && <GlobalHistoryView history={history} needsHistory={needsHistory} furnitureAudits={furnitureAudits} sites={sites} products={products} settings={settings} />}
          {activeView === 'tasks' && <TasksView tasks={tasks} setTasks={setTasks} notify={notify} />}
          {activeView === 'needs_list' && <NeedsReportView products={products} settings={settings} needsHistory={needsHistory} onSaveReport={(r) => setNeedsHistory([r, ...needsHistory])} onDeleteReport={(id) => setNeedsHistory(needsHistory.filter(n => n.id !== id))} sites={sites} />}
          {activeView === 'analytics' && <AnalyticsView products={products} history={history} exchangeRate={settings.exchangeRate} sites={sites} report={autoReport} analysis={autoAnalysis} isAnalyzing={isAnalyzing} onRefresh={runAutomatedAnalysis} />}
          {activeView === 'settings' && <SettingsView settings={settings} onUpdateSettings={setSettings} onResetSystem={() => {localStorage.clear(); window.location.reload();}} />}
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

        {isAddModalOpen && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
            <form onSubmit={handleAddProduct} className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl p-12 space-y-8 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600"><Plus className="w-7 h-7" /></div>
                  <div>
                    <h3 className="text-3xl font-header italic uppercase leading-none">Nouvelle Référence</h3>
                    <p className="text-[10px] font-black uppercase text-slate-400 mt-1 tracking-widest">Enregistrement manuel</p>
                  </div>
                </div>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="p-3 bg-slate-100 rounded-full hover:bg-slate-200 transition-all"><X className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="col-span-1 space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-3">SKU / ID</label>
                  <input type="text" placeholder="AUTO" value={newProductData.id} onChange={(e) => setNewProductData({...newProductData, id: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black outline-none" />
                </div>
                <div className="col-span-1 space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-3">Produit</label>
                  <input required type="text" placeholder="NOM DE L'ARTICLE" value={newProductData.name} onChange={(e) => setNewProductData({...newProductData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase italic outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-3">Catégorie</label>
                  <select value={newProductData.category} onChange={(e) => setNewProductData({...newProductData, category: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[11px] font-black outline-none">
                    {INITIAL_CATEGORIES.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-3">Site</label>
                  <select required value={newProductData.siteId} onChange={(e) => setNewProductData({...newProductData, siteId: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[11px] font-black outline-none">
                    <option value="">SÉLECTIONNER...</option>
                    {sites.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-3">Unité</label>
                  <select value={newProductData.unit} onChange={(e) => setNewProductData({...newProductData, unit: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[11px] font-black outline-none">
                    {settings.units.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-3">Quantité Initiale</label>
                  <input type="number" value={newProductData.initialStock} onChange={(e) => setNewProductData({...newProductData, initialStock: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-2xl font-header italic text-emerald-600" />
                </div>
              </div>
              <button type="submit" className="w-full bg-[#1a3a22] text-white py-8 rounded-[2.5rem] font-black text-[13px] uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-900 transition-all flex items-center justify-center gap-4">
                <Save className="w-6 h-6" /> Intégrer dans la BDD
              </button>
            </form>
          </div>
        )}

        {notifications.map(n => (
          <div key={n.id} className={`fixed top-12 right-12 z-[3000] px-8 py-5 rounded-3xl shadow-2xl animate-slide-in flex items-center gap-4 ${n.type === 'success' ? 'bg-[#1a3a22] text-white' : n.type === 'warning' ? 'bg-amber-600 text-white' : 'bg-rose-600 text-white'}`}>
             <div className="w-2 h-2 rounded-full bg-white animate-ping"></div>
             <p className="text-[11px] font-black uppercase italic tracking-widest">{n.message}</p>
          </div>
        ))}
      </main>
    </div>
  );
}

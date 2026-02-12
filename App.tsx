
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Box, History as HistoryIcon, Activity, LogOut, 
  Settings, CheckSquare, FileBarChart, X,
  MapPin, Lamp, Truck, Database,
  Plus, Save, Trash2, ShoppingCart, Edit3, RotateCcw, Cpu
} from 'lucide-react';
import { 
  Product, InventoryLog, ViewType, Task, AppSettings, NeedReport, 
  Site, Furniture, FurnitureAuditSession, Supplier, RapportAutomatique 
} from './types';
import { INITIAL_CATEGORIES, INITIAL_UNITS } from './constants';

// Vues
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
    case 'inventory': return 'Consommables';
    case 'furniture': return 'Mobilier';
    case 'sites': return 'Sites Logistiques';
    case 'suppliers': return 'Fournisseurs';
    case 'audit': return 'Audit & Écarts';
    case 'traceability': return 'Historique';
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

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [newProductData, setNewProductData] = useState({
    id: '', name: '', category: 'Alimentaire', unitPrice: 0, currency: 'Fc' as 'Fc' | '$', 
    minStock: 10, unit: settings.units[0] || 'PIÈCE', initialStock: 0, siteId: '',
    monthlyNeed: 20
  });

  const [isFirstLaunch, setIsFirstLaunch] = useState(() => products.length === 0 && sites.length === 0);

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

  const handleTransaction = (prodId: string, amount: number, reason: string, type: 'entry' | 'exit' | 'adjustment' | 'transfer' = 'adjustment') => {
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
    
    const newLog: InventoryLog = { 
      id: `LOG-${Date.now()}`.toUpperCase(),
      date: new Date().toISOString(), type, productId: prodId, productName: product.name, 
      changeAmount: amount, finalStock, reason: reason || 'Transaction manuelle', responsible: 'ADMIN', siteId: product.siteId 
    };
    setHistory([newLog, ...history]);
  };

  const handleImportProducts = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim() !== '');
      if (lines.length <= 1) return notify("Fichier CSV vide ou invalide", "error");
      
      const newProducts = [...products];
      const newSites = [...sites];
      let importCount = 0;

      lines.slice(1).forEach(line => {
        const parts = line.split(/[;,]/).map(p => p.trim());
        if (parts.length >= 2) {
          const name = parts[0].toUpperCase();
          const category = parts[1] || 'Alimentaire';
          const stock = parseInt(parts[2]) || 0;
          const minStock = parseInt(parts[3]) || 5;
          const unit = parts[4] || 'PIÈCE';
          const price = parseFloat(parts[5]) || 0;
          const siteName = parts[6] || 'MAGASIN CENTRAL';

          let siteObj = newSites.find(s => s.name.toUpperCase() === siteName.toUpperCase());
          if (!siteObj) {
            siteObj = { id: `S-${Date.now()}-${Math.random().toString(36).substr(2,3)}`.toUpperCase(), name: siteName, location: 'Local', capacity: 2000, status: 'Opérationnel', manager: 'Admin' };
            newSites.push(siteObj);
          }

          const id = `PRD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
          newProducts.push({
            id, name, category, currentStock: stock, minStock, monthlyNeed: minStock * 2,
            unit, unitPrice: price, currency: 'Fc', siteId: siteObj.id, lastInventoryDate: new Date().toISOString()
          });
          importCount++;
        }
      });
      setSites(newSites);
      setProducts(newProducts);
      notify(`${importCount} produits importés par lot.`);
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const handleImportFurniture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim() !== '');
      if (lines.length <= 1) return notify("Fichier vide", "error");
      
      const newFurniture = [...furniture];
      const newSites = [...sites];
      let importCount = 0;

      lines.slice(1).forEach(line => {
        const parts = line.split(/[;,]/).map(p => p.trim());
        if (parts.length >= 2) {
          const code = parts[0] || `MOB-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
          const name = parts[1].toUpperCase();
          const siteNameInput = parts[2] || 'MAGASIN CENTRAL';
          const qty = parseInt(parts[3]) || 1;
          const condition = (parts[4] as any) || 'Bon';

          let siteObj = newSites.find(s => s.name.toUpperCase() === siteNameInput.toUpperCase());
          if (!siteObj) {
            siteObj = { id: `S-${Date.now()}-${Math.random().toString(36).substr(2,3)}`.toUpperCase(), name: siteNameInput, location: 'Auto-généré', capacity: 1000, status: 'Opérationnel', manager: 'Admin' };
            newSites.push(siteObj);
          }

          if (!newFurniture.find(f => f.code === code)) {
            newFurniture.push({ id: `F-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`.toUpperCase(), code, name, siteId: siteObj.id, currentCount: qty, condition, lastChecked: new Date().toISOString() });
            importCount++;
          }
        }
      });
      setSites(newSites);
      setFurniture(newFurniture);
      notify(`${importCount} mobiliers importés.`);
    };
    reader.readAsText(file);
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
    const id = newProductData.id || `RÉF-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const product: Product = {
      id, name: newProductData.name.toUpperCase(), category: newProductData.category, 
      currentStock: Number(newProductData.initialStock), minStock: Number(newProductData.minStock), 
      monthlyNeed: Number(newProductData.monthlyNeed) || 20, unit: newProductData.unit, 
      unitPrice: Number(newProductData.unitPrice), currency: newProductData.currency,
      siteId: newProductData.siteId || sites[0].id, lastInventoryDate: new Date().toISOString()
    };
    setProducts([product, ...products]);
    if (product.currentStock > 0) handleTransaction(id, product.currentStock, 'Initialisation', 'entry');
    setIsAddModalOpen(false);
    setNewProductData({ id: '', name: '', category: 'Alimentaire', unitPrice: 0, currency: 'Fc', minStock: 10, unit: 'PIÈCE', initialStock: 0, siteId: '', monthlyNeed: 20 });
    notify(`Produit "${product.name}" ajouté.`);
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
        <div className="flex items-center gap-3 mb-8 px-2">
          <Activity className="w-8 h-8 text-emerald-400" />
          <h1 className="text-white text-lg font-black uppercase tracking-tighter italic">SmartStock <span className="text-emerald-400">Pro</span></h1>
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
        <button onClick={() => setIsLoggedIn(false)} className="mt-8 flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/5 text-slate-400 font-bold text-[10px] uppercase hover:bg-rose-600 hover:text-white transition-all">
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
          {activeView === 'inventory' && <InventoryView products={products} sites={sites} settings={settings} onMovement={() => setActiveView('movements')} onEdit={(p) => { setEditingProduct(p); setIsEditModalOpen(true); }} onImport={handleImportProducts} onAdd={() => setIsAddModalOpen(true)} onDelete={(id) => setProducts(products.filter(p => p.id !== id))} />}
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
              notify={notify}
              onTransaction={handleTransaction}
            />
          )}
          {activeView === 'suppliers' && <SuppliersView suppliers={suppliers} setSuppliers={setSuppliers} notify={notify} />}
          {activeView === 'audit' && <AuditView products={products} sites={sites} exchangeRate={settings.exchangeRate} onUpdateStock={handleTransaction} notify={notify} />}
          {activeView === 'traceability' && <GlobalHistoryView history={history} needsHistory={needsHistory} furnitureAudits={furnitureAudits} sites={sites} products={products} settings={settings} />}
          {activeView === 'tasks' && <TasksView tasks={tasks} setTasks={setTasks} notify={notify} />}
          {activeView === 'needs_list' && <NeedsReportView products={products} settings={settings} needsHistory={needsHistory} onSaveReport={(r) => setNeedsHistory([r, ...needsHistory])} onDeleteReport={(id) => setNeedsHistory(needsHistory.filter(n => n.id !== id))} sites={sites} />}
          {activeView === 'analytics' && <AnalyticsView products={products} history={history} exchangeRate={settings.exchangeRate} sites={sites} report={autoReport} analysis={autoAnalysis} isAnalyzing={isAnalyzing} onRefresh={runAutomatedAnalysis} />}
          {activeView === 'trash' && <TrashView products={deletedProducts} furniture={deletedFurniture} onRestoreProduct={(id) => {}} onDeleteProduct={(id) => {}} onRestoreFurniture={(id) => {}} onDeleteFurniture={(id) => {}} />}
          {activeView === 'settings' && <SettingsView settings={settings} onUpdateSettings={setSettings} onResetSystem={handleHardReset} notify={notify} />}
          {activeView === 'movements' && <MovementsView products={products} sites={sites} history={history} onTransaction={handleTransaction} />}
        </section>

        {isAddModalOpen && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
            <form onSubmit={handleAddProduct} className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl p-12 space-y-8 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center">
                <h3 className="text-3xl font-header italic uppercase">Nouvelle Référence</h3>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="p-3 bg-slate-100 rounded-full hover:bg-slate-200"><X className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <input required type="text" placeholder="DÉSIGNATION DE L'ARTICLE" value={newProductData.name} onChange={(e) => setNewProductData({...newProductData, name: e.target.value})} className="col-span-2 w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase italic outline-none" />
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Site de stockage</label>
                  <select required value={newProductData.siteId} onChange={(e) => setNewProductData({...newProductData, siteId: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[11px] font-black outline-none">
                    {sites.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Stock Initial</label>
                  <input type="number" placeholder="0" value={newProductData.initialStock} onChange={(e) => setNewProductData({...newProductData, initialStock: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black outline-none" />
                </div>
              </div>
              <button type="submit" className="w-full bg-[#1a3a22] text-white py-8 rounded-[2.5rem] font-black text-[13px] uppercase shadow-2xl hover:bg-emerald-900 transition-all">Enregistrer en Base</button>
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

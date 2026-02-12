
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  LayoutDashboard, Box, History as HistoryIcon, Activity, LogOut, 
  Settings, CheckSquare, FileBarChart, ListChecks, Globe, X, RefreshCw,
  BellRing, AlertCircle, MapPin, CheckCircle2, Info, Lamp, ArrowLeftRight,
  ClipboardList, Search, Truck, Command, AlertTriangle
} from 'lucide-react';
import { Product, InventoryLog, ViewType, Task, AppSettings, NeedReport, Site, Furniture, FurnitureAuditSession, Supplier } from './types';
import { INITIAL_CATEGORIES, INITIAL_FURNITURE, INITIAL_SITES, INITIAL_UNITS, INITIAL_SUPPLIERS } from './constants';

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

const getStored = <T,>(key: string, defaultValue: T): T => {
  const saved = localStorage.getItem(key);
  if (!saved) return defaultValue;
  try { return JSON.parse(saved); } catch (e) { return defaultValue; }
};

const DEFAULT_SETTINGS: AppSettings = {
  enterpriseName: 'SmartStock ERP',
  locationId: 'RDC_HQ_01',
  exchangeRate: 2250,
  primaryCurrency: 'Fc',
  defaultSafetyMargin: 20,
  autoBackup: true,
  units: INITIAL_UNITS
};

interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

const NavItem = ({ active, onClick, icon: Icon, label, alertCount = 0 }: any) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl font-bold text-[9px] uppercase tracking-wider transition-all duration-300 mb-1 ${
      active 
        ? 'nav-item-active' 
        : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`}
  >
    <div className="flex items-center gap-4">
      <Icon className={`w-4 h-4 ${active ? 'text-[#1a3a22]' : ''}`} />
      {label}
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
  
  // États de recherche globale
  const [products, setProducts] = useState<Product[]>(getStored('ss_products', [])); // ← Plus de données par défaut

  // État du modal de déconnexion
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [furniture, setFurniture] = useState<Furniture[]>(getStored('ss_furniture', [])); // ← Vide
  const [sites, setSites] = useState<Site[]>(getStored('ss_sites', [])); // ← Vide
  const [suppliers, setSuppliers] = useState<Supplier[]>(getStored('ss_suppliers', [])); // ← Vide


  const [furnitureAudits, setFurnitureAudits] = useState<FurnitureAuditSession[]>(getStored('ss_furniture_audits', []));
  const [history, setHistory] = useState<InventoryLog[]>(getStored('ss_history', []));
  const [tasks, setTasks] = useState<Task[]>(getStored('ss_tasks', []));
  const [needsHistory, setNeedsHistory] = useState<NeedReport[]>(getStored('ss_needs_history', []));
  const [sites, setSites] = useState<Site[]>(getStored('ss_sites', INITIAL_SITES));
  const [suppliers, setSuppliers] = useState<Supplier[]>(getStored('ss_suppliers', INITIAL_SUPPLIERS));
  
  const [movementModal, setMovementModal] = useState<{isOpen: boolean, type: 'entry'|'exit', product: Product | null}>({isOpen: false, type: 'entry', product: null});
  const [editModal, setEditModal] = useState<{isOpen: boolean, product: Product | null}>({isOpen: false, product: null});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [newProductData, setNewProductData] = useState({
    name: '', category: 'Alimentaire', unitPrice: 0, currency: 'Fc' as 'Fc' | '$', minStock: 10, unit: settings.units[0] || 'PIÈCE', initialStock: 0, siteId: sites[0]?.id || '1'
  });

  const notify = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3500);
  };

  const handleTransaction = (prodId: string, amount: number, reason: string, type: any = 'adjustment') => {
    const product = products.find(p => p.id === prodId);
    if (!product) return;
    const finalStock = product.currentStock + amount;
    if (finalStock < 0) {
      notify("Stock insuffisant pour cette opération", "error");
      return;
    }
    const updated = products.map(p => p.id === prodId ? { ...p, currentStock: finalStock, lastInventoryDate: new Date().toISOString() } : p);
    setProducts(updated);
    const newLog: InventoryLog = { 
        id: `LOG-${Date.now()}`.toUpperCase(),
        date: new Date().toISOString(), type: type, productId: prodId, productName: product.name, 
        changeAmount: amount, finalStock, reason, responsible: 'ADMIN_PRO', siteId: product.siteId 
    };
    setHistory([newLog, ...history]);
    setMovementModal({isOpen: false, type: 'entry', product: null});
    if (type !== 'adjustment') {
      notify(`Mouvement enregistré : ${amount > 0 ? '+' : ''}${amount} ${product.name}`);
    }
  };

  const handleCopySiteProducts = (fromSiteId: string, toSiteId: string) => {
    const productsToCopy = products.filter(p => p.siteId === fromSiteId);
    if (productsToCopy.length === 0) {
      notify("Le site source est vide.", "error");
      return;
    }
    
    const newClonedProducts = productsToCopy.map(p => ({
      ...p,
      id: `SKU-CLONE-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      siteId: toSiteId,
      currentStock: 0,
      lastInventoryDate: new Date().toISOString()
    }));

    setProducts(prev => [...prev, ...newClonedProducts]);
    notify(`Structure clonée : ${newClonedProducts.length} articles copiés vers le site cible.`);
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
      const newLogs: InventoryLog[] = [];
      const timestamp = new Date().toISOString();
      let updatedCount = 0;
      let addedCount = 0;

      const parseCSVLine = (line: string) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') inQuotes = !inQuotes;
          else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else current += char;
        }
        result.push(current.trim());
        return result.map(s => s.replace(/^"|"$/g, ''));
      };

      for (let i = 1; i < lines.length; i++) {
        const parts = parseCSVLine(lines[i]);
        if (parts.length < 4) continue;

        const [id, name, category, stock, min, unit, price, currency] = parts;
        const stockNum = parseInt(stock) || 0;
        const minNum = parseInt(min) || 0;
        const priceNum = parseFloat(price) || 0;

        let existingIdx = newProducts.findIndex(p => p.id === id);
        if (existingIdx === -1 && name) {
          existingIdx = newProducts.findIndex(p => p.name.toLowerCase() === name.toLowerCase() && (targetSiteId ? p.siteId === targetSiteId : true));
        }

        if (existingIdx !== -1) {
          const old = newProducts[existingIdx];
          const updated: Product = {
            ...old,
            name: name || old.name,
            category: category || old.category,
            currentStock: stockNum,
            minStock: minNum,
            unit: unit || old.unit,
            unitPrice: priceNum || old.unitPrice,
            currency: (currency as 'Fc' | '$') || old.currency,
            lastInventoryDate: timestamp
          };
          
          if (old.currentStock !== stockNum) {
            newLogs.push({
              id: `LOG-IMP-${Date.now()}-${i}`,
              date: timestamp,
              type: 'adjustment',
              productId: old.id,
              productName: old.name,
              changeAmount: stockNum - old.currentStock,
              finalStock: stockNum,
              reason: 'Sync via Import CSV',
              responsible: 'IMPORT_SYSTEM',
              siteId: old.siteId
            });
          }
          newProducts[existingIdx] = updated;
          updatedCount++;
        } else if (name) {
          const newId = id || `SKU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
          const product: Product = {
            id: newId,
            name,
            category: category || 'Autre',
            currentStock: stockNum,
            minStock: minNum,
            monthlyNeed: minNum * 2,
            unit: unit || 'PIÈCE',
            unitPrice: priceNum,
            currency: (currency as 'Fc' | '$') || 'Fc',
            siteId: targetSiteId || sites[0]?.id || '1',
            lastInventoryDate: timestamp
          };
          newProducts.push(product);
          newLogs.push({
            id: `LOG-IMP-${Date.now()}-${i}`,
            date: timestamp,
            type: 'entry',
            productId: newId,
            productName: name,
            changeAmount: stockNum,
            finalStock: stockNum,
            reason: 'Initialisation via Import',
            responsible: 'IMPORT_SYSTEM',
            siteId: targetSiteId || sites[0]?.id || '1'
          });
          addedCount++;
        }
      }

      setProducts(newProducts);
      setHistory(prev => [...newLogs, ...prev]);
      notify(`Importation CSV réussie : ${updatedCount} mis à jour, ${addedCount} créés.`);
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleResetSystem = () => {
    localStorage.clear();
    setProducts([]);
    setFurniture(INITIAL_FURNITURE);
    setFurnitureAudits([]);
    setHistory([]);
    setTasks([]);
    setNeedsHistory([]);
    setSites(INITIAL_SITES);
    setSuppliers(INITIAL_SUPPLIERS);
    setSettings(DEFAULT_SETTINGS);
    setActiveView('dashboard');
    setIsLoggedIn(false);
    notify("Système réinitialisé avec succès", "info");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsLogoutModalOpen(false);
    notify("Déconnexion réussie. À bientôt !", "info");
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `SKU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const product: Product = {
      id, name: newProductData.name, category: newProductData.category, currentStock: newProductData.initialStock,
      minStock: newProductData.minStock, monthlyNeed: newProductData.minStock * 2,
      unit: newProductData.unit, unitPrice: newProductData.unitPrice, currency: newProductData.currency,
      siteId: newProductData.siteId, lastInventoryDate: new Date().toISOString()
    };
    setProducts([product, ...products]);
    if (product.currentStock > 0) {
      handleTransaction(id, product.currentStock, 'Stock Initial', 'entry');
    }
    setIsAddModalOpen(false);
    notify(`Produit "${product.name}" ajouté au catalogue.`);
    setNewProductData({ name: '', category: 'Alimentaire', unitPrice: 0, currency: 'Fc', minStock: 10, unit: settings.units[0] || 'PIÈCE', initialStock: 0, siteId: sites[0]?.id || '1' });
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    notify(`Fiche produit "${updatedProduct.name}" mise à jour.`);
    setEditModal({isOpen: false, product: null});
  };

  const handleDeleteProduct = (id: string) => {
    const product = products.find(p => p.id === id);
    if (confirm(`Supprimer définitivement ${product?.name} ?`)) {
      setProducts(products.filter(p => p.id !== id));
      notify(`Produit "${product?.name}" supprimé.`, "error");
    }
  };

  // Logique de recherche globale
  const globalSearchResults = useMemo(() => {
    if (!globalSearch.trim() || globalSearch.length < 2) return null;
    const query = globalSearch.toLowerCase();
    
    return {
      products: products.filter(p => p.name.toLowerCase().includes(query)).slice(0, 4),
      sites: sites.filter(s => s.name.toLowerCase().includes(query) || s.location.toLowerCase().includes(query)).slice(0, 2),
      tasks: tasks.filter(t => t.title.toLowerCase().includes(query)).slice(0, 2),
      suppliers: suppliers.filter(s => s.name.toLowerCase().includes(query)).slice(0, 2)
    };
  }, [globalSearch, products, sites, tasks, suppliers]);

  const handleSearchResultClick = (view: ViewType) => {
    setActiveView(view);
    setGlobalSearch('');
    setIsSearchFocused(false);
  };

  const getViewTitle = (view: ViewType) => {
    const mapping: Record<string, string> = {
      dashboard: 'Tableau de Bord',
      inventory: 'Inventaire Général',
      movements: 'Entrées & Sorties',
      furniture: 'Inventaire Mobilier',
      sites: 'Gestion des Sites',
      suppliers: 'Base Fournisseurs',
      audit_session: 'Session d\'Audit',
      traceability: 'Historique Complet',
      tasks: 'Agenda des Tâches',
      needs_list: 'États de Besoins',
      analytics: 'Scripts Automatiques',
      settings: 'Paramètres Système'
    };
    return mapping[view] || view.toUpperCase();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    localStorage.setItem('ss_products', JSON.stringify(products));
    localStorage.setItem('ss_furniture', JSON.stringify(furniture));
    localStorage.setItem('ss_furniture_audits', JSON.stringify(furnitureAudits));
    localStorage.setItem('ss_history', JSON.stringify(history));
    localStorage.setItem('ss_tasks', JSON.stringify(tasks));
    localStorage.setItem('ss_settings', JSON.stringify(settings));
    localStorage.setItem('ss_needs_history', JSON.stringify(needsHistory));
    localStorage.setItem('ss_sites', JSON.stringify(sites));
    localStorage.setItem('ss_suppliers', JSON.stringify(suppliers));
    localStorage.setItem('isLoggedIn', JSON.stringify(isLoggedIn));
  }, [products, furniture, furnitureAudits, history, tasks, isLoggedIn, settings, needsHistory, sites, suppliers]);

  if (!isLoggedIn) return <LoginView enterpriseName={settings.enterpriseName} onLogin={() => { setIsLoggedIn(true); notify("Bienvenue sur SmartStock Pro"); }} />;

  return (
    <div className="min-h-screen flex bg-[#f8fafc]">
      <div className="fixed top-8 right-8 z-[1000] flex flex-col gap-3 pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className={`flex items-center gap-4 px-6 py-4 rounded-3xl shadow-2xl animate-slide-in pointer-events-auto border ${
            n.type === 'success' ? 'bg-[#1a3a22] text-white border-emerald-500/30' : 
            n.type === 'error' ? 'bg-rose-600 text-white border-rose-400/30' : 
            'bg-slate-900 text-white border-slate-700'
          }`}>
            {n.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : 
             n.type === 'error' ? <AlertCircle className="w-5 h-5 text-rose-200" /> : 
             <Info className="w-5 h-5 text-blue-400" />}
            <p className="text-[11px] font-black uppercase italic tracking-wider">{n.message}</p>
          </div>
        ))}
      </div>

      <aside className="sidebar-float no-print">
        <div className="flex items-center gap-3 mb-8 px-2">
          <Activity className="w-10 h-10 text-emerald-400" />
          <h1 className="text-white text-lg font-black italic uppercase leading-none">SmartStock</h1>
        </div>

        <div className="relative mb-6 px-1" ref={searchRef}>
          <div className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-300 ${
            isSearchFocused ? 'bg-white border-white' : 'bg-white/5 border-white/10'
          }`}>
            <Search className={`w-4 h-4 ${isSearchFocused ? 'text-[#1a3a22]' : 'text-slate-500'}`} />
            <input 
              type="text" 
              placeholder="Recherche globale..." 
              value={globalSearch}
              onChange={(e) => { setGlobalSearch(e.target.value); setIsSearchFocused(true); }}
              onFocus={() => setIsSearchFocused(true)}
              className={`bg-transparent border-none outline-none text-[10px] font-bold uppercase tracking-wider w-full ${
                isSearchFocused ? 'text-[#1a3a22] placeholder:text-slate-400' : 'text-white placeholder:text-slate-500'
              }`}
            />
            {!isSearchFocused && <Command className="w-3 h-3 text-slate-600" />}
          </div>

          {isSearchFocused && globalSearchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-slate-100 p-4 z-[200] max-h-[400px] overflow-y-auto animate-fade-in">
              {globalSearchResults.products.length > 0 && (
                <div className="mb-4">
                  <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-2 px-2">Produits</p>
                  {globalSearchResults.products.map(p => (
                    <button key={p.id} onClick={() => handleSearchResultClick('inventory')} className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between group transition-colors">
                      <div className="flex items-center gap-3">
                        <Box className="w-3 h-3 text-emerald-500" />
                        <span className="text-[9px] font-bold uppercase text-slate-700">{p.name}</span>
                      </div>
                      <span className="text-[8px] font-black text-slate-300">{p.currentStock} {p.unit}</span>
                    </button>
                  ))}
                </div>
              )}
              {globalSearchResults.sites.length > 0 && (
                <div className="mb-4">
                  <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-2 px-2">Sites</p>
                  {globalSearchResults.sites.map(s => (
                    <button key={s.id} onClick={() => handleSearchResultClick('sites')} className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 flex items-center gap-3 group transition-colors">
                      <MapPin className="w-3 h-3 text-indigo-500" />
                      <span className="text-[9px] font-bold uppercase text-slate-700">{s.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {globalSearchResults.tasks.length > 0 && (
                <div className="mb-4">
                  <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-2 px-2">Tâches</p>
                  {globalSearchResults.tasks.map(t => (
                    <button key={t.id} onClick={() => handleSearchResultClick('tasks')} className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 flex items-center gap-3 group transition-colors">
                      <CheckSquare className="w-3 h-3 text-amber-500" />
                      <span className="text-[9px] font-bold uppercase text-slate-700">{t.title}</span>
                    </button>
                  ))}
                </div>
              )}
              {globalSearchResults.suppliers.length > 0 && (
                <div className="mb-4">
                  <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-2 px-2">Fournisseurs</p>
                  {globalSearchResults.suppliers.map(s => (
                    <button key={s.id} onClick={() => handleSearchResultClick('suppliers')} className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 flex items-center gap-3 group transition-colors">
                      <Truck className="w-3 h-3 text-blue-500" />
                      <span className="text-[9px] font-bold uppercase text-slate-700">{s.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {!globalSearchResults.products.length && !globalSearchResults.sites.length && !globalSearchResults.tasks.length && !globalSearchResults.suppliers.length && (
                <p className="text-[10px] font-bold text-slate-400 text-center py-4 uppercase">Aucun résultat trouvé</p>
              )}
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto pr-1">
          <NavItem active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} icon={LayoutDashboard} label="Tableau de Bord" />
          <NavItem active={activeView === 'inventory'} onClick={() => setActiveView('inventory')} icon={Box} label="Inventaire" />
          <NavItem active={activeView === 'movements'} onClick={() => setActiveView('movements')} icon={ArrowLeftRight} label="Entrées & Sorties" />
          <NavItem active={activeView === 'furniture'} onClick={() => setActiveView('furniture')} icon={Lamp} label="Inventaire Mobilier" />
          <NavItem active={activeView === 'sites'} onClick={() => setActiveView('sites')} icon={MapPin} label="Gestion Sites" />
          <NavItem active={activeView === 'suppliers'} onClick={() => setActiveView('suppliers')} icon={Truck} label="Fournisseurs" />
          <NavItem active={activeView === 'audit_session'} onClick={() => setActiveView('audit_session')} icon={RefreshCw} label="Audit / Écarts" />
          <NavItem active={activeView === 'traceability'} onClick={() => setActiveView('traceability')} icon={HistoryIcon} label="Historique Complet" />
          <NavItem active={activeView === 'tasks'} onClick={() => setActiveView('tasks')} icon={CheckSquare} label="Agenda Tâches" alertCount={tasks.filter(t => t.status === 'En attente').length} />
          <NavItem active={activeView === 'needs_list'} onClick={() => setActiveView('needs_list')} icon={ListChecks} label="État de Besoins" />
          <NavItem active={activeView === 'analytics'} onClick={() => setActiveView('analytics')} icon={FileBarChart} label="Analyses Automatiques" />
          <NavItem active={activeView === 'settings'} onClick={() => setActiveView('settings')} icon={Settings} label="Paramètres" />
        </nav>
        <button onClick={() => setIsLogoutModalOpen(true)} className="mt-6 w-full flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/5 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all group">
          <LogOut className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" /> Déconnexion
        </button>
      </aside>

      <main className="flex-1 ml-[300px] p-12 pr-16">
        <header className="mb-12 flex justify-between items-end no-print">
          <div>
             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{settings.enterpriseName}</p>
             <h2 className="text-[52px] font-header text-slate-900 leading-none italic uppercase">
               {getViewTitle(activeView)}
             </h2>
          </div>
          <div className="flex items-center gap-4">
             <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-2">
                <Globe className="w-3 h-3 text-emerald-500" /><span className="text-[9px] font-black uppercase">{settings.locationId}</span>
             </div>
             <div className="bg-white pr-4 pl-2 py-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-[10px] italic">AD</div>
                <p className="text-[8px] font-black uppercase">Admin ERP</p>
             </div>
          </div>
        </header>

        <section>
           {activeView === 'dashboard' && <DashboardView products={products} furniture={furniture} history={history} exchangeRate={settings.exchangeRate} setView={setActiveView} />}
           {activeView === 'inventory' && <InventoryView products={products} sites={sites} settings={settings} onMovement={(p, t) => setMovementModal({isOpen: true, type: t, product: p})} onEdit={(p) => setEditModal({isOpen: true, product: p})} onImport={handleImportCSV} onAdd={() => setIsAddModalOpen(true)} onDelete={handleDeleteProduct} />}
           {activeView === 'movements' && <MovementsView products={products} sites={sites} history={history} onTransaction={handleTransaction} />}
           {activeView === 'furniture' && <FurnitureView furniture={furniture} setFurniture={setFurniture} furnitureAudits={furnitureAudits} setFurnitureAudits={setFurnitureAudits} sites={sites} notify={notify} />}
           {activeView === 'sites' && <SitesView sites={sites} setSites={(s) => { setSites(s); notify("Structure réseau mise à jour."); }} products={products} onCopyData={handleCopySiteProducts} onImportCSV={handleImportCSV} />}
           {activeView === 'suppliers' && <SuppliersView suppliers={suppliers} setSuppliers={setSuppliers} notify={notify} />}
           {activeView === 'audit_session' && <AuditView products={products} sites={sites} exchangeRate={settings.exchangeRate} onUpdateStock={handleTransaction} notify={notify} />}
           {activeView === 'traceability' && <GlobalHistoryView history={history} needsHistory={needsHistory} furnitureAudits={furnitureAudits} sites={sites} products={products} settings={settings} />}
           {activeView === 'tasks' && <TasksView tasks={tasks} setTasks={(t) => { setTasks(t); }} notify={notify} />}
           {activeView === 'needs_list' && <NeedsReportView products={products} settings={settings} needsHistory={needsHistory} onSaveReport={(rep) => { setNeedsHistory([rep, ...needsHistory]); notify(`État de besoin ${rep.id} enregistré.`); }} onDeleteReport={(id) => { setNeedsHistory(needsHistory.filter(r => r.id !== id)); notify("Rapport supprimé des archives.", "error"); }} />}
           {activeView === 'analytics' && <AnalyticsView products={products} history={history} exchangeRate={settings.exchangeRate} sites={sites} />}
           {activeView === 'settings' && <SettingsView settings={settings} onUpdateSettings={(s) => { setSettings(s); notify("Paramètres système mis à jour."); }} onResetSystem={handleResetSystem} />}
        </section>

        {isLogoutModalOpen && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-fade-in no-print">
            <div className="bg-white w-full max-w-md rounded-[3.5rem] shadow-2xl p-12 text-center space-y-8 animate-slide-up border border-white/20">
              <div className="w-24 h-24 bg-rose-50 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner relative">
                <LogOut className="w-10 h-10 text-rose-500" />
                <div className="absolute top-0 right-0 p-2 bg-rose-500 rounded-full border-4 border-white">
                  <AlertTriangle className="w-3 h-3 text-white" />
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-3xl font-header italic uppercase text-slate-900">Déconnexion</h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                  Êtes-vous sûr de vouloir quitter la plateforme ? <br/> 
                  Toutes les modifications non sauvegardées pourraient être perdues.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button 
                  onClick={handleLogout}
                  className="w-full bg-rose-600 text-white py-6 rounded-3xl font-black text-[12px] uppercase tracking-[0.2em] shadow-xl hover:bg-rose-700 hover:-translate-y-1 transition-all"
                >
                  Confirmer la déconnexion
                </button>
                <button 
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="w-full bg-slate-100 text-slate-500 py-6 rounded-3xl font-black text-[12px] uppercase tracking-[0.2em] hover:bg-slate-200 transition-all"
                >
                  Annuler
                </button>
              </div>
              
              <div className="pt-4 border-t border-slate-50">
                <p className="text-[9px] font-black text-slate-300 uppercase italic">SmartStock Pro Edition Entreprise</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

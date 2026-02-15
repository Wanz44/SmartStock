
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Package, Lamp, MapPin, 
  Truck, History, CheckSquare, ListChecks, 
  Settings, LogOut, Trash2, Activity,
  Bell, Menu, X, Search, AlertTriangle, ChevronRight, Terminal
} from 'lucide-react';

import { DashboardView } from './DashboardView';
import { InventoryView } from './InventoryView';
import { FurnitureView } from './FurnitureView';
import { SitesView } from './SitesView';
import { SuppliersView } from './SuppliersView';
import { TraceabilityView } from './TraceabilityView';
import { TasksView } from './TasksView';
import { NeedsReportView } from './NeedsReportView';
import { SettingsView } from './SettingsView';
import { MovementsView } from './MovementsView';
import { TrashView } from './TrashView';
import { LoginView } from './LoginView';
import { AnalyticsView } from './AnalyticsView';

import { 
  INITIAL_PRODUCTS, INITIAL_SITES, INITIAL_FURNITURE, 
  INITIAL_SUPPLIERS, INITIAL_CATEGORIES, INITIAL_UNITS 
} from './constants';
import { 
  Product, Site, Furniture, InventoryLog, Supplier, 
  Task, NeedReport, AppSettings, ViewType 
} from './types';
import { Badge } from './Badge';

const STORAGE_KEYS = {
  PRODUCTS: 'ss_products',
  SITES: 'ss_sites',
  FURNITURE: 'ss_furniture',
  HISTORY: 'ss_history',
  SUPPLIERS: 'ss_suppliers',
  TASKS: 'ss_tasks',
  NEEDS: 'ss_needs',
  SETTINGS: 'ss_settings',
  BALANCE: 'ss_balance',
  TRASH_PRODUCTS: 'ss_trash_products',
  TRASH_FURNITURE: 'ss_trash_furniture'
};

const App: React.FC = () => {
  // --- STATE ---
  const [view, setView] = useState<ViewType | 'search'>('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [products, setProducts] = useState<Product[]>(() => JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || JSON.stringify(INITIAL_PRODUCTS)));
  const [sites, setSites] = useState<Site[]>(() => JSON.parse(localStorage.getItem(STORAGE_KEYS.SITES) || JSON.stringify(INITIAL_SITES)));
  const [furniture, setFurniture] = useState<Furniture[]>(() => JSON.parse(localStorage.getItem(STORAGE_KEYS.FURNITURE) || JSON.stringify(INITIAL_FURNITURE)));
  const [history, setHistory] = useState<InventoryLog[]>(() => JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || '[]'));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => JSON.parse(localStorage.getItem(STORAGE_KEYS.SUPPLIERS) || JSON.stringify(INITIAL_SUPPLIERS)));
  const [tasks, setTasks] = useState<Task[]>(() => JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]'));
  const [needsHistory, setNeedsHistory] = useState<NeedReport[]>(() => JSON.parse(localStorage.getItem(STORAGE_KEYS.NEEDS) || '[]'));
  
  const [logisticsBalance, setLogisticsBalance] = useState<number>(() => Number(localStorage.getItem(STORAGE_KEYS.BALANCE) || '0'));
  
  const [trashProducts, setTrashProducts] = useState<Product[]>(() => JSON.parse(localStorage.getItem(STORAGE_KEYS.TRASH_PRODUCTS) || '[]'));
  const [trashFurniture, setTrashFurniture] = useState<Furniture[]>(() => JSON.parse(localStorage.getItem(STORAGE_KEYS.TRASH_FURNITURE) || '[]'));
  
  const [copiedProducts, setCopiedProducts] = useState<Product[]>([]);
  const [notifications, setNotifications] = useState<{id: number, msg: string, type: string}[]>([]);

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (saved) return JSON.parse(saved);
    return {
      enterpriseName: "SmartStock Pro",
      locationId: "MAIN-HUB",
      exchangeRate: 2850,
      primaryCurrency: 'Fc',
      defaultSafetyMargin: 20,
      autoBackup: true,
      units: INITIAL_UNITS,
      categories: INITIAL_CATEGORIES,
      printHeader: "SMARTSTOCK PRO | RÉSEAU LOGISTIQUE",
      printFooter: "Document officiel généré par le système d'inventaire automatisé.",
      maskSensitiveData: false,
      printModel: 'excel-green',
      showPageNumbers: true,
      printFontFamily: 'Plus Jakarta Sans',
      printFontSize: 10,
      printBoldHeaders: true,
      printThemeColor: '#1a3a22',
      printStripeColor: '#f8fafc',
      printBorderWidth: 1,
      printConditionalFormatting: true,
      printCellPadding: 8,
      notificationsEnabled: true
    };
  });

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    localStorage.setItem(STORAGE_KEYS.SITES, JSON.stringify(sites));
    localStorage.setItem(STORAGE_KEYS.FURNITURE, JSON.stringify(furniture));
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers));
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    localStorage.setItem(STORAGE_KEYS.NEEDS, JSON.stringify(needsHistory));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    localStorage.setItem(STORAGE_KEYS.BALANCE, logisticsBalance.toString());
    localStorage.setItem(STORAGE_KEYS.TRASH_PRODUCTS, JSON.stringify(trashProducts));
    localStorage.setItem(STORAGE_KEYS.TRASH_FURNITURE, JSON.stringify(trashFurniture));
  }, [products, sites, furniture, history, suppliers, tasks, needsHistory, settings, logisticsBalance, trashProducts, trashFurniture]);

  // --- HELPERS ---
  const notify = (msg: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  const handleTransaction = (prodId: string, amount: number, reason: string, type: 'entry' | 'exit' | 'transfer' | 'adjustment' | 'manual_update') => {
    setProducts(prev => prev.map(p => {
      if (p.id === prodId) {
        const newStock = p.currentStock + amount;
        const log: InventoryLog = {
          id: `LOG-${Date.now()}`,
          date: new Date().toISOString(),
          type,
          productId: p.id,
          productName: p.name,
          changeAmount: amount,
          finalStock: newStock,
          siteId: p.siteId,
          reason,
          responsible: "Admin Logistique"
        };
        setHistory(prevHist => [log, ...prevHist]);
        
        if (type === 'entry') {
          const cost = Math.abs(amount) * (p.currency === '$' ? p.unitPrice * settings.exchangeRate : p.unitPrice);
          setLogisticsBalance(prevB => prevB - cost);
        }

        return { ...p, currentStock: newStock, lastInventoryDate: new Date().toISOString() };
      }
      return p;
    }));
    notify(`Mouvement enregistré : ${amount > 0 ? '+' : ''}${amount} unités.`);
  };

  const handleQuickInventory = (prodId: string) => {
    const p = products.find(prod => prod.id === prodId);
    if (p) {
      const diff = p.targetStock - p.currentStock;
      if (diff === 0) return notify("Stock déjà conforme à la cible.", "info");
      handleTransaction(prodId, diff, "Inventaire de régularisation rapide", 'adjustment');
    }
  };

  const handleDeleteProduct = (id: string) => {
    const product = products.find(p => p.id === id);
    if (product) {
      setProducts(prev => prev.filter(p => p.id !== id));
      setTrashProducts(prev => [product, ...prev]);
      notify(`"${product.name}" déplacé dans la corbeille.`, 'warning');
    }
  };

  const handleRestoreProduct = (id: string) => {
    const product = trashProducts.find(p => p.id === id);
    if (product) {
      setTrashProducts(prev => prev.filter(p => p.id !== id));
      setProducts(prev => [product, ...prev]);
      notify(`"${product.name}" restauré.`);
    }
  };

  const handleCopyProducts = (ps: Product[]) => {
    setCopiedProducts(ps);
    notify(`${ps.length} produit(s) copié(s) dans le presse-papier.`);
  };

  const handlePasteProducts = (siteId: string) => {
    if (copiedProducts.length === 0) return;
    const newItems = copiedProducts.map(p => ({
      ...p,
      id: `P-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      siteId,
      currentStock: 0
    }));
    setProducts(prev => [...prev, ...newItems]);
    setCopiedProducts([]);
    notify(`${newItems.length} produit(s) dupliqué(s) sur ce site.`);
  };

  const resetSystem = () => {
    localStorage.clear();
    window.location.reload();
  };

  // --- INTERNAL SEARCH VIEW ---
  const GlobalSearchView = () => {
    const [query, setQuery] = useState('');
    const results = useMemo(() => {
      if (!query || query.length < 2) return { products: [], furniture: [] };
      const q = query.toLowerCase();
      return {
        products: products.filter(p => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)),
        furniture: furniture.filter(f => f.name.toLowerCase().includes(q) || f.code.toLowerCase().includes(q))
      };
    }, [query]);

    return (
      <div className="space-y-10 animate-fade-in pb-32">
        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 text-slate-300" />
            <input 
              autoFocus
              type="text" 
              placeholder="RECHERCHER DANS TOUTE LA BASE : ARTICLES, CODES, PATRIMOINE..." 
              className="w-full bg-slate-50 border border-slate-100 pl-16 pr-6 py-8 rounded-[2.5rem] text-2xl font-header italic outline-none focus:ring-4 focus:ring-[#1a3a22]/10 transition-all"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-6 flex items-center gap-3">
              <Package className="w-4 h-4" /> Consommables ({results.products.length})
            </h4>
            <div className="space-y-4">
              {results.products.length === 0 ? (
                <div className="p-10 text-center opacity-20 border-2 border-dashed border-slate-200 rounded-[3rem] text-[10px] font-black uppercase italic">Aucun article correspondant</div>
              ) : (
                results.products.map(p => (
                  <div key={p.id} onClick={() => setView('inventory')} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-[#1a3a22] transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-[#1a3a22] group-hover:text-white transition-all"><Package className="w-5 h-5" /></div>
                      <div>
                        <p className="text-[13px] font-black uppercase italic text-slate-900 leading-none">{p.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">ID: {p.id} • {sites.find(s => s.id === p.siteId)?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-xl font-header italic text-[#1a3a22] leading-none">{p.currentStock}</p>
                       <Badge variant={p.currentStock <= p.minStock ? 'danger' : 'success'}>{p.unit}</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-6 flex items-center gap-3">
              <Lamp className="w-4 h-4" /> Patrimoine Mobilier ({results.furniture.length})
            </h4>
            <div className="space-y-4">
              {results.furniture.length === 0 ? (
                <div className="p-10 text-center opacity-20 border-2 border-dashed border-slate-200 rounded-[3rem] text-[10px] font-black uppercase italic">Aucun mobilier correspondant</div>
              ) : (
                results.furniture.map(f => (
                  <div key={f.id} onClick={() => setView('furniture')} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-[#1a3a22] transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-[#1a3a22] group-hover:text-white transition-all"><Lamp className="w-5 h-5" /></div>
                      <div>
                        <p className="text-[13px] font-black uppercase italic text-slate-900 leading-none">{f.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Ref: {f.code} • {sites.find(s => s.id === f.siteId)?.name}</p>
                      </div>
                    </div>
                    <Badge variant={f.condition === 'Neuf' ? 'success' : f.condition === 'Usé' ? 'warning' : 'info'}>{f.condition}</Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isLoggedIn) {
    return <LoginView enterpriseName={settings.enterpriseName} onLogin={() => setIsLoggedIn(true)} />;
  }

  const renderView = () => {
    switch (view) {
      case 'dashboard': return <DashboardView products={products} sites={sites} furniture={furniture} history={history} exchangeRate={settings.exchangeRate} setView={setView} logisticsBalance={logisticsBalance} settings={settings} />;
      case 'search': return <GlobalSearchView />;
      case 'inventory': return (
        <InventoryView 
          products={products} 
          settings={settings} 
          sites={sites} 
          onMovement={(p, v) => handleTransaction(p.id, v, "Ajustement manuel rapide", 'manual_update')}
          onQuickInventory={handleQuickInventory}
          onEdit={(p) => notify("Fonction de modification détaillée en cours...", "info")}
          onImport={(e) => notify("Traitement de l'import CSV...", "info")}
          onAdd={() => setView('movements')}
          onDelete={handleDeleteProduct}
          onCopyProducts={handleCopyProducts}
        />
      );
      case 'movements': return <MovementsView products={products} sites={sites} history={history} onTransaction={handleTransaction} />;
      case 'furniture': return <FurnitureView furniture={furniture} setFurniture={setFurniture} furnitureAudits={[]} setFurnitureAudits={() => {}} sites={sites} notify={notify} onImportFurniture={() => {}} />;
      case 'sites': return (
        <SitesView 
          sites={sites} setSites={setSites} 
          products={products} setProducts={setProducts} 
          furniture={furniture} setFurniture={setFurniture}
          onAddProduct={(sid) => { notify(`Ajout rapide sur site ${sid}`, 'info'); }}
          onAddFurniture={(sid) => { notify(`Ajout mobilier sur site ${sid}`, 'info'); }}
          onGenerateNeeds={(sid) => setView('needs_list')}
          onTransaction={handleTransaction}
          notify={notify}
          copiedCount={copiedProducts.length}
          onPasteProducts={handlePasteProducts}
          onQuickInventory={handleQuickInventory}
          onDeleteProduct={handleDeleteProduct}
        />
      );
      case 'suppliers': return <SuppliersView suppliers={suppliers} setSuppliers={setSuppliers} notify={notify} />;
      case 'needs_list': return <NeedsReportView products={products} settings={settings} needsHistory={needsHistory} onSaveReport={(r) => setNeedsHistory([r, ...needsHistory])} onDeleteReport={(id) => setNeedsHistory(needsHistory.filter(n => n.id !== id))} sites={sites} />;
      case 'traceability': return <TraceabilityView history={history} settings={settings} sites={sites} />;
      case 'tasks': return <TasksView tasks={tasks} setTasks={setTasks} notify={notify} />;
      case 'trash': return (
        <TrashView 
          products={trashProducts} 
          furniture={trashFurniture} 
          onRestoreProduct={handleRestoreProduct} 
          onDeleteProduct={(id) => setTrashProducts(prev => prev.filter(p => p.id !== id))}
          onRestoreFurniture={(id) => {
            const f = trashFurniture.find(item => item.id === id);
            if (f) { setTrashFurniture(prev => prev.filter(i => i.id !== id)); setFurniture(prev => [...prev, f]); notify("Mobilier restauré."); }
          }}
          onDeleteFurniture={(id) => setTrashFurniture(prev => prev.filter(f => f.id !== id))}
        />
      );
      case 'settings': return <SettingsView settings={settings} onUpdateSettings={setSettings} onResetSystem={resetSystem} notify={notify} />;
      default: return <DashboardView products={products} sites={sites} furniture={furniture} history={history} exchangeRate={settings.exchangeRate} setView={setView} logisticsBalance={logisticsBalance} settings={settings} />;
    }
  };

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { id: 'search', icon: Search, label: 'Recherche globale' },
    { id: 'inventory', icon: Package, label: 'Inventaire' },
    { id: 'movements', icon: ArrowRightLeft, label: 'Mouvements' },
    { id: 'furniture', icon: Lamp, label: 'Patrimoine' },
    { id: 'sites', icon: MapPin, label: 'Réseau / Sites' },
    { id: 'suppliers', icon: Truck, label: 'Fournisseurs' },
    { id: 'needs_list', icon: ListChecks, label: 'Besoins' },
    { id: 'traceability', icon: History, label: 'Traçabilité' },
    { id: 'tasks', icon: CheckSquare, label: 'Agenda' },
    { id: 'trash', icon: Trash2, label: 'Corbeille' },
    { id: 'settings', icon: Settings, label: 'Configuration' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className={`sidebar-float transition-all duration-500 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-[280px]'}`}>
        <div className="flex items-center gap-3 px-4 mb-10">
          <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <Activity className="text-white w-6 h-6" />
          </div>
          <span className="text-white font-header italic text-lg tracking-tighter">SmartStock <span className="text-emerald-400">Pro</span></span>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id as any)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                view === item.id ? 'nav-item-active' : 'text-emerald-100/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <button 
          onClick={() => setIsLoggedIn(false)}
          className="mt-10 flex items-center gap-4 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-rose-300 hover:bg-rose-500/10 transition-all shrink-0"
        >
          <LogOut className="w-5 h-5" />
          Déconnexion
        </button>
      </aside>

      <main className={`flex-1 transition-all duration-500 p-10 ${isSidebarOpen ? 'ml-[300px]' : 'ml-10'}`}>
        <header className="flex justify-between items-center mb-10 no-print">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-3 bg-white rounded-2xl shadow-sm hover:bg-slate-50 transition-all">
              {isSidebarOpen ? <X className="w-6 h-6 text-slate-400" /> : <Menu className="w-6 h-6 text-slate-400" />}
            </button>
            <div className="flex flex-col">
              <h2 className="text-2xl font-header italic text-slate-900 uppercase leading-none">
                {navItems.find(n => n.id === view)?.label}
              </h2>
              <p className="text-[10px] font-black uppercase text-slate-400 mt-1 tracking-widest italic">
                {settings.enterpriseName} • Hub Logistique v2.5
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Connecté en tant que Bereckya M.</span>
             </div>
             <button onClick={() => setView('search')} className="p-4 bg-white rounded-2xl shadow-sm text-slate-400 hover:text-[#1a3a22] transition-colors">
                <Search className="w-5 h-5" />
             </button>
             <button className="p-4 bg-white rounded-2xl shadow-sm relative text-slate-400 hover:text-[#1a3a22] transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
             </button>
          </div>
        </header>

        <div className="relative">
          {renderView()}
        </div>
      </main>

      <div className="fixed bottom-10 right-10 z-[5000] space-y-4 pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className={`p-6 rounded-[2rem] shadow-2xl flex items-center gap-4 border animate-slide-in pointer-events-auto bg-white ${
            n.type === 'success' ? 'border-emerald-100 text-emerald-800' :
            n.type === 'error' ? 'border-rose-100 text-rose-800' :
            n.type === 'warning' ? 'border-amber-100 text-amber-800' : 'border-blue-100 text-blue-800'
          }`}>
             <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
               n.type === 'success' ? 'bg-emerald-50' :
               n.type === 'error' ? 'bg-rose-50' :
               n.type === 'warning' ? 'bg-amber-50' : 'bg-blue-50'
             }`}>
                {n.type === 'success' ? <CheckSquare className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
             </div>
             <p className="text-[11px] font-black uppercase italic tracking-tight">{n.msg}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

interface ArrowRightLeftProps { className?: string; }
const ArrowRightLeft = ({ className }: ArrowRightLeftProps) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 9 3-3 3 3"/><path d="M13 18H5a2 2 0 0 1-2-2V6"/><path d="m22 15-3 3-3-3"/><path d="M11 6h8a2 2 0 0 1 2 2v10"/></svg>
);

export default App;

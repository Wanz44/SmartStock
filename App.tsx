
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Package, History as HistoryIcon, Plus, AlertTriangle, 
  Trash2, Search, Activity, X, Save, Calculator, FileSpreadsheet, 
  DollarSign, Settings as SettingsIcon, Building2, Edit2, Printer, 
  Home, Armchair, TrendingUp, Download, Filter, Menu as MenuIcon, LogOut, ArrowRight,
  ShieldCheck, ArrowUpDown, ChevronDown, CheckCircle, Info
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ComposedChart, Area, PieChart, Pie 
} from 'recharts';
import { Product, InventoryLog, ViewType, Site, Furniture } from './types';
import { INITIAL_PRODUCTS, CATEGORIES } from './constants';

const EXCEL_GREEN = '#107c41';
const CHART_COLORS = [EXCEL_GREEN, '#2b579a', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

type SortKey = 'name' | 'stock' | 'price' | 'category';
type SortOrder = 'asc' | 'desc';

const App: React.FC = () => {
  // --- État de l'Application ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [history, setHistory] = useState<InventoryLog[]>([]);
  const [furniture, setFurniture] = useState<Furniture[]>([]);
  const [sites, setSites] = useState<Site[]>([{ id: 'S1', name: 'Siège Social' }, { id: 'S2', name: 'Annexe Nord' }]);
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- Feedback & Notifications ---
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  
  // --- Modals & Filtres ---
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementType, setMovementType] = useState<'entry' | 'exit'>('entry');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({ currency: '$', siteId: 'S1' });

  const [searchTerm, setSearchTerm] = useState('');
  const [siteFilter, setSiteFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('Toutes');
  const [sortConfig, setSortConfig] = useState<{key: SortKey, order: SortOrder}>({ key: 'name', order: 'asc' });

  // --- Initialisation ---
  useEffect(() => {
    const saved = (key: string) => localStorage.getItem(key);
    if (saved('ss_session')) setIsLoggedIn(true);
    setProducts(JSON.parse(saved('stockProducts') || JSON.stringify(INITIAL_PRODUCTS)));
    setHistory(JSON.parse(saved('stockHistory') || '[]'));
    setFurniture(JSON.parse(saved('stockFurniture') || '[]'));
    setSites(JSON.parse(saved('stockSites') || '[{"id":"S1","name":"Siège Social"},{"id":"S2","name":"Annexe Nord"}]'));
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    localStorage.setItem('stockProducts', JSON.stringify(products));
    localStorage.setItem('stockHistory', JSON.stringify(history));
    localStorage.setItem('stockFurniture', JSON.stringify(furniture));
    localStorage.setItem('stockSites', JSON.stringify(sites));
  }, [products, history, furniture, sites, isLoggedIn]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // --- Logique Métier ---
  const filteredAndSortedProducts = useMemo(() => {
    let result = products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSite = siteFilter === 'all' || p.siteId === siteFilter;
      const matchCat = categoryFilter === 'Toutes' || p.category === categoryFilter;
      return matchSearch && matchSite && matchCat;
    });

    return result.sort((a, b) => {
      let valA: any, valB: any;
      switch(sortConfig.key) {
        case 'name': valA = a.name; valB = b.name; break;
        case 'stock': valA = a.currentStock; valB = b.currentStock; break;
        case 'price': valA = a.unitPrice; valB = b.unitPrice; break;
        case 'category': valA = a.category; valB = b.category; break;
        default: return 0;
      }
      if (valA < valB) return sortConfig.order === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.order === 'asc' ? 1 : -1;
      return 0;
    });
  }, [products, searchTerm, siteFilter, categoryFilter, sortConfig]);

  const exportCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).map(val => `"${val}"`).join(','));
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Exportation réussie", "success");
  };

  const deleteProduct = (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet article ? Cette action est irréversible.")) {
      setProducts(prev => prev.filter(p => p.id !== id));
      showToast("Article supprimé définitivement", "info");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ss_session');
    setIsLoggedIn(false);
    showToast("Déconnexion effectuée", "info");
  };

  const logAction = (productId: string, amount: number, type: InventoryLog['type'], options?: any) => {
    const p = products.find(prod => prod.id === productId);
    if (!p) return;
    const newLog: InventoryLog = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      type,
      productId,
      productName: p.name,
      changeAmount: amount,
      finalStock: p.currentStock + amount,
      ...options
    };
    setHistory(prev => [newLog, ...prev]);
  };

  const handleStockUpdate = (productId: string, amount: number, type: 'entry' | 'exit', siteId: string) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId && p.siteId === siteId) {
        const change = type === 'entry' ? Math.abs(amount) : -Math.abs(amount);
        logAction(p.id, change, type, { fromSiteId: siteId, responsible: 'Admin' });
        showToast(`${type === 'entry' ? 'Entrée' : 'Sortie'} de ${Math.abs(amount)} unités enregistrée`, "success");
        return { ...p, currentStock: Math.max(0, p.currentStock + change), lastInventoryDate: new Date().toISOString() };
      }
      return p;
    }));
  };

  // --- Composants UI ---
  const SortButton = ({ label, sortKey }: { label: string, sortKey: SortKey }) => (
    <button 
      onClick={() => setSortConfig({ key: sortKey, order: sortConfig.key === sortKey && sortConfig.order === 'asc' ? 'desc' : 'asc' })}
      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${sortConfig.key === sortKey ? 'bg-emerald-700 text-white' : 'bg-white border text-slate-500 hover:bg-slate-50'}`}
    >
      {label}
      {sortConfig.key === sortKey && <ArrowUpDown className="w-3 h-3" />}
    </button>
  );

  const Toast = () => {
    if (!notification) return null;
    return (
      <div className={`fixed bottom-8 right-8 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-right duration-300 ${notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : notification.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
        {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : notification.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
        <p className="text-xs font-black uppercase tracking-widest">{notification.message}</p>
        <button onClick={() => setNotification(null)}><X className="w-4 h-4" /></button>
      </div>
    );
  };

  // --- Vues ---
  const InventoryView = () => (
    <div className="space-y-4">
      <div className="bg-white p-5 border rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2 flex-1 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-2xl text-xs outline-none focus:border-emerald-500" />
            </div>
            <select value={siteFilter} onChange={e => setSiteFilter(e.target.value)} className="px-4 py-2.5 bg-slate-50 border rounded-2xl text-[10px] font-black uppercase outline-none">
              <option value="all">Tous les Sites</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-4 py-2.5 bg-slate-50 border rounded-2xl text-[10px] font-black uppercase outline-none">
              <option value="Toutes">Catégories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={() => exportCSV(filteredAndSortedProducts, 'inventaire')} className="p-3 bg-white border rounded-2xl text-slate-600 hover:bg-emerald-50 transition-all shadow-sm"><Download className="w-5 h-5" /></button>
            <button onClick={() => { setEditingProduct(null); setFormData({ currency: '$', siteId: 'S1' }); setIsProductModalOpen(true); }} className="flex-1 bg-emerald-700 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-emerald-800 shadow-xl"><Plus className="w-3 h-3" /> Nouvel Article</button>
          </div>
        </div>
        <div className="flex items-center gap-3 pt-2 border-t border-slate-50">
          <span className="text-[9px] font-black uppercase text-slate-400">Trier par :</span>
          <SortButton label="Nom" sortKey="name" />
          <SortButton label="Stock" sortKey="stock" />
          <SortButton label="Prix" sortKey="price" />
          <SortButton label="Catégorie" sortKey="category" />
        </div>
      </div>

      <div className="bg-white border rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/80 border-b text-[9px] font-black text-slate-500 uppercase tracking-widest">
                <th className="px-8 py-5">Article</th>
                <th className="px-6 py-5">Site</th>
                <th className="px-6 py-5 text-center">Stock</th>
                <th className="px-6 py-5 text-center">Prix Unit.</th>
                <th className="px-6 py-5 text-center">Statut</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {filteredAndSortedProducts.map(p => {
                const isAlert = p.currentStock <= p.minStock;
                return (
                  <tr key={p.id} className="border-b hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="font-black text-slate-900 uppercase tracking-tighter">{p.name}</div>
                      <div className="text-[8px] uppercase text-slate-400 font-bold">{p.category}</div>
                    </td>
                    <td className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 italic">{sites.find(s=>s.id===p.siteId)?.name}</td>
                    <td className="px-6 py-5 text-center font-black tabular-nums text-sm">{p.currentStock} <span className="text-[10px] text-slate-400">{p.unit}</span></td>
                    <td className="px-6 py-5 text-center font-black text-slate-700">{p.unitPrice} {p.currency}</td>
                    <td className="px-6 py-5 text-center">
                       <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${isAlert ? 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                        {isAlert ? 'Réappro.' : 'OK'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingProduct(p); setFormData(p); setIsProductModalOpen(true); }} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => deleteProduct(p.id)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // --- Main Layout ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex bg-white overflow-hidden">
        <Toast />
        <div className="hidden lg:flex w-1/2 bg-[#004a23] relative flex-col justify-between p-16 overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <FileSpreadsheet className="w-10 h-10 text-white" />
              <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase">SmartStock<span className="text-emerald-400">Pro</span></h1>
            </div>
            <h2 className="text-5xl font-black text-white leading-[1.1] tracking-tight mb-6">Gestion de stock <br/><span className="text-emerald-400">Professionnelle.</span></h2>
            <p className="text-emerald-100/60 max-w-sm font-medium">Réduisez les erreurs, gagnez du temps et assurez la traçabilité complète de vos inventaires multi-sites.</p>
          </div>
        </div>
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
           <div className="w-full max-w-sm space-y-8">
             <div className="text-center">
               <h3 className="text-3xl font-black text-slate-900 tracking-tight">Accès Sécurisé</h3>
               <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Identifiez-vous pour continuer</p>
             </div>
             <form onSubmit={e => { e.preventDefault(); setIsLoggedIn(true); localStorage.setItem('ss_session', 'active'); showToast("Bienvenue sur SmartStock Pro", "success"); }} className="space-y-4">
                <input type="text" placeholder="Admin" className="w-full p-5 bg-white border border-slate-200 rounded-[1.5rem] outline-none font-bold focus:border-emerald-600 transition-all shadow-sm" defaultValue="admin" />
                <input type="password" placeholder="Mot de passe" className="w-full p-5 bg-white border border-slate-200 rounded-[1.5rem] outline-none font-bold focus:border-emerald-600 transition-all shadow-sm" defaultValue="••••••" />
                <button className="w-full bg-[#107c41] text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2">Se Connecter <ArrowRight className="w-4 h-4" /></button>
             </form>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f3f4] flex text-slate-900 font-sans selection:bg-[#107c41]/10 overflow-x-hidden">
      <Toast />
      
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[55] lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

      <aside className={`fixed inset-y-6 left-6 z-[60] w-64 bg-[#004a23] text-white flex flex-col shadow-2xl rounded-[2.5rem] border border-white/10 transition-transform duration-500 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-[110%] lg:translate-x-0'}`}>
        <div className="p-8 border-b border-white/5 bg-[#003d1c] rounded-t-[2.5rem]">
          <h1 className="text-lg font-black tracking-tighter uppercase italic leading-none">SmartStock<span className="text-emerald-400">Pro</span></h1>
        </div>
        <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'inventory', label: 'Stocks', icon: FileSpreadsheet },
            { id: 'furniture', label: 'Mobilier', icon: Armchair },
            { id: 'replenishment', label: 'Commandes', icon: Calculator },
            { id: 'history', label: 'Historique', icon: HistoryIcon },
            { id: 'settings', label: 'Configuration', icon: SettingsIcon },
          ].map(item => (
            <button key={item.id} onClick={() => { setActiveView(item.id as ViewType); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-6 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === item.id ? 'bg-white text-[#004a23] shadow-lg scale-105' : 'text-emerald-100/60 hover:bg-white/5'}`}>
              <item.icon className="w-4 h-4" /> {item.label}
            </button>
          ))}
        </nav>
        <div className="p-6 bg-[#003d1c] border-t border-white/5 rounded-b-[2.5rem]">
           <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-rose-500/10 text-rose-300 text-[9px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all">
             <LogOut className="w-3.5 h-3.5" /> Déconnexion
           </button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-[19rem] p-4 lg:p-10 transition-all duration-500">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-slate-200 pb-8 sticky top-0 bg-[#f1f3f4]/80 backdrop-blur-md z-40">
           <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 bg-white border border-slate-200 rounded-2xl text-slate-600"><MenuIcon className="w-6 h-6" /></button>
             <div>
               <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">{activeView}</h2>
               <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2">{filteredAndSortedProducts.length} éléments affichés</p>
             </div>
           </div>
           <div className="flex gap-2">
              <button onClick={() => window.print()} className="p-3.5 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-emerald-50 transition-all shadow-sm"><Printer className="w-5 h-5" /></button>
           </div>
        </header>

        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeView === 'inventory' && <InventoryView />}
          {activeView === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 border rounded-[2rem] shadow-sm flex flex-col justify-between h-40">
                  <div className="flex justify-between"><div className="p-2 bg-emerald-50 rounded-xl"><Package className="w-5 h-5 text-emerald-600" /></div><TrendingUp className="w-4 h-4 text-emerald-500" /></div>
                  <div><p className="text-[10px] font-black text-slate-400 uppercase">Articles</p><p className="text-3xl font-black text-slate-900">{products.length}</p></div>
                </div>
                <div className="bg-white p-6 border rounded-[2rem] shadow-sm flex flex-col justify-between h-40">
                  <div className="flex justify-between"><div className="p-2 bg-rose-50 rounded-xl"><AlertTriangle className="w-5 h-5 text-rose-600" /></div><Activity className="w-4 h-4 text-rose-400" /></div>
                  <div><p className="text-[10px] font-black text-slate-400 uppercase">Alertes</p><p className="text-3xl font-black text-rose-600">{products.filter(p=>p.currentStock<=p.minStock).length}</p></div>
                </div>
                <div className="bg-white p-6 border rounded-[2rem] shadow-sm flex flex-col justify-between h-40">
                  <div className="flex justify-between"><div className="p-2 bg-blue-50 rounded-xl"><DollarSign className="w-5 h-5 text-blue-600" /></div><FileSpreadsheet className="w-4 h-4 text-blue-400" /></div>
                  <div><p className="text-[10px] font-black text-slate-400 uppercase">Valeur</p><p className="text-2xl font-black text-slate-900">{products.reduce((acc,p)=>acc+(p.currentStock*p.unitPrice),0).toLocaleString()} $</p></div>
                </div>
                <div className="bg-white p-6 border rounded-[2rem] shadow-sm flex flex-col justify-between h-40">
                  <div className="flex justify-between"><div className="p-2 bg-amber-50 rounded-xl"><Building2 className="w-5 h-5 text-amber-600" /></div><Home className="w-4 h-4 text-amber-400" /></div>
                  <div><p className="text-[10px] font-black text-slate-400 uppercase">Sites</p><p className="text-3xl font-black text-slate-900">{sites.length}</p></div>
                </div>
              </div>
            </div>
          )}
          {activeView === 'history' && (
            <div className="bg-white border rounded-[2.5rem] overflow-hidden shadow-sm">
              <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xs font-black uppercase tracking-widest">Journal des Mouvements</h3>
                <button onClick={() => exportCSV(history, 'historique')} className="text-[10px] font-black uppercase text-emerald-700 bg-white border border-emerald-100 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-emerald-50 transition-all"><Download className="w-4 h-4" /> Export CSV</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[9px] font-black text-slate-500 uppercase border-b">
                      <th className="px-8 py-5">Date</th>
                      <th className="px-6 py-5">Article</th>
                      <th className="px-6 py-5">Flux</th>
                      <th className="px-6 py-5 text-center">Quantité</th>
                      <th className="px-6 py-5 text-center">Stock Final</th>
                      <th className="px-8 py-5">Auteur</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {history.map(log => (
                      <tr key={log.id} className="border-b hover:bg-slate-50/30 transition-colors">
                        <td className="px-8 py-5 font-bold text-slate-400">{new Date(log.date).toLocaleString()}</td>
                        <td className="px-6 py-5 font-black uppercase text-slate-800">{log.productName}</td>
                        <td className="px-6 py-5">
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${log.type === 'entry' ? 'bg-emerald-50 text-emerald-600' : log.type === 'exit' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                            {log.type}
                          </span>
                        </td>
                        <td className={`px-6 py-5 text-center font-black ${log.changeAmount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{log.changeAmount > 0 ? '+' : ''}{log.changeAmount}</td>
                        <td className="px-6 py-5 text-center font-bold tabular-nums">{log.finalStock}</td>
                        <td className="px-8 py-5 uppercase text-[9px] font-black text-slate-400">{log.responsible || 'Système'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Modals & Forms (Simplified forbrevity) */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={() => setIsProductModalOpen(false)} />
          <div className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20">
            <div className="p-8 bg-[#004a23] text-white flex justify-between items-center">
              <h3 className="text-xs font-black uppercase italic">Fiche Article</h3>
              <button onClick={() => setIsProductModalOpen(false)} className="p-2 bg-white/10 rounded-xl hover:bg-white/20"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if(editingProduct) setProducts(prev => prev.map(p => p.id === editingProduct.id ? {...p, ...formData} as Product : p));
              else setProducts(prev => [...prev, { ...formData, id: Math.random().toString(36).substr(2, 9), lastInventoryDate: new Date().toISOString(), currentStock: formData.currentStock || 0 } as Product]);
              showToast("Article enregistré avec succès", "success");
              setIsProductModalOpen(false);
            }} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase">Désignation</label>
                  <input required value={formData.name || ''} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase">Catégorie</label>
                  <select value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold text-sm">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase">Prix Unit.</label>
                  <input type="number" step="0.01" value={formData.unitPrice || 0} onChange={e=>setFormData({...formData, unitPrice: parseFloat(e.target.value)})} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold text-sm" />
                </div>
              </div>
              <button className="w-full py-5 bg-emerald-700 text-white rounded-[2rem] font-black uppercase text-xs shadow-xl flex items-center justify-center gap-3"><Save className="w-4 h-4" /> Enregistrer</button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          .no-print, header, aside, button, .Toast { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; }
          .bg-white { border: none !important; }
          .rounded-[2.5rem] { border-radius: 0 !important; }
        }
      `}</style>
    </div>
  );
};

export default App;

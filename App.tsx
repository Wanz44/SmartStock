import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, Package, History as HistoryIcon, Plus, AlertTriangle, 
  Trash2, Search, Activity, X, Save, Calculator, FileSpreadsheet, 
  DollarSign, Settings as SettingsIcon, Building2, Edit2, Printer, 
  Home, Armchair, TrendingUp, Download, Filter, Menu as MenuIcon, LogOut, ArrowRight,
  ShieldCheck, ArrowUpDown, ChevronDown, CheckCircle, Info, PieChart as PieChartIcon,
  LineChart as LineChartIcon, BarChart3, Tag, Sparkles, RefreshCcw, Archive, FileUp, Loader2,
  Database, Truck, ShieldAlert, Globe, HardDriveDownload, RotateCcw, Cpu, FileText, UserCheck, TrendingDown,
  FileDown, FileType, Menu, User, Lock, Eye, EyeOff
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ComposedChart, Area, PieChart, Pie, Bar, Line, Legend
} from 'recharts';
import { Product, InventoryLog, ViewType, Site, Furniture } from './types';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from './constants';
import { getStockInsights, processImportedData } from './services/geminiService';

const EXCEL_GREEN = '#107c41';
const CHART_COLORS = [EXCEL_GREEN, '#2b579a', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

type SortKey = 'name' | 'stock' | 'price' | 'category';
type SortOrder = 'asc' | 'desc';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Login State
  const [loginForm, setLoginForm] = useState({ username: 'admin', password: 'admin' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [history, setHistory] = useState<InventoryLog[]>([]);
  const [archives, setArchives] = useState<InventoryLog[]>([]);
  const [sites, setSites] = useState<Site[]>([{ id: 'S1', name: 'Siège Social' }, { id: 'S2', name: 'Annexe Nord' }]);
  const [categories, setCategories] = useState<string[]>(INITIAL_CATEGORIES);
  const [suppliers, setSuppliers] = useState<string[]>(['Fournisseur Général', 'Logistique Kin', 'Import CFA']);
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({ currency: 'Fc', siteId: 'S1' });

  const [searchTerm, setSearchTerm] = useState('');
  const [siteFilter, setSiteFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState<{key: SortKey, order: SortOrder}>({ key: 'name', order: 'asc' });

  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isImportLoading, setIsImportLoading] = useState(false);

  useEffect(() => {
    const saved = (key: string) => localStorage.getItem(key);
    if (saved('ss_session')) {
      console.log("Restoring session...");
      setIsLoggedIn(true);
    }
    setProducts(JSON.parse(saved('stockProducts') || JSON.stringify(INITIAL_PRODUCTS)));
    setHistory(JSON.parse(saved('stockHistory') || '[]'));
    setArchives(JSON.parse(saved('stockArchives') || '[]'));
    setSites(JSON.parse(saved('stockSites') || '[{"id":"S1","name":"Siège Social"},{"id":"S2","name":"Annexe Nord"}]'));
    setCategories(JSON.parse(saved('stockCategories') || JSON.stringify(INITIAL_CATEGORIES)));
    setSuppliers(JSON.parse(saved('stockSuppliers') || '["Fournisseur Général", "Logistique Kin", "Import CFA"]'));
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    localStorage.setItem('stockProducts', JSON.stringify(products));
    localStorage.setItem('stockHistory', JSON.stringify(history));
    localStorage.setItem('stockArchives', JSON.stringify(archives));
    localStorage.setItem('stockSites', JSON.stringify(sites));
    localStorage.setItem('stockCategories', JSON.stringify(categories));
    localStorage.setItem('stockSuppliers', JSON.stringify(suppliers));
  }, [products, history, archives, sites, categories, suppliers, isLoggedIn]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const filteredAndSortedProducts = useMemo(() => {
    let result = products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSite = siteFilter === 'all' || p.siteId === siteFilter;
      return matchSearch && matchSite;
    });

    return result.sort((a, b) => {
      let valA: any, valB: any;
      switch(sortConfig.key) {
        case 'name': valA = a.name.toLowerCase(); valB = b.name.toLowerCase(); break;
        case 'stock': valA = a.currentStock; valB = b.currentStock; break;
        case 'price': valA = a.unitPrice; valB = b.unitPrice; break;
        case 'category': valA = a.category; valB = b.category; break;
        default: return 0;
      }
      if (valA < valB) return sortConfig.order === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.order === 'asc' ? 1 : -1;
      return 0;
    });
  }, [products, searchTerm, siteFilter, sortConfig]);

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('ss_session');
    setIsLogoutModalOpen(false);
    showToast("Déconnexion effectuée avec succès", "info");
  };

  const exportCSV = (data: Product[], filename: string) => {
    const headers = ['ID', 'Nom', 'Catégorie', 'Stock Actuel', 'Stock Min', 'Besoin Mensuel', 'Unité', 'Prix Unitaire', 'Devise', 'Fournisseur', 'Site ID', 'Dernier Inventaire'];
    const csvContent = [
      headers.join(','),
      ...data.map(p => [
        p.id,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.category.replace(/"/g, '""')}"`,
        p.currentStock,
        p.minStock,
        p.monthlyNeed,
        `"${p.unit.replace(/"/g, '""')}"`,
        p.unitPrice,
        `"${p.currency}"`,
        `"${(p.supplier || '').replace(/"/g, '""')}"`,
        `"${p.siteId}"`,
        p.lastInventoryDate
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Exportation CSV terminée", "success");
  };

  const handleGenerateDemo = () => {
    if(window.confirm("Générer 10 produits de démonstration ?")) {
      const demoProducts: Product[] = Array.from({length: 10}).map((_, i) => ({
        id: `demo-${Date.now()}-${i}`,
        name: `Article Démo ${i+1}`,
        category: categories[i % categories.length],
        currentStock: Math.floor(Math.random() * 50),
        minStock: 10,
        monthlyNeed: 20,
        unit: 'unités',
        unitPrice: Math.floor(Math.random() * 50000),
        currency: 'Fc',
        siteId: sites[i % sites.length].id,
        lastInventoryDate: new Date().toISOString()
      }));
      setProducts(prev => [...prev, ...demoProducts]);
      showToast("Données de démonstration prêtes", "success");
    }
  };

  const handleSystemBackup = () => {
    const backup = { products, history, archives, sites, categories, suppliers, timestamp: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_SmartStock_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast("Backup JSON exporté avec succès", "success");
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsImportLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const imported = await processImportedData(text, categories);
        const toAdd = imported.map(p => ({
          ...p, 
          id: Math.random().toString(36).substr(2, 9), 
          lastInventoryDate: new Date().toISOString(), 
          siteId: sites[0].id,
          currency: p.currency || 'Fc'
        } as Product));
        setProducts(prev => [...prev, ...toAdd]);
        showToast(`${toAdd.length} articles importés par l'IA`, "success");
      } catch (err) { showToast("Erreur d'importation IA", "error"); }
      finally { setIsImportLoading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
    };
    reader.readAsText(file);
  };

  const handleFetchAiInsights = async () => {
    setIsAiLoading(true);
    try {
      const insights = await getStockInsights(products, history);
      setAiInsights(insights);
    } catch (err) { showToast("Erreur diagnostic IA", "error"); }
    finally { setIsAiLoading(false); }
  };

  // --- VIEWS ---
  const DashboardView = () => {
    const totalValue = useMemo(() => products.reduce((acc, p) => acc + (p.currentStock * p.unitPrice), 0), [products]);
    const categoryValueData = useMemo(() => {
      const v: Record<string, number> = {};
      products.forEach(p => { const val = p.currentStock * p.unitPrice; if (val > 0) v[p.category] = (v[p.category] || 0) + val; });
      return Object.entries(v).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
    }, [products]);

    const combinedTimelineData = useMemo(() => {
      return Array.from({length: 10}).map((_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (9 - i));
        return { 
          date: d.toLocaleDateString('fr-FR', {day:'2-digit', month:'2-digit'}), 
          stockValue: totalValue * (0.9 + Math.random() * 0.2), 
          turnover: Math.random() * (totalValue / 10) 
        };
      });
    }, [totalValue]);

    return (
      <div className="space-y-6 lg:space-y-12 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-8">
          {[
            { label: 'Valeur Inventaire', val: totalValue.toLocaleString() + ' Fc', icon: DollarSign, color: 'emerald' },
            { label: 'En Rupture', val: products.filter(p=>p.currentStock===0).length + ' Réf.', icon: AlertTriangle, color: 'rose' },
            { label: 'Alertes Seuil', val: products.filter(p=>p.currentStock<=p.minStock && p.currentStock>0).length + ' Réf.', icon: TrendingUp, color: 'amber' },
            { label: 'Catalogue', val: products.length + ' Pdt.', icon: Package, color: 'slate' }
          ].map((c, i) => (
            <div key={i} className="bg-white p-6 lg:p-10 border rounded-[2rem] lg:rounded-[3rem] shadow-sm group hover:-translate-y-2 transition-all">
              <div className={`p-3 lg:p-4 bg-${c.color}-50 text-${c.color}-600 rounded-2xl lg:rounded-3xl w-max mb-4 lg:mb-8`}><c.icon className="w-6 h-6 lg:w-8 lg:h-8" /></div>
              <p className="text-[9px] lg:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1 lg:mb-2">{c.label}</p>
              <h4 className="text-2xl lg:text-4xl font-black text-slate-900 tracking-tight italic tabular-nums">{c.val}</h4>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-8">
          <div className="bg-white p-6 lg:p-12 border rounded-[2rem] lg:rounded-[3.5rem] shadow-sm min-h-[450px]">
             <h3 className="text-base lg:text-lg font-black uppercase tracking-[0.2em] mb-8 lg:mb-12 flex items-center gap-3"><PieChartIcon className="w-5 h-5 text-emerald-600" /> Structure Fiscale</h3>
             <div className="h-[350px] lg:h-[400px] w-full flex flex-col sm:flex-row items-center gap-6 lg:gap-8 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie data={categoryValueData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                      {categoryValueData.map((_, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="none" />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-full sm:w-1/2 space-y-2 lg:space-y-3">
                   {categoryValueData.slice(0, 5).map((d, i) => (
                     <div key={i} className="flex justify-between p-3 lg:p-4 bg-slate-50 rounded-xl lg:rounded-2xl border hover:border-emerald-100 transition-all">
                        <span className="text-[9px] lg:text-[11px] font-black uppercase text-slate-700 truncate mr-2">{d.name}</span>
                        <span className="text-[9px] lg:text-[11px] font-black text-slate-900 whitespace-nowrap">{d.value.toLocaleString()} Fc</span>
                     </div>
                   ))}
                </div>
             </div>
          </div>

          <div className="bg-white p-6 lg:p-12 border rounded-[2rem] lg:rounded-[3.5rem] shadow-sm min-h-[450px]">
             <h3 className="text-base lg:text-lg font-black uppercase tracking-[0.2em] mb-8 lg:mb-12 flex items-center gap-3"><LineChartIcon className="w-5 h-5 text-blue-600" /> Performance & Intensité</h3>
             <div className="h-[350px] lg:h-[400px] w-full overflow-hidden">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <ComposedChart data={combinedTimelineData}>
                    <defs><linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2b579a" stopOpacity={0.1}/><stop offset="95%" stopColor="#2b579a" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{fontSize: 9, fontWeight: 800}} axisLine={false} tickLine={false} dy={10} />
                    <YAxis yAxisId="left" tick={{fontSize: 9, fontWeight: 800}} axisLine={false} tickLine={false} dx={-10} />
                    <YAxis yAxisId="right" orientation="right" tick={{fontSize: 9, fontWeight: 800}} axisLine={false} tickLine={false} dx={10} />
                    <Tooltip />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{fontSize: '9px', fontWeight: 'bold'}} />
                    <Area yAxisId="left" name="Valeur Stock" dataKey="stockValue" stroke="#2b579a" strokeWidth={3} fill="url(#colorStock)" />
                    <Bar yAxisId="right" name="Intensité Flux" dataKey="turnover" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
                    <Line yAxisId="right" name="Rotation Tend." dataKey="turnover" stroke="#ef4444" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>
      </div>
    );
  };

  const InventoryView = () => (
    <div className="space-y-6">
      <div className="bg-white p-4 lg:p-6 border rounded-[1.5rem] lg:rounded-[2.5rem] shadow-sm space-y-4 lg:space-y-6 no-print">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative w-full lg:flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Filtrer l'inventaire..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-6 py-3 lg:py-4 bg-slate-50 border border-slate-200 rounded-xl lg:rounded-2xl text-sm outline-none focus:border-emerald-500 transition-all font-bold" />
          </div>
          <div className="flex flex-wrap gap-2 lg:gap-3 w-full lg:w-auto">
            <button onClick={() => window.print()} className="flex-1 lg:flex-none px-4 lg:px-6 py-3 lg:py-4 bg-slate-900 text-white rounded-xl lg:rounded-2xl text-[10px] lg:text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg"><Printer className="w-4 h-4" /> Imprimer</button>
            <button onClick={() => exportCSV(products, 'SmartStock_Inventaire')} className="flex-1 lg:flex-none px-4 lg:px-6 py-3 lg:py-4 bg-emerald-700 text-white rounded-xl lg:rounded-2xl text-[10px] lg:text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-800 shadow-lg transition-all"><Download className="w-4 h-4" /> CSV</button>
            <button onClick={() => { setEditingProduct(null); setFormData({ currency: 'Fc', siteId: sites[0].id }); setIsProductModalOpen(true); }} className="w-full lg:flex-none px-4 lg:px-6 py-3 lg:py-4 bg-white border-2 border-slate-200 text-slate-900 rounded-xl lg:rounded-2xl text-[10px] lg:text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"><Plus className="w-4 h-4" /> Nouveau</button>
          </div>
        </div>
      </div>
      <div className="bg-white border rounded-[1.5rem] lg:rounded-[3rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-widest border-b">
                <th className="px-6 lg:px-10 py-4 lg:py-6">Désignation</th>
                <th className="px-4 lg:px-6 py-4 lg:py-6 text-center">Stock</th>
                <th className="px-4 lg:px-6 py-4 lg:py-6 text-center">P.U.</th>
                <th className="px-4 lg:px-6 py-4 lg:py-6 text-center">Valeur</th>
                <th className="px-6 lg:px-10 py-4 lg:py-6 text-right no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[11px] lg:text-xs">
              {filteredAndSortedProducts.map(p => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 lg:px-10 py-4 lg:py-6 font-black text-slate-900 uppercase text-xs lg:text-sm">{p.name} <span className="text-[8px] lg:text-[9px] text-emerald-600 block">{p.category}</span></td>
                  <td className="px-4 lg:px-6 py-4 lg:py-6 text-center font-black text-sm lg:text-base">{p.currentStock} <span className="text-[8px] lg:text-[9px] text-slate-400">{p.unit}</span></td>
                  <td className="px-4 lg:px-6 py-4 lg:py-6 text-center font-bold text-slate-600">{p.unitPrice.toLocaleString()} {p.currency}</td>
                  <td className="px-4 lg:px-6 py-4 lg:py-6 text-center font-black">{(p.currentStock * p.unitPrice).toLocaleString()} {p.currency}</td>
                  <td className="px-6 lg:px-10 py-4 lg:py-6 text-right no-print">
                    <button onClick={()=>{setEditingProduct(p); setFormData(p); setIsProductModalOpen(true);}} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl mr-1 lg:mr-2"><Edit2 className="w-3 h-3 lg:w-4 lg:h-4" /></button>
                    <button onClick={()=>setProducts(products.filter(item=>item.id!==p.id))} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"><Trash2 className="w-3 h-3 lg:w-4 lg:h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const ReplenishmentView = () => {
    const need = products.filter(p => p.currentStock <= p.minStock);
    return (
      <div className="space-y-6 lg:space-y-8 pb-24">
        <div className="bg-white p-6 lg:p-12 border rounded-[2rem] lg:rounded-[3.5rem] shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 lg:gap-8">
           <div className="flex items-center gap-4 lg:gap-6 w-full lg:w-auto">
              <div className="p-3 lg:p-4 bg-emerald-600 text-white rounded-2xl lg:rounded-3xl"><Calculator className="w-6 h-6 lg:w-8 lg:h-8" /></div>
              <div><h3 className="text-xl lg:text-2xl font-black uppercase italic tracking-tighter">Besoins Critiques</h3><p className="text-[9px] lg:text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">{need.length} références à réapprovisionner</p></div>
           </div>
           <button onClick={handleFetchAiInsights} disabled={isAiLoading} className="w-full lg:w-auto px-6 lg:px-10 py-4 lg:py-5 bg-slate-900 text-white rounded-2xl lg:rounded-3xl font-black uppercase text-[10px] lg:text-[11px] flex items-center justify-center gap-3 lg:gap-4 hover:bg-black transition-all disabled:opacity-50 shadow-xl">
              {isAiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-emerald-400" />} Diagnostic IA Logistique
           </button>
        </div>
        {aiInsights && <div className="p-6 lg:p-12 bg-slate-900 text-slate-100 rounded-[2rem] lg:rounded-[3.5rem] shadow-xl animate-in zoom-in duration-500 italic text-xs lg:text-sm leading-relaxed whitespace-pre-wrap"><Sparkles className="w-5 h-5 lg:w-6 lg:h-6 text-emerald-400 mb-4 lg:mb-6" />{aiInsights}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
           {need.map(p => (
             <div key={p.id} className="p-6 lg:p-10 bg-white border-2 border-rose-100 rounded-[2rem] lg:rounded-[3rem] shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 lg:w-32 h-24 lg:h-32 bg-rose-50 rounded-full -mr-12 lg:-mr-16 -mt-12 lg:-mt-16 group-hover:scale-110 transition-transform" />
                <h4 className="font-black text-slate-900 uppercase tracking-tight text-base lg:text-lg mb-3 lg:mb-4 relative z-10">{p.name}</h4>
                <div className="flex justify-between items-end relative z-10">
                   <div><p className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">À commander</p><p className="text-2xl lg:text-3xl font-black text-rose-600">{p.monthlyNeed - p.currentStock} <span className="text-[10px] lg:text-xs">{p.unit}</span></p></div>
                   <div className="text-right font-bold text-slate-400 italic text-[10px] lg:text-xs">Seuil: {p.minStock}</div>
                </div>
             </div>
           ))}
        </div>
      </div>
    );
  };

  const MonthlyReportView = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthName = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(new Date());

    const monthStats = useMemo(() => {
      const logs = history.filter(h => {
        const d = new Date(h.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });

      const totalExpense = logs.filter(l => l.type === 'entry').reduce((acc, l) => {
        const p = products.find(prod => prod.id === l.productId);
        return acc + (l.changeAmount * (p ? p.unitPrice : 0));
      }, 0);

      const residualValue = products.reduce((acc, p) => acc + (p.currentStock * p.unitPrice), 0);

      const siteStats = sites.map(site => {
        const siteProds = products.filter(p => p.siteId === site.id);
        const siteLogs = logs.filter(l => {
           const p = products.find(prod => prod.id === l.productId);
           return p?.siteId === site.id;
        });
        const exp = siteLogs.filter(l => l.type === 'entry').reduce((acc, l) => {
          const p = products.find(prod => prod.id === l.productId);
          return acc + (l.changeAmount * (p ? p.unitPrice : 0));
        }, 0);
        const exits = siteLogs.filter(l => l.type === 'exit').length;
        const ruptureCount = siteProds.filter(p => p.currentStock === 0).length;
        const ruptureRate = siteProds.length > 0 ? (ruptureCount / siteProds.length) * 100 : 0;

        return { name: site.name, expense: exp, outputVolume: exits, ruptureRate };
      });

      return { totalExpense, residualValue, siteStats };
    }, [history, products, sites, currentMonth, currentYear]);

    const globalHealth = useMemo(() => {
      const ruptures = products.filter(p => p.currentStock === 0).length;
      const alerts = products.filter(p => p.currentStock <= p.minStock && p.currentStock > 0).length;
      if (ruptures > 0) return 'RED';
      if (alerts > 0) return 'ORANGE';
      return 'GREEN';
    }, [products]);

    return (
      <div className="space-y-8 lg:space-y-12 pb-24 max-w-5xl mx-auto print:p-0 print:m-0">
        <div className="hidden print:flex justify-between items-center border-b-4 border-[#004a23] pb-8 mb-12">
           <div className="flex items-center gap-4">
             <div className="bg-[#004a23] p-4 rounded-2xl"><FileSpreadsheet className="w-10 h-10 text-white" /></div>
             <div>
                <h1 className="text-3xl font-black uppercase italic">SmartStock<span className="text-emerald-600">Pro</span></h1>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Rapport de Gestion Mensuel</p>
             </div>
           </div>
           <div className="text-right">
             <p className="text-sm font-black uppercase">{monthName} {currentYear}</p>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Généré le {new Date().toLocaleDateString()}</p>
           </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center no-print mb-8 gap-4">
           <h3 className="text-xl lg:text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3 lg:gap-4"><FileText className="w-6 h-6 lg:w-8 lg:h-8 text-emerald-600" /> Structure du Rapport Automatisé</h3>
           <button onClick={() => window.print()} className="w-full sm:w-auto px-6 lg:px-8 py-3 lg:py-4 bg-slate-900 text-white rounded-xl lg:rounded-2xl text-[10px] lg:text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 lg:gap-3 hover:bg-black shadow-lg transition-all"><Printer className="w-4 h-4 lg:w-5 lg:h-5" /> Imprimer</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-8">
           <div className="bg-white p-6 lg:p-10 border-2 rounded-[2rem] lg:rounded-[3rem] shadow-sm relative overflow-hidden">
             <div className="p-3 lg:p-4 bg-blue-50 text-blue-600 rounded-2xl lg:rounded-3xl w-max mb-4 lg:mb-6"><DollarSign className="w-5 h-5 lg:w-6 lg:h-6" /></div>
             <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dépense Totale du Mois</p>
             <h4 className="text-2xl lg:text-3xl font-black text-slate-900 tabular-nums italic">{monthStats.totalExpense.toLocaleString()} Fc</h4>
           </div>
           <div className="bg-white p-6 lg:p-10 border-2 rounded-[2rem] lg:rounded-[3rem] shadow-sm">
             <div className="p-3 lg:p-4 bg-emerald-50 text-emerald-600 rounded-2xl lg:rounded-3xl w-max mb-4 lg:mb-6"><HardDriveDownload className="w-5 h-5 lg:w-6 lg:h-6" /></div>
             <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Valeur du Stock Résiduel</p>
             <h4 className="text-2xl lg:text-3xl font-black text-slate-900 tabular-nums italic">{monthStats.residualValue.toLocaleString()} Fc</h4>
           </div>
           <div className="bg-white p-6 lg:p-10 border-2 rounded-[2rem] lg:rounded-[3rem] shadow-sm flex flex-col justify-between">
             <div className="p-3 lg:p-4 bg-slate-50 text-slate-600 rounded-2xl lg:rounded-3xl w-max mb-4 lg:mb-6"><Activity className="w-5 h-5 lg:w-6 lg:h-6" /></div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">État de Santé Global</p>
             <div className="flex items-center gap-3 lg:gap-4">
                <div className={`w-10 lg:w-12 h-10 lg:h-12 rounded-full flex items-center justify-center ${globalHealth === 'GREEN' ? 'bg-emerald-500' : globalHealth === 'ORANGE' ? 'bg-amber-500' : 'bg-rose-500'}`}><div className="w-3 lg:w-4 h-3 lg:h-4 bg-white/20 rounded-full animate-pulse" /></div>
                <span className={`text-xs lg:text-sm font-black uppercase italic ${globalHealth === 'GREEN' ? 'text-emerald-600' : globalHealth === 'ORANGE' ? 'text-amber-600' : 'text-rose-600'}`}>{globalHealth === 'GREEN' ? 'Stock Sain' : globalHealth === 'ORANGE' ? 'Vigilance' : 'Alerte Critique'}</span>
             </div>
           </div>
        </div>

        <div className="bg-white border-2 rounded-[2rem] lg:rounded-[3.5rem] shadow-sm overflow-hidden p-6 lg:p-12">
           <h4 className="text-base lg:text-lg font-black uppercase tracking-[0.2em] mb-8 lg:mb-10 flex items-center gap-3 lg:gap-4"><Building2 className="w-5 h-5 text-blue-600" /> Performance par Site</h4>
           <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[500px]">
                <thead><tr className="bg-slate-50 border-b text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest"><th className="px-6 py-4">Site</th><th className="px-4 py-4 text-center">Dépenses</th><th className="px-4 py-4 text-center">Sorties</th><th className="px-4 py-4 text-right">Rupture</th></tr></thead>
                <tbody className="text-xs">{monthStats.siteStats.map((s, i) => (<tr key={i} className="border-b last:border-0 hover:bg-slate-50 transition-colors"><td className="px-6 py-4 lg:py-6 font-black text-slate-900 uppercase">{s.name}</td><td className="px-4 py-4 lg:py-6 text-center font-bold text-slate-600">{s.expense.toLocaleString()} Fc</td><td className="px-4 py-4 lg:py-6 text-center font-black">{s.outputVolume} art.</td><td className="px-4 py-4 lg:py-6 text-right font-black"><span className={`px-2 lg:px-4 py-1 lg:py-2 rounded-full text-[8px] lg:text-[10px] border ${s.ruptureRate > 10 ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>{s.ruptureRate.toFixed(1)}%</span></td></tr>))}</tbody>
              </table>
           </div>
        </div>
      </div>
    );
  };

  const SettingsView = () => (
    <div className="max-w-6xl mx-auto space-y-8 lg:space-y-12 pb-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-12">
        <div className="bg-white border rounded-[1.5rem] lg:rounded-[3rem] p-6 lg:p-12 shadow-sm space-y-6 lg:space-y-8 md:col-span-2">
          <div className="flex items-center gap-4 lg:gap-6"><div className="p-3 lg:p-4 bg-emerald-700 text-white rounded-xl lg:rounded-2xl"><FileDown className="w-6 h-6 lg:w-8 lg:h-8" /></div><div><h3 className="text-xl lg:text-2xl font-black uppercase italic tracking-tighter">Centre d'Exportation</h3><p className="text-[9px] lg:text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Extraire les données et rapports légaux</p></div></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
             <button onClick={() => exportCSV(products, 'SmartStock_Inventaire')} className="p-6 lg:p-8 bg-slate-50 border-2 rounded-[1.5rem] lg:rounded-[2.5rem] flex flex-col items-center gap-3 lg:gap-4 hover:border-emerald-500 hover:bg-white transition-all group">
                <FileSpreadsheet className="w-8 h-8 lg:w-10 lg:h-10 text-emerald-600 group-hover:scale-110 transition-transform" />
                <div className="text-center"><p className="text-[10px] lg:text-xs font-black uppercase">Inventaire (.CSV)</p></div>
             </button>
             <button onClick={() => { setActiveView('monthly_report'); setTimeout(() => window.print(), 500); }} className="p-8 bg-slate-50 border-2 rounded-[1.5rem] lg:rounded-[2.5rem] flex flex-col items-center gap-3 lg:gap-4 hover:border-rose-500 hover:bg-white transition-all group">
                <Printer className="w-8 h-8 lg:w-10 lg:h-10 text-rose-600 group-hover:scale-110 transition-transform" />
                <div className="text-center"><p className="text-[10px] lg:text-xs font-black uppercase">Rapport Global (.PDF)</p></div>
             </button>
             <button onClick={() => exportCSV(products.filter(p=>p.currentStock<=p.minStock), 'SmartStock_Besoins')} className="p-6 lg:p-8 bg-slate-50 border-2 rounded-[1.5rem] lg:rounded-[2.5rem] flex flex-col items-center gap-3 lg:gap-4 hover:border-amber-500 hover:bg-white transition-all group">
                <FileType className="w-8 h-8 lg:w-10 lg:h-10 text-amber-600 group-hover:scale-110 transition-transform" />
                <div className="text-center"><p className="text-[10px] lg:text-xs font-black uppercase">Liste Besoins (.CSV)</p></div>
             </button>
          </div>
        </div>

        <div className="bg-white border rounded-[1.5rem] lg:rounded-[3rem] p-6 lg:p-12 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-4 lg:gap-6 mb-6 lg:mb-8"><div className="p-3 lg:p-4 bg-emerald-700 text-white rounded-xl lg:rounded-2xl"><FileUp className="w-6 h-6 lg:w-8 lg:h-8" /></div><div><h3 className="text-xl lg:text-2xl font-black uppercase italic tracking-tighter">Importation IA</h3></div></div>
          <div className="border-4 border-dashed border-slate-100 rounded-[1.5rem] lg:rounded-[3rem] p-6 lg:p-10 text-center bg-slate-50/30 hover:border-emerald-200 transition-all group relative h-40 lg:h-48 flex flex-col items-center justify-center gap-4">
             <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv, .xlsx, .xls, .txt" className="absolute inset-0 opacity-0 cursor-pointer" disabled={isImportLoading} />
             {isImportLoading ? <Loader2 className="w-8 h-8 lg:w-10 lg:h-10 text-emerald-600 animate-spin" /> : <FileSpreadsheet className="w-8 h-8 lg:w-10 lg:h-10 text-slate-200 group-hover:text-emerald-500 transition-all" />}
             <p className="text-[10px] lg:text-xs font-black text-slate-900 uppercase tracking-tight">{isImportLoading ? "Analyse..." : "Glisser un fichier"}</p>
          </div>
        </div>

        <div className="bg-white border rounded-[1.5rem] lg:rounded-[3rem] p-6 lg:p-12 shadow-sm space-y-6 lg:space-y-8">
          <div className="flex items-center gap-4 lg:gap-6"><div className="p-3 lg:p-4 bg-slate-900 text-white rounded-xl lg:rounded-2xl"><Database className="w-6 h-6 lg:w-8 lg:h-8" /></div><div><h3 className="text-xl lg:text-2xl font-black uppercase italic tracking-tighter">Maintenance</h3></div></div>
          <div className="grid grid-cols-2 gap-3 lg:gap-4">
            <button onClick={handleSystemBackup} className="p-4 lg:p-6 bg-slate-50 rounded-xl lg:rounded-[2rem] border border-slate-200 flex flex-col items-center gap-2 lg:gap-3 hover:bg-white hover:border-blue-400 transition-all"><HardDriveDownload className="w-6 h-6 lg:w-8 lg:h-8 text-blue-600" /><span className="text-[8px] lg:text-[9px] font-black uppercase">Backup</span></button>
            <button onClick={handleGenerateDemo} className="p-4 lg:p-6 bg-slate-50 rounded-xl lg:rounded-[2rem] border border-slate-200 flex flex-col items-center gap-2 lg:gap-3 hover:bg-white hover:border-emerald-400 transition-all"><Sparkles className="w-6 h-6 lg:w-8 lg:h-8 text-emerald-600" /><span className="text-[8px] lg:text-[9px] font-black uppercase">Démo</span></button>
            <button onClick={()=>window.location.reload()} className="p-4 lg:p-6 bg-slate-50 rounded-xl lg:rounded-[2rem] border border-slate-200 flex flex-col items-center gap-2 lg:gap-3 hover:bg-white hover:border-amber-400 transition-all"><RefreshCcw className="w-6 h-6 lg:w-8 lg:h-8 text-amber-600" /><span className="text-[8px] lg:text-[9px] font-black uppercase">Refresh</span></button>
            <button onClick={()=>{if(window.confirm("Tout supprimer ?")){localStorage.clear(); window.location.reload();}}} className="p-4 lg:p-6 bg-rose-50 rounded-xl lg:rounded-[2rem] border border-rose-100 flex flex-col items-center gap-2 lg:gap-3 hover:bg-rose-100 hover:border-rose-300 transition-all"><ShieldAlert className="w-6 h-6 lg:w-8 lg:h-8 text-rose-600" /><span className="text-[8px] lg:text-[9px] font-black uppercase text-rose-700">Reset</span></button>
          </div>
        </div>
      </div>
    </div>
  );

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;

    console.log("Attempting login with:", loginForm.username);
    setIsLoggingIn(true);
    
    // Immediate validation
    if (loginForm.username.trim() === 'admin' && loginForm.password.trim() === 'admin') {
      console.log("Login successful!");
      localStorage.setItem('ss_session', 'active');
      setIsLoggedIn(true);
      showToast("Bienvenue sur SmartStock Pro", "success");
    } else {
      console.warn("Login failed: Invalid credentials");
      showToast("Identifiants incorrects (Défaut: admin/admin)", "error");
    }
    setIsLoggingIn(false);
  };

  if (!isLoggedIn) return (
    <div className="min-h-screen flex bg-[#f8fafc] font-sans overflow-hidden">
      {/* Côté Illustration & Branding */}
      <div className="hidden lg:flex w-7/12 bg-[#004a23] p-24 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500/10 rounded-full -mr-[300px] -mt-[300px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-400/5 rounded-full -ml-[200px] -mb-[200px]" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-6 mb-20 animate-in slide-in-from-left duration-700">
            <div className="bg-emerald-500 p-5 rounded-[2rem] shadow-2xl ring-8 ring-emerald-500/20">
              <FileSpreadsheet className="w-14 h-14 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase">SmartStock<span className="text-emerald-400">Pro</span></h1>
              <p className="text-emerald-400/60 font-black uppercase tracking-[0.4em] text-[10px] mt-2">Enterprise Logisitics Solution</p>
            </div>
          </div>
          <h2 className="text-[5.5rem] font-black text-white leading-[0.9] uppercase italic mb-12 tracking-tighter animate-in slide-in-from-left duration-1000 delay-100">
            Simplifiez.<br/>Analysez.<br/><span className="text-emerald-400">Optimisez.</span>
          </h2>
          <p className="text-emerald-100/60 text-lg font-medium max-w-lg leading-relaxed animate-in slide-in-from-left duration-1000 delay-200">
            L'assistant intelligent qui transforme la gestion complexe de vos inventaires en une expérience fluide et prédictive.
          </p>
        </div>

        <div className="flex gap-12 relative z-10 animate-in fade-in duration-1000 delay-500">
          <div className="bg-white/5 backdrop-blur-2xl p-10 rounded-[3.5rem] flex-1 border border-white/10 hover:bg-white/10 transition-colors group cursor-default">
            <ShieldCheck className="w-12 h-12 text-emerald-400 mb-8 group-hover:scale-110 transition-transform" />
            <p className="text-white text-[13px] font-black uppercase tracking-[0.2em]">Sécurité Bancaire</p>
            <p className="text-white/40 text-[11px] mt-2 font-medium">Chiffrement AES-256 de bout en bout.</p>
          </div>
          <div className="bg-white/5 backdrop-blur-2xl p-10 rounded-[3.5rem] flex-1 border border-white/10 hover:bg-white/10 transition-colors group cursor-default">
            <BarChart3 className="w-12 h-12 text-blue-400 mb-8 group-hover:scale-110 transition-transform" />
            <p className="text-white text-[13px] font-black uppercase tracking-[0.2em]">Intelligence Artificielle</p>
            <p className="text-white/40 text-[11px] mt-2 font-medium">Prédiction des ruptures par Gemini.</p>
          </div>
        </div>
      </div>

      {/* Côté Formulaire */}
      <div className="w-full lg:w-5/12 flex items-center justify-center p-8 lg:p-16 bg-white relative">
         <div className="w-full max-w-md space-y-16">
           <div className="text-center lg:text-left">
             <div className="lg:hidden flex justify-center mb-8">
                <div className="bg-[#004a23] p-4 rounded-3xl shadow-xl"><FileSpreadsheet className="w-10 h-10 text-white" /></div>
             </div>
             <h3 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic">Se connecter</h3>
             <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.4em] mt-6 flex items-center justify-center lg:justify-start gap-3">
               Accès Portail Sécurisé <Info className="w-3 h-3 text-emerald-500" />
             </p>
           </div>

           <form onSubmit={handleLoginSubmit} className="space-y-8">
             <div className="space-y-6">
                {/* Champ Identifiant */}
                <div className="space-y-3 group">
                  <label htmlFor="username" className="block text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Utilisateur</label>
                  <div className="relative">
                    <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                    <input 
                      id="username"
                      type="text" 
                      placeholder="Identifiant (ex: admin)" 
                      autoComplete="username"
                      required
                      value={loginForm.username}
                      onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                      className="w-full pl-16 pr-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] outline-none font-bold text-slate-950 placeholder:text-slate-400 text-lg focus:border-emerald-500 focus:bg-white focus:ring-8 focus:ring-emerald-50 transition-all" 
                    />
                  </div>
                </div>

                {/* Champ Mot de passe */}
                <div className="space-y-3 group">
                  <label htmlFor="password" className="block text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Mot de passe</label>
                  <div className="relative">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                    <input 
                      id="password"
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      autoComplete="current-password"
                      required
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                      className="w-full pl-16 pr-20 py-6 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] outline-none font-bold text-slate-950 placeholder:text-slate-400 text-lg focus:border-emerald-500 focus:bg-white focus:ring-8 focus:ring-emerald-50 transition-all" 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
             </div>

             <div className="flex items-center justify-between px-2">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div className="relative">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-6 h-6 bg-slate-200 rounded-lg peer-checked:bg-emerald-600 transition-colors" />
                    <CheckCircle className="absolute inset-0 w-6 h-6 text-white opacity-0 peer-checked:opacity-100 transition-opacity p-1" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Rester connecté</span>
                </label>
                <button type="button" className="text-[11px] font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-700 hover:underline transition-all">Code oublié ?</button>
             </div>

             <button 
               type="submit" 
               disabled={isLoggingIn}
               aria-busy={isLoggingIn}
               className="w-full bg-[#107c41] text-white py-7 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.4em] shadow-2xl shadow-emerald-200 hover:-translate-y-2 active:scale-95 disabled:opacity-70 disabled:pointer-events-none hover:bg-emerald-800 transition-all flex items-center justify-center gap-4 group"
             >
               {isLoggingIn ? (
                 <Loader2 className="w-6 h-6 animate-spin" />
               ) : (
                 <>Connexion <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" /></>
               )}
             </button>

             <p className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                Support technique: +243 00 000 000
             </p>
           </form>
         </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f1f3f4] flex text-slate-900 font-sans">
      <aside className={`fixed inset-y-0 left-0 z-[100] w-72 sm:w-80 bg-[#004a23] text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out no-print lg:translate-x-0 lg:left-6 lg:inset-y-6 lg:rounded-[3.5rem] ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-10 lg:p-12 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="bg-emerald-500 p-2 lg:p-3 rounded-xl lg:rounded-2xl"><FileSpreadsheet className="w-5 h-5 lg:w-7 lg:h-7" /></div>
            <h1 className="text-xl lg:text-2xl font-black tracking-tighter uppercase italic leading-none">SmartStock<span className="text-emerald-400">Pro</span></h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-white/50 hover:text-white"><X className="w-6 h-6" /></button>
        </div>
        <nav className="flex-1 px-6 lg:px-8 py-8 lg:py-12 lg:space-y-3 space-y-2 overflow-y-auto custom-scrollbar">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'inventory', label: 'Stocks Actifs', icon: FileSpreadsheet },
            { id: 'replenishment', label: 'Besoins', icon: Calculator },
            { id: 'monthly_report', label: 'Rapport Mensuel', icon: FileText },
            { id: 'history', label: 'Journal Audit', icon: HistoryIcon },
            { id: 'settings', label: 'Paramètres', icon: SettingsIcon },
          ].map(item => (
            <button key={item.id} onClick={() => { setActiveView(item.id as ViewType); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 lg:gap-5 px-6 lg:px-8 py-4 lg:py-6 rounded-2xl lg:rounded-[2.5rem] text-[9px] lg:text-[11px] font-black uppercase tracking-[0.2em] lg:tracking-[0.25em] transition-all ${activeView === item.id ? 'bg-white text-[#004a23] shadow-xl scale-105' : 'text-emerald-100/40 hover:bg-white/5 hover:text-white'}`}><item.icon className="w-4 h-4 lg:w-5 lg:h-5" /> {item.label}</button>
          ))}
        </nav>
        <div className="p-8 lg:p-10 border-t border-white/5"><button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 lg:gap-4 px-6 lg:px-8 py-4 lg:py-5 rounded-xl lg:rounded-[2rem] bg-rose-500 text-white text-[9px] lg:text-[11px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all">Déconnexion</button></div>
      </aside>

      <main className={`flex-1 flex flex-col min-h-screen transition-all duration-300 lg:ml-[22rem] xl:ml-[24rem] p-6 lg:p-16 print:m-0 print:p-0`}>
        <header className="flex justify-between items-center mb-8 lg:mb-16 border-b border-slate-200 pb-8 lg:pb-12 no-print">
           <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 bg-white border border-slate-200 rounded-xl text-slate-900 shadow-sm"><Menu className="w-6 h-6" /></button>
             <div><h2 className="text-2xl lg:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">{activeView.replace('_', ' ')}</h2><p className="hidden sm:block text-[9px] lg:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 lg:mt-4">Enterprise v3.5 • Session Active</p></div>
           </div>
           <div className="flex gap-3 lg:gap-5">
             <button onClick={()=>window.location.reload()} className="p-3 lg:p-5 bg-white border border-slate-200 rounded-xl lg:rounded-[2rem] text-slate-400 hover:text-emerald-700 transition-all shadow-md"><RefreshCcw className="w-5 h-5 lg:w-7 lg:h-7" /></button>
             <div className="hidden sm:flex items-center gap-3 lg:gap-4 bg-white border border-slate-200 p-2 lg:p-3 pr-6 lg:pr-8 rounded-xl lg:rounded-[2rem] shadow-md">
               <div className="w-8 lg:w-12 h-8 lg:h-12 bg-[#004a23] rounded-lg lg:rounded-2xl flex items-center justify-center text-white font-black text-xs lg:text-sm">AD</div>
               <div className="flex flex-col"><span className="text-[9px] lg:text-[10px] font-black uppercase text-slate-900 leading-tight">ADMIN</span><span className="text-[8px] lg:text-[9px] font-bold text-slate-400">CONNECTÉ</span></div>
             </div>
           </div>
        </header>

        <section className="flex-1 animate-in fade-in duration-700">
          {activeView === 'dashboard' && <DashboardView />}
          {activeView === 'inventory' && <InventoryView />}
          {activeView === 'replenishment' && <ReplenishmentView />}
          {activeView === 'monthly_report' && <MonthlyReportView />}
          {activeView === 'history' && <div className="p-12 lg:p-20 text-center bg-white rounded-[2rem] lg:rounded-[3rem] border shadow-sm"><HistoryIcon className="w-12 h-12 lg:w-16 lg:h-16 text-slate-100 mx-auto mb-6" /><p className="text-[10px] lg:text-sm font-black text-slate-300 uppercase tracking-widest">Journal d'audit disponible dans les archives</p></div>}
          {activeView === 'settings' && <SettingsView />}
        </section>
      </main>

      {/* Modal Produit Rapide */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 lg:p-8 no-print">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={() => setIsProductModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-[2rem] lg:rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 lg:p-12 bg-[#004a23] text-white flex justify-between items-center"><h3 className="text-lg lg:text-xl font-black uppercase italic">{editingProduct ? 'Modification' : 'Nouvel Article'}</h3><button onClick={() => setIsProductModalOpen(false)} className="p-3 lg:p-4 bg-white/10 rounded-2xl lg:rounded-3xl"><X className="w-5 h-5 lg:w-7 lg:h-7" /></button></div>
            <form onSubmit={(e) => { e.preventDefault(); if(editingProduct) { setProducts(prev => prev.map(p => p.id === editingProduct.id ? {...p, ...formData} as Product : p)); showToast(`Mise à jour effectuée`, "success"); } else { setProducts(prev => [...prev, { ...formData, id: Date.now().toString(), currentStock: 0, minStock: Number(formData.minStock), monthlyNeed: Number(formData.monthlyNeed) } as Product]); showToast(`Article enregistré`, "success"); } setIsProductModalOpen(false); }} className="p-8 lg:p-12 space-y-6 lg:space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-8">
                <div className="sm:col-span-2 space-y-2"><label className="text-[10px] lg:text-[11px] font-black text-slate-400 uppercase tracking-widest">Désignation</label><input required value={formData.name || ''} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full p-4 lg:p-6 bg-slate-50 border rounded-2xl lg:rounded-3xl outline-none font-bold focus:border-emerald-600 transition-all" /></div>
                <div className="space-y-2"><label className="text-[10px] lg:text-[11px] font-black text-slate-400 uppercase tracking-widest">Min. Seuil</label><input type="number" required value={formData.minStock || ''} onChange={e=>setFormData({...formData, minStock: Number(e.target.value)})} className="w-full p-4 lg:p-6 bg-slate-50 border rounded-2xl lg:rounded-3xl outline-none font-bold focus:border-emerald-600 transition-all" /></div>
                <div className="space-y-2"><label className="text-[10px] lg:text-[11px] font-black text-slate-400 uppercase tracking-widest">Mensuel</label><input type="number" required value={formData.monthlyNeed || ''} onChange={e=>setFormData({...formData, monthlyNeed: Number(e.target.value)})} className="w-full p-4 lg:p-6 bg-slate-50 border rounded-2xl lg:rounded-3xl outline-none font-bold focus:border-emerald-600 transition-all" /></div>
                <div className="space-y-2"><label className="text-[10px] lg:text-[11px] font-black text-slate-400 uppercase tracking-widest">P.U.</label><input type="number" step="0.01" required value={formData.unitPrice || ''} onChange={e=>setFormData({...formData, unitPrice: Number(e.target.value)})} className="w-full p-4 lg:p-6 bg-slate-50 border rounded-2xl lg:rounded-3xl outline-none font-bold focus:border-emerald-600 transition-all" /></div>
                <div className="space-y-2"><label className="text-[10px] lg:text-[11px] font-black text-slate-400 uppercase tracking-widest">Unité</label><input required value={formData.unit || ''} onChange={e=>setFormData({...formData, unit: e.target.value})} className="w-full p-4 lg:p-6 bg-slate-50 border rounded-2xl lg:rounded-3xl outline-none font-bold focus:border-emerald-600 transition-all" /></div>
              </div>
              <button className="w-full py-5 lg:py-7 bg-emerald-700 text-white rounded-[2rem] lg:rounded-[3rem] font-black uppercase text-[10px] lg:text-xs tracking-[0.3em] lg:tracking-[0.4em] shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3"><Save className="w-5 h-5" /> Enregistrer</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Déconnexion - Confirmation Claire */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 lg:p-8 no-print">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl transition-all" onClick={() => setIsLogoutModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-[2.5rem] lg:rounded-[3.5rem] shadow-2xl overflow-hidden animate-modal p-10 lg:p-14 text-center">
            <div className="p-6 bg-rose-50 text-rose-500 rounded-full w-max mx-auto mb-8 ring-4 ring-rose-100"><LogOut className="w-10 h-10 lg:w-12 lg:h-12" /></div>
            <h3 className="text-2xl lg:text-3xl font-black uppercase italic tracking-tighter text-slate-900 mb-4">Confirmer la sortie ?</h3>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-12 italic">Toutes vos modifications non sauvegardées pourraient être perdues.</p>
            <div className="flex flex-col gap-4">
               <button onClick={confirmLogout} className="w-full py-5 lg:py-6 bg-rose-600 text-white rounded-2xl lg:rounded-3xl font-black uppercase text-[10px] lg:text-xs tracking-[0.2em] shadow-xl hover:bg-rose-700 hover:scale-[1.02] transition-all">Oui, me déconnecter</button>
               <button onClick={() => setIsLogoutModalOpen(false)} className="w-full py-5 lg:py-6 bg-slate-100 text-slate-500 rounded-2xl lg:rounded-3xl font-black uppercase text-[10px] lg:text-xs tracking-[0.2em] hover:bg-slate-200 transition-all">Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Toast */}
      {notification && (
        <div className={`fixed bottom-8 right-8 z-[300] p-6 rounded-[2rem] shadow-2xl flex items-center gap-4 animate-in slide-in-from-right-10 duration-500 bg-white border-2 ${notification.type === 'error' ? 'border-rose-200' : 'border-emerald-200'}`}>
           <div className={`p-2 rounded-full ${notification.type === 'error' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
             {notification.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
           </div>
           <p className="text-xs font-black uppercase text-slate-800 italic">{notification.message}</p>
        </div>
      )}

      <style>{`
        @media print { 
          .no-print, header, aside, button, footer { display: none !important; } 
          main { margin: 0 !important; padding: 0 !important; width: 100% !important; background: white !important; } 
          body { background: white !important; } 
          .bg-white, .bg-slate-50 { border-color: #e2e8f0 !important; box-shadow: none !important; } 
          tr { page-break-inside: avoid; } 
        }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;
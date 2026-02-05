
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, Package, History as HistoryIcon, Plus, AlertTriangle, 
  Trash2, Search, Activity, X, Save, Calculator, FileSpreadsheet, 
  DollarSign, Settings as SettingsIcon, Building2, Edit2, Printer, 
  Home, Armchair, TrendingUp, Download, Filter, Menu as MenuIcon, LogOut, ArrowRight,
  ShieldCheck, ArrowUpDown, ChevronDown, CheckCircle, Info, PieChart as PieChartIcon,
  LineChart as LineChartIcon, BarChart3, Tag, Sparkles, RefreshCcw, Archive, FileUp, Loader2,
  Database, Truck, ShieldAlert, Globe, HardDriveDownload, RotateCcw, Cpu, FileText, UserCheck, TrendingDown,
  FileDown, FileType
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
    if (saved('ss_session')) setIsLoggedIn(true);
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

  // --- ACTIONS SYSTEME ---

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

  // --- VUES ---

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
      <div className="space-y-12 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          {[
            { label: 'Valeur Inventaire', val: totalValue.toLocaleString() + ' Fc', icon: DollarSign, color: 'emerald' },
            { label: 'En Rupture', val: products.filter(p=>p.currentStock===0).length + ' Réf.', icon: AlertTriangle, color: 'rose' },
            { label: 'Alertes Seuil', val: products.filter(p=>p.currentStock<=p.minStock && p.currentStock>0).length + ' Réf.', icon: TrendingUp, color: 'amber' },
            { label: 'Catalogue', val: products.length + ' Pdt.', icon: Package, color: 'slate' }
          ].map((c, i) => (
            <div key={i} className="bg-white p-10 border rounded-[3rem] shadow-sm group hover:-translate-y-2 transition-all">
              <div className={`p-4 bg-${c.color}-50 text-${c.color}-600 rounded-3xl w-max mb-8`}><c.icon className="w-8 h-8" /></div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">{c.label}</p>
              <h4 className="text-4xl font-black text-slate-900 tracking-tight italic tabular-nums">{c.val}</h4>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="bg-white p-12 border rounded-[3.5rem] shadow-sm">
             <h3 className="text-lg font-black uppercase tracking-[0.25em] mb-12 flex items-center gap-4"><PieChartIcon className="w-5 h-5 text-emerald-600" /> Structure Fiscale</h3>
             <div className="h-[400px] w-full flex flex-col sm:flex-row items-center gap-8">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryValueData} cx="50%" cy="50%" innerRadius={90} outerRadius={140} paddingAngle={4} dataKey="value">
                      {categoryValueData.map((_, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="none" />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-full sm:w-1/2 space-y-3">
                   {categoryValueData.map((d, i) => (
                     <div key={i} className="flex justify-between p-4 bg-slate-50 rounded-2xl border hover:border-emerald-100 transition-all">
                        <span className="text-[11px] font-black uppercase text-slate-700">{d.name}</span>
                        <span className="text-[11px] font-black text-slate-900">{d.value.toLocaleString()} Fc</span>
                     </div>
                   ))}
                </div>
             </div>
          </div>

          <div className="bg-white p-12 border rounded-[3.5rem] shadow-sm">
             <h3 className="text-lg font-black uppercase tracking-[0.25em] mb-12 flex items-center gap-4"><LineChartIcon className="w-5 h-5 text-blue-600" /> Performance & Intensité</h3>
             <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={combinedTimelineData}>
                    <defs><linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2b579a" stopOpacity={0.1}/><stop offset="95%" stopColor="#2b579a" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{fontSize: 10, fontWeight: 800}} axisLine={false} tickLine={false} dy={10} />
                    <YAxis yAxisId="left" tick={{fontSize: 10, fontWeight: 800}} axisLine={false} tickLine={false} dx={-10} />
                    <YAxis yAxisId="right" orientation="right" tick={{fontSize: 10, fontWeight: 800}} axisLine={false} tickLine={false} dx={10} />
                    <Tooltip />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 'bold'}} />
                    <Area yAxisId="left" name="Valeur Stock" dataKey="stockValue" stroke="#2b579a" strokeWidth={4} fill="url(#colorStock)" />
                    <Bar yAxisId="right" name="Intensité Flux" dataKey="turnover" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={25} />
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
      <div className="bg-white p-6 border rounded-[2.5rem] shadow-sm space-y-6 no-print">
        <div className="flex flex-col xl:flex-row gap-6 items-center justify-between">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Filtrer l'inventaire..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-emerald-500 transition-all font-bold" />
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => window.print()} className="px-6 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-black transition-all shadow-lg"><Printer className="w-5 h-5" /> Imprimer</button>
            <button onClick={() => exportCSV(products, 'SmartStock_Inventaire')} className="px-6 py-4 bg-emerald-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-emerald-800 shadow-lg transition-all"><Download className="w-5 h-5" /> CSV</button>
            <button onClick={() => { setEditingProduct(null); setFormData({ currency: 'Fc', siteId: sites[0].id }); setIsProductModalOpen(true); }} className="px-6 py-4 bg-white border-2 border-slate-200 text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-slate-50 transition-all"><Plus className="w-4 h-4" /> Nouveau</button>
          </div>
        </div>
      </div>
      <div className="bg-white border rounded-[3rem] overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b">
              <th className="px-10 py-6">Désignation</th>
              <th className="px-6 py-6 text-center">Stock</th>
              <th className="px-6 py-6 text-center">P.U.</th>
              <th className="px-6 py-6 text-center">Valeur</th>
              <th className="px-10 py-6 text-right no-print">Actions</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {filteredAndSortedProducts.map(p => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-slate-50/70 transition-colors">
                <td className="px-10 py-6 font-black text-slate-900 uppercase text-sm">{p.name} <span className="text-[9px] text-emerald-600 block">{p.category}</span></td>
                <td className="px-6 py-6 text-center font-black text-base">{p.currentStock} <span className="text-[9px] text-slate-400">{p.unit}</span></td>
                <td className="px-6 py-6 text-center font-bold text-slate-600">{p.unitPrice.toLocaleString()} {p.currency}</td>
                <td className="px-6 py-6 text-center font-black">{(p.currentStock * p.unitPrice).toLocaleString()} {p.currency}</td>
                <td className="px-10 py-6 text-right no-print">
                  <button onClick={()=>{setEditingProduct(p); setFormData(p); setIsProductModalOpen(true);}} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl mr-2"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={()=>setProducts(products.filter(item=>item.id!==p.id))} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const ReplenishmentView = () => {
    const need = products.filter(p => p.currentStock <= p.minStock);
    return (
      <div className="space-y-8 pb-24">
        <div className="bg-white p-12 border rounded-[3.5rem] shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="flex items-center gap-6">
              <div className="p-4 bg-emerald-600 text-white rounded-3xl"><Calculator className="w-8 h-8" /></div>
              <div><h3 className="text-2xl font-black uppercase italic tracking-tighter">Besoins Critiques</h3><p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">{need.length} références à réapprovisionner</p></div>
           </div>
           <button onClick={handleFetchAiInsights} disabled={isAiLoading} className="px-10 py-5 bg-slate-900 text-white rounded-3xl font-black uppercase text-[11px] flex items-center gap-4 hover:bg-black transition-all disabled:opacity-50 shadow-2xl">
              {isAiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-emerald-400" />} Diagnostic IA Logistique
           </button>
        </div>
        {aiInsights && <div className="p-12 bg-slate-900 text-slate-100 rounded-[3.5rem] shadow-2xl animate-in zoom-in duration-500 italic text-sm leading-relaxed whitespace-pre-wrap"><Sparkles className="w-6 h-6 text-emerald-400 mb-6" />{aiInsights}</div>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {need.map(p => (
             <div key={p.id} className="p-10 bg-white border-2 border-rose-100 rounded-[3rem] shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
                <h4 className="font-black text-slate-900 uppercase tracking-tight text-lg mb-4 relative z-10">{p.name}</h4>
                <div className="flex justify-between items-end relative z-10">
                   <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">À commander</p><p className="text-3xl font-black text-rose-600">{p.monthlyNeed - p.currentStock} <span className="text-xs">{p.unit}</span></p></div>
                   <div className="text-right font-bold text-slate-400 italic text-xs">Seuil: {p.minStock}</div>
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

      const consumption: Record<string, number> = {};
      logs.filter(l => l.type === 'exit').forEach(l => {
        consumption[l.productName] = (consumption[l.productName] || 0) + Math.abs(l.changeAmount);
      });
      const topConsumption = Object.entries(consumption)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      const losses: Record<string, number> = {};
      logs.filter(l => l.type === 'adjustment' && l.changeAmount < 0).forEach(l => {
        const p = products.find(prod => prod.id === l.productId);
        losses[l.productName] = (losses[l.productName] || 0) + (Math.abs(l.changeAmount) * (p ? p.unitPrice : 0));
      });
      const topLosses = Object.entries(losses)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

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

      return { totalExpense, residualValue, topConsumption, topLosses, siteStats };
    }, [history, products, sites, currentMonth, currentYear]);

    const globalHealth = useMemo(() => {
      const ruptures = products.filter(p => p.currentStock === 0).length;
      const alerts = products.filter(p => p.currentStock <= p.minStock && p.currentStock > 0).length;
      if (ruptures > 0) return 'RED';
      if (alerts > 0) return 'ORANGE';
      return 'GREEN';
    }, [products]);

    return (
      <div className="space-y-12 pb-24 max-w-5xl mx-auto print:p-0 print:m-0">
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

        <div className="flex justify-between items-center no-print mb-8">
           <h3 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-4"><FileText className="w-8 h-8 text-emerald-600" /> Structure du Rapport Automatisé</h3>
           <button onClick={() => window.print()} className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-black shadow-lg transition-all"><Printer className="w-5 h-5" /> Générer PDF / Imprimer</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="bg-white p-10 border-2 rounded-[3rem] shadow-sm relative overflow-hidden">
             <div className="p-4 bg-blue-50 text-blue-600 rounded-3xl w-max mb-6"><DollarSign className="w-6 h-6" /></div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dépense Totale du Mois</p>
             <h4 className="text-3xl font-black text-slate-900 tabular-nums italic">{monthStats.totalExpense.toLocaleString()} Fc</h4>
             <div className="mt-4 flex items-center gap-2 text-rose-500 font-bold text-xs uppercase"><TrendingUp className="w-4 h-4" /> 12% vs mois préc.</div>
           </div>
           <div className="bg-white p-10 border-2 rounded-[3rem] shadow-sm">
             <div className="p-4 bg-emerald-50 text-emerald-600 rounded-3xl w-max mb-6"><HardDriveDownload className="w-6 h-6" /></div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Valeur du Stock Résiduel</p>
             <h4 className="text-3xl font-black text-slate-900 tabular-nums italic">{monthStats.residualValue.toLocaleString()} Fc</h4>
             <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase italic">Actif immobilisé en magasin</p>
           </div>
           <div className="bg-white p-10 border-2 rounded-[3rem] shadow-sm flex flex-col justify-between">
             <div className="p-4 bg-slate-50 text-slate-600 rounded-3xl w-max mb-6"><Activity className="w-6 h-6" /></div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">État de Santé Global</p>
             <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full shadow-inner flex items-center justify-center ${globalHealth === 'GREEN' ? 'bg-emerald-500' : globalHealth === 'ORANGE' ? 'bg-amber-500' : 'bg-rose-500'}`}><div className="w-4 h-4 bg-white/20 rounded-full animate-pulse" /></div>
                <span className={`text-sm font-black uppercase italic ${globalHealth === 'GREEN' ? 'text-emerald-600' : globalHealth === 'ORANGE' ? 'text-amber-600' : 'text-rose-600'}`}>{globalHealth === 'GREEN' ? 'Stock Sain' : globalHealth === 'ORANGE' ? 'Vigilance' : 'Alerte Critique'}</span>
             </div>
           </div>
        </div>

        <div className="bg-white border-2 rounded-[3.5rem] shadow-sm overflow-hidden p-12">
           <h4 className="text-lg font-black uppercase tracking-[0.25em] mb-10 flex items-center gap-4"><Building2 className="w-5 h-5 text-blue-600" /> Performance par Site (Comparatif)</h4>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="bg-slate-50 border-b text-[10px] font-black text-slate-400 uppercase tracking-widest"><th className="px-8 py-4">Site</th><th className="px-6 py-4 text-center">Total Dépenses</th><th className="px-6 py-4 text-center">Volume Sorties</th><th className="px-6 py-4 text-right">Taux de Rupture</th></tr></thead>
                <tbody className="text-xs">{monthStats.siteStats.map((s, i) => (<tr key={i} className="border-b last:border-0 hover:bg-slate-50 transition-colors"><td className="px-8 py-6 font-black text-slate-900 uppercase">{s.name}</td><td className="px-6 py-6 text-center font-bold text-slate-600">{s.expense.toLocaleString()} Fc</td><td className="px-6 py-6 text-center font-black">{s.outputVolume} articles</td><td className="px-6 py-6 text-right font-black"><span className={`px-4 py-2 rounded-full text-[10px] border-2 ${s.ruptureRate > 10 ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>{s.ruptureRate.toFixed(1)}% {s.ruptureRate > 10 ? '(Alerte)' : ''}</span></td></tr>))}</tbody>
              </table>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-white border-2 rounded-[3.5rem] shadow-sm p-12">
              <h4 className="text-md font-black uppercase tracking-widest mb-10 flex items-center gap-4"><TrendingUp className="w-5 h-5 text-emerald-600" /> Les Plus Consommés</h4>
              <div className="space-y-6">{monthStats.topConsumption.map(([name, qty], i) => (<div key={i} className="flex flex-col gap-2"><div className="flex justify-between text-[11px] font-black uppercase italic"><span className="text-slate-900">{name}</span><span className="text-emerald-600">{qty} unités</span></div><div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(qty / monthStats.topConsumption[0][1]) * 100}%` }} /></div></div>))}</div>
           </div>
           <div className="bg-white border-2 rounded-[3.5rem] shadow-sm p-12">
              <h4 className="text-md font-black uppercase tracking-widest mb-10 flex items-center gap-4"><TrendingDown className="w-5 h-5 text-rose-600" /> Les Plus Grosses Pertes</h4>
              <div className="space-y-6">{monthStats.topLosses.map(([name, val], i) => (<div key={i} className="flex flex-col gap-2"><div className="flex justify-between text-[11px] font-black uppercase italic"><span className="text-slate-900">{name}</span><span className="text-rose-600">{val.toLocaleString()} Fc</span></div><div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-rose-500 rounded-full" style={{ width: `${(val / (monthStats.topLosses[0]?.[1] || 1)) * 100}%` }} /></div></div>))}</div>
           </div>
        </div>

        <div className="hidden print:grid grid-cols-2 gap-20 pt-24 mt-24">
           <div className="border-t-2 border-slate-900 pt-8 text-center"><p className="text-xs font-black uppercase tracking-widest">Le Responsable Stock</p><div className="h-24" /><p className="text-[10px] font-bold text-slate-400">Signature & Cachet</p></div>
           <div className="border-t-2 border-slate-900 pt-8 text-center"><p className="text-xs font-black uppercase tracking-widest">Le Directeur Logistique</p><div className="h-24" /><p className="text-[10px] font-bold text-slate-400">Signature & Cachet</p></div>
        </div>
      </div>
    );
  };

  const SettingsView = () => {
    const [newSup, setNewSup] = useState('');
    return (
      <div className="max-w-6xl mx-auto space-y-12 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Section Centre d'Exportation */}
          <div className="bg-white border rounded-[3rem] p-12 shadow-sm space-y-8 md:col-span-2">
            <div className="flex items-center gap-6"><div className="p-4 bg-emerald-700 text-white rounded-2xl"><FileDown className="w-8 h-8" /></div><div><h3 className="text-2xl font-black uppercase italic tracking-tighter">Centre d'Exportation</h3><p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Extraire les données et rapports légaux</p></div></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
               <button onClick={() => exportCSV(products, 'SmartStock_Inventaire')} className="p-8 bg-slate-50 border-2 rounded-[2.5rem] flex flex-col items-center gap-4 hover:border-emerald-500 hover:bg-white transition-all group">
                  <FileSpreadsheet className="w-10 h-10 text-emerald-600 group-hover:scale-110 transition-transform" />
                  <div className="text-center"><p className="text-xs font-black uppercase">Inventaire (.CSV)</p><p className="text-[9px] font-bold text-slate-400">Tableau Excel exploitable</p></div>
               </button>
               <button onClick={() => { setActiveView('monthly_report'); setTimeout(() => window.print(), 500); }} className="p-8 bg-slate-50 border-2 rounded-[2.5rem] flex flex-col items-center gap-4 hover:border-rose-500 hover:bg-white transition-all group">
                  <Printer className="w-10 h-10 text-rose-600 group-hover:scale-110 transition-transform" />
                  <div className="text-center"><p className="text-xs font-black uppercase">Rapport Global (.PDF)</p><p className="text-[9px] font-bold text-slate-400">Synthèse mensuelle imprimable</p></div>
               </button>
               <button onClick={() => exportCSV(products.filter(p=>p.currentStock<=p.minStock), 'SmartStock_Besoins')} className="p-8 bg-slate-50 border-2 rounded-[2.5rem] flex flex-col items-center gap-4 hover:border-amber-500 hover:bg-white transition-all group">
                  <FileType className="w-10 h-10 text-amber-600 group-hover:scale-110 transition-transform" />
                  <div className="text-center"><p className="text-xs font-black uppercase">Liste Besoins (.CSV)</p><p className="text-[9px] font-bold text-slate-400">Articles sous seuil critique</p></div>
               </button>
            </div>
          </div>

          <div className="bg-white border rounded-[3rem] p-12 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-6 mb-8"><div className="p-4 bg-emerald-700 text-white rounded-2xl"><FileUp className="w-8 h-8" /></div><div><h3 className="text-2xl font-black uppercase italic tracking-tighter">Importation IA</h3><p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Excel/CSV structuré par Gemini</p></div></div>
            <div className="border-4 border-dashed border-slate-100 rounded-[3rem] p-10 text-center bg-slate-50/30 hover:border-emerald-200 transition-all group relative h-48 flex flex-col items-center justify-center gap-4">
               <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv, .xlsx, .xls, .txt" className="absolute inset-0 opacity-0 cursor-pointer" disabled={isImportLoading} />
               {isImportLoading ? <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" /> : <FileSpreadsheet className="w-10 h-10 text-slate-200 group-hover:text-emerald-500 transition-all" />}
               <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{isImportLoading ? "Analyse IA..." : "Cliquez pour Importer"}</p>
            </div>
          </div>

          <div className="bg-white border rounded-[3rem] p-12 shadow-sm space-y-8">
            <div className="flex items-center gap-6"><div className="p-4 bg-slate-900 text-white rounded-2xl"><Database className="w-8 h-8" /></div><div><h3 className="text-2xl font-black uppercase italic tracking-tighter">Maintenance</h3><p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Actions critiques Enterprise</p></div></div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={handleSystemBackup} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200 flex flex-col items-center gap-3 hover:bg-white hover:border-blue-400 transition-all"><HardDriveDownload className="w-8 h-8 text-blue-600" /><span className="text-[9px] font-black uppercase">Backup JSON</span></button>
              <button onClick={handleGenerateDemo} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200 flex flex-col items-center gap-3 hover:bg-white hover:border-emerald-400 transition-all"><Sparkles className="w-8 h-8 text-emerald-600" /><span className="text-[9px] font-black uppercase">Générer Démo</span></button>
              <button onClick={()=>window.location.reload()} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200 flex flex-col items-center gap-3 hover:bg-white hover:border-amber-400 transition-all"><RotateCcw className="w-8 h-8 text-amber-600" /><span className="text-[9px] font-black uppercase">Re-calcul</span></button>
              <button onClick={()=>{if(window.confirm("Tout supprimer ?")){localStorage.clear(); window.location.reload();}}} className="p-6 bg-rose-50 rounded-[2rem] border border-rose-100 flex flex-col items-center gap-3 hover:bg-rose-100 hover:border-rose-300 transition-all"><ShieldAlert className="w-8 h-8 text-rose-600" /><span className="text-[9px] font-black uppercase text-rose-700">Factory Reset</span></button>
            </div>
          </div>
          {/* Section Fournisseurs */}
          <div className="bg-white border rounded-[3rem] p-12 shadow-sm space-y-8 lg:col-span-2">
            <div className="flex items-center gap-6"><div className="p-4 bg-slate-900 text-white rounded-2xl"><Truck className="w-8 h-8" /></div><div><h3 className="text-2xl font-black uppercase italic tracking-tighter">Fournisseurs Partenaires</h3><p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Répertoire logistique global</p></div></div>
            <div className="flex flex-wrap gap-4">
              {suppliers.map((s, i) => ( <div key={i} className="flex items-center gap-4 px-8 py-4 bg-slate-50 border rounded-3xl font-black uppercase text-[10px] text-slate-800">{s}<button onClick={()=>setSuppliers(p=>p.filter(x=>x!==s))} className="text-rose-300 hover:text-rose-600"><X className="w-4 h-4" /></button></div> ))}
              <div className="flex-1 flex gap-2"><input value={newSup} onChange={e=>setNewSup(e.target.value)} placeholder="Nouveau partenaire..." className="flex-1 p-4 bg-slate-50 border rounded-2xl outline-none font-bold text-xs" /><button onClick={()=>{if(newSup){setSuppliers([...suppliers, newSup]); setNewSup('');}}} className="px-8 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px]">Ajouter</button></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isLoggedIn) return (
    <div className="min-h-screen flex bg-white font-sans overflow-hidden">
      <div className="hidden lg:flex w-1/2 bg-[#004a23] p-24 flex-col justify-between">
        <div><div className="flex items-center gap-5 mb-16"><div className="bg-emerald-500 p-4 rounded-3xl"><FileSpreadsheet className="w-12 h-12 text-white" /></div><h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">SmartStock<span className="text-emerald-400">Pro</span></h1></div><h2 className="text-7xl font-black text-white leading-tight uppercase italic mb-10">Maitrisez<br/>vos flux de<br/><span className="text-emerald-400">A à Z.</span></h2></div>
        <div className="flex gap-8"><div className="bg-white/10 backdrop-blur-xl p-8 rounded-[3rem] flex-1"><ShieldCheck className="w-10 h-10 text-emerald-400 mb-6" /><p className="text-white text-[12px] font-black uppercase tracking-widest">Sécurité Pro</p></div><div className="bg-white/10 backdrop-blur-xl p-8 rounded-[3rem] flex-1"><BarChart3 className="w-10 h-10 text-blue-400 mb-6" /><p className="text-white text-[12px] font-black uppercase tracking-widest">Analyses IA</p></div></div>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-12 bg-slate-50">
         <form onSubmit={e=>{e.preventDefault(); setIsLoggedIn(true); localStorage.setItem('ss_session', 'active');}} className="w-full max-w-sm space-y-16 text-center">
           <div><h3 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic">Connexion</h3><p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.4em] mt-5">Authentification SmartStock</p></div>
           <div className="space-y-6"><input type="text" placeholder="Identifiant" className="w-full p-6 bg-white border border-slate-200 rounded-[2.5rem] outline-none font-bold" defaultValue="admin" /><input type="password" placeholder="Clé d'Accès" className="w-full p-6 bg-white border border-slate-200 rounded-[2.5rem] outline-none font-bold" defaultValue="admin" /><button className="w-full bg-[#107c41] text-white py-7 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:-translate-y-1 transition-all">Lancer l'Application</button></div>
         </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f1f3f4] flex text-slate-900 font-sans">
      <aside className="fixed inset-y-6 left-6 z-[60] w-80 bg-[#004a23] text-white flex flex-col shadow-2xl rounded-[3.5rem] border border-white/10 no-print">
        <div className="p-12 border-b border-white/5 flex items-center gap-4"><div className="bg-emerald-500 p-3 rounded-2xl"><FileSpreadsheet className="w-7 h-7" /></div><h1 className="text-2xl font-black tracking-tighter uppercase italic leading-none">SmartStock<span className="text-emerald-400">Pro</span></h1></div>
        <nav className="flex-1 px-8 py-12 space-y-3 overflow-y-auto custom-scrollbar">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'inventory', label: 'Stocks Actifs', icon: FileSpreadsheet },
            { id: 'replenishment', label: 'Besoins', icon: Calculator },
            { id: 'monthly_report', label: 'Rapport Mensuel', icon: FileText },
            { id: 'history', label: 'Journal Audit', icon: HistoryIcon },
            { id: 'settings', label: 'Paramètres', icon: SettingsIcon },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveView(item.id as ViewType)} className={`w-full flex items-center gap-5 px-8 py-6 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.25em] transition-all ${activeView === item.id ? 'bg-white text-[#004a23] shadow-2xl scale-105' : 'text-emerald-100/40 hover:bg-white/5 hover:text-white'}`}><item.icon className="w-5 h-5" /> {item.label}</button>
          ))}
        </nav>
        <div className="p-10 border-t border-white/5"><button onClick={() => setIsLoggedIn(false)} className="w-full flex items-center justify-center gap-4 px-8 py-5 rounded-[2rem] bg-rose-500 text-white text-[11px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all">Déconnexion</button></div>
      </aside>

      <main className="flex-1 lg:ml-[24rem] p-8 lg:p-16 min-h-screen flex flex-col print:m-0 print:p-0">
        <header className="flex justify-between items-center mb-16 border-b border-slate-200 pb-12 no-print">
           <div><h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">{activeView.replace('_', ' ')}</h2><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">Enterprise v3.5 • Session Active</p></div>
           <div className="flex gap-5">
             <button onClick={()=>window.location.reload()} className="p-5 bg-white border border-slate-200 rounded-[2rem] text-slate-400 hover:text-emerald-700 transition-all shadow-lg"><RefreshCcw className="w-7 h-7" /></button>
             <div className="hidden sm:flex items-center gap-4 bg-white border border-slate-200 p-3 pr-8 rounded-[2rem] shadow-lg">
               <div className="w-12 h-12 bg-[#004a23] rounded-2xl flex items-center justify-center text-white font-black text-sm">AD</div>
               <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-slate-900">ADMIN</span><span className="text-[9px] font-bold text-slate-400">CONNECTÉ</span></div>
             </div>
           </div>
        </header>

        <section className="flex-1 animate-in fade-in duration-700">
          {activeView === 'dashboard' && <DashboardView />}
          {activeView === 'inventory' && <InventoryView />}
          {activeView === 'replenishment' && <ReplenishmentView />}
          {activeView === 'monthly_report' && <MonthlyReportView />}
          {activeView === 'history' && <div className="p-20 text-center bg-white rounded-[3rem] border"><HistoryIcon className="w-16 h-16 text-slate-100 mx-auto mb-6" /><p className="text-sm font-black text-slate-300 uppercase tracking-widest">Journal d'audit disponible dans les archives</p></div>}
          {activeView === 'settings' && <SettingsView />}
        </section>
      </main>

      {isProductModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 no-print">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-3xl" onClick={() => setIsProductModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-[4rem] shadow-2xl overflow-hidden">
            <div className="p-12 bg-[#004a23] text-white flex justify-between items-center"><h3 className="text-xl font-black uppercase italic">{editingProduct ? 'Modification' : 'Nouvel Article'}</h3><button onClick={() => setIsProductModalOpen(false)} className="p-4 bg-white/10 rounded-3xl"><X className="w-7 h-7" /></button></div>
            <form onSubmit={(e) => { e.preventDefault(); if(editingProduct) { setProducts(prev => prev.map(p => p.id === editingProduct.id ? {...p, ...formData} as Product : p)); showToast(`Mise à jour effectuée`, "success"); } else { setProducts(prev => [...prev, { ...formData, id: Date.now().toString(), currentStock: 0, minStock: Number(formData.minStock), monthlyNeed: Number(formData.monthlyNeed) } as Product]); showToast(`Article enregistré`, "success"); } setIsProductModalOpen(false); }} className="p-12 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="col-span-2 space-y-2"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Désignation</label><input required value={formData.name || ''} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full p-6 bg-slate-50 border rounded-3xl outline-none font-bold focus:border-emerald-600 transition-all" /></div>
                <div className="space-y-2"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Min. Seuil</label><input type="number" required value={formData.minStock || ''} onChange={e=>setFormData({...formData, minStock: Number(e.target.value)})} className="w-full p-6 bg-slate-50 border rounded-3xl outline-none font-bold focus:border-emerald-600 transition-all" /></div>
                <div className="space-y-2"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Mensuel</label><input type="number" required value={formData.monthlyNeed || ''} onChange={e=>setFormData({...formData, monthlyNeed: Number(e.target.value)})} className="w-full p-6 bg-slate-50 border rounded-3xl outline-none font-bold focus:border-emerald-600 transition-all" /></div>
                <div className="space-y-2"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">P.U.</label><input type="number" step="0.01" required value={formData.unitPrice || ''} onChange={e=>setFormData({...formData, unitPrice: Number(e.target.value)})} className="w-full p-6 bg-slate-50 border rounded-3xl outline-none font-bold focus:border-emerald-600 transition-all" /></div>
                <div className="space-y-2"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Unité</label><input required value={formData.unit || ''} onChange={e=>setFormData({...formData, unit: e.target.value})} className="w-full p-6 bg-slate-50 border rounded-3xl outline-none font-bold focus:border-emerald-600 transition-all" /></div>
              </div>
              <button className="w-full py-7 bg-emerald-700 text-white rounded-[3rem] font-black uppercase text-xs tracking-[0.4em] shadow-2xl hover:-translate-y-1 transition-all"><Save className="w-6 h-6 inline mr-4" /> Enregistrer</button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @media print { 
          .no-print, header, aside, button, footer { display: none !important; } 
          main { margin: 0 !important; padding: 0 !important; width: 100% !important; background: white !important; } 
          body { background: white !important; } 
          .bg-white, .bg-slate-50 { border-color: #e2e8f0 !important; box-shadow: none !important; } 
          .rounded-[2.5rem], .rounded-[3rem], .rounded-[3.5rem], .rounded-[4rem] { border-radius: 1.5rem !important; } 
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

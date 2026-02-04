
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  History as HistoryIcon, 
  BrainCircuit,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  ClipboardCheck,
  Search,
  Bell,
  TrendingUp,
  Activity,
  X,
  Save,
  Truck,
  Calculator,
  Download,
  Calendar,
  FileSpreadsheet,
  Layers,
  BarChart3,
  ArrowUpDown,
  DollarSign,
  ChevronDown,
  Info,
  Settings as SettingsIcon,
  Building2,
  Globe,
  Database,
  ShieldCheck,
  Edit2,
  Tag,
  UploadCloud,
  Loader2,
  Menu as MenuIcon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  Line,
  ComposedChart,
  Area,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { Product, InventoryLog, ViewType, InventorySnapshot } from './types';
import { INITIAL_PRODUCTS, CATEGORIES as DEFAULT_CATEGORIES } from './constants';
import { getStockInsights, processImportedData } from './services/geminiService';

// Excel Professional Color Palette
const EXCEL_GREEN = '#107c41';
const EXCEL_DARK_GREEN = '#0a5a2f';
const EXCEL_LIGHT_GREEN = '#d1e6d9';
const CHART_COLORS = [EXCEL_GREEN, '#2b579a', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const StatCard = ({ title, value, icon: Icon, colorClass, subtitle, trend }: { title: string, value: string | number | React.ReactNode, icon: any, colorClass: string, subtitle?: string, trend?: string }) => (
  <div className="bg-white p-5 border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-emerald-300 transition-all rounded-xl w-full">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 rounded-lg ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      {trend && (
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
          <TrendingUp className="w-3 h-3" /> {trend}
        </span>
      )}
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <div className="text-xl md:text-2xl font-black text-slate-900 tabular-nums truncate">{value}</div>
      {subtitle && <p className="text-[10px] text-slate-400 mt-2 font-medium">{subtitle}</p>}
    </div>
  </div>
);

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [history, setHistory] = useState<InventoryLog[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({ currency: '$' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Category Management State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryIndex, setEditingCategoryIndex] = useState<number | null>(null);
  const [editCategoryValue, setEditCategoryValue] = useState('');

  // Settings State
  const [companyInfo, setCompanyInfo] = useState({
    name: 'SmartStock Enterprise',
    email: 'contact@smartstock.pro',
    currency: '$',
    alertLevel: 20,
    language: 'fr'
  });

  useEffect(() => {
    const savedProducts = localStorage.getItem('stockProducts');
    const savedHistory = localStorage.getItem('stockHistory');
    const savedCompany = localStorage.getItem('stockCompany');
    const savedCategories = localStorage.getItem('stockCategories');
    
    if (savedProducts) setProducts(JSON.parse(savedProducts));
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (savedCompany) setCompanyInfo(JSON.parse(savedCompany));
    if (savedCategories) setCategories(JSON.parse(savedCategories));
  }, []);

  useEffect(() => {
    localStorage.setItem('stockProducts', JSON.stringify(products));
    localStorage.setItem('stockHistory', JSON.stringify(history));
    localStorage.setItem('stockCompany', JSON.stringify(companyInfo));
    localStorage.setItem('stockCategories', JSON.stringify(categories));
  }, [products, history, companyInfo, categories]);

  const alerts = useMemo(() => products.filter(p => p.currentStock <= p.minStock), [products]);
  const filteredProducts = useMemo(() => 
    products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())),
  [products, searchTerm]);

  const categoryValueData = useMemo(() => {
    const map: {[key: string]: number} = {};
    products.forEach(p => {
      map[p.category] = (map[p.category] || 0) + (p.currentStock * p.unitPrice);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [products]);

  const combinedChartData = useMemo(() => {
    const days = 7;
    const result = [];
    const now = new Date();
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      const dayLogs = history.filter(l => new Date(l.date).toDateString() === date.toDateString());
      const outs = Math.abs(dayLogs.filter(l => l.changeAmount < 0).reduce((acc, l) => acc + l.changeAmount, 0));
      const totalUnits = products.reduce((acc, p) => acc + p.currentStock, 0);
      result.push({
        name: dateStr,
        stockLevel: totalUnits + (Math.sin(i) * 5),
        rotation: totalUnits > 0 ? (outs / totalUnits) * 100 : 0
      });
    }
    return result;
  }, [history, products]);

  const deleteProduct = (productId: string) => {
    if (window.confirm("Supprimer définitivement ce produit du registre ?")) {
      setProducts(prev => prev.filter(p => p.id !== productId));
    }
  };

  const updateStock = (productId: string, amount: number, type: InventoryLog['type'], reason?: string) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const newStock = Math.max(0, p.currentStock + amount);
        const log: InventoryLog = {
          id: Math.random().toString(36).substr(2, 9),
          date: new Date().toISOString(),
          type,
          productId: p.id,
          productName: p.name,
          changeAmount: amount,
          finalStock: newStock,
          reason
        };
        setHistory(h => [log, ...h]);
        return { ...p, currentStock: newStock, lastInventoryDate: new Date().toISOString() };
      }
      return p;
    }));
  };

  const handleRefill = (productId: string) => {
    const p = products.find(prod => prod.id === productId);
    if (!p) return;
    const target = p.minStock + p.monthlyNeed;
    const needed = target - p.currentStock;
    if (needed > 0) {
      updateStock(productId, needed, 'refill', 'Ajustement de réapprovisionnement');
    }
  };

  const handleRefillAll = () => {
    products.forEach(p => {
      const target = p.minStock + p.monthlyNeed;
      const needed = target - p.currentStock;
      if (needed > 0) handleRefill(p.id);
    });
    alert("Plan de réapprovisionnement exécuté.");
  };

  const openEditModal = (product: Product | null = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({ 
        category: categories[0], 
        currentStock: 0, 
        minStock: 10, 
        monthlyNeed: 10, 
        unit: 'unités', 
        unitPrice: 0, 
        currency: companyInfo.currency as '$' | 'Fc', 
        supplier: '' 
      });
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...formData } as Product : p));
    } else {
      const newProduct: Product = { ...formData, id: Math.random().toString(36).substr(2, 9), lastInventoryDate: new Date().toISOString() } as Product;
      setProducts(prev => [...prev, newProduct]);
    }
    setIsProductModalOpen(false);
  };

  const addCategory = () => {
    if (!newCategoryName.trim()) return;
    if (categories.includes(newCategoryName.trim())) return;
    setCategories([...categories, newCategoryName.trim()]);
    setNewCategoryName('');
  };

  const startEditCategory = (index: number) => {
    setEditingCategoryIndex(index);
    setEditCategoryValue(categories[index]);
  };

  const saveEditCategory = () => {
    if (editingCategoryIndex === null || !editCategoryValue.trim()) return;
    const oldName = categories[editingCategoryIndex];
    const newName = editCategoryValue.trim();
    setProducts(products.map(p => p.category === oldName ? { ...p, category: newName } : p));
    const newCategories = [...categories];
    newCategories[editingCategoryIndex] = newName;
    setCategories(newCategories);
    setEditingCategoryIndex(null);
  };

  const deleteCategory = (index: number) => {
    const categoryName = categories[index];
    if (products.some(p => p.category === categoryName)) {
      alert("Catégorie utilisée.");
      return;
    }
    setCategories(categories.filter((_, i) => i !== index));
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      try {
        const analyzedProducts = await processImportedData(text, categories);
        const newProducts = [...products];
        analyzedProducts.forEach(ap => {
          if (!newProducts.some(p => p.name.toLowerCase() === ap.name?.toLowerCase())) {
            newProducts.push({
              ...ap,
              id: Math.random().toString(36).substr(2, 9),
              lastInventoryDate: new Date().toISOString(),
              currentStock: ap.currentStock || 0,
              minStock: ap.minStock || 10,
              monthlyNeed: ap.monthlyNeed || 10,
              unit: ap.unit || 'unités',
              unitPrice: ap.unitPrice || 0,
              currency: ap.currency || (companyInfo.currency as '$' | 'Fc'),
              category: ap.category || categories[0],
            } as Product);
          }
        });
        setProducts(newProducts);
      } catch (err) {
        alert("Erreur import.");
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  const resetAllData = () => {
    if (window.confirm("Tout effacer ?")) {
      setProducts([]);
      setHistory([]);
      setCategories(DEFAULT_CATEGORIES);
    }
  };

  // Nav Links Configuration
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Registre', icon: FileSpreadsheet },
    { id: 'replenishment', label: 'Besoins', icon: Calculator },
    { id: 'history', label: 'Journal', icon: HistoryIcon },
    { id: 'ai', label: 'Expert IA', icon: BrainCircuit },
    { id: 'settings', label: 'Paramètres', icon: SettingsIcon },
  ];

  const AiView = () => {
    const handleAnalysis = async () => {
      setIsAnalyzing(true);
      try {
        const insights = await getStockInsights(products, history);
        setAiAnalysis(insights || "Pas d'insights.");
      } catch (error) {
        setAiAnalysis("Erreur analyse.");
      } finally {
        setIsAnalyzing(false);
      }
    };

    return (
      <div className="space-y-6 max-w-4xl mx-auto px-4 lg:px-0">
        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden">
          <div className="bg-blue-700 text-white p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <BrainCircuit className="w-6 h-6 shrink-0" />
              <h2 className="text-lg md:text-xl font-black uppercase tracking-widest italic">Expert IA Gemini</h2>
            </div>
            {!aiAnalysis && !isAnalyzing && (
              <button onClick={handleAnalysis} className="w-full sm:w-auto bg-white text-blue-700 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-lg">Générer Rapport</button>
            )}
          </div>
          <div className="p-6 md:p-10">
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <p className="text-xs font-black text-slate-800 uppercase tracking-widest animate-pulse">Traitement neuronal en cours...</p>
              </div>
            ) : aiAnalysis ? (
              <div className="space-y-6">
                <div className="prose prose-slate max-w-none bg-slate-50 p-6 md:p-8 rounded-[2rem] border border-slate-100 text-slate-700 font-medium whitespace-pre-wrap text-sm leading-relaxed shadow-inner overflow-x-auto">
                  {aiAnalysis}
                </div>
                <button onClick={handleAnalysis} className="w-full py-4 border-2 border-dashed border-blue-200 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all">Relancer l'Analyse</button>
              </div>
            ) : (
              <div className="text-center py-12 space-y-6">
                <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto"><BrainCircuit className="w-10 h-10 text-blue-600" /></div>
                <div className="max-w-xs mx-auto">
                  <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">Analyse Prédictive</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-2 leading-relaxed">Intelligence Gemini pour l'optimisation des flux.</p>
                </div>
                <button onClick={handleAnalysis} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all">Lancer l'Expert</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f1f3f4] flex text-slate-900 font-sans selection:bg-emerald-100 overflow-x-hidden">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[55] lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Responsive Sidebar */}
      <aside className={`
        fixed inset-y-6 left-6 z-[60] 
        w-64 bg-[#004a23] text-white flex flex-col 
        shadow-2xl rounded-[2.5rem] border border-white/10 overflow-hidden
        transition-transform duration-500 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-[110%] lg:translate-x-0'}
      `}>
        <div className="p-8 border-b border-white/5 bg-[#003d1c]">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white border border-white/10">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter uppercase italic leading-none">{companyInfo.name.split(' ')[0]}</h1>
              <p className="text-[8px] text-emerald-400 font-black uppercase tracking-[0.3em] mt-2 opacity-60">Enterprise v2.5</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto custom-scrollbar">
          {navItems.map(item => (
            <button 
              key={item.id} 
              onClick={() => {
                setActiveView(item.id as ViewType);
                setIsSidebarOpen(false);
              }} 
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-3xl text-[10px] font-black transition-all group uppercase tracking-widest ${
                activeView === item.id 
                ? 'bg-white text-[#004a23] shadow-2xl scale-105' 
                : 'text-emerald-100/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className={`w-4 h-4 shrink-0 transition-transform ${activeView === item.id ? 'text-emerald-600' : 'text-emerald-400/30'}`} /> 
              {item.label}
              {item.id === 'replenishment' && alerts.length > 0 && (
                <span className={`ml-auto text-[8px] w-5 h-5 flex items-center justify-center rounded-full font-black animate-pulse ${activeView === item.id ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-600 text-white'}`}>
                  {alerts.length}
                </span>
              )}
            </button>
          ))}
        </nav>
        
        <div className="p-6 bg-[#003d1c] border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-[10px] font-black border border-white/10 shrink-0">AD</div> 
            <div className="overflow-hidden">
              <p className="text-[9px] font-black text-white uppercase tracking-tight truncate">Directeur</p>
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                <p className="text-[7px] font-bold text-emerald-400/60 uppercase">En ligne</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`
        flex-1 transition-all duration-500
        ml-0 lg:ml-[19rem] 
        p-4 sm:p-6 lg:p-10 
        custom-scrollbar
      `}>
        {/* Responsive Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-slate-200 pb-8 bg-[#f1f3f4]/90 backdrop-blur-md sticky top-0 z-40 px-2">
          <div className="flex items-center gap-4">
            {/* Hamburger Toggle */}
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-emerald-50 transition-all">
              <MenuIcon className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
                {navItems.find(n => n.id === activeView)?.label}
              </h2>
              <div className="flex items-center gap-3 mt-2">
                 <Calendar className="w-3 h-3 text-emerald-600" />
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</span>
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="bg-white border border-slate-200 px-6 py-3 rounded-2xl flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.2em] text-emerald-700 shadow-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> 
              Synchro OK
            </div>
          </div>
        </header>

        {/* Views Container */}
        <section className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
          {activeView === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Produits" value={products.length} icon={Package} colorClass="bg-emerald-50 text-emerald-700" subtitle="Total Registre" trend="+1%" />
                <StatCard title="Alertes" value={alerts.length} icon={AlertTriangle} colorClass="bg-rose-50 text-rose-700" subtitle="Niveau Critique" />
                <StatCard 
                  title="Valeur" 
                  value={`${products.reduce((acc, p) => acc + (p.currentStock * p.unitPrice), 0).toLocaleString()} ${companyInfo.currency}`} 
                  icon={DollarSign} 
                  colorClass="bg-emerald-100 text-emerald-800" 
                />
                <StatCard title="Performance" value="94%" icon={Activity} colorClass="bg-blue-50 text-blue-700" subtitle="Taux de Service" />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-white p-4 sm:p-6 border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Flux Hebdomadaire</h3>
                  <div className="h-64 sm:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={combinedChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" fontSize={9} tick={{fill: '#94a3b8'}} />
                        <YAxis fontSize={9} tick={{fill: '#94a3b8'}} />
                        <Tooltip />
                        <Area type="monotone" dataKey="stockLevel" fill={`${EXCEL_GREEN}10`} stroke={EXCEL_GREEN} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white p-4 sm:p-6 border border-slate-200 rounded-2xl shadow-sm">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Secteurs Actifs</h3>
                  <div className="h-64 sm:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryValueData} innerRadius={50} outerRadius={75} dataKey="value">
                          {categoryValueData.map((_, i) => <Cell key={`c-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'inventory' && (
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
              <div className="bg-emerald-50/50 p-4 border-b border-emerald-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-600 rounded-xl text-white shrink-0">
                    <FileSpreadsheet className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <h2 className="text-sm md:text-base font-black text-emerald-900 tracking-tight uppercase italic">Registre Actif</h2>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                    <input type="text" placeholder="Recherche..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 pr-4 py-2 border border-emerald-200 rounded-xl text-xs w-full bg-white shadow-inner outline-none focus:border-emerald-500" />
                  </div>
                  <button onClick={() => openEditModal()} className="bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-800 transition-all flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Nouveau
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50 text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">
                      <th className="px-6 py-4">Article</th>
                      <th className="px-6 py-4">Catégorie</th>
                      <th className="px-6 py-4 text-center">Stock</th>
                      <th className="px-6 py-4 text-center">Prix</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {filteredProducts.map((p, i) => (
                      <tr key={p.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'} hover:bg-emerald-50/50 transition-colors border-b border-slate-100 group`}>
                        <td className="px-6 py-4 font-bold text-slate-900">{p.name}</td>
                        <td className="px-6 py-4"><span className="text-[8px] bg-slate-100 px-2 py-0.5 rounded-full font-black text-slate-500 uppercase">{p.category}</span></td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-3">
                            <button onClick={() => updateStock(p.id, -1, 'manual_update')} className="w-6 h-6 flex items-center justify-center bg-white border border-slate-200 rounded text-slate-400">-</button>
                            <span className={`w-8 font-black tabular-nums ${p.currentStock <= p.minStock ? 'text-rose-600' : 'text-slate-900'}`}>{p.currentStock}</span>
                            <button onClick={() => updateStock(p.id, 1, 'manual_update')} className="w-6 h-6 flex items-center justify-center bg-white border border-slate-200 rounded text-slate-400">+</button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-black tabular-nums">{p.unitPrice.toFixed(2)} {p.currency}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEditModal(p)} className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => deleteProduct(p.id)} className="p-2 text-rose-600 hover:bg-rose-100 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeView === 'replenishment' && (
            <div className="space-y-6 max-w-5xl mx-auto pb-12 px-2 sm:px-0">
               <div className="bg-white border border-slate-200 p-6 md:p-10 shadow-sm rounded-3xl">
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                   <div>
                     <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase italic">Calculateur Besoins</h2>
                     <p className="text-slate-400 text-[10px] mt-1 font-bold uppercase tracking-widest">Plan d'approvisionnement auto</p>
                   </div>
                   {products.filter(p => p.currentStock < p.minStock + p.monthlyNeed).length > 0 && (
                     <button onClick={handleRefillAll} className="w-full sm:w-auto bg-emerald-700 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-800 transition-all flex items-center justify-center gap-2">
                       <CheckCircle2 className="w-4 h-4" /> Tout Valider
                     </button>
                   )}
                 </div>
                 <div className="grid gap-3">
                   {products.filter(p => p.currentStock < p.minStock + p.monthlyNeed).map(p => (
                     <div key={p.id} className="flex flex-col sm:flex-row items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl hover:border-emerald-500 transition-all gap-4">
                       <div className="flex items-center gap-4 w-full">
                         <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0"><Package className="w-6 h-6" /></div>
                         <div>
                           <h4 className="font-black text-slate-800 text-sm uppercase">{p.name}</h4>
                           <p className="text-[9px] text-slate-400 font-bold uppercase">{p.currentStock} en stock</p>
                         </div>
                       </div>
                       <div className="flex items-center justify-between sm:justify-end gap-6 w-full">
                         <div className="text-right">
                           <p className="text-[8px] text-emerald-600 font-black uppercase tracking-widest">À commander</p>
                           <p className="text-2xl font-black text-emerald-700">+{ (p.minStock + p.monthlyNeed) - p.currentStock }</p>
                         </div>
                         <button onClick={() => handleRefill(p.id)} className="bg-emerald-50 text-emerald-700 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all">OK</button>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
            </div>
          )}

          {activeView === 'history' && (
            <div className="bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden">
                <div className="bg-slate-50 p-6 md:p-8 border-b border-slate-200">
                  <h2 className="text-base md:text-lg font-black text-slate-800 tracking-tight uppercase flex items-center gap-3 italic">
                    <HistoryIcon className="w-5 h-5 text-slate-400" /> Journal Audit
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[600px]">
                    <thead>
                      <tr className="bg-slate-100/50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                        <th className="px-8 py-4">Date</th>
                        <th className="px-8 py-4">Article</th>
                        <th className="px-8 py-4 text-center">∆ Variation</th>
                        <th className="px-8 py-4 text-center">Solde</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {history.map(log => (
                        <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="px-8 py-4 text-slate-400 font-mono text-[10px]">{new Date(log.date).toLocaleString([], {dateStyle: 'short', timeStyle: 'short'})}</td>
                          <td className="px-8 py-4 font-bold text-slate-800">{log.productName}</td>
                          <td className={`px-8 py-4 text-center font-black ${log.changeAmount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {log.changeAmount > 0 ? '+' : ''}{log.changeAmount}
                          </td>
                          <td className="px-8 py-4 text-center font-black text-slate-900 tabular-nums">{log.finalStock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
          )}

          {activeView === 'ai' && <AiView />}

          {activeView === 'settings' && (
            <div className="space-y-6 max-w-4xl mx-auto pb-12 px-2 sm:px-0">
              <div className="bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden">
                <div className="bg-emerald-700 text-white p-8 flex items-center gap-4">
                  <SettingsIcon className="w-6 h-6 shrink-0" />
                  <h2 className="text-xl font-black uppercase tracking-widest italic">Configuration</h2>
                </div>
                <div className="p-6 md:p-10 space-y-10 md:space-y-12">
                  <section>
                    <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-2">
                      <Building2 className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">Profil Entité</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input type="text" value={companyInfo.name} onChange={e => setCompanyInfo({...companyInfo, name: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm focus:border-emerald-600" />
                      <input type="email" value={companyInfo.email} onChange={e => setCompanyInfo({...companyInfo, email: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm focus:border-emerald-600" />
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-2">
                      <UploadCloud className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">Import Excel/CSV</h3>
                    </div>
                    <div onClick={() => !isImporting && fileInputRef.current?.click()} className={`border-2 border-dashed rounded-3xl p-8 md:p-12 flex flex-col items-center justify-center transition-all cursor-pointer ${isImporting ? 'bg-slate-50 border-emerald-300' : 'bg-emerald-50/20 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-400'}`}>
                      <input type="file" ref={fileInputRef} onChange={handleFileImport} className="hidden" accept=".csv,.txt" />
                      {isImporting ? (
                        <div className="text-center space-y-3">
                          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                          <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Classement IA en cours...</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <UploadCloud className="w-10 h-10 text-emerald-600 mb-4 mx-auto" />
                          <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Importer un fichier</p>
                          <p className="text-[8px] text-slate-400 font-bold uppercase mt-2">Gemini structurera vos données automatiquement</p>
                        </div>
                      )}
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-2">
                      <Tag className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">Segments Catalogue</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <input type="text" placeholder="Nouveau..." value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs outline-none focus:border-emerald-600" />
                        <button onClick={addCategory} className="px-5 py-3 bg-emerald-700 text-white rounded-2xl shadow-lg shadow-emerald-900/10"><Plus className="w-4 h-4" /></button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {categories.map((cat, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl group text-xs font-bold text-slate-700">
                            {editingCategoryIndex === idx ? (
                              <input autoFocus value={editCategoryValue} onChange={e => setEditCategoryValue(e.target.value)} onBlur={saveEditCategory} className="bg-transparent border-b border-emerald-600 outline-none w-full" />
                            ) : (
                              <span className="truncate">{cat}</span>
                            )}
                            <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => startEditCategory(idx)} className="p-1 text-slate-400 hover:text-emerald-600"><Edit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => deleteCategory(idx)} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  <section className="bg-rose-50 p-6 rounded-2xl border border-rose-100">
                    <div className="flex items-center gap-2 mb-4">
                      <Database className="w-4 h-4 text-rose-600" />
                      <h3 className="text-[10px] font-black text-rose-800 uppercase">Données Critiques</h3>
                    </div>
                    <button onClick={resetAllData} className="w-full sm:w-auto px-6 py-3 bg-rose-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-900/10">Réinitialiser Système</button>
                  </section>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Responsive Modal Product */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={() => setIsProductModalOpen(false)} />
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl animate-in zoom-in duration-300 border border-white/20 custom-scrollbar">
            <div className="p-6 md:p-8 bg-emerald-700 text-white flex justify-between items-center sticky top-0 z-10">
              <h3 className="text-xs md:text-sm font-black uppercase tracking-[0.2em] italic">Fiche Référence</h3>
              <button onClick={() => setIsProductModalOpen(false)} className="bg-white/10 p-2 rounded-2xl"><X className="w-5 h-5 md:w-6 md:h-6" /></button>
            </div>
            <form onSubmit={handleSaveProduct} className="p-6 md:p-10 space-y-6 md:space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Désignation</label>
                  <input required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} type="text" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm focus:border-emerald-600 shadow-inner" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Catégorie</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none shadow-inner appearance-none">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Prix</label>
                  <input required value={formData.unitPrice} onChange={e => setFormData({...formData, unitPrice: parseFloat(e.target.value) || 0})} type="number" step="0.01" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none shadow-inner" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Stock</label>
                  <input required value={formData.currentStock} onChange={e => setFormData({...formData, currentStock: parseInt(e.target.value) || 0})} type="number" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none shadow-inner" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Alerte</label>
                  <input required value={formData.minStock} onChange={e => setFormData({...formData, minStock: parseInt(e.target.value) || 0})} type="number" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none shadow-inner" />
                </div>
              </div>
              <button type="submit" className="w-full py-5 bg-emerald-700 text-white font-black text-xs uppercase tracking-[0.3em] rounded-[2rem] shadow-xl shadow-emerald-900/10 hover:bg-emerald-800 transition-all flex items-center justify-center gap-3">
                <Save className="w-5 h-5" /> Valider Registre
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Button for Mobile Inventory */}
      {activeView === 'inventory' && !isProductModalOpen && (
        <button 
          onClick={() => openEditModal()} 
          className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-emerald-700 text-white rounded-full shadow-[0_8px_24px_rgba(16,124,65,0.4)] flex items-center justify-center z-50 animate-bounce transition-transform active:scale-90"
        >
          <Plus className="w-7 h-7" />
        </button>
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; height: 3px; } 
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #107c4130; border-radius: 20px; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        @media (max-width: 640px) {
          .recharts-legend-wrapper { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default App;


import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  History as HistoryIcon, 
  BrainCircuit,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Search,
  Activity,
  X,
  Save,
  Calculator,
  Calendar,
  FileSpreadsheet,
  DollarSign,
  Settings as SettingsIcon,
  Building2,
  Database,
  Edit2,
  Tag,
  UploadCloud,
  Loader2,
  Menu as MenuIcon,
  LogOut,
  Lock,
  User,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Globe,
  ChevronRight,
  KeyRound,
  Download,
  Filter
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
  ComposedChart,
  Area,
  PieChart,
  Pie
} from 'recharts';
import { Product, InventoryLog, ViewType } from './types';
import { INITIAL_PRODUCTS, CATEGORIES as DEFAULT_CATEGORIES } from './constants';
import { getStockInsights, processImportedData } from './services/geminiService';

// Excel Professional Color Palette
const EXCEL_GREEN = '#107c41';
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
  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // App State
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [history, setHistory] = useState<InventoryLog[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Toutes');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({ currency: '$' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings State
  const [companyInfo, setCompanyInfo] = useState({
    name: 'SmartStock Enterprise',
    email: 'contact@smartstock.pro',
    currency: '$',
    alertLevel: 20,
    language: 'fr'
  });

  useEffect(() => {
    try {
      // Check Auth session
      const session = localStorage.getItem('ss_session');
      if (session) {
        setIsLoggedIn(true);
      }

      const savedProducts = localStorage.getItem('stockProducts');
      const savedHistory = localStorage.getItem('stockHistory');
      const savedCompany = localStorage.getItem('stockCompany');
      const savedCategories = localStorage.getItem('stockCategories');
      
      if (savedProducts) setProducts(JSON.parse(savedProducts));
      if (savedHistory) setHistory(JSON.parse(savedHistory));
      if (savedCompany) setCompanyInfo(JSON.parse(savedCompany));
      if (savedCategories) setCategories(JSON.parse(savedCategories));
    } catch (e) {
      console.warn("Erreur lors du chargement des données locales :", e);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      try {
        localStorage.setItem('stockProducts', JSON.stringify(products));
        localStorage.setItem('stockHistory', JSON.stringify(history));
        localStorage.setItem('stockCompany', JSON.stringify(companyInfo));
        localStorage.setItem('stockCategories', JSON.stringify(categories));
      } catch (e) {
        console.error("Erreur de sauvegarde locale :", e);
      }
    }
  }, [products, history, companyInfo, categories, isLoggedIn]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    // Credentials de démo
    if (loginForm.username.toLowerCase() === 'admin' && loginForm.password === 'admin123') {
      setIsLoggedIn(true);
      localStorage.setItem('ss_session', 'active_session_token');
    } else {
      setLoginError('Identifiants non reconnus. Réessayez.');
    }
  };

  const handleLogout = () => {
    if (window.confirm("Se déconnecter de la session ?")) {
      setIsLoggedIn(false);
      localStorage.removeItem('ss_session');
    }
  };

  const alerts = useMemo(() => products.filter(p => p.currentStock <= p.minStock), [products]);
  
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'Toutes' || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, categoryFilter]);

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

  const handleExportCSV = () => {
    const headers = ["Nom", "Categorie", "Stock Actuel", "Seuil Min", "Prix Unitaire", "Devise", "Dernier Inventaire"];
    const rows = filteredProducts.map(p => [
      p.name,
      p.category,
      p.currentStock,
      p.minStock,
      p.unitPrice,
      p.currency,
      new Date(p.lastInventoryDate).toLocaleDateString()
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers, ...rows].map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SmartStock_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f1f3f4] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#107c41] animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex bg-white font-sans overflow-hidden">
        {/* Left Side: Brand & Visuals */}
        <div className="hidden lg:flex w-1/2 bg-[#004a23] relative flex-col justify-between p-16 overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          
          <div className="relative z-10 animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-2xl">
                <FileSpreadsheet className="w-6 h-6 text-[#107c41]" />
              </div>
              <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase">SmartStock<span className="text-emerald-400">Pro</span></h1>
            </div>

            <div className="space-y-6 max-w-md">
              <h2 className="text-5xl font-black text-white leading-[1.1] tracking-tight">
                La gestion de stock <br />
                <span className="text-emerald-400">réinventée.</span>
              </h2>
              <p className="text-emerald-100/60 text-lg font-medium leading-relaxed">
                Automatisez vos inventaires, surveillez vos seuils critiques et laissez l'IA Gemini optimiser votre chaîne d'approvisionnement.
              </p>
            </div>
          </div>

          <div className="relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl">
                <BrainCircuit className="w-8 h-8 text-emerald-400 mb-4" />
                <p className="text-white text-sm font-black uppercase tracking-widest">Optimisation IA</p>
                <p className="text-emerald-100/40 text-[10px] mt-1">Modèles Gemini v3.5</p>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl">
                <Activity className="w-8 h-8 text-blue-400 mb-4" />
                <p className="text-white text-sm font-black uppercase tracking-widest">Temps Réel</p>
                <p className="text-emerald-100/40 text-[10px] mt-1">Sychronisation des flux</p>
              </div>
            </div>
          </div>

          <div className="absolute top-1/2 right-[-10%] w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none" />
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#f8fafb] relative">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ 
            backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', 
            backgroundSize: '32px 32px' 
          }} />

          <div className="w-full max-w-sm relative z-10">
            <div className="text-center mb-10">
              <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                <div className="w-10 h-10 bg-[#107c41] rounded-lg flex items-center justify-center shadow-lg">
                  <FileSpreadsheet className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-black text-slate-900 italic uppercase">SmartStock<span className="text-[#107c41]">Pro</span></h1>
              </div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Bon retour.</h3>
              <p className="text-slate-500 text-sm font-medium">Connectez-vous à l'instance Enterprise.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {loginError && (
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-[10px] font-black text-rose-600 uppercase tracking-widest text-center animate-shake flex items-center justify-center gap-2">
                  <AlertTriangle className="w-3 h-3" /> {loginError}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Utilisateur</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#107c41] transition-colors" />
                    <input 
                      type="text" 
                      placeholder="admin" 
                      value={loginForm.username}
                      onChange={e => setLoginForm({...loginForm, username: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-6 text-slate-900 text-sm font-bold outline-none focus:border-[#107c41] transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mot de passe</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#107c41] transition-colors" />
                    <input 
                      type="password" 
                      placeholder="admin123" 
                      value={loginForm.password}
                      onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-6 text-slate-900 text-sm font-bold outline-none focus:border-[#107c41] transition-all"
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full bg-[#107c41] hover:bg-[#0d6334] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 group mt-4">
                Se connecter <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

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
        setAiAnalysis(insights || "Pas d'insights disponibles.");
      } catch (error) {
        setAiAnalysis("Erreur d'analyse.");
      } finally {
        setIsAnalyzing(false);
      }
    };

    return (
      <div className="space-y-6 max-w-4xl mx-auto px-4 lg:px-0">
        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden">
          <div className="bg-[#2b579a] text-white p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <BrainCircuit className="w-6 h-6 shrink-0" />
              <h2 className="text-lg md:text-xl font-black uppercase tracking-widest italic">Expert IA Gemini</h2>
            </div>
            {!aiAnalysis && !isAnalyzing && (
              <button onClick={handleAnalysis} className="w-full sm:w-auto bg-white text-[#2b579a] px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-lg">Générer Rapport</button>
            )}
          </div>
          <div className="p-6 md:p-10">
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-12 h-12 text-[#2b579a] animate-spin" />
                <p className="text-xs font-black text-slate-800 uppercase tracking-widest animate-pulse">Consultation du noyau Gemini v3.5...</p>
              </div>
            ) : aiAnalysis ? (
              <div className="space-y-6">
                <div className="prose prose-slate max-w-none bg-slate-50 p-6 md:p-8 rounded-[2rem] border border-slate-100 text-slate-700 font-medium whitespace-pre-wrap text-sm leading-relaxed shadow-inner">
                  {aiAnalysis}
                </div>
                <button onClick={handleAnalysis} className="w-full py-4 border-2 border-dashed border-blue-200 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all">Relancer l'Analyse</button>
              </div>
            ) : (
              <div className="text-center py-12 space-y-6">
                <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto"><BrainCircuit className="w-10 h-10 text-blue-600" /></div>
                <div className="max-w-xs mx-auto">
                  <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">Analyse Prédictive</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-2 leading-relaxed">Intelligence Gemini pour l'optimisation des flux logistiques.</p>
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
    <div className="min-h-screen bg-[#f1f3f4] flex text-slate-900 font-sans selection:bg-[#107c41]/10 overflow-x-hidden animate-in fade-in duration-1000">
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[55] lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-6 left-6 z-[60] w-64 bg-[#004a23] text-white flex flex-col shadow-2xl rounded-[2.5rem] border border-white/10 overflow-hidden transition-transform duration-500 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-[110%] lg:translate-x-0'}`}>
        <div className="p-8 border-b border-white/5 bg-[#003d1c]">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white border border-white/10">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter uppercase italic leading-none">{companyInfo.name.split(' ')[0]}</h1>
              <p className="text-[8px] text-emerald-400 font-black uppercase tracking-[0.3em] mt-2 opacity-60">Admin Portal</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto">
          {navItems.map(item => (
            <button 
              key={item.id} 
              onClick={() => { setActiveView(item.id as ViewType); setIsSidebarOpen(false); }} 
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-3xl text-[10px] font-black transition-all group uppercase tracking-widest ${activeView === item.id ? 'bg-white text-[#004a23] shadow-2xl scale-105' : 'text-emerald-100/60 hover:bg-white/5 hover:text-white'}`}
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
        
        <div className="p-6 bg-[#003d1c] border-t border-white/5 space-y-4">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-rose-500/10 text-rose-300 text-[9px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all">
            <LogOut className="w-3.5 h-3.5" /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 transition-all duration-500 ml-0 lg:ml-[19rem] p-4 sm:p-6 lg:p-10">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-slate-200 pb-8 bg-[#f1f3f4]/90 backdrop-blur-md sticky top-0 z-40 px-2">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 bg-white border border-slate-200 rounded-2xl text-slate-600">
              <MenuIcon className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
                {navItems.find(n => n.id === activeView)?.label}
              </h2>
            </div>
          </div>
        </header>

        <section className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
          {activeView === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Produits" value={products.length} icon={Package} colorClass="bg-emerald-50 text-emerald-700" subtitle="Total Registre" trend="+1%" />
                <StatCard title="Alertes" value={alerts.length} icon={AlertTriangle} colorClass="bg-rose-50 text-rose-700" subtitle="Niveau Critique" />
                <StatCard title="Valeur" value={`${products.reduce((acc, p) => acc + (p.currentStock * p.unitPrice), 0).toLocaleString()} ${companyInfo.currency}`} icon={DollarSign} colorClass="bg-emerald-100 text-emerald-800" />
                <StatCard title="Performance" value="94%" icon={Activity} colorClass="bg-blue-50 text-blue-700" subtitle="Taux de Service" />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-white p-4 sm:p-6 border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Flux Stock</h3>
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
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Répartition Valeur</h3>
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
            <div className="space-y-4">
              <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                    <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none appearance-none">
                      <option value="Toutes">Toutes les catégories</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                    <input type="text" placeholder="RECHERCHER..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none w-48" />
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                   <button onClick={handleExportCSV} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                    <Download className="w-3.5 h-3.5" /> CSV
                  </button>
                  <button onClick={() => openEditModal()} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-800 transition-all">
                    <Plus className="w-3.5 h-3.5" /> Nouveau
                  </button>
                </div>
              </div>

              <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-50 text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">
                        <th className="px-6 py-4">Article</th>
                        <th className="px-6 py-4">Catégorie</th>
                        <th className="px-6 py-4 text-center">Stock</th>
                        <th className="px-6 py-4 text-center">Statut</th>
                        <th className="px-6 py-4 text-center">Prix</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {filteredProducts.map((p, i) => {
                        const isAlert = p.currentStock <= p.minStock;
                        return (
                          <tr key={p.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'} hover:bg-emerald-50/50 transition-colors border-b border-slate-100 group`}>
                            <td className="px-6 py-4 font-bold text-slate-900">{p.name}</td>
                            <td className="px-6 py-4"><span className="text-[8px] bg-slate-100 px-2 py-0.5 rounded-md font-black text-slate-500 uppercase">{p.category}</span></td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-3">
                                <button onClick={() => updateStock(p.id, -1, 'manual_update')} className="w-6 h-6 flex items-center justify-center bg-white border border-slate-200 rounded text-slate-400 hover:text-emerald-600">-</button>
                                <span className={`w-10 font-black tabular-nums ${isAlert ? 'text-rose-600' : 'text-slate-900'}`}>{p.currentStock}</span>
                                <button onClick={() => updateStock(p.id, 1, 'manual_update')} className="w-6 h-6 flex items-center justify-center bg-white border border-slate-200 rounded text-slate-400 hover:text-emerald-600">+</button>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                               <div className="flex items-center justify-center">
                                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${isAlert ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                    {isAlert ? 'Alerte' : 'Sain'}
                                  </span>
                               </div>
                            </td>
                            <td className="px-6 py-4 text-center font-black text-slate-700">{p.unitPrice.toFixed(2)} {p.currency}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEditModal(p)} className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => { if(window.confirm("Supprimer ?")) setProducts(prev => prev.filter(prod => prod.id !== p.id)) }} className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
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
          )}

          {activeView === 'replenishment' && (
            <div className="space-y-6 max-w-5xl mx-auto pb-12">
               <div className="bg-white border border-slate-200 p-6 md:p-10 shadow-sm rounded-3xl">
                 <div className="flex justify-between items-center mb-8">
                   <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase italic">Calculateur Besoins</h2>
                   <button onClick={handleRefillAll} className="bg-emerald-700 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-800 transition-all flex items-center gap-2">
                     <CheckCircle2 className="w-4 h-4" /> Tout Valider
                   </button>
                 </div>
                 <div className="grid gap-3">
                   {products.filter(p => p.currentStock < p.minStock + p.monthlyNeed).map(p => (
                     <div key={p.id} className="flex flex-col sm:flex-row items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl gap-4">
                       <div className="flex items-center gap-4 w-full">
                         <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0"><Package className="w-6 h-6" /></div>
                         <div>
                           <h4 className="font-black text-slate-800 text-sm uppercase">{p.name}</h4>
                           <p className="text-[9px] text-slate-400 font-bold uppercase">{p.currentStock} en stock / Seuil: {p.minStock}</p>
                         </div>
                       </div>
                       <div className="text-right">
                         <p className="text-[8px] text-emerald-600 font-black uppercase tracking-widest">À commander</p>
                         <p className="text-2xl font-black text-emerald-700">+{ (p.minStock + p.monthlyNeed) - p.currentStock }</p>
                       </div>
                       <button onClick={() => handleRefill(p.id)} className="bg-emerald-50 text-emerald-700 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all">Confirmer</button>
                     </div>
                   ))}
                 </div>
               </div>
            </div>
          )}

          {activeView === 'ai' && <AiView />}

          {activeView === 'settings' && (
            <div className="space-y-6 max-w-4xl mx-auto pb-12">
              <div className="bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden">
                <div className="bg-emerald-700 text-white p-8 flex items-center gap-4">
                  <SettingsIcon className="w-6 h-6" />
                  <h2 className="text-xl font-black uppercase tracking-widest italic">Configuration Système</h2>
                </div>
                <div className="p-6 md:p-10 space-y-12">
                  <section>
                    <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-2">
                      <Building2 className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">Profil Entité</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input type="text" value={companyInfo.name} onChange={e => setCompanyInfo({...companyInfo, name: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm" />
                      <input type="email" value={companyInfo.email} onChange={e => setCompanyInfo({...companyInfo, email: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm" />
                    </div>
                  </section>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={() => setIsProductModalOpen(false)} />
          <div className="relative w-full max-w-xl bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-white/20">
            <div className="p-6 md:p-8 bg-emerald-700 text-white flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] italic">Fiche Référence Produit</h3>
              <button onClick={() => setIsProductModalOpen(false)} className="bg-white/10 p-2 rounded-2xl"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveProduct} className="p-6 md:p-10 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Désignation</label>
                  <input required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} type="text" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Catégorie</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Prix</label>
                  <input required value={formData.unitPrice} onChange={e => setFormData({...formData, unitPrice: parseFloat(e.target.value) || 0})} type="number" step="0.01" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none" />
                </div>
              </div>
              <button type="submit" className="w-full py-5 bg-emerald-700 text-white font-black text-xs uppercase tracking-[0.3em] rounded-[2rem] shadow-xl hover:bg-emerald-800 transition-all flex items-center justify-center gap-3">
                <Save className="w-5 h-5" /> Enregistrer les modifications
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;


import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, Package, History as HistoryIcon, Plus, AlertTriangle, 
  Trash2, Search, X, Calculator, FileSpreadsheet, 
  DollarSign, Settings as SettingsIcon, Edit2, 
  TrendingUp, Sparkles, Loader2,
  ShieldAlert, LogOut, ShieldCheck, 
  Menu, Shield, CheckCircle,
  Armchair, FileText, ArrowUpRight, ArrowDownLeft,
  Printer, Camera, Upload, 
  Image as ImageIcon, Wand2, ChevronRight, FileDown, ExternalLink,
  MapPin, User, Calendar, Tag, Info, Building2, Download, Filter, 
  Clock, RefreshCw, FileCheck, BarChart3, PieChart, Lock, Globe,
  Layers, Database, ClipboardList, Briefcase, Key, Bell, CreditCard,
  Cpu, HardDrive, Share2, ToggleLeft as Toggle, ChevronDown, Activity,
  Zap, Save, Eye, ListFilter, SlidersHorizontal
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart as RePieChart, Pie } from 'recharts';
import { Product, InventoryLog, ViewType, Site, Furniture, RapportAutomatique } from './types';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_FURNITURE } from './constants';
import { getProfessionalReport, extractDataFromImage, generateProductImage } from './services/geminiService';

const viewLabels: Record<ViewType, string> = {
  dashboard: 'Tableau de bord',
  inventory: 'Stocks / Inventaire',
  furniture: 'Mobilier & Actifs',
  replenishment: 'Réapprovisionnement',
  history: 'Historique / Audit',
  settings: 'Paramètres Système',
  monthly_report: 'Reporting Automatique',
  studio: 'Studio Photo',
  import: 'Import Automatique'
};

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [furniture, setFurniture] = useState<Furniture[]>([]);
  const [history, setHistory] = useState<InventoryLog[]>([]);
  const [sites, setSites] = useState<Site[]>([
    { id: 'S1', name: 'Entrepôt Central (Kinshasa)' }, 
    { id: 'S2', name: 'Siège Social (Gombe)' },
    { id: 'S3', name: 'Succursale Est (Goma)' }
  ]);
  
  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [historyFilterType, setHistoryFilterType] = useState<string>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isImportLoading, setIsImportLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState<RapportAutomatique | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  
  // Advanced Inventory Filters
  const [showFilters, setShowFilters] = useState(false);
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'alert' | 'sufficient'>('all');
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [minTotal, setMinTotal] = useState<string>('');
  const [maxTotal, setMaxTotal] = useState<string>('');

  // Confirmation Modals
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Settings States
  const [settingsToggles, setSettingsToggles] = useState({
    autoArchive: true,
    emailAlerts: true,
    cloudSync: false,
    aiOptimization: true,
    twoFactor: true,
    lowStockNotifications: true
  });

  // Modals & Editing
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isFurnitureModalOpen, setIsFurnitureModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Product | Furniture | null>(null);

  useEffect(() => {
    const savedP = localStorage.getItem('ss_products');
    const savedF = localStorage.getItem('ss_furniture');
    const savedH = localStorage.getItem('ss_history');
    if (savedP) setProducts(JSON.parse(savedP)); else setProducts(INITIAL_PRODUCTS);
    if (savedF) setFurniture(JSON.parse(savedF)); else setFurniture(INITIAL_FURNITURE);
    if (savedH) setHistory(JSON.parse(savedH));
  }, []);

  useEffect(() => {
    localStorage.setItem('ss_products', JSON.stringify(products));
    localStorage.setItem('ss_furniture', JSON.stringify(furniture));
    localStorage.setItem('ss_history', JSON.stringify(history));
  }, [products, furniture, history]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const addLog = (log: Omit<InventoryLog, 'id' | 'date'>) => {
    const newLog: InventoryLog = {
      ...log,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      responsible: 'Admin_ERP_DRC'
    };
    setHistory(prev => [newLog, ...prev]);
  };

  const handleGenerateReport = async () => {
    setIsAiLoading(true);
    try {
      const report = await getProfessionalReport(products, history);
      setAiReport(report);
      showToast("Rapport d'audit automatique haute fidélité généré");
    } catch (error) {
      console.error(error);
      showToast("Échec de la génération automatique du rapport", "error");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleStudioGeneration = async (prompt: string) => {
    setIsAiLoading(true);
    setGeneratedImageUrl(null);
    try {
      const imageUrl = await generateProductImage(prompt);
      if (imageUrl) {
        setGeneratedImageUrl(imageUrl);
        showToast("Rendu studio terminé avec succès");
      } else {
        showToast("Le studio n'a pas pu générer l'image", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Erreur système lors du rendu", "error");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleImageImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImportLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      try {
        const extracted = await extractDataFromImage(base64);
        const newProducts = extracted.map(p => ({
          ...p,
          id: Math.random().toString(36).substr(2, 9),
          siteId: sites[0].id,
          lastInventoryDate: new Date().toISOString(),
          monthlyNeed: 10,
          currency: 'Fc'
        })) as Product[];
        setProducts(prev => [...prev, ...newProducts]);
        newProducts.forEach(p => addLog({ type: 'entry', productId: p.id, productName: p.name, changeAmount: p.currentStock, finalStock: p.currentStock }));
        showToast(`${newProducts.length} articles identifiés automatiquement`);
      } catch (e) {
        showToast("Échec de la reconnaissance visuelle automatique (Erreur 500 possible)", "error");
      } finally {
        setIsImportLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // --- Filtered Products Logic ---
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Basic Search
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           p.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Stock Status
      const isAlert = p.currentStock <= p.minStock;
      const matchesStockStatus = stockStatusFilter === 'all' || 
                                (stockStatusFilter === 'alert' && isAlert) ||
                                (stockStatusFilter === 'sufficient' && !isAlert);

      // Unit
      const matchesUnit = unitFilter === 'all' || p.unit === unitFilter;

      // Price Range
      const matchesPrice = (!minPrice || p.unitPrice >= Number(minPrice)) && 
                          (!maxPrice || p.unitPrice <= Number(maxPrice));

      // Total Value Range
      const totalVal = p.currentStock * p.unitPrice;
      const matchesTotal = (!minTotal || totalVal >= Number(minTotal)) && 
                           (!maxTotal || totalVal <= Number(maxTotal));

      return matchesSearch && matchesStockStatus && matchesUnit && matchesPrice && matchesTotal;
    });
  }, [products, searchTerm, stockStatusFilter, unitFilter, minPrice, maxPrice, minTotal, maxTotal]);

  const uniqueUnits = useMemo(() => {
    return Array.from(new Set(products.map(p => p.unit))).filter(Boolean);
  }, [products]);

  // --- Sub-Views ---

  const DashboardView = () => (
    <div className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Valeur Consommables" value={`${products.reduce((a, b) => a + (b.currentStock * b.unitPrice), 0).toLocaleString()} Fc`} icon={DollarSign} color="emerald" trend="+5.2%" />
        <StatCard label="Patrimoine Immobilisé" value={`${furniture.reduce((a, b) => a + ((b.purchasePrice || 0) * b.currentCount), 0).toLocaleString()} Fc`} icon={Building2} color="blue" trend="Stable" />
        <StatCard label="Ruptures de Stock" value={products.filter(p => p.currentStock <= p.minStock).length} icon={ShieldAlert} color="rose" alert />
        <StatCard label="Actifs Gérés" value={furniture.reduce((a, b) => a + b.currentCount, 0)} icon={Armchair} color="amber" trend="+2" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        <div className="xl:col-span-2 space-y-8">
           <div className="bg-white p-10 border rounded-[3rem] shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-slate-500"><TrendingUp className="w-4 h-4 text-emerald-600" /> Flux de Traçabilité Récent</h3>
                <button onClick={() => setActiveView('history')} className="text-[10px] font-black uppercase text-emerald-700 hover:text-emerald-900 transition-colors">Registre complet</button>
              </div>
              <div className="space-y-4">
                {history.slice(0, 5).map(h => (
                  <div key={h.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${h.type === 'entry' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {h.type === 'entry' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-[12px] font-black uppercase text-slate-900 group-hover:italic">{h.productName}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{new Date(h.date).toLocaleDateString('fr-FR', {day:'2-digit', month:'long'})} • {h.responsible}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-black tabular-nums ${h.changeAmount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {h.changeAmount > 0 ? '+' : ''}{h.changeAmount}
                      </span>
                      <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Solde: {h.finalStock}</p>
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </div>
        <div className="space-y-6">
           <div className="bg-white p-10 border rounded-[3rem] shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-widest mb-10 text-slate-500">Flux de Travail Rapide</h3>
              <div className="space-y-4">
                <WorkflowBtn label="Lancer l'Audit Automatique" onClick={() => setActiveView('monthly_report')} icon={FileText} />
                <WorkflowBtn label="Extraction Vision AI" onClick={() => setActiveView('import')} icon={Camera} />
                <WorkflowBtn label="Recensement Mobilier" onClick={() => setActiveView('furniture')} icon={ClipboardList} />
                <WorkflowBtn label="Visualisation Studio" onClick={() => setActiveView('studio')} icon={ImageIcon} />
              </div>
           </div>
           <div className="bg-[#004a23] p-10 rounded-[3rem] text-white shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-150 transition-transform duration-1000" />
              <div className="relative z-10 space-y-4">
                <ShieldCheck className="w-10 h-10 text-emerald-400" />
                <h4 className="text-xl font-black italic uppercase leading-tight">Système de Sécurité Actif</h4>
                <p className="text-[10px] font-medium text-emerald-100/60 leading-relaxed uppercase tracking-widest">Base de données synchronisée et certifiée ISO-9001 simulation.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );

  const InventoryView = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-8 border rounded-[3rem] shadow-sm flex flex-col gap-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
            <input 
              type="text" 
              placeholder="Référence, désignation ou catégorie..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="w-full pl-16 pr-8 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all" 
            />
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-4 rounded-2xl border transition-all flex items-center gap-3 text-[10px] font-black uppercase tracking-widest ${showFilters ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span className="hidden sm:inline">Filtres Avancés</span>
              { (stockStatusFilter !== 'all' || unitFilter !== 'all' || minPrice || maxPrice || minTotal || maxTotal) && <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" /> }
            </button>
            <button onClick={() => {setEditingItem(null); setIsProductModalOpen(true);}} className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-black shadow-xl transition-all whitespace-nowrap"><Plus className="w-5 h-5" /> Ajouter</button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pt-4 border-t border-slate-50 animate-in slide-in-from-top-4 duration-300">
            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Package className="w-3 h-3" /> Niveau de Stock</label>
              <select 
                value={stockStatusFilter} 
                onChange={e => setStockStatusFilter(e.target.value as any)}
                className="w-full p-4 bg-slate-50 border-none rounded-xl outline-none font-bold text-slate-900 text-xs italic"
              >
                <option value="all">Tous les stocks</option>
                <option value="alert">En Alerte (≤ Seuil)</option>
                <option value="sufficient">Stock Suffisant</option>
              </select>
            </div>
            
            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Tag className="w-3 h-3" /> Unité de Mesure</label>
              <select 
                value={unitFilter} 
                onChange={e => setUnitFilter(e.target.value)}
                className="w-full p-4 bg-slate-50 border-none rounded-xl outline-none font-bold text-slate-900 text-xs italic"
              >
                <option value="all">Toutes les unités</option>
                {uniqueUnits.map(unit => <option key={unit} value={unit}>{unit}</option>)}
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><DollarSign className="w-3 h-3" /> Prix Unitaire (Fc)</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  placeholder="Min" 
                  value={minPrice} 
                  onChange={e => setMinPrice(e.target.value)}
                  className="w-1/2 p-4 bg-slate-50 border-none rounded-xl outline-none font-bold text-slate-900 text-xs tabular-nums"
                />
                <input 
                  type="number" 
                  placeholder="Max" 
                  value={maxPrice} 
                  onChange={e => setMaxPrice(e.target.value)}
                  className="w-1/2 p-4 bg-slate-50 border-none rounded-xl outline-none font-bold text-slate-900 text-xs tabular-nums"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Calculator className="w-3 h-3" /> Valeur Totale (Fc)</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  placeholder="Min" 
                  value={minTotal} 
                  onChange={e => setMinTotal(e.target.value)}
                  className="w-1/2 p-4 bg-slate-50 border-none rounded-xl outline-none font-bold text-slate-900 text-xs tabular-nums"
                />
                <input 
                  type="number" 
                  placeholder="Max" 
                  value={maxTotal} 
                  onChange={e => setMaxTotal(e.target.value)}
                  className="w-1/2 p-4 bg-slate-50 border-none rounded-xl outline-none font-bold text-slate-900 text-xs tabular-nums"
                />
              </div>
            </div>

            <div className="lg:col-span-4 flex justify-end gap-3 pt-2">
              <button 
                onClick={() => {
                  setStockStatusFilter('all');
                  setUnitFilter('all');
                  setMinPrice('');
                  setMaxPrice('');
                  setMinTotal('');
                  setMaxTotal('');
                  setSearchTerm('');
                }}
                className="px-6 py-2 text-[9px] font-black uppercase text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
              >
                Réinitialiser les filtres
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border rounded-[3.5rem] overflow-hidden shadow-sm relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              <tr>
                <th className="px-10 py-6">Désignation & Classification</th>
                <th className="px-10 py-6 text-center">Niveau de Stock</th>
                <th className="px-10 py-6 text-center">Unité</th>
                <th className="px-10 py-6 text-right">Valeur Unitaire</th>
                <th className="px-10 py-6 text-right">Valeur Totale</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredProducts.length > 0 ? filteredProducts.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-10 py-6">
                    <p className="font-black text-slate-900 uppercase italic group-hover:text-emerald-700 transition-colors">{p.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-widest">{p.category}</p>
                  </td>
                  <td className="px-10 py-6 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-xl font-black tabular-nums ${p.currentStock <= p.minStock ? 'text-rose-600' : 'text-slate-900'}`}>{p.currentStock}</span>
                      {p.currentStock <= p.minStock && <span className="text-[8px] font-black uppercase text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">Alerte Seuil</span>}
                    </div>
                  </td>
                  <td className="px-10 py-6 text-center font-bold text-slate-400 uppercase text-[10px]">{p.unit}</td>
                  <td className="px-10 py-6 text-right font-black text-slate-900 tabular-nums">{p.unitPrice.toLocaleString()} Fc</td>
                  <td className="px-10 py-6 text-right font-black text-emerald-700 tabular-nums">{(p.currentStock * p.unitPrice).toLocaleString()} Fc</td>
                  <td className="px-10 py-6 text-right space-x-2">
                    <button onClick={() => {setEditingItem(p); setIsProductModalOpen(true);}} className="p-3 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => {
                      if(window.confirm(`Supprimer définitivement l'article "${p.name}" ?`)) {
                        setProducts(products.filter(x => x.id !== p.id));
                        showToast("Article supprimé du registre");
                      }
                    }} className="p-3 text-rose-300 hover:text-rose-600 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-10 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-6 bg-slate-50 rounded-full text-slate-300"><Search className="w-12 h-12" /></div>
                      <p className="text-xl font-black italic uppercase text-slate-300 tracking-widest">Aucun article ne correspond à ces critères</p>
                      <button 
                        onClick={() => {
                          setStockStatusFilter('all');
                          setUnitFilter('all');
                          setMinPrice('');
                          setMaxPrice('');
                          setMinTotal('');
                          setMaxTotal('');
                          setSearchTerm('');
                        }}
                        className="text-[10px] font-black uppercase text-emerald-600 hover:underline tracking-widest"
                      >
                        Effacer tous les filtres
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const FurnitureView = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-6 bg-white p-8 border rounded-[3rem] shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
          <input 
            type="text" 
            placeholder="Code inventaire, nom ou département d'affectation..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="w-full pl-16 pr-8 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all" 
          />
        </div>
        <button onClick={() => {setEditingItem(null); setIsFurnitureModalOpen(true);}} className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-black shadow-xl transition-all"><Plus className="w-5 h-5" /> Nouvel Actif</button>
      </div>

      <div className="bg-white border rounded-[3.5rem] overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            <tr>
              <th className="px-10 py-6">Code & Désignation</th>
              <th className="px-10 py-6">Affectation & Site</th>
              <th className="px-10 py-6 text-center">État / Condition</th>
              <th className="px-10 py-6 text-center">Quantité</th>
              <th className="px-10 py-6 text-right">Valeur Acquisition</th>
              <th className="px-10 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {furniture.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()) || f.code.toLowerCase().includes(searchTerm.toLowerCase())).map(f => (
              <tr key={f.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-10 py-6">
                  <p className="text-[10px] font-mono font-bold text-emerald-600 mb-1">{f.code}</p>
                  <p className="font-black text-slate-900 uppercase italic group-hover:underline">{f.name}</p>
                </td>
                <td className="px-10 py-6">
                  <div className="flex items-center gap-2 text-slate-700 font-bold text-xs">
                    <MapPin className="w-3 h-3 text-emerald-500" /> {sites.find(s => s.id === f.siteId)?.name || 'Inconnu'}
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 font-medium text-[10px] uppercase mt-1">
                    <User className="w-3 h-3" /> {f.assignedTo || 'Non assigné'}
                  </div>
                </td>
                <td className="px-10 py-6 text-center">
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${
                    f.condition === 'Neuf' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                    f.condition === 'Bon' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                    f.condition === 'Usé' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                    'bg-rose-50 text-rose-700 border-rose-100'
                  }`}>
                    {f.condition}
                  </span>
                </td>
                <td className="px-10 py-6 text-center font-black text-xl tabular-nums">{f.currentCount}</td>
                <td className="px-10 py-6 text-right font-black text-slate-900 tabular-nums">{(f.purchasePrice || 0).toLocaleString()} Fc</td>
                <td className="px-10 py-6 text-right space-x-2">
                   <button onClick={() => {setEditingItem(f); setIsFurnitureModalOpen(true);}} className="p-3 text-blue-500 hover:bg-blue-50 rounded-xl"><Edit2 className="w-4 h-4" /></button>
                   <button onClick={() => setFurniture(furniture.filter(x => x.id !== f.id))} className="p-3 text-rose-300 hover:text-rose-600 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const HistoryView = () => {
    const filteredHistory = history.filter(h => {
      const matchSearch = h.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          h.responsible?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = historyFilterType === 'all' || h.type === historyFilterType;
      return matchSearch && matchType;
    });

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="bg-white p-8 border rounded-[3rem] shadow-sm flex flex-wrap items-center gap-6">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
            <input 
              type="text" 
              placeholder="Rechercher une opération d'audit..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="w-full pl-16 pr-8 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all" 
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-50 p-1 px-4 border rounded-2xl">
              <Filter className="w-4 h-4 text-slate-400" />
              <select value={historyFilterType} onChange={e => setHistoryFilterType(e.target.value)} className="bg-transparent py-3 outline-none text-[10px] font-black uppercase text-slate-600">
                <option value="all">Tous les flux</option>
                <option value="entry">Entrées Entrepôt</option>
                <option value="exit">Sorties Utilisation</option>
                <option value="transfer">Transferts Sites</option>
                <option value="adjustment">Ajustements Inventaire</option>
              </select>
            </div>
            <button className="px-8 py-4 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all shadow-xl flex items-center gap-3">
              <Download className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Exporter PDF</span>
            </button>
          </div>
        </div>

        <div className="bg-white border rounded-[3.5rem] overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              <tr>
                <th className="px-10 py-6">Horodatage d'Audit</th>
                <th className="px-10 py-6">Type d'Opération</th>
                <th className="px-10 py-6">Article Certifié</th>
                <th className="px-10 py-6 text-center">Volume</th>
                <th className="px-10 py-6 text-center">Solde Final</th>
                <th className="px-10 py-6 text-right">Responsable / Visa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredHistory.map(h => (
                <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-10 py-6">
                    <span className="text-[11px] font-black text-slate-900">{new Date(h.date).toLocaleDateString('fr-FR')}</span>
                    <span className="text-[9px] font-bold text-slate-400 font-mono block mt-1">{new Date(h.date).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}</span>
                  </td>
                  <td className="px-10 py-6">
                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase border ${
                      h.type === 'entry' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                    }`}>
                      {h.type === 'entry' ? 'Entrée Stock' : 'Sortie Stock'}
                    </span>
                  </td>
                  <td className="px-10 py-6">
                    <p className="font-black text-slate-900 uppercase italic">{h.productName}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Ref: {h.productId.substring(0,8)}</p>
                  </td>
                  <td className="px-10 py-6 text-center">
                    <span className={`text-sm font-black tabular-nums ${h.changeAmount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {h.changeAmount > 0 ? '+' : ''}{h.changeAmount}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-center">
                    <span className="text-sm font-black text-slate-900 tabular-nums bg-slate-100 px-3 py-1 rounded-xl">{h.finalStock}</span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <p className="text-[11px] font-black text-slate-900 uppercase italic">{h.responsible}</p>
                    <p className="text-[8px] font-bold text-emerald-600 uppercase flex items-center justify-end gap-1 mt-1"><ShieldCheck className="w-2.5 h-2.5" /> Signé Système</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const SettingsView = () => (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      {/* Profil & Sécurité */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-white p-12 border rounded-[4rem] shadow-sm space-y-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 text-slate-50 opacity-10 group-hover:scale-110 transition-transform pointer-events-none"><User className="w-48 h-48" /></div>
          <div className="flex items-center gap-6 relative z-10">
            <div className="p-5 bg-emerald-50 text-emerald-600 rounded-[2rem] shadow-inner"><User className="w-10 h-10" /></div>
            <div>
              <h3 className="text-3xl font-black italic uppercase text-slate-900 tracking-tighter">Profil Administrateur Pro</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identité & Habilitations ERP DRC</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <SettingsInput label="Nom de l'Administrateur" value="Admin_ERP_Pro" />
            <SettingsInput label="E-mail de Contact" value="admin@smartstock.cd" />
            <SettingsInput label="Rôle Système" value="Superviseur Logistique" disabled />
            <SettingsInput label="ID Unitaire" value="HQ-KIN-SS-001" disabled />
          </div>
          <div className="pt-8 border-t flex flex-wrap gap-4 relative z-10">
             <button className="px-10 py-5 bg-[#004a23] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-black transition-all">Mettre à jour le profil</button>
             <button className="px-10 py-5 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"><Key className="w-4 h-4" /> Changer le Token</button>
          </div>
        </div>

        <div className="bg-[#004a23] p-12 rounded-[4rem] text-white space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-400/20" />
          <h4 className="text-2xl font-black uppercase italic tracking-tight flex items-center gap-3"><ShieldCheck className="w-7 h-7 text-emerald-400" /> Sécurité ERP</h4>
          <div className="space-y-6">
             <ToggleItem 
               label="Auth. Double Facteur" 
               desc="Sécurisez l'accès par code mobile" 
               active={settingsToggles.twoFactor} 
               onClick={() => setSettingsToggles({...settingsToggles, twoFactor: !settingsToggles.twoFactor})}
             />
             <ToggleItem 
               label="Audit Log Temps Réel" 
               desc="Enregistrement continu des flux" 
               active={true} 
               disabled
             />
             <ToggleItem 
               label="Synchronisation Cloud" 
               desc="Sauvegarde miroir temps réel" 
               active={settingsToggles.cloudSync} 
               onClick={() => setSettingsToggles({...settingsToggles, cloudSync: !settingsToggles.cloudSync})}
             />
          </div>
          <div className="pt-6 border-t border-white/10">
            <p className="text-[10px] font-black uppercase opacity-60 mb-1">Dernière Intrusion Bloquée</p>
            <p className="text-xs font-bold text-emerald-400">Aucune menace détectée</p>
          </div>
        </div>
      </div>

      {/* Réseau & Sites */}
      <div className="bg-white p-12 border rounded-[4rem] shadow-sm space-y-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-blue-50 text-blue-600 rounded-[2rem] shadow-inner"><Building2 className="w-10 h-10" /></div>
            <div>
              <h3 className="text-3xl font-black italic uppercase text-slate-900 tracking-tighter">Architecture Logistique</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Maillage des sites d'exploitation</p>
            </div>
          </div>
          <button className="px-10 py-5 bg-slate-900 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-2xl flex items-center gap-3 hover:bg-black transition-all active:scale-95"><Plus className="w-5 h-5" /> Nouveau Hub</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {sites.map(s => (
             <div key={s.id} className="p-10 bg-slate-50 border rounded-[3.5rem] group hover:border-blue-500 hover:shadow-2xl hover:bg-white transition-all cursor-pointer relative">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors"><MapPin className="w-6 h-6" /></div>
                  <div className="flex gap-2">
                    <button className="p-2.5 text-slate-300 hover:text-blue-600 transition-all"><Edit2 className="w-4 h-4" /></button>
                    <button className="p-2.5 text-rose-200 hover:text-rose-600 transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <h5 className="text-[16px] font-black uppercase text-slate-900 italic mb-2 tracking-tight">{s.name}</h5>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status: Opérationnel • 142 Actifs</p>
             </div>
           ))}
        </div>
      </div>

      {/* Moteur IA & Données */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white p-12 border rounded-[4rem] shadow-sm space-y-10">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-amber-50 text-amber-600 rounded-[2rem] shadow-inner"><Cpu className="w-10 h-10" /></div>
            <div>
              <h3 className="text-3xl font-black italic uppercase text-slate-900 tracking-tighter">Moteur Automatique</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Intelligence Artificielle & Automatisation</p>
            </div>
          </div>
          <div className="space-y-6">
             <ToggleItem 
               label="Optimisation AI Proactive" 
               desc="Proposer des réapprovisionnements basés sur l'historique" 
               active={settingsToggles.aiOptimization} 
               onClick={() => setSettingsToggles({...settingsToggles, aiOptimization: !settingsToggles.aiOptimization})}
               dark
             />
             <ToggleItem 
               label="Archivage Automatique" 
               desc="Archiver les flux de plus de 12 mois sans activité" 
               active={settingsToggles.autoArchive} 
               onClick={() => setSettingsToggles({...settingsToggles, autoArchive: !settingsToggles.autoArchive})}
               dark
             />
             <ToggleItem 
               label="Alertes Stock Critique" 
               desc="Notifications temps réel de rupture" 
               active={settingsToggles.lowStockNotifications} 
               onClick={() => setSettingsToggles({...settingsToggles, lowStockNotifications: !settingsToggles.lowStockNotifications})}
               dark
             />
          </div>
        </div>

        <div className="bg-white p-12 border rounded-[4rem] shadow-sm flex flex-col justify-between space-y-10">
          <div className="space-y-10">
            <div className="flex items-center gap-6">
              <div className="p-5 bg-slate-50 text-slate-400 rounded-[2rem] shadow-inner"><HardDrive className="w-10 h-10" /></div>
              <div>
                <h3 className="text-3xl font-black italic uppercase text-slate-900 tracking-tighter">Maintenance Base</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Santé du stockage et archives</p>
              </div>
            </div>
            <div className="p-10 bg-slate-50 rounded-[3rem] border space-y-8 shadow-inner">
               <div className="space-y-4">
                 <div className="flex justify-between items-center text-[11px] font-black uppercase text-slate-400">
                    <span className="flex items-center gap-2"><Activity className="w-4 h-4" /> Occupation Données</span>
                    <span className="text-emerald-600">4.2 MB / 100 MB</span>
                 </div>
                 <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[4.2%]" />
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <button className="py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all">
                    <Share2 className="w-4 h-4" /> Export CSV
                  </button>
                  <button className="py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
                    <RefreshCw className="w-4 h-4" /> Restaurer
                  </button>
               </div>
            </div>
          </div>
          <div className="bg-rose-50 p-8 rounded-[2.5rem] border border-rose-100 flex items-start gap-4">
             <ShieldAlert className="w-10 h-10 text-rose-600 shrink-0 mt-1" />
             <div>
                <p className="text-[12px] font-black uppercase text-rose-900 italic">Zone de Danger ERP</p>
                <p className="text-[10px] font-medium text-rose-700 leading-tight mt-1 uppercase tracking-tight">Toutes les données seront supprimées définitivement.</p>
                <button className="mt-4 px-8 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 shadow-xl transition-all">Réinitialiser Système</button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );

  const SettingsInput = ({ label, value, type = "text", disabled = false }: any) => (
    <div className="space-y-3">
      <label className="text-[10px] font-black uppercase text-slate-400 ml-2">{label}</label>
      <input 
        type={type} 
        defaultValue={value} 
        disabled={disabled}
        className={`w-full px-8 py-5 bg-slate-50 border-none rounded-[1.8rem] font-bold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all text-sm ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'hover:bg-slate-100/50'}`} 
      />
    </div>
  );

  const ToggleItem = ({ label, desc, active, onClick, disabled, dark }: any) => (
    <div className={`flex items-center justify-between gap-6 ${disabled ? 'opacity-30' : ''}`}>
      <div className="flex-1">
        <p className={`text-[13px] font-black uppercase italic ${dark ? 'text-slate-900' : 'text-white'}`}>{label}</p>
        <p className={`text-[9px] font-bold ${dark ? 'text-slate-400' : 'text-emerald-100/50'} uppercase mt-1 tracking-widest`}>{desc}</p>
      </div>
      <button 
        onClick={onClick}
        disabled={disabled}
        className={`w-16 h-9 rounded-full transition-all relative border-2 ${active ? 'bg-emerald-400 border-emerald-500' : (dark ? 'bg-slate-200 border-slate-300' : 'bg-white/10 border-white/20')}`}
      >
        <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-2xl transition-all duration-300 ${active ? 'left-8' : 'left-1'}`} />
      </button>
    </div>
  );

  // --- Main Layout Login ---
  if (!isLoggedIn) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[50vw] h-[50vh] bg-emerald-600/5 -translate-y-1/2 translate-x-1/2 rounded-full blur-[100px]" />
      <div className="bg-white p-16 rounded-[4.5rem] shadow-2xl w-full max-w-md space-y-10 border text-center relative z-10 animate-in zoom-in-95 duration-500">
        <div className="inline-flex p-6 bg-[#004a23] rounded-[2.5rem] text-white shadow-2xl"><ShieldCheck className="w-12 h-12" /></div>
        <div className="space-y-2">
          <h2 className="text-5xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">SmartStock <span className="text-emerald-600">Pro</span></h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">Enterprise Resource Planner v2.5</p>
        </div>
        <div className="space-y-4 pt-4">
          <div className="relative">
            <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input className="w-full pl-14 pr-5 py-5 bg-slate-50 border rounded-2xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all" placeholder="Utilisateur" defaultValue="admin_erp" />
          </div>
          <div className="relative">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input type="password" className="w-full pl-14 pr-5 py-5 bg-slate-50 border rounded-2xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all" placeholder="Mot de passe" defaultValue="••••••••" />
          </div>
          <button onClick={() => setIsLoggedIn(true)} className="w-full py-6 bg-[#004a23] text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-black hover:-translate-y-1 transition-all active:scale-95">Accès Système Haute Sécurité</button>
        </div>
        <p className="text-[9px] font-black uppercase text-slate-300 tracking-widest italic pt-4">© 2025 SmartStock Engineering • ISO Certified Simulation</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Sidebar ERP */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-80 bg-[#004a23] m-5 rounded-[4rem] p-10 flex flex-col text-white shadow-2xl transition-transform lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:flex'} no-print`}>
        <div className="flex items-center gap-4 mb-14 border-b border-white/10 pb-10">
          <ShieldCheck className="w-10 h-10 text-emerald-400" />
          <div>
            <h1 className="text-2xl font-black italic uppercase tracking-tighter">SmartStock</h1>
            <p className="text-[8px] font-bold text-emerald-400/50 uppercase tracking-[0.3em]">Patrimoine & Logistique</p>
          </div>
        </div>
        <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar -mx-2 px-2">
          <NavItem active={activeView === 'dashboard'} onClick={() => {setActiveView('dashboard'); setIsSidebarOpen(false);}} icon={LayoutDashboard} label="Tableau de bord" />
          <NavItem active={activeView === 'inventory'} onClick={() => {setActiveView('inventory'); setIsSidebarOpen(false);}} icon={Package} label="Stocks / Inventaire" />
          <NavItem active={activeView === 'furniture'} onClick={() => {setActiveView('furniture'); setIsSidebarOpen(false);}} icon={Armchair} label="Mobilier & Actifs" />
          <NavItem active={activeView === 'import'} onClick={() => {setActiveView('import'); setIsSidebarOpen(false);}} icon={Upload} label="Import Automatique" />
          <NavItem active={activeView === 'history'} onClick={() => {setActiveView('history'); setIsSidebarOpen(false);}} icon={HistoryIcon} label="Historique / Audit" />
          <NavItem active={activeView === 'monthly_report'} onClick={() => {setActiveView('monthly_report'); setIsSidebarOpen(false);}} icon={FileText} label="Reporting Automatique" />
          <NavItem active={activeView === 'studio'} onClick={() => {setActiveView('studio'); setIsSidebarOpen(false);}} icon={ImageIcon} label="Studio Photo" />
          <NavItem active={activeView === 'settings'} onClick={() => {setActiveView('settings'); setIsSidebarOpen(false);}} icon={SettingsIcon} label="Paramètres Système" />
        </nav>
        <div className="mt-10 pt-8 border-t border-white/10">
          <button onClick={() => setIsLogoutModalOpen(true)} className="w-full py-5 bg-rose-600/10 text-rose-300 rounded-3xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center gap-3">
            <LogOut className="w-5 h-5" /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 p-10 lg:p-14 lg:ml-80 overflow-y-auto relative no-print:bg-[#f8fafc] print:p-0 print:ml-0">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-14 gap-6 no-print">
          <div>
            <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-4 bg-white border rounded-2xl shadow-sm"><Menu className="w-6 h-6" /></button>
              <h2 className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter">{viewLabels[activeView]}</h2>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] mt-2 flex items-center gap-2"><Globe className="w-3 h-3 text-emerald-500" /> Hub Central : DRC_HQ_KIN_01</p>
          </div>
          <div className="flex items-center gap-6">
             <button onClick={() => window.print()} className="p-5 bg-white border rounded-[1.8rem] text-slate-400 hover:text-emerald-600 hover:border-emerald-200 shadow-sm transition-all"><Printer className="w-6 h-6" /></button>
             <div className="h-12 w-px bg-slate-200" />
             <div className="flex items-center gap-4 bg-white p-2.5 pr-8 border rounded-[2rem] shadow-sm hover:shadow-xl transition-all cursor-pointer">
                <div className="w-12 h-12 bg-[#004a23] rounded-[1.2rem] flex items-center justify-center text-white font-black text-sm italic shadow-inner">AD</div>
                <div className="hidden sm:block">
                  <p className="text-[11px] font-black uppercase text-slate-900 leading-none">Admin_ERP</p>
                  <p className="text-[9px] font-bold text-emerald-500 uppercase mt-1">Superviseur Pro</p>
                </div>
             </div>
          </div>
        </header>

        {/* Dynamic Views Rendering */}
        {activeView === 'dashboard' && <DashboardView />}
        {activeView === 'inventory' && <InventoryView />}
        {activeView === 'furniture' && <FurnitureView />}
        {activeView === 'history' && <HistoryView />}
        {activeView === 'settings' && <SettingsView />}
        
        {activeView === 'import' && (
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 animate-in zoom-in-95 duration-700">
             <ImportCard 
               title="Vision Automatique AI" 
               desc="Extraction par reconnaissance visuelle haute précision" 
               icon={Camera} 
               color="emerald" 
               onFileChange={handleImageImport} 
               loading={isImportLoading}
             />
             <ImportCard 
               title="Importation Massive" 
               desc="Intégration fichier structure CSV/Excel" 
               icon={FileSpreadsheet} 
               color="blue" 
             />
          </div>
        )}

        {activeView === 'monthly_report' && (
          <div className="animate-in fade-in duration-700">
            <div className="max-w-6xl mx-auto space-y-12">
               {!aiReport ? (
                 <div className="bg-white p-24 border rounded-[4rem] shadow-sm text-center space-y-10 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-2 bg-emerald-600" />
                    <div className="inline-flex p-8 bg-slate-50 text-slate-300 rounded-[3rem] group-hover:scale-110 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all shadow-inner">
                      <BarChart3 className="w-20 h-20" />
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-5xl font-black italic uppercase text-slate-900 tracking-tighter">Certification Logistique</h3>
                      <p className="text-slate-400 font-medium max-w-xl mx-auto leading-relaxed uppercase text-xs tracking-widest">
                        Générez un document d'audit complet incluant analyses financières, graphiques de performance et recommandations stratégiques automatiques par IA.
                      </p>
                    </div>
                    <button onClick={handleGenerateReport} disabled={isAiLoading} className="px-16 py-7 bg-[#004a23] text-white rounded-3xl font-black uppercase text-xs tracking-[0.25em] shadow-2xl hover:bg-black hover:-translate-y-1 transition-all flex items-center justify-center gap-4 mx-auto disabled:opacity-50">
                      {isAiLoading ? <Loader2 className="w-7 h-7 animate-spin" /> : <ShieldCheck className="w-7 h-7" />} {isAiLoading ? "Analyse Systémique..." : "Générer le Rapport Certifié"}
                    </button>
                    <p className="text-[9px] font-black uppercase text-slate-300 tracking-[0.5em] pt-4">Système SmartStock Pro v2.5.4</p>
                 </div>
               ) : (
                 <div className="bg-white border rounded-[4rem] shadow-2xl overflow-hidden print:shadow-none print:rounded-none print:border-none animate-in slide-in-from-bottom-12 duration-1000">
                    <div className="bg-[#004a23] p-20 text-white relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                       <div className="relative z-10 flex justify-between items-start">
                          <div className="space-y-8">
                             <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                                <Lock className="w-4 h-4 text-emerald-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Document Confidentiel - Audit Patrimonial</span>
                             </div>
                             <h1 className="text-8xl font-black italic uppercase tracking-tighter leading-none">Rapport de Performance<br/>Logistique</h1>
                             <p className="text-2xl font-bold uppercase opacity-60 mt-4 tracking-widest">Généré le {new Date(aiReport.generatedAt).toLocaleDateString('fr-FR', {day:'2-digit', month:'long', year:'numeric'})}</p>
                          </div>
                          <div className="text-right">
                             <ShieldCheck className="w-32 h-32 text-emerald-400 mb-6 inline-block" />
                             <p className="text-[11px] font-black uppercase tracking-[0.4em] opacity-50 italic">SmartStock Pro Enterprise</p>
                          </div>
                       </div>
                    </div>
                    <div className="p-20 space-y-20 bg-slate-50/50">
                       <p className="text-3xl text-slate-800 leading-relaxed font-serif italic border-l-[12px] border-emerald-600 pl-16 py-4">{aiReport.summary}</p>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                          <div className="bg-rose-50 p-14 rounded-[4rem] border border-rose-100 shadow-sm space-y-8">
                             <h4 className="text-2xl font-black uppercase italic text-rose-900 flex items-center gap-4"><AlertTriangle className="w-8 h-8" /> Risques Critiques</h4>
                             <div className="space-y-4">
                               {aiReport.criticalAlerts.map((a,i) => <div key={i} className="flex gap-4 p-5 bg-white/60 rounded-3xl text-rose-900 font-bold uppercase text-[12px] italic border border-rose-200/50 shadow-sm"><Zap className="w-5 h-5 shrink-0" /> {a}</div>)}
                             </div>
                          </div>
                          <div className="bg-emerald-50 p-14 rounded-[4rem] border border-emerald-100 shadow-sm space-y-8">
                             <h4 className="text-2xl font-black uppercase italic text-emerald-900 flex items-center gap-4"><CheckCircle className="w-8 h-8" /> Recommandations</h4>
                             <div className="space-y-4">
                               {aiReport.recommendations.map((r,i) => <div key={i} className="flex gap-4 p-5 bg-white/60 rounded-3xl text-emerald-900 font-bold uppercase text-[12px] italic border border-emerald-200/50 shadow-sm"><ArrowUpRight className="w-5 h-5 shrink-0" /> {r}</div>)}
                             </div>
                          </div>
                       </div>
                       <button onClick={() => window.print()} className="w-full py-10 bg-slate-900 text-white rounded-[3rem] font-black uppercase tracking-[0.3em] no-print hover:bg-black transition-all shadow-2xl flex items-center justify-center gap-6 text-lg"><Printer className="w-8 h-8" /> Imprimer le Rapport Certifié</button>
                    </div>
                 </div>
               )}
            </div>
          </div>
        )}

        {activeView === 'studio' && (
          <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500">
             <div className="bg-white p-14 border rounded-[4rem] shadow-sm space-y-10">
                <div className="flex items-center gap-6">
                  <div className="p-6 bg-emerald-50 text-emerald-600 rounded-[2.5rem] shadow-inner"><ImageIcon className="w-12 h-12" /></div>
                  <div>
                    <h3 className="text-4xl font-black italic uppercase text-slate-900 tracking-tighter">Studio Photo Pro</h3>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Visualisation assistée par IA pour catalogue</p>
                  </div>
                </div>
                <textarea 
                  id="studio-prompt"
                  placeholder="Décrivez l'actif à visualiser (ex: Un bureau de direction moderne en bois précieux, haute résolution, éclairage studio)..." 
                  className="w-full p-10 bg-slate-50 border-none rounded-[3rem] font-bold text-slate-900 outline-none min-h-[200px] focus:ring-4 focus:ring-emerald-500/10 transition-all text-xl"
                />
                <button 
                  onClick={() => {
                    const p = (document.getElementById('studio-prompt') as HTMLTextAreaElement).value;
                    if (p) handleStudioGeneration(p);
                  }}
                  disabled={isAiLoading}
                  className="w-full py-8 bg-[#004a23] text-white rounded-[3rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl flex items-center justify-center gap-6 hover:bg-black transition-all"
                >
                  {isAiLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Sparkles className="w-8 h-8" />} Générer le Visuel Haute Fidélité
                </button>
                
                {generatedImageUrl && (
                  <div className="mt-14 rounded-[4rem] overflow-hidden border-[16px] border-white shadow-2xl animate-in zoom-in-95 duration-1000 bg-slate-50 p-6">
                    <img src={generatedImageUrl} alt="Rendu de l'actif" className="w-full h-auto rounded-[2.5rem] shadow-2xl" />
                    <div className="mt-8 flex justify-between items-center px-4">
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Rendu généré par Gemini Visual Studio</p>
                       <a href={generatedImageUrl} download="rendu_erp.png" className="flex items-center gap-3 px-8 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg">
                         <Download className="w-5 h-5" /> Télécharger
                       </a>
                    </div>
                  </div>
                )}
             </div>
          </div>
        )}
      </main>

      {/* MODALS */}
      {isLogoutModalOpen && (
        <Modal onClose={() => setIsLogoutModalOpen(false)} title="Confirmer la Déconnexion">
          <div className="text-center space-y-8">
            <div className="inline-flex p-8 bg-rose-50 text-rose-600 rounded-[3rem] shadow-inner">
              <LogOut className="w-16 h-16" />
            </div>
            <div className="space-y-4">
              <h4 className="text-3xl font-black italic uppercase text-slate-900 tracking-tighter">Terminer la Session ?</h4>
              <p className="text-slate-400 font-bold uppercase text-[11px] tracking-widest max-w-sm mx-auto leading-relaxed">
                Toutes les modifications non enregistrées localement seront perdues. L'accès sécurisé devra être ré-authentifié.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6 pt-6">
              <button 
                onClick={() => setIsLogoutModalOpen(false)}
                className="py-6 bg-slate-50 text-slate-400 rounded-3xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-all"
              >
                Annuler
              </button>
              <button 
                onClick={() => {
                  setIsLoggedIn(false);
                  setIsLogoutModalOpen(false);
                }}
                className="py-6 bg-rose-600 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-700 shadow-xl shadow-rose-600/20 transition-all"
              >
                Confirmer Déconnexion
              </button>
            </div>
          </div>
        </Modal>
      )}

      {isProductModalOpen && (
        <Modal onClose={() => setIsProductModalOpen(false)} title={editingItem ? "Fiche Technique Article" : "Nouvel Article Consommable"}>
           <form onSubmit={(e) => {
             e.preventDefault();
             const fd = new FormData(e.currentTarget);
             const newItem: Product = {
               id: (editingItem as Product)?.id || Math.random().toString(36).substr(2, 9),
               name: fd.get('name') as string,
               category: fd.get('category') as string || 'Général',
               currentStock: Number(fd.get('currentStock')),
               minStock: Number(fd.get('minStock')),
               monthlyNeed: 10,
               unit: fd.get('unit') as string,
               unitPrice: Number(fd.get('unitPrice')),
               currency: 'Fc',
               siteId: sites[0].id,
               lastInventoryDate: new Date().toISOString()
             };
             if(!editingItem) addLog({ type: 'entry', productId: newItem.id, productName: newItem.name, changeAmount: newItem.currentStock, finalStock: newItem.currentStock });
             if(editingItem) setProducts(products.map(p => p.id === newItem.id ? newItem : p));
             else setProducts([...products, newItem]);
             setIsProductModalOpen(false);
             showToast("Données de stock synchronisées avec succès");
           }} className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4 col-span-2">
                <label className="text-[11px] font-black uppercase text-slate-400 ml-2">Désignation de l'Article</label>
                <input name="name" defaultValue={editingItem?.name} required className="w-full p-6 bg-slate-50 border-none rounded-3xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-emerald-500/10 text-lg italic" />
              </div>
              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase text-slate-400 ml-2">Classification / Catégorie</label>
                <select name="category" defaultValue={(editingItem as Product)?.category} className="w-full p-6 bg-slate-50 border-none rounded-3xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-emerald-500/10 uppercase italic">
                   {INITIAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase text-slate-400 ml-2">Unité de Mesure</label>
                <input name="unit" defaultValue={(editingItem as Product)?.unit} placeholder="Ex: Cartons" className="w-full p-6 bg-slate-50 border-none rounded-3xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-emerald-500/10 uppercase italic" />
              </div>
              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase text-slate-400 ml-2">Volume en Stock</label>
                <input type="number" name="currentStock" defaultValue={(editingItem as Product)?.currentStock || 0} required className="w-full p-6 bg-slate-50 border-none rounded-3xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-emerald-500/10 text-2xl tabular-nums" />
              </div>
              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase text-slate-400 ml-2">Prix de Valorisation (Fc)</label>
                <input type="number" name="unitPrice" defaultValue={(editingItem as Product)?.unitPrice || 0} required className="w-full p-6 bg-slate-50 border-none rounded-3xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-emerald-500/10 text-2xl tabular-nums" />
              </div>
              <button type="submit" className="col-span-2 py-8 bg-[#004a23] text-white rounded-[3rem] font-black uppercase text-sm tracking-[0.3em] shadow-2xl mt-10 hover:bg-black transition-all flex items-center justify-center gap-4"><Save className="w-6 h-6" /> Enregistrer l'Article</button>
           </form>
        </Modal>
      )}

      {isFurnitureModalOpen && (
        <Modal onClose={() => setIsFurnitureModalOpen(false)} title={editingItem ? "Dossier Immobilisé" : "Nouvel Actif Patrimonial"}>
           <form onSubmit={(e) => {
             e.preventDefault();
             const fd = new FormData(e.currentTarget);
             const newItem: Furniture = {
               id: (editingItem as Furniture)?.id || Math.random().toString(36).substr(2, 9),
               code: fd.get('code') as string,
               name: fd.get('name') as string,
               siteId: fd.get('siteId') as string,
               currentCount: Number(fd.get('currentCount')),
               previousCount: (editingItem as Furniture)?.currentCount || Number(fd.get('currentCount')),
               condition: fd.get('condition') as Furniture['condition'],
               lastChecked: new Date().toISOString(),
               assignedTo: fd.get('assignedTo') as string,
               purchasePrice: Number(fd.get('purchasePrice')),
               purchaseDate: fd.get('purchaseDate') as string
             };
             if(editingItem) setFurniture(furniture.map(f => f.id === newItem.id ? newItem : f));
             else setFurniture([...furniture, newItem]);
             setIsFurnitureModalOpen(false);
             showToast("Patrimoine mis à jour dans le registre central");
           }} className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4 col-span-2">
                <label className="text-[11px] font-black uppercase text-slate-400 ml-2">Code d'Inventaire / Barcode Tag</label>
                <input name="code" defaultValue={(editingItem as Furniture)?.code} required placeholder="AST-HQ-2025-..." className="w-full p-6 bg-slate-50 border-none rounded-3xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-emerald-500/10 font-mono text-lg" />
              </div>
              <div className="space-y-4 col-span-2">
                <label className="text-[11px] font-black uppercase text-slate-400 ml-2">Désignation de l'Actif</label>
                <input name="name" defaultValue={editingItem?.name} required className="w-full p-6 bg-slate-50 border-none rounded-3xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-emerald-500/10 text-lg italic" />
              </div>
              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase text-slate-400 ml-2">Affectation / Responsable</label>
                <input name="assignedTo" defaultValue={(editingItem as Furniture)?.assignedTo} placeholder="Ex: Bureau CEO" className="w-full p-6 bg-slate-50 border-none rounded-3xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-emerald-500/10 uppercase italic" />
              </div>
              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase text-slate-400 ml-2">Localisation / Hub</label>
                <select name="siteId" defaultValue={(editingItem as Furniture)?.siteId} className="w-full p-6 bg-slate-50 border-none rounded-3xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-emerald-500/10 italic">
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase text-slate-400 ml-2">État de Conservation</label>
                <select name="condition" defaultValue={(editingItem as Furniture)?.condition} className="w-full p-6 bg-slate-50 border-none rounded-3xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-emerald-500/10 uppercase italic">
                  <option value="Neuf">Neuf (Certification ISO)</option>
                  <option value="Bon">Bon État Opérationnel</option>
                  <option value="Usé">Usé (Amortissement)</option>
                  <option value="Endommagé">Endommagé / Rebut</option>
                </select>
              </div>
              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase text-slate-400 ml-2">Quantité Décomptée</label>
                <input type="number" name="currentCount" defaultValue={(editingItem as Furniture)?.currentCount || 1} className="w-full p-6 bg-slate-50 border-none rounded-3xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-emerald-500/10 text-2xl tabular-nums" />
              </div>
              <button type="submit" className="col-span-2 py-8 bg-slate-900 text-white rounded-[3rem] font-black uppercase text-sm tracking-[0.3em] shadow-2xl mt-10 hover:bg-black transition-all flex items-center justify-center gap-4"><FileCheck className="w-6 h-6" /> Certifier l'Immobilisation</button>
           </form>
        </Modal>
      )}

      {/* GLOBAL TOAST */}
      {notification && (
        <div className={`fixed bottom-12 right-12 z-[200] px-12 py-8 rounded-[3rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.4)] flex items-center gap-6 bg-white border-2 animate-in slide-in-from-right-10 ${notification.type === 'error' ? 'text-rose-600 border-rose-100' : 'text-emerald-600 border-emerald-100'}`}>
          <div className={`p-3 rounded-2xl shadow-inner ${notification.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
            {notification.type === 'success' ? <ShieldCheck className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
          </div>
          <span className="text-[14px] font-black uppercase tracking-widest text-slate-900 italic">{notification.message}</span>
        </div>
      )}
    </div>
  );
};

// --- Atomic Sub-Components ---

const NavItem = ({ active, onClick, icon: Icon, label }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-6 px-10 py-7 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.3em] transition-all duration-300 ${active ? 'bg-white text-[#004a23] shadow-2xl scale-[1.05]' : 'text-emerald-100/30 hover:bg-white/5 hover:text-white'}`}>
    <Icon className={`w-7 h-7 transition-transform duration-500 ${active ? 'scale-110' : 'scale-90'}`} /> {label}
  </button>
);

const StatCard = ({ label, value, icon: Icon, color, trend, alert }: any) => (
  <div className={`bg-white p-12 border rounded-[4rem] shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden ${alert ? 'border-rose-100' : ''}`}>
    <div className={`absolute top-0 right-0 p-10 opacity-5 group-hover:scale-125 transition-transform duration-1000 ${alert ? 'text-rose-500' : 'text-slate-400'}`}><Icon className="w-32 h-32" /></div>
    <div className={`p-6 bg-${color}-50 text-${color}-600 rounded-[1.8rem] w-max mb-10 group-hover:rotate-12 transition-transform shadow-inner`}><Icon className="w-10 h-10" /></div>
    <div className="relative z-10">
      <div className="flex justify-between items-end mb-2">
        <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        {trend && <span className={`text-[10px] font-black uppercase ${trend.startsWith('+') ? 'text-emerald-500' : 'text-slate-300'}`}>{trend}</span>}
      </div>
      <h4 className={`text-5xl font-black italic tracking-tighter tabular-nums ${alert ? 'text-rose-600' : 'text-slate-900'}`}>{value}</h4>
    </div>
  </div>
);

const WorkflowBtn = ({ label, onClick, icon: Icon }: any) => (
  <button onClick={onClick} className="w-full flex items-center justify-between p-7 bg-slate-50 rounded-[2.5rem] border hover:bg-white hover:shadow-2xl hover:border-emerald-500 transition-all group">
    <div className="flex items-center gap-6">
      <div className="p-5 bg-white rounded-2xl shadow-sm text-slate-400 group-hover:text-emerald-600 group-hover:scale-110 transition-all shadow-inner"><Icon className="w-6 h-6" /></div>
      <span className="text-[12px] font-black uppercase text-slate-900 italic tracking-tighter">{label}</span>
    </div>
    <ChevronRight className="w-6 h-6 text-slate-300 group-hover:translate-x-2 transition-transform" />
  </button>
);

const ImportCard = ({ title, desc, icon: Icon, color, onFileChange, loading }: any) => (
  <div className={`bg-white p-16 border-[6px] border-dashed border-slate-100 rounded-[5rem] text-center space-y-10 hover:border-${color}-500 transition-all cursor-pointer relative overflow-hidden group shadow-sm hover:shadow-2xl`}>
    {loading && (
      <div className="absolute inset-0 bg-white/90 backdrop-blur-md z-20 flex flex-col items-center justify-center gap-6">
        <Loader2 className="w-16 h-16 text-emerald-600 animate-spin" />
        <p className="text-[11px] font-black uppercase text-emerald-600 tracking-[0.5em] animate-pulse">Traitement AI Vision En Cours...</p>
      </div>
    )}
    <div className={`absolute inset-0 bg-${color}-50/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
    <div className="relative z-10">
      <div className={`w-32 h-32 bg-${color}-50 text-${color}-600 rounded-[3rem] flex items-center justify-center mx-auto mb-12 group-hover:scale-110 transition-transform shadow-inner`}><Icon className="w-16 h-16" /></div>
      <h3 className="text-4xl font-black italic uppercase text-slate-900 tracking-tighter">{title}</h3>
      <p className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-3">{desc}</p>
      <input type="file" onChange={onFileChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*,.csv" />
    </div>
  </div>
);

const Modal = ({ children, onClose, title }: any) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-900/95 backdrop-blur-3xl no-print animate-in fade-in duration-300">
    <div className="bg-white w-full max-w-5xl rounded-[6rem] shadow-[0_60px_120px_-30px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-500 overflow-hidden max-h-[94vh] flex flex-col border border-white/20">
      <div className="px-20 py-16 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center shrink-0">
        <div>
          <h3 className="text-4xl font-black italic uppercase text-slate-900 tracking-tighter leading-none">{title}</h3>
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-[0.4em] mt-3 flex items-center gap-3"><ShieldCheck className="w-4 h-4" /> Zone de Certification ERP</p>
        </div>
        <button onClick={onClose} className="p-5 text-slate-300 hover:text-slate-900 transition-all bg-white rounded-[2rem] border shadow-2xl active:scale-90"><X className="w-10 h-10" /></button>
      </div>
      <div className="px-20 py-16 overflow-y-auto custom-scrollbar flex-1">{children}</div>
    </div>
  </div>
);

export default App;

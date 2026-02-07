
import React, { useState, useEffect, useMemo } from 'react';
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
  Cpu, HardDrive, Share2, ToggleLeft as Toggle, ChevronDown
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart as RePieChart, Pie } from 'recharts';
import { Product, InventoryLog, ViewType, Site, Furniture, RapportAutomatique } from './types';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_FURNITURE } from './constants';
import { getProfessionalReport, extractDataFromImage, generateProductImage } from './services/geminiService';

// Fix for Error 1: Define viewLabels mapping
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
  
  // États UI
  const [searchTerm, setSearchTerm] = useState('');
  const [historyFilterType, setHistoryFilterType] = useState<string>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isImportLoading, setIsImportLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState<RapportAutomatique | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  // États Paramètres
  const [settingsToggles, setSettingsToggles] = useState({
    autoArchive: true,
    emailAlerts: true,
    cloudSync: false,
    aiOptimization: true,
    twoFactor: true
  });

  // Modales & Edition
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isFurnitureModalOpen, setIsFurnitureModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Product | Furniture | null>(null);

  // Implementation of handleStudioGeneration and its state
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
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

  // Persistence locale
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

  // Logique métier
  const addHistory = (log: Omit<InventoryLog, 'id' | 'date'>) => {
    const newLog: InventoryLog = {
      ...log,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      responsible: 'Admin_Pro'
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
          lastInventoryDate: new Date().toISOString()
        })) as Product[];
        setProducts(prev => [...prev, ...newProducts]);
        showToast(`${newProducts.length} articles identifiés et importés automatiquement`);
      } catch (e) {
        showToast("Échec de la reconnaissance visuelle automatique", "error");
      } finally {
        setIsImportLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const COLORS = ['#004a23', '#00703c', '#008f4c', '#00aa5b', '#00c76a', '#10b981'];

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
                <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-slate-500"><TrendingUp className="w-4 h-4 text-emerald-600" /> Journal de Traçabilité Récent</h3>
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
                <WorkflowBtn label="Extraction Vision" onClick={() => setActiveView('import')} icon={Camera} />
                <WorkflowBtn label="Recensement Mobilier" onClick={() => setActiveView('furniture')} icon={ClipboardList} />
                <WorkflowBtn label="Visualisation Studio" onClick={() => setActiveView('studio')} icon={ImageIcon} />
              </div>
           </div>
           <div className="bg-[#004a23] p-10 rounded-[3rem] text-white shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-150 transition-transform duration-1000" />
              <div className="relative z-10 space-y-4">
                <ShieldCheck className="w-10 h-10 text-emerald-400" />
                <h4 className="text-xl font-black italic uppercase leading-tight">Système de Sécurité Audit Actif</h4>
                <p className="text-[10px] font-medium text-emerald-100/60 leading-relaxed uppercase tracking-widest">Base de données synchronisée et certifiée ISO-9001 simulation.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );

  const InventoryView = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-6 bg-white p-8 border rounded-[3rem] shadow-sm">
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
        <button onClick={() => {setEditingItem(null); setIsProductModalOpen(true);}} className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-black shadow-xl transition-all"><Plus className="w-5 h-5" /> Ajouter Consommable</button>
      </div>

      <div className="bg-white border rounded-[3.5rem] overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            <tr>
              <th className="px-10 py-6">Désignation & Catégorie</th>
              <th className="px-10 py-6 text-center">Niveau de Stock</th>
              <th className="px-10 py-6 text-center">Unité</th>
              <th className="px-10 py-6 text-right">Valeur Unitaire</th>
              <th className="px-10 py-6 text-right">Valeur Totale</th>
              <th className="px-10 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
              <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-10 py-6">
                  <p className="font-black text-slate-900 uppercase italic group-hover:text-emerald-700 transition-colors">{p.name}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-widest">{p.category}</p>
                </td>
                <td className="px-10 py-6 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className={`text-xl font-black tabular-nums ${p.currentStock <= p.minStock ? 'text-rose-600' : 'text-slate-900'}`}>{p.currentStock}</span>
                    {p.currentStock <= p.minStock && <span className="text-[8px] font-black uppercase text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">Alerte Seuil</span>}
                  </div>
                </td>
                <td className="px-10 py-6 text-center font-bold text-slate-400 uppercase text-[10px]">{p.unit}</td>
                <td className="px-10 py-6 text-right font-black text-slate-900 tabular-nums">{p.unitPrice.toLocaleString()} Fc</td>
                <td className="px-10 py-6 text-right font-black text-emerald-700 tabular-nums">{(p.currentStock * p.unitPrice).toLocaleString()} Fc</td>
                <td className="px-10 py-6 text-right space-x-2">
                   <button onClick={() => {setEditingItem(p); setIsProductModalOpen(true);}} className="p-3 text-blue-500 hover:bg-blue-50 rounded-xl"><Edit2 className="w-4 h-4" /></button>
                   <button onClick={() => setProducts(products.filter(x => x.id !== p.id))} className="p-3 text-rose-300 hover:text-rose-600 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Profil & Sécurité */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-white p-12 border rounded-[4rem] shadow-sm space-y-10">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-emerald-50 text-emerald-600 rounded-[2rem] shadow-inner"><User className="w-10 h-10" /></div>
            <div>
              <h3 className="text-3xl font-black italic uppercase text-slate-900 tracking-tighter">Profil Administrateur Pro</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identité & Certificats de Sécurité ERP</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <SettingsInput label="Nom Complet" value="Admin_Pro_SS" />
            <SettingsInput label="Adresse E-mail" value="superviseur@smartstock.pro" />
            <SettingsInput label="Rôle Système" value="Super-Administrateur" disabled />
            <SettingsInput label="Clé de Signature" value="************" type="password" />
          </div>
          <div className="pt-8 border-t flex flex-wrap gap-4">
             <button className="px-10 py-4 bg-emerald-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-emerald-800 transition-all">Mettre à jour le profil</button>
             <button className="px-10 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"><Key className="w-4 h-4" /> Changer le mot de passe</button>
          </div>
        </div>

        <div className="bg-[#004a23] p-12 rounded-[4rem] text-white space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-400/20" />
          <h4 className="text-xl font-black uppercase italic tracking-tight flex items-center gap-3"><ShieldCheck className="w-6 h-6 text-emerald-400" /> Sécurité ERP</h4>
          <div className="space-y-6">
             <ToggleItem 
               label="Authentification 2FA" 
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
        </div>
      </div>

      {/* Gestion des Sites & Logistique */}
      <div className="bg-white p-12 border rounded-[4rem] shadow-sm space-y-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-blue-50 text-blue-600 rounded-[2rem] shadow-inner"><Building2 className="w-10 h-10" /></div>
            <div>
              <h3 className="text-3xl font-black italic uppercase text-slate-900 tracking-tighter">Réseau Logistique</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Maillage des sites d'exploitation et entrepôts</p>
            </div>
          </div>
          <button className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-3"><Plus className="w-5 h-5" /> Nouveau Site</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {sites.map(s => (
             <div key={s.id} className="p-8 bg-slate-50 border rounded-[3rem] group hover:border-blue-500 hover:shadow-xl transition-all cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm"><MapPin className="w-5 h-5 text-blue-500" /></div>
                  <button className="p-2 text-rose-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
                <h5 className="text-[14px] font-black uppercase text-slate-900 italic mb-1">{s.name}</h5>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Status: Opérationnel • 248 Actifs</p>
             </div>
           ))}
        </div>
      </div>

      {/* Paramètres Système & Données */}
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
               label="Optimisation de Stock AI" 
               desc="Proposer des commandes basées sur l'usage" 
               active={settingsToggles.aiOptimization} 
               onClick={() => setSettingsToggles({...settingsToggles, aiOptimization: !settingsToggles.aiOptimization})}
               dark
             />
             <ToggleItem 
               label="Archivage Automatique" 
               desc="Archiver les flux de plus de 12 mois" 
               active={settingsToggles.autoArchive} 
               onClick={() => setSettingsToggles({...settingsToggles, autoArchive: !settingsToggles.autoArchive})}
               dark
             />
             <ToggleItem 
               label="Alertes E-mail Prioritaires" 
               desc="Notifications de seuils critiques par mail" 
               active={settingsToggles.emailAlerts} 
               onClick={() => setSettingsToggles({...settingsToggles, emailAlerts: !settingsToggles.emailAlerts})}
               dark
             />
          </div>
        </div>

        <div className="bg-white p-12 border rounded-[4rem] shadow-sm space-y-10">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-slate-50 text-slate-400 rounded-[2rem] shadow-inner"><Database className="w-10 h-10" /></div>
            <div>
              <h3 className="text-3xl font-black italic uppercase text-slate-900 tracking-tighter">Données & Maintenance</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gestion du stockage et backups</p>
            </div>
          </div>
          <div className="p-8 bg-slate-50 rounded-[3rem] border space-y-6">
             <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <HardDrive className="w-5 h-5 text-slate-400" />
                  <span className="text-[11px] font-black uppercase text-slate-900">Occupation Base de Données</span>
                </div>
                <span className="text-[11px] font-black text-emerald-600">4.2 MB / 100 MB</span>
             </div>
             <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[4.2%]" />
             </div>
             <div className="grid grid-cols-2 gap-4 pt-4">
                <button className="py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all">
                  <Share2 className="w-4 h-4" /> Exporter (JSON)
                </button>
                <button className="py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
                  <RefreshCw className="w-4 h-4" /> Restaurer
                </button>
             </div>
          </div>
          <div className="bg-rose-50 p-6 rounded-[2.5rem] border border-rose-100 flex items-start gap-4">
             <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-1" />
             <div>
                <p className="text-[11px] font-black uppercase text-rose-900">Zone Critique de Suppression</p>
                <p className="text-[10px] font-medium text-rose-700 leading-tight mt-1">L'effacement des données est irréversible. Toutes les traces d'audit seront perdues.</p>
                <button className="mt-4 text-[9px] font-black uppercase text-rose-600 hover:underline">Réinitialiser tout le système</button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );

  const SettingsInput = ({ label, value, type = "text", disabled = false }: any) => (
    <div className="space-y-3">
      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">{label}</label>
      <input 
        type={type} 
        defaultValue={value} 
        disabled={disabled}
        className={`w-full p-5 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} 
      />
    </div>
  );

  const ToggleItem = ({ label, desc, active, onClick, disabled, dark }: any) => (
    <div className={`flex items-center justify-between gap-6 ${disabled ? 'opacity-30' : ''}`}>
      <div className="flex-1">
        <p className={`text-[12px] font-black uppercase italic ${dark ? 'text-slate-900' : 'text-white'}`}>{label}</p>
        <p className={`text-[9px] font-bold ${dark ? 'text-slate-400' : 'text-emerald-100/50'} uppercase mt-0.5`}>{desc}</p>
      </div>
      <button 
        onClick={onClick}
        disabled={disabled}
        className={`w-14 h-8 rounded-full transition-all relative ${active ? 'bg-emerald-400' : (dark ? 'bg-slate-200' : 'bg-white/10')}`}
      >
        <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-xl transition-all ${active ? 'left-7' : 'left-1'}`} />
      </button>
    </div>
  );

  // Vue Login
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
        <p className="text-[9px] font-black uppercase text-slate-300 tracking-widest italic pt-4">© 2025 SmartStock Engineering • All Rights Reserved</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Sidebar de luxe */}
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
          <NavItem active={activeView === 'settings'} onClick={() => {setActiveView('settings'); setIsSidebarOpen(false);}} icon={SettingsIcon} label="Paramètres" />
        </nav>
        <div className="mt-10 pt-8 border-t border-white/10">
          <button onClick={() => setIsLoggedIn(false)} className="w-full py-5 bg-rose-600/10 text-rose-300 rounded-3xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center gap-3">
            <LogOut className="w-5 h-5" /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-10 lg:p-14 lg:ml-80 overflow-y-auto relative no-print:bg-[#f8fafc] print:p-0 print:ml-0">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-14 gap-6 no-print">
          <div>
            <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-4 bg-white border rounded-2xl shadow-sm"><Menu className="w-6 h-6" /></button>
              <h2 className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter">{viewLabels[activeView]}</h2>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">Système de gestion industrielle opérationnel</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
             <div className="hidden lg:flex items-center gap-2 px-6 py-3 bg-white border rounded-2xl shadow-sm">
                <Globe className="w-4 h-4 text-emerald-600" />
                <span className="text-[10px] font-black uppercase text-slate-900 tracking-widest">DRC_HQ_01</span>
             </div>
             <button onClick={() => window.print()} className="p-5 bg-white border rounded-[1.5rem] text-slate-400 hover:text-emerald-600 hover:border-emerald-200 shadow-sm transition-all"><Printer className="w-6 h-6" /></button>
             <div className="h-12 w-px bg-slate-200" />
             <div className="flex items-center gap-4 bg-white p-2.5 pr-7 border rounded-[1.8rem] shadow-sm hover:shadow-lg transition-all cursor-pointer">
                <div className="w-12 h-12 bg-[#004a23] rounded-[1.2rem] flex items-center justify-center text-white font-black text-sm italic">AD</div>
                <div className="hidden sm:block">
                  <p className="text-[11px] font-black uppercase text-slate-900 leading-none">Admin ERP</p>
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
               title="Vision Automatique" 
               desc="Extraction par reconnaissance visuelle" 
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
                    <div className="inline-flex p-6 bg-slate-50 text-slate-300 rounded-[2.5rem] group-hover:scale-110 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all">
                      <BarChart3 className="w-16 h-16" />
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-4xl font-black italic uppercase text-slate-900 tracking-tighter">Certification Logistique Automatique</h3>
                      <p className="text-slate-400 font-medium max-w-xl mx-auto leading-relaxed">
                        Générez un document d'audit complet incluant analyses financières, graphiques de performance et recommandations stratégiques automatiques.
                      </p>
                    </div>
                    <button onClick={handleGenerateReport} disabled={isAiLoading} className="px-16 py-6 bg-[#004a23] text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.25em] shadow-2xl hover:bg-black hover:-translate-y-1 transition-all flex items-center justify-center gap-4 mx-auto disabled:opacity-50">
                      {isAiLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldCheck className="w-6 h-6" />} {isAiLoading ? "Traitement Automatique..." : "Générer le Rapport Officiel"}
                    </button>
                 </div>
               ) : (
                 <div className="bg-white border rounded-[4rem] shadow-2xl overflow-hidden print:shadow-none print:rounded-none print:border-none animate-in slide-in-from-bottom-12 duration-1000">
                    <div className="bg-[#004a23] p-16 text-white">
                       <h1 className="text-8xl font-black italic uppercase tracking-tighter leading-none">Rapport d'Audit</h1>
                       <p className="text-2xl font-bold uppercase opacity-60 mt-4">Système SmartStock Pro</p>
                    </div>
                    <div className="p-16 space-y-10">
                       <p className="text-2xl text-slate-700 leading-relaxed font-serif italic border-l-8 border-emerald-600 pl-10">{aiReport.summary}</p>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div className="bg-rose-50 p-10 rounded-[3rem] border border-rose-100">
                             <h4 className="text-xl font-black uppercase italic text-rose-900 mb-6">Urgences d'Audit</h4>
                             {aiReport.criticalAlerts.map((a,i) => <div key={i} className="mb-3 text-rose-800 font-bold uppercase text-[11px]">• {a}</div>)}
                          </div>
                          <div className="bg-emerald-50 p-10 rounded-[3rem] border border-emerald-100">
                             <h4 className="text-xl font-black uppercase italic text-emerald-900 mb-6">Recommandations</h4>
                             {aiReport.recommendations.map((r,i) => <div key={i} className="mb-3 text-emerald-800 font-bold uppercase text-[11px]">• {r}</div>)}
                          </div>
                       </div>
                       <button onClick={() => window.print()} className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-widest no-print">Imprimer / PDF</button>
                    </div>
                 </div>
               )}
            </div>
          </div>
        )}

        {activeView === 'studio' && (
          <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500">
             <div className="bg-white p-14 border rounded-[4rem] shadow-sm space-y-10">
                <div className="flex items-center gap-5">
                  <div className="p-5 bg-emerald-50 text-emerald-600 rounded-[2rem]"><ImageIcon className="w-10 h-10" /></div>
                  <div>
                    <h3 className="text-3xl font-black italic uppercase text-slate-900 tracking-tighter">Studio Photo Automatique</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Génération de visuels catalogue par automatique</p>
                  </div>
                </div>
                <textarea 
                  id="studio-prompt"
                  placeholder="Décrivez l'actif à visualiser (ex: Bureau exécutif en chêne sombre, éclairage doux)..." 
                  className="w-full p-8 bg-slate-50 border-none rounded-[2.5rem] font-bold text-slate-900 outline-none min-h-[150px] focus:ring-4 focus:ring-emerald-500/10 transition-all text-lg"
                />
                <button 
                  onClick={() => {
                    const p = (document.getElementById('studio-prompt') as HTMLTextAreaElement).value;
                    if (p) handleStudioGeneration(p);
                  }}
                  disabled={isAiLoading}
                  className="w-full py-7 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-2xl flex items-center justify-center gap-4 hover:bg-black transition-all"
                >
                  {isAiLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />} Générer le Visuel Professionnel
                </button>
                
                {generatedImageUrl && (
                  <div className="mt-10 rounded-[3rem] overflow-hidden border-8 border-white shadow-2xl animate-in zoom-in-95 duration-700 bg-slate-50 p-4">
                    <img src={generatedImageUrl} alt="Rendu de l'actif" className="w-full h-auto rounded-[2rem]" />
                    <div className="mt-4 flex justify-end">
                       <a href={generatedImageUrl} download="rendu_studio.png" className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-600 hover:text-emerald-800">
                         <Download className="w-4 h-4" /> Télécharger le rendu
                       </a>
                    </div>
                  </div>
                )}
             </div>
          </div>
        )}
      </main>

      {/* Modales ERP */}
      {isProductModalOpen && (
        <Modal onClose={() => setIsProductModalOpen(false)} title={editingItem ? "Fiche Technique Article" : "Nouvelle Fiche Consommable"}>
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
             if(!editingItem) {
               addHistory({ type: 'entry', productId: newItem.id, productName: newItem.name, changeAmount: newItem.currentStock, finalStock: newItem.currentStock });
             }
             if(editingItem) setProducts(products.map(p => p.id === newItem.id ? newItem : p));
             else setProducts([...products, newItem]);
             setIsProductModalOpen(false);
             showToast("Synchronisation des données de stock terminée");
           }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3 col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Désignation Officielle</label>
                <input name="name" defaultValue={editingItem?.name} required className="w-full p-5 bg-slate-50 border rounded-2xl font-bold text-slate-900 outline-none" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Catégorie</label>
                <select 
                  name="category" 
                  defaultValue={(editingItem as Product)?.category} 
                  className="w-full p-5 bg-slate-50 border rounded-2xl font-bold text-slate-900 outline-none"
                >
                   {INITIAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Unité de Mesure</label>
                <input name="unit" defaultValue={(editingItem as Product)?.unit} placeholder="Ex: Cartons" className="w-full p-5 bg-slate-50 border rounded-2xl font-bold text-slate-900 outline-none" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Stock Actuel</label>
                <input type="number" name="currentStock" defaultValue={(editingItem as Product)?.currentStock || 0} required className="w-full p-5 bg-slate-50 border rounded-2xl font-bold text-slate-900 outline-none" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Prix Unitaire (Fc)</label>
                <input type="number" name="unitPrice" defaultValue={(editingItem as Product)?.unitPrice || 0} required className="w-full p-5 bg-slate-50 border rounded-2xl font-bold text-slate-900 outline-none" />
              </div>
              <button type="submit" className="col-span-2 py-6 bg-[#004a23] text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl mt-6">Enregistrer en Base</button>
           </form>
        </Modal>
      )}

      {isFurnitureModalOpen && (
        <Modal onClose={() => setIsFurnitureModalOpen(false)} title={editingItem ? "Dossier Immobilisé" : "Nouvel Actif Immobilisé"}>
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
             showToast("Données patrimoniales sécurisées");
           }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3 col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Code Inventaire Barcode/Tag</label>
                <input name="code" defaultValue={(editingItem as Furniture)?.code} required placeholder="AST-0000-ERP" className="w-full p-5 bg-slate-50 border rounded-2xl font-bold text-slate-900 outline-none" />
              </div>
              <div className="space-y-3 col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Désignation de l'Actif</label>
                <input name="name" defaultValue={editingItem?.name} required className="w-full p-5 bg-slate-50 border rounded-2xl font-bold text-slate-900 outline-none" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Affectation / Département</label>
                <input name="assignedTo" defaultValue={(editingItem as Furniture)?.assignedTo} placeholder="Ex: Finance" className="w-full p-5 bg-slate-50 border rounded-2xl font-bold text-slate-900 outline-none" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Site</label>
                <select name="siteId" defaultValue={(editingItem as Furniture)?.siteId} className="w-full p-5 bg-slate-50 border rounded-2xl font-bold text-slate-900 outline-none">
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">État Physique</label>
                <select name="condition" defaultValue={(editingItem as Furniture)?.condition} className="w-full p-5 bg-slate-50 border rounded-2xl font-bold text-slate-900 outline-none">
                  <option value="Neuf">Neuf</option>
                  <option value="Bon">Bon état</option>
                  <option value="Usé">Usé</option>
                  <option value="Endommagé">Endommagé</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Quantité Totale</label>
                <input type="number" name="currentCount" defaultValue={(editingItem as Furniture)?.currentCount || 1} className="w-full p-5 bg-slate-50 border rounded-2xl font-bold text-slate-900 outline-none" />
              </div>
              <button type="submit" className="col-span-2 py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl mt-6">Enregistrer l'immobilisation</button>
           </form>
        </Modal>
      )}

      {notification && (
        <div className={`fixed bottom-12 right-12 z-[200] px-10 py-7 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] flex items-center gap-5 bg-white border-2 animate-in slide-in-from-right-10 ${notification.type === 'error' ? 'text-rose-600 border-rose-100' : 'text-emerald-600 border-emerald-100'}`}>
          {notification.type === 'success' ? <div className="p-2 bg-emerald-50 rounded-xl"><CheckCircle className="w-6 h-6" /></div> : <div className="p-2 bg-rose-50 rounded-xl"><ShieldAlert className="w-6 h-6" /></div>}
          <span className="text-[12px] font-black uppercase tracking-widest text-slate-900 italic">{notification.message}</span>
        </div>
      )}
    </div>
  );
};

// Composants Atomiques Internes
const NavItem = ({ active, onClick, icon: Icon, label }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-5 px-9 py-6 rounded-[2.2rem] text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-300 ${active ? 'bg-white text-[#004a23] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] scale-[1.03]' : 'text-emerald-100/30 hover:bg-white/5 hover:text-white'}`}>
    <Icon className={`w-6 h-6 transition-transform duration-500 ${active ? 'scale-110' : 'scale-90'}`} /> {label}
  </button>
);

const StatCard = ({ label, value, icon: Icon, color, trend, alert }: any) => (
  <div className={`bg-white p-10 border rounded-[3.5rem] shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden ${alert ? 'border-rose-100' : ''}`}>
    <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform ${alert ? 'text-rose-500' : 'text-slate-400'}`}><Icon className="w-24 h-24" /></div>
    <div className={`p-5 bg-${color}-50 text-${color}-600 rounded-[1.5rem] w-max mb-8 group-hover:rotate-12 transition-transform shadow-inner`}><Icon className="w-8 h-8" /></div>
    <div className="relative z-10">
      <div className="flex justify-between items-end mb-1">
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        {trend && <span className={`text-[9px] font-black uppercase ${trend.startsWith('+') ? 'text-emerald-500' : 'text-slate-300'}`}>{trend}</span>}
      </div>
      <h4 className={`text-4xl font-black italic tracking-tighter tabular-nums ${alert ? 'text-rose-600' : 'text-slate-900'}`}>{value}</h4>
    </div>
  </div>
);

const WorkflowBtn = ({ label, onClick, icon: Icon }: any) => (
  <button onClick={onClick} className="w-full flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border hover:bg-white hover:shadow-xl hover:border-emerald-500 transition-all group">
    <div className="flex items-center gap-5">
      <div className="p-4 bg-white rounded-2xl shadow-sm text-slate-400 group-hover:text-emerald-600 group-hover:scale-110 transition-all"><Icon className="w-5 h-5" /></div>
      <span className="text-[11px] font-black uppercase text-slate-900 italic tracking-tight">{label}</span>
    </div>
    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
  </button>
);

const ImportCard = ({ title, desc, icon: Icon, color, onFileChange, loading }: any) => (
  <div className={`bg-white p-14 border-4 border-dashed border-slate-100 rounded-[4rem] text-center space-y-8 hover:border-${color}-500 transition-all cursor-pointer relative overflow-hidden group shadow-sm hover:shadow-2xl`}>
    {loading && (
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
        <p className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.4em] animate-pulse">Analyse Vision Automatique...</p>
      </div>
    )}
    <div className={`absolute inset-0 bg-${color}-50/30 opacity-0 group-hover:opacity-100 transition-opacity`} />
    <div className="relative z-10">
      <div className={`w-28 h-28 bg-${color}-50 text-${color}-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 group-hover:scale-110 transition-transform shadow-inner`}><Icon className="w-12 h-12" /></div>
      <h3 className="text-3xl font-black italic uppercase text-slate-900 tracking-tighter">{title}</h3>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">{desc}</p>
      <input type="file" onChange={onFileChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*,.csv" />
    </div>
  </div>
);

const Modal = ({ children, onClose, title }: any) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-2xl no-print animate-in fade-in duration-300">
    <div className="bg-white w-full max-w-4xl rounded-[5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500 overflow-hidden max-h-[92vh] flex flex-col border border-white/20">
      <div className="px-16 py-12 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center shrink-0">
        <div>
          <h3 className="text-3xl font-black italic uppercase text-slate-900 tracking-tighter leading-none">{title}</h3>
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.3em] mt-2 flex items-center gap-2"><Lock className="w-3 h-3" /> Zone de Saisie Sécurisée</p>
        </div>
        <button onClick={onClose} className="p-4 text-slate-300 hover:text-slate-900 transition-all bg-white rounded-3xl border shadow-xl active:scale-90"><X className="w-8 h-8" /></button>
      </div>
      <div className="px-16 py-14 overflow-y-auto custom-scrollbar flex-1">{children}</div>
    </div>
  </div>
);

export default App;

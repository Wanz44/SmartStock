
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, Box, History as HistoryIcon, Plus, AlertTriangle, 
  Trash2, Search, X, DollarSign, Settings as SettingsIcon, Edit2, 
  Sparkles, Loader2, ShieldAlert, ShieldCheck, 
  Armchair, FileText, Camera, Upload, 
  ImageIcon, Globe, Activity, FileSpreadsheet,
  Printer, User, ArrowRightLeft, Factory, Truck, MapPin, 
  BrainCircuit, Microscope, Wand2, Zap, ScanFace, LogOut, ChevronDown, ChevronUp, Filter,
  BarChart as BarChartIcon, PieChart as PieChartIcon, 
  CheckCircle2, ChevronRight, Info, Database, Shield, Laptop, 
  Settings2, Wrench, Download, Calendar, Clock, TrendingUp,
  FileSearch,
  AlertCircle,
  Coins,
  ClipboardList,
  FileUp,
  RefreshCcw
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend 
} from 'recharts';
import { Product, InventoryLog, ViewType, Site, Furniture, RapportAutomatique, Supplier } from './types';
import { INITIAL_PRODUCTS, INITIAL_FURNITURE, INITIAL_CATEGORIES } from './constants';
import { getAutomatedReport, parseInventoryData } from './services/automationService';

const getStored = <T,>(key: string, defaultValue: T): T => {
  const saved = localStorage.getItem(key);
  if (!saved) return defaultValue;
  try { return JSON.parse(saved); } catch (e) { return defaultValue; }
};

// --- Professional UI Components ---

const Badge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    OPTIMAL: "bg-emerald-50 text-emerald-700 border-emerald-100",
    CRITIQUE: "bg-rose-50 text-rose-700 border-rose-100",
    RÉAPPRO: "bg-amber-50 text-amber-700 border-amber-100",
    VÉROUILLÉ: "bg-slate-100 text-slate-600 border-slate-200",
    NEUF: "bg-emerald-50 text-emerald-700 border-emerald-100",
    BON: "bg-blue-50 text-blue-700 border-blue-100",
    USÉ: "bg-amber-50 text-amber-700 border-amber-100",
    ENDOMMAGÉ: "bg-rose-50 text-rose-700 border-rose-100",
    ENTRY: "bg-emerald-50 text-emerald-700 border-emerald-100",
    EXIT: "bg-rose-50 text-rose-700 border-rose-100",
    TRANSFER: "bg-blue-50 text-blue-700 border-blue-100",
    ADJUSTMENT: "bg-slate-100 text-slate-600 border-slate-200"
  };
  return (
    <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter border flex items-center gap-1 w-max ${styles[status] || styles.OPTIMAL}`}>
      <div className={`w-1 h-1 rounded-full ${['CRITIQUE', 'ENDOMMAGÉ', 'RÉAPPRO', 'EXIT'].includes(status) ? (status === 'RÉAPPRO' ? 'bg-amber-600' : 'bg-rose-600') : 'bg-current'}`} />
      {status}
    </div>
  );
};

const NavItem = ({ active, onClick, icon: Icon, label }: any) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center gap-4 px-8 py-5 rounded-full font-black uppercase text-[10px] tracking-widest transition-all ${active ? 'bg-white text-[#143d21] shadow-xl scale-[1.02]' : 'text-white/60 hover:bg-white/5 hover:text-white translate-x-0 hover:translate-x-1'}`}
  >
    <Icon className={`w-4 h-4 ${active ? 'text-[#143d21]' : ''}`} />
    {label}
  </button>
);

// --- Sub-Views ---

const DashboardView = ({ products, furniture, history, setActiveView, exchangeRate }: any) => {
  const totalValFc = products.reduce((a: any, b: any) => {
    const price = b.currency === '$' ? b.unitPrice * exchangeRate : b.unitPrice;
    return a + (b.currentStock * price);
  }, 0);
  const totalValUsd = totalValFc / exchangeRate;
  
  const totalAssetsFc = furniture.reduce((a: any, b: any) => a + (b.purchasePrice || 0), 0);
  const totalAssetsUsd = totalAssetsFc / exchangeRate;
  
  const ruptures = products.filter((p: any) => p.currentStock <= p.minStock).length;

  const chartData = useMemo(() => {
    const stats: Record<string, number> = {};
    products.forEach(p => {
      const price = p.currency === '$' ? p.unitPrice * exchangeRate : p.unitPrice;
      stats[p.category] = (stats[p.category] || 0) + (p.currentStock * price);
    });
    return Object.entries(stats).map(([label, valeur]) => ({ label, valeur }));
  }, [products, exchangeRate]);

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          label="Valeur Consommables" 
          value={`${totalValFc.toLocaleString()} Fc`} 
          subValue={`${totalValUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })} $`}
          icon={DollarSign} 
          badge="RÉEL" 
        />
        <StatCard 
          label="Patrimoine Mobilier" 
          value={`${totalAssetsFc.toLocaleString()} Fc`} 
          subValue={`${totalAssetsUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })} $`}
          icon={Database} 
          badge={furniture.length > 0 ? "ACTIF" : "VIDE"} 
        />
        <StatCard label="Ruptures de Stock" value={ruptures} icon={AlertTriangle} alert={ruptures > 0} />
        <StatCard label="Actifs Gérés" value={furniture.length} icon={Armchair} badge="OPÉ" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-10 flex justify-between items-center border-b border-slate-50">
              <h3 className="text-xs font-black uppercase italic tracking-widest text-slate-500 flex items-center gap-3">
                <BarChartIcon className="w-4 h-4" /> Répartition par Catégorie (Fc)
              </h3>
            </div>
            <div className="p-10 h-[300px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} width={100} />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '15px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                      itemStyle={{ fontWeight: 900, color: '#143d21' }}
                      formatter={(value: number) => [`${value.toLocaleString()} Fc`, 'Valeur']}
                    />
                    <Bar dataKey="valeur" radius={[0, 8, 8, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#143d21' : '#10b981'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-30">
                  <PieChartIcon className="w-12 h-12 mb-4" />
                  <p className="text-[10px] font-black uppercase italic">Aucune donnée statistique</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-10 flex justify-between items-center border-b border-slate-50">
              <h3 className="text-xs font-black uppercase italic tracking-widest text-slate-500 flex items-center gap-3">
                <Activity className="w-4 h-4" /> Flux de Stock Récents
              </h3>
              <button onClick={() => setActiveView('history')} className="text-[8px] font-black uppercase underline tracking-widest text-slate-900">Journal Complet</button>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[400px] p-6 space-y-2">
              {history.slice(-10).reverse().map((log: any) => (
                <div key={log.id} className="flex items-center justify-between p-6 bg-slate-50/50 rounded-2xl group hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${log.changeAmount > 0 ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-200 text-slate-500'}`}>
                      {log.changeAmount > 0 ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                    <div>
                      <h5 className="text-[11px] font-black uppercase text-slate-900">{log.productName}</h5>
                      <p className="text-[8px] font-bold text-slate-500 uppercase tabular-nums">{new Date(log.date).toLocaleTimeString('fr-FR')}</p>
                    </div>
                  </div>
                  <div className={`text-sm font-black italic ${log.changeAmount > 0 ? 'text-emerald-500' : 'text-slate-900'}`}>
                    {log.changeAmount > 0 ? `+${log.changeAmount}` : log.changeAmount}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-[10px] font-black uppercase italic tracking-widest text-slate-500 px-4">Actions Rapides</h3>
          <WorkflowCard onClick={() => setActiveView('monthly_report')} icon={FileText} label="Générer Rapport Statistique" />
          <WorkflowCard onClick={() => setActiveView('import')} icon={FileSpreadsheet} label="Importation de Données" />
          <WorkflowCard onClick={() => setActiveView('furniture')} icon={Armchair} label="Inventaire Mobilier" />
          
          <div className="mt-10 p-10 bg-[#143d21] rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
            <ShieldCheck className="w-8 h-8 mb-6 text-emerald-400" />
            <h5 className="text-[11px] font-black uppercase tracking-widest mb-2 italic">Données Sécurisées</h5>
            <p className="text-[9px] font-medium text-emerald-100/70 leading-relaxed uppercase italic">Calculs algorithmiques locaux. Pas de dépendance externe.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, subValue, icon: Icon, alert, badge }: any) => (
  <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between h-full">
    <div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-6 ${alert ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-slate-400'}`}><Icon className="w-5 h-5" /></div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</p>
    </div>
    <div>
      <div className="flex justify-between items-end">
        <h4 className={`text-3xl font-black italic tracking-tighter leading-none ${alert ? 'text-rose-600' : 'text-slate-900'}`}>{value}</h4>
        {badge && <span className="text-[8px] font-black px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{badge}</span>}
      </div>
      {subValue && <p className="text-[11px] font-bold text-emerald-600 mt-2 uppercase italic tracking-tighter tabular-nums">{subValue}</p>}
    </div>
  </div>
);

// Fix for missing InventoryStat component
const InventoryStat = ({ label, value, icon: Icon, alert }: any) => (
  <div className={`bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 ${alert ? 'bg-rose-50/30' : ''}`}>
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${alert ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <h4 className={`text-xl font-black italic tracking-tighter tabular-nums ${alert ? 'text-rose-600' : 'text-slate-900'}`}>{value}</h4>
    </div>
  </div>
);

const WorkflowCard = ({ icon: Icon, label, onClick }: any) => (
  <button onClick={onClick} className="w-full p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm flex items-center justify-between group hover:border-[#143d21] transition-all">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-[#143d21] group-hover:text-white transition-all">
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-[10px] font-black uppercase italic tracking-tight text-slate-900">{label}</span>
    </div>
    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 transition-colors" />
  </button>
);

const InventoryView = ({ products, searchTerm, setSearchTerm, setIsEditModalOpen, setEditingProduct, handleExport, exchangeRate, onImportSuccess, showToast }: any) => {
  const [filterCategory, setFilterCategory] = useState('TOUTES');
  const [filterStatus, setFilterStatus] = useState('TOUS');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    return products.filter((p: any) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'TOUTES' || p.category === filterCategory;
      const status = p.currentStock === 0 ? 'CRITIQUE' : (p.currentStock <= p.minStock ? 'RÉAPPRO' : 'OPTIMAL');
      const matchesStatus = filterStatus === 'TOUS' || status === filterStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchTerm, filterCategory, filterStatus]);

  const totalValue = filtered.reduce((acc: number, p: any) => {
    const price = p.currency === '$' ? p.unitPrice * exchangeRate : p.unitPrice;
    return acc + (p.currentStock * price);
  }, 0);

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const items = parseInventoryData(content);
      if (items.length > 0) {
        const newProducts = items.map(item => ({
          ...item,
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          minStock: 5,
          monthlyNeed: 0,
          siteId: 'S1',
          lastInventoryDate: new Date().toISOString()
        }));
        onImportSuccess(newProducts as Product[]);
        showToast(`${newProducts.length} articles importés par fichier CSV`);
      } else {
        showToast("Le format du fichier semble incorrect ou vide", "error");
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <InventoryStat label="Articles Filtrés" value={filtered.length} icon={Box} />
        <InventoryStat label="Valeur du Filtre" value={`${totalValue.toLocaleString()} Fc`} icon={DollarSign} />
        <InventoryStat label="Alertes Stock" value={filtered.filter((p:any) => p.currentStock <= p.minStock).length} icon={Zap} alert={filtered.some((p:any) => p.currentStock <= p.minStock)} />
        <InventoryStat label="Ruptures" value={filtered.filter((p:any) => p.currentStock === 0).length} icon={ShieldAlert} alert={filtered.some((p:any) => p.currentStock === 0)} />
      </div>

      <div className="flex flex-col xl:flex-row gap-6 bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm no-print">
        <div className="flex-1 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#143d21] transition-colors" />
            <input 
              type="text" 
              placeholder="Chercher désignation, SKU..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-slate-50 border-none rounded-[1.5rem] text-xs font-black uppercase tracking-widest outline-none ring-offset-0 focus:ring-2 ring-[#143d21]/10 transition-all text-slate-900"
            />
          </div>
          
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-8 py-5 bg-slate-50 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer hover:bg-slate-100 transition-colors text-slate-800"
          >
            <option value="TOUTES">Catégories: Toutes</option>
            {INITIAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-8 py-5 bg-slate-50 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer hover:bg-slate-100 transition-colors text-slate-800"
          >
            <option value="TOUS">Statuts: Tous</option>
            <option value="OPTIMAL">Statut: Optimal</option>
            <option value="RÉAPPRO">Statut: Réappro</option>
            <option value="CRITIQUE">Statut: Critique</option>
          </select>
        </div>

        <div className="flex gap-4">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileImport} 
            accept=".csv,.txt" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-10 py-5 bg-emerald-50 text-emerald-800 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest flex items-center gap-3 hover:bg-emerald-100 transition-all border border-emerald-100"
          >
            <FileUp className="w-4 h-4" /> Importer
          </button>
          <button 
            onClick={() => handleExport()} 
            className="px-10 py-5 bg-slate-50 text-slate-700 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest flex items-center gap-3 hover:bg-slate-100 transition-all border border-slate-200"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button 
            onClick={() => { setEditingProduct(null); setIsEditModalOpen(true); }}
            className="px-10 py-5 bg-[#143d21] text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-3 hover:scale-[1.02] transition-all"
          >
            <Plus className="w-5 h-5" /> Nouvel Article
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/70 border-b border-slate-100">
            <tr className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">
              <th className="px-12 py-10">Référence / Produit</th>
              <th className="px-8 py-10">Classification</th>
              <th className="px-8 py-10">Inventaire / Seuil</th>
              <th className="px-8 py-10">Disponibilité</th>
              <th className="px-8 py-10 text-right">Valo. Unitaire</th>
              <th className="px-12 py-10 text-right">Valo. Totale</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-12 py-40 text-center">
                  <div className="max-w-xs mx-auto space-y-6 opacity-40">
                    <Database className="w-20 h-20 mx-auto text-slate-400" />
                    <p className="text-[11px] font-black uppercase italic tracking-widest text-slate-600">Aucun registre correspondant</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((p: any) => {
                const priceInFc = p.currency === '$' ? p.unitPrice * exchangeRate : p.unitPrice;
                return (
                  <tr key={p.id} className="group hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => { setEditingProduct(p); setIsEditModalOpen(true); }}>
                    <td className="px-12 py-10">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-slate-200 rounded-[1.2rem] flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:shadow-sm transition-all overflow-hidden">
                          <Box className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-[7px] font-black text-slate-500 uppercase tracking-tighter mb-1">SKU-{p.id.slice(-8).toUpperCase()}</p>
                          <h5 className="text-[13px] font-black italic uppercase text-slate-900 leading-none">{p.name}</h5>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-10">
                      <p className="text-[10px] font-black text-slate-900 uppercase leading-none mb-1.5">{p.category}</p>
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Entrepôt Central</p>
                    </td>
                    <td className="px-8 py-10">
                      <div className="flex items-baseline gap-1.5 leading-none mb-2">
                        <span className={`text-xl font-black italic tabular-nums ${p.currentStock <= p.minStock ? 'text-rose-600' : 'text-slate-900'}`}>{p.currentStock}</span>
                        <span className="text-[9px] font-black text-slate-400">/ {p.minStock}</span>
                      </div>
                      <div className="w-16 h-1 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${p.currentStock === 0 ? 'bg-rose-600' : (p.currentStock <= p.minStock ? 'bg-amber-400' : 'bg-emerald-500')}`} 
                          style={{ width: `${Math.min(100, (p.currentStock / (p.minStock * 2 || 10)) * 100)}%` }} 
                        />
                      </div>
                    </td>
                    <td className="px-8 py-10">
                      <Badge status={p.currentStock === 0 ? 'CRITIQUE' : (p.currentStock <= p.minStock ? 'RÉAPPRO' : 'OPTIMAL')} />
                    </td>
                    <td className="px-8 py-10 text-right">
                      <p className="text-[11px] font-black italic text-slate-900 tabular-nums leading-none mb-1.5">{p.unitPrice.toLocaleString()} {p.currency}</p>
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Par {p.unit || 'Pièce'}</p>
                    </td>
                    <td className="px-12 py-10 text-right">
                      <p className="text-[15px] font-black italic text-[#143d21] tabular-nums leading-none mb-1.5">{(p.currentStock * priceInFc).toLocaleString()} Fc</p>
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest italic opacity-0 group-hover:opacity-100 transition-opacity">Valorisation Totale (Fc)</p>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Reporting View ---
const ReportingView = ({ products, history, exchangeRate }: { products: Product[], history: InventoryLog[], exchangeRate: number }) => {
  const [report, setReport] = useState<RapportAutomatique | null>(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    // Délai simulé pour le "moteur de calcul"
    setTimeout(async () => {
      try {
        const data = await getAutomatedReport(products, history, exchangeRate);
        setReport(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 1000);
  };

  useEffect(() => {
    if (products.length > 0 && !report) {
      generateReport();
    }
  }, [products]);

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-10 animate-fade-in">
      <Loader2 className="w-24 h-24 text-[#143d21] animate-spin" />
      <div className="text-center space-y-3">
        <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">Moteur de Calcul Statistique</h3>
        <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Analyse déterministe des flux en cours...</p>
      </div>
    </div>
  );

  if (!report) return (
    <div className="bg-white p-24 rounded-[4rem] border border-slate-100 shadow-sm text-center space-y-12">
      <FileSearch className="w-20 h-20 text-slate-200 mx-auto" />
      <div className="space-y-4">
        <h4 className="text-3xl font-black italic uppercase text-slate-900">Aucun rapport disponible</h4>
        <p className="text-slate-500 text-sm uppercase font-black italic tracking-widest">Lancez l'audit statistique pour analyser vos stocks.</p>
      </div>
      <button onClick={generateReport} className="px-16 py-6 bg-[#143d21] text-white rounded-[2.5rem] font-black uppercase text-[11px] tracking-widest shadow-2xl hover:scale-105 transition-all">Générer l'Audit</button>
    </div>
  );

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <div className="flex justify-between items-center no-print">
        <h3 className="text-xs font-black uppercase italic tracking-widest text-slate-500 flex items-center gap-3">
          <Database className="w-4 h-4 text-emerald-600" /> Audit Statistique SmartStock Pro
        </h3>
        <div className="flex gap-4">
           <button onClick={() => window.print()} className="px-8 py-4 bg-white border border-slate-100 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-sm hover:bg-slate-50 flex items-center gap-3">
             <Printer className="w-4 h-4" /> PDF
           </button>
           <button onClick={generateReport} className="px-8 py-4 bg-emerald-50 text-emerald-800 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest hover:bg-emerald-100 flex items-center gap-3">
             <RefreshCcw className="w-4 h-4" /> Actualiser
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <section className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm space-y-8">
            <h4 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">Résumé Analytique</h4>
            <div className="p-10 bg-slate-50 rounded-[2.5rem] border-l-8 border-[#143d21]">
              <p className="text-slate-700 leading-relaxed font-medium italic text-lg uppercase tracking-tight">
                {report.summary}
              </p>
            </div>
          </section>

          <section className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm space-y-10">
             <div className="flex justify-between items-center">
               <h4 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">Valorisation par Catégorie</h4>
               <TrendingUp className="w-8 h-8 text-emerald-600" />
             </div>
             <div className="h-[400px] w-full bg-slate-50/50 p-8 rounded-[3rem]">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={report.chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '20px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}
                      itemStyle={{ fontWeight: 900, color: '#143d21' }}
                    />
                    <Bar dataKey="valeur" radius={[10, 10, 0, 0]}>
                      {report.chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#143d21' : '#10b981'} />
                      ))}
                    </Bar>
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </section>

          <section className="space-y-6">
            <h4 className="text-xl font-black italic uppercase tracking-widest text-slate-900 px-4">Actions Prioritaires</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {report.recommendations.map((rec, i) => (
                <div key={i} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-start gap-6 group hover:border-[#143d21] transition-all">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-[#143d21] group-hover:text-white transition-all">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <p className="text-[11px] font-black uppercase italic text-slate-700 tracking-tight leading-relaxed">{rec}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-10">
          <div className="bg-rose-50 p-10 rounded-[3.5rem] border-2 border-rose-100 space-y-8">
            <div className="flex items-center gap-4 text-rose-700">
              <AlertCircle className="w-8 h-8" />
              <h5 className="text-xl font-black italic uppercase tracking-tighter">Alertes Systèmes</h5>
            </div>
            <div className="space-y-4">
              {report.criticalAlerts.map((alert, i) => (
                <div key={i} className="p-6 bg-white/60 rounded-2xl border border-rose-200">
                  <p className="text-[10px] font-black uppercase italic text-rose-900 leading-tight">{alert}</p>
                </div>
              ))}
              {report.criticalAlerts.length === 0 && (
                 <p className="text-[10px] font-black uppercase italic text-rose-400">Aucun incident détecté.</p>
              )}
            </div>
          </div>

          <div className="bg-[#143d21] p-12 rounded-[4rem] text-white shadow-2xl space-y-10 relative overflow-hidden">
             <div className="relative z-10 space-y-8">
                <div className="flex items-center gap-4">
                  <DollarSign className="w-8 h-8 text-emerald-400" />
                  <h5 className="text-xl font-black italic uppercase tracking-tighter">Projection de Coûts</h5>
                </div>
                <div className="space-y-4">
                   <p className="text-emerald-100/70 text-[10px] font-black uppercase tracking-[0.3em] italic leading-none">Estimation algorithmique</p>
                   <p className="text-lg font-black italic leading-relaxed text-emerald-50">
                     {report.financialProjection}
                   </p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const HistoryView = ({ history, searchTerm, setSearchTerm, handleExport }: any) => {
  const [period, setPeriod] = useState<'DAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'ALL'>('ALL');

  const filtered = useMemo(() => {
    const now = new Date();
    return history.filter((log: any) => {
      const matchesSearch = log.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (log.responsible || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const logDate = new Date(log.date);
      let matchesPeriod = true;

      if (period === 'DAY') {
        matchesPeriod = logDate.toDateString() === now.toDateString();
      } else if (period === 'WEEK') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        matchesPeriod = logDate >= weekAgo;
      } else if (period === 'MONTH') {
        matchesPeriod = logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
      } else if (period === 'YEAR') {
        matchesPeriod = logDate.getFullYear() === now.getFullYear();
      }

      return matchesSearch && matchesPeriod;
    });
  }, [history, searchTerm, period]);

  const stats = useMemo(() => {
    const entries = filtered.filter((l:any) => l.changeAmount > 0).reduce((a:number, b:any) => a + b.changeAmount, 0);
    const exits = filtered.filter((l:any) => l.changeAmount < 0).reduce((a:number, b:any) => a + Math.abs(b.changeAmount), 0);
    return { entries, exits, total: filtered.length };
  }, [filtered]);

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InventoryStat label="Mouvements Totaux" value={stats.total} icon={Activity} />
        <InventoryStat label="Total Entrées" value={stats.entries} icon={ChevronUp} />
        <InventoryStat label="Total Sorties" value={stats.exits} icon={ChevronDown} alert={stats.exits > stats.entries} />
      </div>

      <div className="flex flex-col xl:flex-row gap-6 bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm no-print">
        <div className="flex-1 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#143d21] transition-colors" />
            <input 
              type="text" 
              placeholder="Article, responsable..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-slate-50 border-none rounded-[1.5rem] text-xs font-black uppercase tracking-widest outline-none ring-offset-0 focus:ring-2 ring-[#143d21]/10 transition-all text-slate-900"
            />
          </div>
          
          <div className="flex bg-slate-50 p-1.5 rounded-[1.5rem] gap-1">
            {(['DAY', 'WEEK', 'MONTH', 'YEAR', 'ALL'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-white text-[#143d21] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {p === 'DAY' ? 'Jour' : p === 'WEEK' ? 'Semaine' : p === 'MONTH' ? 'Mois' : p === 'YEAR' ? 'Année' : 'Tous'}
              </button>
            ))}
          </div>
        </div>

        <button onClick={() => handleExport()} className="px-10 py-5 bg-[#143d21] text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-3 hover:scale-[1.02] transition-all">
          <Download className="w-4 h-4" /> Rapport d'Audit
        </button>
      </div>

      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
              <th className="px-10 py-8">Horodatage & Type</th>
              <th className="px-8 py-8">Article</th>
              <th className="px-8 py-8 text-center">Quantité</th>
              <th className="px-8 py-8 text-center">Final</th>
              <th className="px-8 py-8">Responsable / Motif</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-10 py-32 text-center text-slate-400">
                  <HistoryIcon className="w-16 h-16 mx-auto mb-6 opacity-20" />
                  <p className="text-[10px] font-black uppercase tracking-widest italic">Aucun mouvement pour cette période</p>
                </td>
              </tr>
            ) : (
              filtered.reverse().map((log: any) => (
                <tr key={log.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${log.changeAmount > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {log.changeAmount > 0 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-900 uppercase leading-none mb-1">{new Date(log.date).toLocaleDateString()}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{new Date(log.date).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-8 text-sm font-black italic uppercase text-slate-900">{log.productName}</td>
                  <td className="px-8 py-8 text-center font-black italic tabular-nums">
                    <span className={log.changeAmount > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                      {log.changeAmount > 0 ? '+' : ''}{log.changeAmount}
                    </span>
                  </td>
                  <td className="px-8 py-8 text-center text-slate-400 font-black italic tabular-nums">{log.finalStock}</td>
                  <td className="px-8 py-8">
                    <p className="text-[9px] font-black text-slate-900 uppercase leading-none mb-1">{log.responsible || 'Sytème'}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase italic tracking-tighter truncate max-w-[150px]">{log.reason || 'Std'}</p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ImportView = ({ onImportSuccess, showToast }: any) => {
  const [inputText, setInputText] = useState("");
  const [previewItems, setPreviewItems] = useState<any[]>([]);

  const handlePreview = () => {
    const items = parseInventoryData(inputText);
    setPreviewItems(items);
    if (items.length > 0) {
      showToast(`${items.length} articles identifiés dans le texte`);
    } else {
      showToast("Aucune donnée valide identifiée", "error");
    }
  };

  const confirmImport = () => {
    const newProducts = previewItems.map(item => ({
      ...item,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      minStock: 5,
      monthlyNeed: 0,
      siteId: 'S1',
      lastInventoryDate: new Date().toISOString()
    }));
    onImportSuccess(newProducts);
    setPreviewItems([]);
    setInputText("");
    showToast(`${newProducts.length} articles importés avec succès`);
  };

  return (
    <div className="space-y-10 animate-fade-in max-w-5xl mx-auto">
      <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm space-y-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[1.5rem] flex items-center justify-center">
            <ClipboardList className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">Importation Automatisée</h3>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">Collez vos données (Nom, Quantité, Prix, Catégorie, Unité) séparées par des points-virgules.</p>
          </div>
        </div>

        <textarea 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ex: Coca;50;1500;Boisson;pces&#10;Riz 25kg;10;45000;Alimentaire;sac"
          className="w-full h-48 p-8 bg-slate-50 border-none rounded-[2.5rem] font-mono text-sm outline-none focus:ring-2 ring-blue-500/10 transition-all text-slate-800 placeholder:opacity-40"
        />

        <div className="flex justify-end gap-4">
          <button 
            onClick={handlePreview}
            className="px-10 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all"
          >
            Analyser le texte
          </button>
        </div>
      </div>

      {previewItems.length > 0 && (
        <div className="space-y-8 animate-fade-in">
          <div className="bg-emerald-500 p-10 rounded-[3rem] text-white flex justify-between items-center shadow-xl">
             <div>
               <h4 className="text-2xl font-black italic uppercase tracking-tighter">Aperçu de l'importation</h4>
               <p className="text-[10px] font-bold text-emerald-100/70 uppercase italic tracking-widest">Vérifiez les données avant intégration finale</p>
             </div>
             <button onClick={confirmImport} className="px-10 py-5 bg-white text-emerald-900 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-lg flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4" /> Valider l'importation
             </button>
          </div>

          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                  <th className="px-10 py-8">Article</th>
                  <th className="px-8 py-8">Catégorie</th>
                  <th className="px-8 py-8 text-center">Quantité</th>
                  <th className="px-10 py-8 text-right">Prix (Fc)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {previewItems.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-10 py-8 text-sm font-black italic uppercase text-slate-900">{item.name}</td>
                    <td className="px-8 py-8"><Badge status="OPTIMAL" /></td>
                    <td className="px-8 py-8 text-center text-lg font-black italic tabular-nums text-slate-900">{item.currentStock}</td>
                    <td className="px-10 py-8 text-right font-black italic text-slate-900">{item.unitPrice?.toLocaleString()} Fc</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Vue de gestion du patrimoine mobilier et des actifs immobilisés.
 * Fix for missing FurnitureView component.
 */
const FurnitureView = ({ furniture, searchTerm, setSearchTerm, setIsEditModalOpen, setEditingFurniture }: any) => {
  const filtered = furniture.filter((f: any) => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-col xl:flex-row gap-6 bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm no-print">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#143d21] transition-colors" />
          <input 
            type="text" 
            placeholder="Chercher nom, code, affectation..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-5 bg-slate-50 border-none rounded-[1.5rem] text-xs font-black uppercase tracking-widest outline-none ring-offset-0 focus:ring-2 ring-[#143d21]/10 transition-all text-slate-900"
          />
        </div>
        <button 
          onClick={() => { setEditingFurniture(null); setIsEditModalOpen(true); }}
          className="px-10 py-5 bg-[#143d21] text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-3 hover:scale-[1.02] transition-all"
        >
          <Plus className="w-5 h-5" /> Nouvel Actif
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filtered.length === 0 ? (
          <div className="col-span-full py-32 text-center opacity-30">
            <Armchair className="w-20 h-20 mx-auto mb-6" />
            <p className="text-[11px] font-black uppercase italic tracking-widest">Aucun actif mobilier répertorié</p>
          </div>
        ) : (
          filtered.map((f: any) => (
            <div key={f.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm group hover:border-[#143d21] transition-all cursor-pointer" onClick={() => { setEditingFurniture(f); setIsEditModalOpen(true); }}>
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-[#143d21] group-hover:text-white transition-all">
                  <Armchair className="w-6 h-6" />
                </div>
                <Badge status={f.condition.toUpperCase()} />
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-1">{f.code}</p>
                  <h5 className="text-xl font-black italic uppercase text-slate-900 leading-none">{f.name}</h5>
                </div>
                <div className="pt-4 border-t border-slate-50 flex justify-between items-end">
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Affecté à</p>
                    <p className="text-[11px] font-bold text-slate-900 uppercase italic">{f.assignedTo || 'Non assigné'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Valeur d'achat</p>
                    <p className="text-[13px] font-black text-[#143d21] tabular-nums">{(f.purchasePrice || 0).toLocaleString()} Fc</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// --- App Entry Point ---

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [products, setProducts] = useState<Product[]>(() => getStored('ss_products', INITIAL_PRODUCTS));
  const [furniture, setFurniture] = useState<Furniture[]>(() => getStored('ss_furniture', INITIAL_FURNITURE));
  const [history, setHistory] = useState<InventoryLog[]>(() => getStored('ss_history', []));
  const [exchangeRate, setExchangeRate] = useState<number>(() => getStored('ss_exchange_rate', 2850));
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingFurniture, setEditingFurniture] = useState<Furniture | null>(null);
  
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    localStorage.setItem('ss_products', JSON.stringify(products));
    localStorage.setItem('ss_furniture', JSON.stringify(furniture));
    localStorage.setItem('ss_history', JSON.stringify(history));
    localStorage.setItem('ss_exchange_rate', JSON.stringify(exchangeRate));
  }, [products, furniture, history, exchangeRate]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleImportSuccess = (newProducts: Product[]) => {
    setProducts(prev => [...prev, ...newProducts]);
    const newLogs: InventoryLog[] = newProducts.map(p => ({
      id: `log-${Date.now()}-${p.id}`,
      date: new Date().toISOString(),
      type: 'entry',
      productId: p.id,
      productName: p.name,
      changeAmount: p.currentStock,
      finalStock: p.currentStock,
      reason: "Import Automatisé",
      responsible: "Admin Pro"
    }));
    setHistory(prev => [...prev, ...newLogs]);
    if (activeView === 'import') setActiveView('inventory');
  };

  const handleSaveProduct = () => {
    if (!editingProduct) return;
    const index = products.findIndex(p => p.id === editingProduct.id);
    if (index >= 0) {
      const updated = [...products];
      updated[index] = editingProduct;
      setProducts(updated);
      showToast("Données mises à jour");
    } else {
      const newId = `p-${Date.now()}`;
      setProducts(prev => [...prev, { ...editingProduct, id: newId }]);
      showToast("Article enregistré");
    }
    setIsEditModalOpen(false);
    setEditingProduct(null);
  };

  const handleSaveFurniture = () => {
    if (!editingFurniture) return;
    const index = furniture.findIndex(f => f.id === editingFurniture.id);
    if (index >= 0) {
      const updated = [...furniture];
      updated[index] = editingFurniture;
      setFurniture(updated);
      showToast("Actif mis à jour");
    } else {
      setFurniture(prev => [...prev, editingFurniture]);
      showToast("Actif enregistré");
    }
    setIsEditModalOpen(false);
    setEditingFurniture(null);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleExportCSV = () => {
    const headers = "ID,Nom,Categorie,Stock,Prix Unit.,Devise,Valo Totale (Fc)\n";
    const rows = products.map(p => {
      const priceInFc = p.currency === '$' ? p.unitPrice * exchangeRate : p.unitPrice;
      return `${p.id},"${p.name}",${p.category},${p.currentStock},${p.unitPrice},${p.currency},${p.currentStock * priceInFc}`;
    }).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventaire_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast("Export CSV généré");
  };

  const handleExportAuditCSV = () => {
    const headers = "Date,Heure,Article,Mouvement,Final,Responsable,Motif\n";
    const rows = history.map(h => {
      const d = new Date(h.date);
      return `"${d.toLocaleDateString()}","${d.toLocaleTimeString()}","${h.productName}",${h.changeAmount},${h.finalStock},"${h.responsible || 'Admin'}","${h.reason || 'Std'}"`;
    }).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_complet_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast("Rapport d'audit exporté");
  };

  if (!isLoggedIn) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <div className="bg-white p-24 rounded-[5rem] shadow-2xl text-center space-y-16 animate-fade-in border border-slate-100">
        <div className="inline-flex p-12 bg-[#143d21] rounded-[4rem] text-white shadow-3xl animate-bounce-slow">
          <ShieldCheck className="w-20 h-20" />
        </div>
        <div className="space-y-4">
          <h2 className="text-8xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">SmartStock</h2>
          <p className="text-[12px] font-black text-emerald-600 uppercase tracking-[0.5em] italic">Enterprise Algorithm v4.5</p>
        </div>
        <div className="space-y-6">
          <button onClick={handleLogin} className="w-full py-10 bg-[#143d21] text-white rounded-[4rem] font-black uppercase text-sm tracking-widest shadow-2xl hover:bg-black transition-all">Accéder au Système</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      <aside className="fixed inset-y-0 left-0 z-50 w-80 bg-[#143d21] m-6 rounded-[3.5rem] p-10 flex flex-col text-white shadow-2xl no-print">
        <div className="mb-14 px-4 py-2 border-b border-white/5 pb-10 flex items-center gap-4">
          <ShieldCheck className="w-8 h-8 text-emerald-400" />
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">SmartStock</h1>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
          <NavItem active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} icon={LayoutDashboard} label="Tableau de bord" />
          <NavItem active={activeView === 'inventory'} onClick={() => setActiveView('inventory')} icon={Box} label="Stocks / Inventaire" />
          <NavItem active={activeView === 'furniture'} onClick={() => setActiveView('furniture')} icon={Armchair} label="Mobilier & Actifs" />
          <NavItem active={activeView === 'import'} onClick={() => setActiveView('import')} icon={FileSpreadsheet} label="Import Automatisé" />
          <NavItem active={activeView === 'history'} onClick={() => setActiveView('history')} icon={HistoryIcon} label="Historique / Audit" />
          <NavItem active={activeView === 'monthly_report'} onClick={() => setActiveView('monthly_report')} icon={FileText} label="Reporting Statistique" />
          <NavItem active={activeView === 'settings'} onClick={() => setActiveView('settings')} icon={SettingsIcon} label="Paramètres" />
        </div>
        <button onClick={() => setIsLoggedIn(false)} className="mt-12 flex items-center justify-center gap-3 py-6 bg-white/5 hover:bg-rose-600 text-white/50 hover:text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest transition-all">
          <LogOut className="w-4 h-4" /> Fermer la Session
        </button>
      </aside>

      <main className="flex-1 p-14 lg:ml-80">
        <header className="flex justify-between items-end mb-16 no-print">
          <div className="space-y-4">
            <h2 className="text-7xl font-black text-slate-900 italic uppercase tracking-tighter leading-none">{viewLabels[activeView]}</h2>
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic leading-none">Moteur algorithmique opérationnel</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none">
              <Coins className="w-4 h-4 text-amber-600" /> Taux: {exchangeRate}
            </div>
            <button onClick={() => window.print()} className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-500 hover:text-[#143d21] shadow-sm"><Printer className="w-5 h-5" /></button>
            <div className="flex items-center gap-4 bg-white border border-slate-100 pr-8 p-1.5 rounded-full shadow-sm">
              <div className="w-12 h-12 bg-[#143d21] rounded-full flex items-center justify-center text-white text-xs font-black">AD</div>
              <div>
                <p className="text-[11px] font-black text-slate-900 uppercase leading-none mb-1">Admin ERP</p>
                <p className="text-[8px] font-black text-emerald-500 uppercase leading-none">Superviseur Pro</p>
              </div>
            </div>
          </div>
        </header>

        <div className="pb-32">
          {activeView === 'dashboard' && <DashboardView products={products} furniture={furniture} history={history} setActiveView={setActiveView} exchangeRate={exchangeRate} />}
          {activeView === 'inventory' && <InventoryView products={products} searchTerm={searchTerm} setSearchTerm={setSearchTerm} handleExport={handleExportCSV} setIsEditModalOpen={setIsEditModalOpen} setEditingProduct={setEditingProduct} exchangeRate={exchangeRate} onImportSuccess={handleImportSuccess} showToast={showToast} />}
          {activeView === 'furniture' && <FurnitureView furniture={furniture} searchTerm={searchTerm} setSearchTerm={setSearchTerm} setIsEditModalOpen={setIsEditModalOpen} setEditingFurniture={setEditingFurniture} />}
          {activeView === 'history' && <HistoryView history={history} searchTerm={searchTerm} setSearchTerm={setSearchTerm} handleExport={handleExportAuditCSV} />}
          {activeView === 'monthly_report' && <ReportingView products={products} history={history} exchangeRate={exchangeRate} />}
          {activeView === 'import' && <ImportView onImportSuccess={handleImportSuccess} showToast={showToast} />}
          {activeView === 'settings' && <SettingsView exchangeRate={exchangeRate} setExchangeRate={setExchangeRate} />}
        </div>
      </main>

      {/* Product Edit Modal */}
      {isEditModalOpen && activeView === 'inventory' && (
        <Modal 
          title={editingProduct ? "Modifier" : "Ajouter"} 
          onClose={() => setIsEditModalOpen(false)} 
          onSave={handleSaveProduct}
        >
          <div className="grid grid-cols-2 gap-8">
            <Field label="Désignation" value={editingProduct?.name || ''} onChange={(v:any) => setEditingProduct({...(editingProduct || { id: '', currentStock: 0, minStock: 5, unitPrice: 0, unit: 'pces', currency: 'Fc', category: 'Matériel', siteId: 'S1', lastInventoryDate: new Date().toISOString() } as any), name: v})} />
            <Field label="Catégorie" value={editingProduct?.category || 'Matériel'} onChange={(v:any) => setEditingProduct({...(editingProduct || {} as any), category: v})} type="select" options={INITIAL_CATEGORIES} />
            <Field label="Stock Disponible" value={editingProduct?.currentStock || 0} onChange={(v:any) => setEditingProduct({...(editingProduct || {} as any), currentStock: parseInt(v) || 0})} type="number" />
            <Field label="Seuil d'Alerte" value={editingProduct?.minStock || 5} onChange={(v:any) => setEditingProduct({...(editingProduct || {} as any), minStock: parseInt(v) || 5})} type="number" />
            <Field label="Prix Unitaire" value={editingProduct?.unitPrice || 0} onChange={(v:any) => setEditingProduct({...(editingProduct || {} as any), unitPrice: parseFloat(v) || 0})} type="number" />
            <Field label="Devise" value={editingProduct?.currency || 'Fc'} onChange={(v:any) => setEditingProduct({...(editingProduct || {} as any), currency: v})} type="select" options={['Fc', '$']} />
            <Field label="Unité" value={editingProduct?.unit || 'pces'} onChange={(v:any) => setEditingProduct({...(editingProduct || {} as any), unit: v})} type="select" options={['pces', 'kg', 'L', 'bidons', 'paquets', 'mètres']} />
            
            <div className="col-span-2 p-8 bg-emerald-50/50 rounded-3xl border border-emerald-100 flex justify-between items-center">
               <div>
                 <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">Valorisation (Fc)</p>
                 <h4 className="text-3xl font-black italic text-emerald-800 tabular-nums leading-none">
                   {((editingProduct?.currentStock || 0) * (editingProduct?.currency === '$' ? (editingProduct?.unitPrice || 0) * exchangeRate : (editingProduct?.unitPrice || 0))).toLocaleString()} Fc
                 </h4>
               </div>
               <div className="text-right">
                 <Badge status={editingProduct?.currentStock === 0 ? 'CRITIQUE' : (editingProduct?.currentStock && editingProduct?.minStock && editingProduct.currentStock <= editingProduct.minStock ? 'RÉAPPRO' : 'OPTIMAL')} />
               </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Furniture Edit Modal */}
      {isEditModalOpen && activeView === 'furniture' && (
        <Modal 
          title="Actif Immobilisé" 
          onClose={() => setIsEditModalOpen(false)} 
          onSave={handleSaveFurniture}
        >
          <div className="grid grid-cols-2 gap-10">
            <Field label="Désignation" value={editingFurniture?.name || ''} onChange={(v:any) => setEditingFurniture({...(editingFurniture || { id: `${Date.now()}`, code: `INV-${Date.now()}` } as any), name: v})} />
            <Field label="Code Inventaire" value={editingFurniture?.code || ''} onChange={(v:any) => setEditingFurniture({...(editingFurniture || {} as any), code: v})} />
            <Field label="Affectation" value={editingFurniture?.assignedTo || ''} onChange={(v:any) => setEditingFurniture({...(editingFurniture || {} as any), assignedTo: v})} />
            <Field label="État" value={editingFurniture?.condition || 'Bon'} onChange={(v:any) => setEditingFurniture({...(editingFurniture || {} as any), condition: v})} type="select" options={['Neuf', 'Bon', 'Usé', 'Endommagé']} />
            <Field label="Valeur" value={editingFurniture?.purchasePrice || 0} onChange={(v:any) => setEditingFurniture({...(editingFurniture || {} as any), purchasePrice: parseInt(v) || 0})} type="number" />
            <Field label="Quantité" value={editingFurniture?.currentCount || 1} onChange={(v:any) => setEditingFurniture({...(editingFurniture || {} as any), currentCount: parseInt(v) || 1})} type="number" />
          </div>
        </Modal>
      )}

      {notification && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 px-12 py-8 bg-white border-2 border-emerald-100 rounded-[3rem] shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-10 z-[300]">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          <p className="text-sm font-black uppercase italic text-slate-700 tracking-widest">{notification.message}</p>
        </div>
      )}
    </div>
  );
};

const Modal = ({ title, children, onClose, onSave }: any) => (
  <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
    <div className="bg-white w-full max-w-2xl rounded-[4rem] p-16 space-y-12 shadow-2xl relative">
      <button onClick={onClose} className="absolute top-12 right-12 p-4 text-slate-400 hover:text-rose-500 transition-colors"><X className="w-10 h-10" /></button>
      <h3 className="text-5xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">{title}</h3>
      {children}
      <button onClick={onSave} className="w-full py-10 bg-[#143d21] text-white rounded-[3rem] font-black uppercase text-xs tracking-widest shadow-2xl transition-all hover:bg-black">Confirmer</button>
    </div>
  </div>
);

const Field = ({ label, value, onChange, type = "text", options = [] }: any) => (
  <div className="space-y-3">
    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none ml-2">{label}</p>
    {type === 'select' ? (
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full p-6 bg-slate-50 border-none rounded-3xl font-bold text-slate-800 outline-none cursor-pointer focus:ring-2 ring-emerald-500/10">
        {options.map((o:any) => <option key={o} value={o}>{o}</option>)}
      </select>
    ) : (
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full p-6 bg-slate-50 border-none rounded-3xl font-bold text-slate-800 outline-none focus:ring-2 ring-emerald-500/10" />
    )}
  </div>
);

const SettingsView = ({ exchangeRate, setExchangeRate }: any) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-fade-in">
    <div className="lg:col-span-2 space-y-8">
      <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-10 mb-12">
           <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center text-emerald-700 border border-emerald-100">
             <User className="w-12 h-12" />
           </div>
           <div>
             <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 mb-2">Profil Administrateur</h3>
             <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest italic">Configuration globale du système</p>
           </div>
        </div>
        <div className="grid grid-cols-2 gap-10">
          <div className="space-y-3"><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Identifiant</p><div className="p-6 bg-slate-50 rounded-2xl font-black italic text-slate-900">Admin_Pro_DRC</div></div>
          <div className="space-y-3"><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Email Audit</p><div className="p-6 bg-slate-50 rounded-2xl font-black italic text-slate-900">audit@smartstock.local</div></div>
        </div>
      </div>

      <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-6 mb-10">
          <Coins className="w-10 h-10 text-amber-500" />
          <div>
            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 leading-none mb-2">Taux de Change Global</h3>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Conversion algorithmique des devises</p>
          </div>
        </div>
        <div className="max-w-xs space-y-6">
          <div className="space-y-3">
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none ml-2">Taux: 1 $ = ? Fc</p>
             <div className="relative group">
               <input 
                 type="number" 
                 value={exchangeRate}
                 onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
                 className="w-full p-8 bg-slate-50 border-none rounded-[2rem] font-black text-2xl text-slate-900 outline-none tabular-nums focus:ring-2 ring-[#143d21]/10 transition-all"
               />
               <span className="absolute right-8 top-1/2 -translate-y-1/2 font-black text-slate-300 italic">Fc</span>
             </div>
          </div>
        </div>
      </div>
    </div>
    <div className="space-y-8">
       <div className="bg-[#143d21] p-12 rounded-[3.5rem] text-white shadow-2xl space-y-10">
          <div className="flex items-center gap-4"><Shield className="w-8 h-8 text-emerald-400" /><h4 className="text-xl font-black italic uppercase tracking-tighter leading-none">Système Local</h4></div>
          <div className="space-y-8">
            <Toggle label="Base de données locale" sub="Stockage navigateur persistant" active />
            <Toggle label="Algorithmes déterministes" sub="Pas de traitement Cloud" active />
            <Toggle label="Chiffrement session" sub="Sécurité des registres active" active />
          </div>
       </div>
    </div>
  </div>
);

const Toggle = ({ label, sub, active }: any) => (
  <div className="flex items-center justify-between group">
    <div>
      <h6 className="text-[11px] font-black uppercase tracking-tight italic mb-1">{label}</h6>
      <p className="text-[8px] font-bold text-emerald-100/80 uppercase italic leading-none">{sub}</p>
    </div>
    <div className={`w-12 h-6 rounded-full p-1 relative transition-colors ${active ? 'bg-emerald-500' : 'bg-white/10'}`}>
      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${active ? 'translate-x-6' : 'translate-x-0'}`} />
    </div>
  </div>
);

const viewLabels: Record<ViewType, string> = {
  dashboard: 'Tableau de bord', inventory: 'Stocks / Inventaire', furniture: 'Mobilier & Actifs', replenishment: 'Réappro', history: 'Historique / Audit', suppliers: 'Fournisseurs', sites: 'Sites', analytics: 'BI', forecasting: 'Prévisions', monthly_report: 'Reporting Statistique', import: 'Import Automatisé', settings: 'Paramètres Système'
};

export default App;

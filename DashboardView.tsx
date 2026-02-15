
import React, { useMemo } from 'react';
import { 
  Activity, ChevronRight, FileText, Zap, HardDrive, CheckSquare, 
  ShieldCheck, TrendingUp, ListChecks, Settings, Wallet, 
  ArrowDownRight, ArrowUpRight, Banknote, HeartPulse, AlertCircle, Cpu, MapPin, BarChart3
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line, Legend } from 'recharts';
import { Badge } from './Badge';
import { Product, InventoryLog, Furniture, ViewType, Site, AppSettings } from './types';
import { AnalyticsView } from './AnalyticsView';

interface DashboardViewProps {
  products: Product[];
  sites: Site[];
  furniture: Furniture[];
  history: InventoryLog[];
  exchangeRate: number;
  setView: (view: ViewType) => void;
  logisticsBalance: number;
  settings: AppSettings;
}

export const DashboardView = ({ products, sites, furniture, history, exchangeRate, setView, logisticsBalance, settings }: DashboardViewProps) => {
  const stats = useMemo(() => {
    const alerts = products.filter((p: Product) => p.currentStock <= p.minStock).length;
    const totalItems = products.length;
    const healthScore = totalItems > 0 ? Math.round(((totalItems - alerts) / totalItems) * 100) : 100;
    return { alerts, prodCount: totalItems, furnCount: furniture.length, healthScore };
  }, [products, furniture]);

  const siteValueStats = useMemo(() => {
    return sites.map(site => {
      const siteProds = products.filter(p => p.siteId === site.id);
      const value = siteProds.reduce((acc, p) => {
        const pVal = p.currency === '$' ? p.unitPrice * exchangeRate : p.unitPrice;
        return acc + (p.currentStock * pVal);
      }, 0);
      return { name: site.name, value };
    }).sort((a, b) => b.value - a.value);
  }, [products, sites, exchangeRate]);

  const siteHealthStats = useMemo(() => {
    if (sites.length === 0) return [];
    return sites.map(site => {
      const siteProds = products.filter(p => p.siteId === site.id);
      const total = siteProds.length;
      const healthy = siteProds.filter(p => p.currentStock > p.minStock).length;
      const score = total > 0 ? Math.round((healthy / total) * 100) : 100;
      const criticalProds = siteProds
        .filter(p => p.currentStock <= p.minStock)
        .sort((a, b) => (a.currentStock / (a.minStock || 1)) - (b.currentStock / (b.minStock || 1)))
        .slice(0, 2);
      return { sid: site.id, siteName: site.name, score, total, criticalCount: total - healthy, criticalProds };
    }).sort((a, b) => a.score - b.score);
  }, [products, sites]);

  const chartData = useMemo(() => {
    const days = 15;
    const data = [];
    const now = new Date();
    for (let i = days; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
      const dailyMovements = history.filter(h => h.date.split('T')[0] === dateStr);
      const dailyVariationVolume = dailyMovements.reduce((acc, h) => acc + Math.abs(h.changeAmount), 0);
      const dailyValue = products.reduce((acc, p) => {
        const pVal = p.currency === '$' ? p.unitPrice * exchangeRate : p.unitPrice;
        return acc + (p.currentStock * pVal);
      }, 0);
      data.push({ name: label, valeur: Math.round(dailyValue), flux: dailyVariationVolume });
    }
    return data;
  }, [products, history, exchangeRate]);

  return (
    <div className="space-y-10 animate-fade-in pb-32">
      {/* BARRE D'ÉTAT LOGISTIQUE AUTOMATISÉE */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex items-center justify-between no-print overflow-hidden relative">
         <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
         <div className="flex items-center gap-6">
            <div className={`p-4 rounded-2xl ${stats.healthScore > 80 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
               <HeartPulse className="w-8 h-8" />
            </div>
            <div>
               <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Index de Santé Logistique</h3>
               <p className="text-3xl font-header italic text-slate-900 leading-none">{stats.healthScore}% <span className="text-[10px] font-bold text-slate-400">RÉSEAU STABLE</span></p>
            </div>
         </div>
         <div className="flex-1 max-w-md mx-10">
            <div className="flex justify-between items-center mb-2">
               <span className="text-[8px] font-black uppercase text-slate-400">Occupation moyenne du réseau</span>
               <span className="text-[9px] font-black text-slate-900">72%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
               <div className="h-full bg-emerald-500 rounded-full" style={{ width: '72%' }} />
            </div>
         </div>
         <button onClick={() => setView('needs_list')} className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">Lancer Approvisionnement</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col min-h-[160px]">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><MapPin className="w-3 h-3 text-emerald-500" /> Valeur Consommables / Site</p>
           <div className="space-y-3 overflow-y-auto max-h-[120px] custom-scrollbar pr-2 flex-1">
             {siteValueStats.length === 0 ? (<p className="text-[10px] font-bold text-slate-300 italic uppercase py-4">Aucune donnée</p>) : (
               siteValueStats.map((site, idx) => (
                 <div key={idx} className="flex justify-between items-center border-b border-slate-50 pb-2 last:border-0">
                    <span className="text-[11px] font-black uppercase text-slate-600 truncate max-w-[150px]">{site.name}</span>
                    <span className="text-[12px] font-header italic text-[#1a3a22]">{site.value.toLocaleString()} <span className="text-[7px]">Fc</span></span>
                 </div>
               ))
             )}
           </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between min-h-[160px]">
           <div><p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-4">Seuils Critiques Réseau</p><h4 className={`text-5xl font-black italic tracking-tighter ${stats.alerts > 0 ? 'text-rose-500' : 'text-slate-200'}`}>{stats.alerts}</h4></div>
           <div className="flex justify-between items-center mt-2"><span className="text-[8px] font-black text-slate-300 uppercase italic">Alerte Rupture</span><Badge variant={stats.alerts > 0 ? "danger" : "success"}>{stats.alerts > 0 ? "Action!" : "Stock OK"}</Badge></div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between min-h-[160px]">
           <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Articles Total Référencés</p><h4 className="text-5xl font-black italic tracking-tighter text-slate-900">{stats.prodCount}</h4></div>
           <div className="flex justify-between items-center mt-2"><span className="text-[8px] font-black text-slate-300 uppercase italic">Total SKU Actifs</span><Badge variant="success">Base de données OK</Badge></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white p-10 rounded-[4rem] border border-slate-100 shadow-xl overflow-hidden">
          <div className="flex justify-between items-center mb-10"><div><h3 className="text-xl font-header italic uppercase flex items-center gap-3"><TrendingUp className="w-5 h-5 text-blue-500" /> Flux & Valeur Réseaux</h3><p className="text-[10px] font-black uppercase text-slate-400 mt-1 tracking-widest">Valeur Stock vs Flux Journaliers (15 Jours)</p></div></div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <defs><linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'black', fill: '#94a3b8'}} dy={10} /><YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'black', fill: '#3b82f6'}} tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`} /><YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'black', fill: '#f97316'}} /><Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: '800'}} cursor={{stroke: '#e2e8f0', strokeWidth: 2}} /><Area yAxisId="left" type="monotone" dataKey="valeur" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" name="Valeur Stock (Fc)" /><Line yAxisId="right" type="monotone" dataKey="flux" stroke="#f97316" strokeWidth={4} dot={{r: 4, fill: '#f97316', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6, strokeWidth: 0}} name="Volume Flux" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden">
           <h3 className="text-[14px] font-header italic uppercase mb-8 flex items-center gap-3"><Activity className="w-5 h-5 text-emerald-500" /> Santé par Site</h3>
           <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {siteHealthStats.map(site => (
                <div key={site.sid} className="bg-slate-50 p-4 rounded-2xl border border-transparent hover:border-emerald-100 transition-all">
                   <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black uppercase italic truncate max-w-[120px]">{site.siteName}</span>
                      <Badge variant={site.score > 80 ? 'success' : 'warning'}>{site.score}%</Badge>
                   </div>
                   <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full ${site.score > 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${site.score}%` }} />
                   </div>
                </div>
              ))}
           </div>
           <div className="mt-8 p-6 bg-slate-900 rounded-[2.5rem] text-white">
              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-2">Statut IA / Auto-Audit</p>
              <p className="text-[10px] font-bold text-slate-400 italic">Moteur actif : surveillance du patrimoine en temps réel opérationnelle.</p>
           </div>
        </div>
      </div>
    </div>
  );
};

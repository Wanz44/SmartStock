
import React from 'react';
import { 
  Zap, RefreshCw, AlertTriangle, TrendingUp, 
  TrendingDown, PieChart as PieIcon, MapPin, Calendar, 
  Activity, CheckCircle2, AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Product, InventoryLog, RapportAutomatique, Site } from './types';
import { Badge } from './Badge';

const CHART_COLORS = ['#1a3a22', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

interface AnalyticsViewProps {
  products: Product[];
  history: InventoryLog[];
  exchangeRate: number;
  sites: Site[];
  report: RapportAutomatique | null;
  analysis: string;
  isAnalyzing: boolean;
  onRefresh: () => void;
}

export const AnalyticsView = ({ 
  products, 
  history, 
  exchangeRate, 
  sites, 
  report, 
  analysis, 
  isAnalyzing, 
  onRefresh 
}: AnalyticsViewProps) => {

  if (isAnalyzing || !report) return (
    <div className="flex flex-col items-center justify-center py-32 gap-6 animate-pulse">
      <div className="relative">
        <RefreshCw className="w-16 h-16 text-emerald-500 animate-spin" />
        <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-emerald-600" />
      </div>
      <div className="text-center">
        <p className="text-[14px] font-black uppercase italic text-slate-900">Moteur d'analyse automatisée en cours...</p>
        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Exécution du script de traitement des métriques et audits financiers</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-12 animate-fade-in pb-32">
      <div className="flex justify-end no-print">
        <button 
          onClick={onRefresh}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-xl text-[9px] font-black uppercase text-[#1a3a22] hover:bg-slate-50 transition-all shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" /> 
          Rafraîchir l'analyse
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-white p-10 rounded-[4rem] border border-slate-100 shadow-xl space-y-8">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-header italic uppercase flex items-center gap-3">
              <Zap className="w-6 h-6 text-emerald-500" /> Audit Logistique Automatisé
            </h3>
            <Badge variant="info">Traitement temps réel</Badge>
          </div>
          <div className="bg-slate-50 p-8 rounded-[3rem] border-l-[6px] border-emerald-500 relative">
             <p className="text-[14px] font-bold text-slate-700 leading-relaxed whitespace-pre-wrap italic">
               "{analysis || "Analyse en attente..."}"
             </p>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-6">
           <div className={`p-8 rounded-[3rem] shadow-2xl text-white transition-all ${report.balanceAnalysis.isPositive ? 'bg-[#1a3a22]' : 'bg-rose-900'}`}>
              <div className="flex justify-between items-start mb-6">
                 <div>
                    <h3 className="text-xl font-header italic uppercase">Bilan des Flux (30J)</h3>
                    <p className="text-[10px] font-bold opacity-60 uppercase mt-1">Comparaison Entrées vs Sorties</p>
                 </div>
                 {report.balanceAnalysis.isPositive ? <TrendingUp className="w-10 h-10 text-emerald-400" /> : <TrendingDown className="w-10 h-10 text-rose-400" />}
              </div>
              <div className="flex items-end justify-between">
                 <div>
                    <p className="text-3xl font-black italic">{report.balanceAnalysis.ratio}%</p>
                    <p className="text-[9px] font-black uppercase tracking-widest mt-1 italic">{report.balanceAnalysis.message}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[9px] font-bold opacity-40 uppercase">Statut Financier</p>
                    <Badge variant={report.balanceAnalysis.isPositive ? 'success' : 'danger'}>
                       {report.balanceAnalysis.isPositive ? 'Excédentaire' : 'Déficitaire'}
                    </Badge>
                 </div>
              </div>
           </div>

           <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex-1">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <AlertCircle className="w-4 h-4" /> Indicateurs Santé Sites
              </h4>
              <div className="space-y-4">
                 {report.healthIndicators.map((ind, i) => (
                    <div key={i} className="flex items-center justify-between group">
                       <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${ind.status === 'green' ? 'bg-emerald-500' : ind.status === 'orange' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                          <span className="text-[11px] font-black uppercase italic text-slate-700">{ind.siteName}</span>
                       </div>
                       <span className="text-[11px] font-header italic text-slate-400">{ind.score}%</span>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm">
           <h3 className="text-xl font-header italic uppercase mb-10 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-500" /> Dépenses par Mois (Fc)
           </h3>
           <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={report.monthlyExpenseData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'black', fill: '#94a3b8'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'black', fill: '#94a3b8'}} tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold'}} />
                    <Bar dataKey="valeur" fill="#3b82f6" radius={[12, 12, 0, 0]} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm">
           <h3 className="text-xl font-header italic uppercase mb-10 flex items-center gap-3">
              <MapPin className="w-5 h-5 text-emerald-500" /> Valeur Stock par Site
           </h3>
           <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={report.siteValueData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'black', fill: '#94a3b8'}} tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} />
                    <YAxis type="category" dataKey="label" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'black', fill: '#1e293b'}} width={100} />
                    <Tooltip contentStyle={{borderRadius: '20px', fontSize: '10px'}} />
                    <Bar dataKey="valeur" fill="#10b981" radius={[0, 12, 12, 0]} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm">
           <h3 className="text-xl font-header italic uppercase mb-10 flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-orange-500" /> Top 5 Consommation (Volume)
           </h3>
           <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={report.topConsumption}>
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: 'black', fill: '#94a3b8'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'black', fill: '#94a3b8'}} />
                    <Tooltip contentStyle={{borderRadius: '20px'}} />
                    <Bar dataKey="valeur" fill="#f97316" radius={[12, 12, 0, 0]}>
                       {report.topConsumption.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                       ))}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm">
           <h3 className="text-xl font-header italic uppercase mb-10 flex items-center gap-3">
              <PieIcon className="w-5 h-5 text-indigo-500" /> Part des Dépenses par Site
           </h3>
           <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                       data={report.siteExpenseData}
                       cx="50%"
                       cy="50%"
                       innerRadius={60}
                       outerRadius={100}
                       paddingAngle={5}
                       dataKey="valeur"
                       nameKey="label"
                       label={({name}) => name}
                    >
                       {report.siteExpenseData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                       ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '20px'}} />
                    <Legend verticalAlign="bottom" height={36}/>
                 </PieChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-10">
         <div className="lg:col-span-1 space-y-6">
            <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400">Rapport de Script</h4>
            <div className="space-y-4">
               {report.recommendations.map((rec, i) => (
                  <div key={i} className="flex gap-4 items-start bg-slate-50 p-4 rounded-2xl">
                     <div className="mt-1 w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                     <p className="text-[11px] font-bold uppercase italic text-slate-700 leading-tight">{rec}</p>
                  </div>
               ))}
            </div>
         </div>
         
         <div className="lg:col-span-2 space-y-6">
            <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400">Alertes Systèmes</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
               {report.criticalAlerts.slice(0, 6).map((alert, i) => (
                  <div key={i} className="bg-rose-50 p-4 rounded-2xl flex items-center gap-4 border border-rose-100">
                     <AlertTriangle className="w-5 h-5 text-rose-500" />
                     <p className="text-[11px] font-black uppercase text-rose-900">{alert}</p>
                  </div>
               ))}
               {report.criticalAlerts.length === 0 && (
                  <div className="col-span-full py-8 text-center bg-emerald-50 rounded-3xl border border-emerald-100">
                     <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                     <p className="text-[11px] font-black uppercase text-emerald-900">Aucune anomalie détectée par le script</p>
                  </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};

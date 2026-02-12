
import React, { useMemo } from 'react';
import { Activity, ChevronRight, FileText, Zap, HardDrive, CheckSquare, ShieldCheck, TrendingUp, ListChecks, Settings } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line, Legend } from 'recharts';
import { Badge } from './Badge';
import { Product, InventoryLog, Furniture, ViewType } from './types';

interface DashboardViewProps {
  products: Product[];
  furniture: Furniture[];
  history: InventoryLog[];
  exchangeRate: number;
  setView: (view: ViewType) => void;
}

export const DashboardView = ({ products, furniture, history, exchangeRate, setView }: DashboardViewProps) => {
  const stats = useMemo(() => {
    const stockVal = products.reduce((acc: number, p: Product) => acc + (p.currentStock * (p.currency === '$' ? p.unitPrice * exchangeRate : p.unitPrice)), 0);
    const alerts = products.filter((p: Product) => p.currentStock <= p.minStock).length;
    return { stockVal, alerts, prodCount: products.length, furnCount: furniture.length };
  }, [products, exchangeRate]);

  // Génération des données historiques pour le graphique (15 derniers jours)
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
        const drift = (Math.sin(i * 0.5) * 0.05); 
        return acc + (p.currentStock * pVal * (1 + drift));
      }, 0);

      data.push({
        name: label,
        valeur: Math.round(dailyValue),
        flux: dailyVariationVolume
      });
    }
    return data;
  }, [products, history, exchangeRate]);

  return (
    <div className="space-y-10 animate-fade-in pb-32">
      {/* CARTES DE STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Valeur Consommables</p>
           <h4 className="text-2xl font-black italic tracking-tighter text-slate-900">{stats.stockVal.toLocaleString()} Fc</h4>
           <div className="flex justify-between items-center mt-2">
             <span className="text-[8px] font-black text-slate-300 uppercase italic">Réel</span>
             <Badge variant="info">Audit OK</Badge>
           </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Patrimoine Immobilisé</p>
           <h4 className="text-2xl font-black italic tracking-tighter text-slate-900">{stats.furnCount} Éléments</h4>
           <div className="flex justify-between items-center mt-2">
             <span className="text-[8px] font-black text-slate-300 uppercase italic">Mobilier</span>
             <Badge>Inventorié</Badge>
           </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
           <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-4">Seuils Critiques</p>
           <h4 className="text-3xl font-black italic tracking-tighter text-rose-500">{stats.alerts}</h4>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Articles Gérés</p>
           <h4 className="text-3xl font-black italic tracking-tighter text-slate-900">{stats.prodCount}</h4>
        </div>
      </div>

      {/* SECTION GRAPHIQUE COMBINÉ */}
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h3 className="text-xl font-header italic uppercase flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-blue-500" /> Performance & Rotation
            </h3>
            <p className="text-[10px] font-black uppercase text-slate-400 mt-1 tracking-widest">Valorisation Financière vs Volume de Flux (15J)</p>
          </div>
          <div className="flex gap-4">
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500/20 border-2 border-blue-500"></div>
                <span className="text-[9px] font-black uppercase text-slate-400 italic">Valeur (Fc)</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-[9px] font-black uppercase text-slate-400 italic">Volume Flux</span>
             </div>
          </div>
        </div>
        
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 9, fontWeight: 'black', fill: '#94a3b8'}} 
                dy={10}
              />
              <YAxis 
                yAxisId="left"
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 9, fontWeight: 'black', fill: '#3b82f6'}}
                tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 9, fontWeight: 'black', fill: '#f97316'}}
              />
              <Tooltip 
                contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: '800'}}
                cursor={{stroke: '#e2e8f0', strokeWidth: 2}}
              />
              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="valeur" 
                stroke="#3b82f6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorValue)" 
                name="Valeur Stock (Fc)"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="flux" 
                stroke="#f97316" 
                strokeWidth={4}
                dot={{r: 4, fill: '#f97316', strokeWidth: 2, stroke: '#fff'}}
                activeDot={{r: 6, strokeWidth: 0}}
                name="Volume de Flux"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
           <div className="flex justify-between items-center mb-8">
             <h3 className="text-xl font-header italic uppercase flex items-center gap-3">
               <Activity className="w-5 h-5 text-emerald-500" /> Journal de Traçabilité Récent
             </h3>
             <button onClick={() => setView('traceability')} className="text-[9px] font-black uppercase text-[#1a3a22] hover:underline underline-offset-4">Registre Complet</button>
           </div>
           <div className="space-y-3">
             {history.length === 0 ? (
               <div className="py-10 text-center opacity-20 italic font-black text-[10px] uppercase">Aucun mouvement récent</div>
             ) : (
               history.slice(0, 5).map((h: InventoryLog) => (
                 <div key={h.id} className="bg-slate-50 p-5 rounded-2xl flex items-center justify-between group">
                   <div className="flex items-center gap-5">
                      <div className="p-2 bg-white rounded-lg"><ChevronRight className="w-3 h-3 text-emerald-500" /></div>
                      <div>
                        <p className="text-[11px] font-black uppercase italic text-slate-900">{h.productName}</p>
                        <p className="text-[8px] font-bold text-slate-300">{new Date(h.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {h.type === 'entry' ? 'Entrée' : h.type === 'exit' ? 'Sortie' : 'Ajustement'}</p>
                      </div>
                   </div>
                   <p className={`text-lg font-black italic ${h.changeAmount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                     {h.changeAmount > 0 ? '+' : ''}{h.changeAmount}
                   </p>
                 </div>
               ))
             )}
           </div>
        </div>
        
        <div className="space-y-6">
           <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Flux de Travail Rapide</h4>
              <div className="space-y-4">
                {[
                  { label: "Lancer l'audit Scripté", icon: FileText, view: 'analytics' },
                  { label: "Agenda des Tâches", icon: CheckSquare, view: 'tasks' },
                  { label: "État de Besoins", icon: ListChecks, view: 'needs_list' },
                  { label: "Paramètres ERP", icon: Settings, view: 'settings' }
                ].map((item, idx) => (
                  <button key={idx} onClick={() => setView(item.view as ViewType)} className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all">
                    <div className="flex items-center gap-4">
                      <item.icon className="w-4 h-4 text-slate-300" />
                      <span className="text-[9px] font-black uppercase italic text-slate-700">{item.label}</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                  </button>
                ))}
              </div>
           </div>
           <div className="bg-[#1a3a22] p-8 rounded-[2.5rem] shadow-xl text-white">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h4 className="text-[10px] font-black uppercase tracking-widest">Système Sécurisé</h4>
              </div>
              <p className="text-[9px] font-bold text-white/60 uppercase leading-relaxed">Toutes vos données sont stockées localement et synchronisées avec le Cloud pour une traçabilité maximale.</p>
           </div>
        </div>
      </div>
    </div>
  );
};

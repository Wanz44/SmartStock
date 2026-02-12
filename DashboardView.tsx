
import React, { useMemo } from 'react';
import { 
  Activity, ChevronRight, FileText, Zap, HardDrive, CheckSquare, 
  ShieldCheck, TrendingUp, ListChecks, Settings, Wallet, 
  ArrowDownRight, ArrowUpRight, Banknote, HeartPulse, AlertCircle
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line, Legend } from 'recharts';
import { Badge } from './Badge';
import { Product, InventoryLog, Furniture, ViewType, Site } from './types';

interface DashboardViewProps {
  products: Product[];
  furniture: Furniture[];
  history: InventoryLog[];
  exchangeRate: number;
  setView: (view: ViewType) => void;
  logisticsBalance: number;
}

export const DashboardView = ({ products, furniture, history, exchangeRate, setView, logisticsBalance }: DashboardViewProps) => {
  const stats = useMemo(() => {
    const stockVal = products.reduce((acc: number, p: Product) => acc + (p.currentStock * (p.currency === '$' ? p.unitPrice * exchangeRate : p.unitPrice)), 0);
    const alerts = products.filter((p: Product) => p.currentStock <= p.minStock).length;
    return { stockVal, alerts, prodCount: products.length, furnCount: furniture.length };
  }, [products, exchangeRate]);

  // Calcul de la santé du stock par site
  const siteHealthStats = useMemo(() => {
    const siteIds = Array.from(new Set(products.map(p => p.siteId)));
    // Simuler/Récupérer les noms des sites depuis le localStorage car DashboardView ne reçoit pas 'sites' en props
    const storedSites: Site[] = JSON.parse(localStorage.getItem('ss_sites') || '[]');
    
    return siteIds.map(sid => {
      const siteProds = products.filter(p => p.siteId === sid);
      const total = siteProds.length;
      const healthy = siteProds.filter(p => p.currentStock > p.minStock).length;
      const score = total > 0 ? Math.round((healthy / total) * 100) : 100;
      const siteName = storedSites.find(s => s.id === sid)?.name || 'Site Inconnu';
      
      // Top 3 des produits les plus critiques du site pour l'aperçu
      const criticalProds = siteProds
        .filter(p => p.currentStock <= p.minStock)
        .sort((a, b) => (a.currentStock / (a.minStock || 1)) - (b.currentStock / (b.minStock || 1)))
        .slice(0, 2);

      return { sid, siteName, score, total, criticalCount: total - healthy, criticalProds };
    }).sort((a, b) => a.score - b.score); // Les plus critiques en premier
  }, [products]);

  // Extraction des transactions ayant un impact financier
  const financialTransactions = useMemo(() => {
    return history
      .filter(h => h.type === 'entry' || h.type === 'exit')
      .slice(0, 4)
      .map(h => {
        const product = products.find(p => p.id === h.productId);
        const priceFc = product ? (product.currency === '$' ? product.unitPrice * exchangeRate : product.unitPrice) : 0;
        const totalValue = Math.abs(h.changeAmount) * priceFc;
        return { ...h, totalValue };
      });
  }, [history, products, exchangeRate]);

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
        const drift = (Math.sin(i * 0.5) * 0.02); // Légère variation visuelle
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
        
        <div className="bg-gradient-to-br from-[#1a3a22] to-emerald-900 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-white/10 transition-all duration-500" />
           <p className="text-[9px] font-black text-emerald-200/60 uppercase tracking-widest mb-4 flex items-center gap-2">
             <Wallet className="w-3 h-3" /> Solde Caisse Logistique
           </p>
           <h4 className="text-2xl font-black italic tracking-tighter">{logisticsBalance.toLocaleString()} Fc</h4>
           <div className="flex justify-between items-center mt-2">
             <span className="text-[8px] font-black text-emerald-200/40 uppercase italic">Budget Disponible</span>
             <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
           </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
           <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-4">Seuils Critiques</p>
           <h4 className="text-3xl font-black italic tracking-tighter text-rose-50">{stats.alerts}</h4>
           <div className="flex justify-between items-center mt-2">
             <span className="text-[8px] font-black text-slate-300 uppercase italic">Alerte Rupture</span>
             <Badge variant="danger">Action!</Badge>
           </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Articles Gérés</p>
           <h4 className="text-3xl font-black italic tracking-tighter text-slate-900">{stats.prodCount}</h4>
           <div className="flex justify-between items-center mt-2">
             <span className="text-[8px] font-black text-slate-300 uppercase italic">Total SKU</span>
             <Badge variant="success">In Base</Badge>
           </div>
        </div>
      </div>

      {/* SECTION SANTÉ DU STOCK PAR SITE */}
      <div className="grid grid-cols-1 gap-8 no-print">
         <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-xl font-header italic uppercase flex items-center gap-3">
                  <HeartPulse className="w-6 h-6 text-rose-500" /> Santé du Stock par Site
               </h3>
               <p className="text-[10px] font-black uppercase text-slate-400 italic">Disponibilité vs Seuils de Sécurité</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {siteHealthStats.length === 0 ? (
                  <div className="col-span-full py-10 text-center opacity-30 italic font-black text-[10px] uppercase">Aucun stock à analyser</div>
               ) : (
                  siteHealthStats.map(site => (
                     <div key={site.sid} className="bg-slate-50 p-6 rounded-[2.5rem] border border-transparent hover:border-emerald-200 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                           <div className="flex flex-col">
                              <p className="text-[10px] font-black uppercase italic text-slate-900 leading-none truncate max-w-[120px]">{site.siteName}</p>
                              <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase">{site.total} références</span>
                           </div>
                           <Badge variant={site.score >= 90 ? 'success' : site.score >= 70 ? 'info' : site.score >= 40 ? 'warning' : 'danger'}>
                              {site.score}%
                           </Badge>
                        </div>
                        
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden mb-4 shadow-inner">
                           <div 
                              className={`h-full transition-all duration-1000 ${
                                 site.score >= 90 ? 'bg-emerald-500' : 
                                 site.score >= 70 ? 'bg-blue-500' : 
                                 site.score >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                              }`} 
                              style={{ width: `${site.score}%` }} 
                           />
                        </div>

                        {site.criticalProds.length > 0 && (
                           <div className="space-y-1 mt-4">
                              <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Alertes Prioritaires :</p>
                              {site.criticalProds.map(p => (
                                 <div key={p.id} className="flex justify-between items-center">
                                    <span className="text-[8px] font-bold text-slate-600 truncate uppercase">{p.name}</span>
                                    <span className="text-[8px] font-black text-rose-500">{p.currentStock}/{p.minStock}</span>
                                 </div>
                              ))}
                           </div>
                        )}
                        
                        {site.criticalCount === 0 && (
                           <div className="flex items-center gap-2 mt-4 text-emerald-600">
                              <ShieldCheck className="w-3 h-3" />
                              <span className="text-[8px] font-black uppercase italic">Conformité Totale</span>
                           </div>
                        )}
                     </div>
                  ))
               )}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* GRAPHIQUE CENTRAL */}
        <div className="lg:col-span-8 bg-white p-10 rounded-[4rem] border border-slate-100 shadow-xl overflow-hidden">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-header italic uppercase flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-blue-500" /> Performance & Rotation
              </h3>
              <p className="text-[10px] font-black uppercase text-slate-400 mt-1 tracking-widest">Valorisation Financière vs Volume de Flux (15J)</p>
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
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'black', fill: '#94a3b8'}} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'black', fill: '#3b82f6'}} tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'black', fill: '#f97316'}} />
                <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: '800'}} cursor={{stroke: '#e2e8f0', strokeWidth: 2}} />
                <Area yAxisId="left" type="monotone" dataKey="valeur" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" name="Valeur Stock (Fc)" />
                <Line yAxisId="right" type="monotone" dataKey="flux" stroke="#f97316" strokeWidth={4} dot={{r: 4, fill: '#f97316', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6, strokeWidth: 0}} name="Volume de Flux" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SECTION FINANCIÈRE : DERNIÈRES OPÉRATIONS */}
        <div className="lg:col-span-4 bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm flex flex-col">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-[14px] font-header italic uppercase flex items-center gap-3">
                 <Banknote className="w-5 h-5 text-amber-500" /> Trésorerie & Flux
              </h3>
              <div className="p-2 bg-amber-50 rounded-xl">
                 <Zap className="w-4 h-4 text-amber-500" />
              </div>
           </div>
           
           <div className="space-y-4 flex-1">
              {financialTransactions.length === 0 ? (
                <div className="py-20 text-center opacity-20 italic font-black text-[10px] uppercase">Aucun flux financier</div>
              ) : (
                financialTransactions.map((h, idx) => (
                  <div key={idx} className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between group hover:bg-slate-100 transition-all">
                     <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-xl ${h.type === 'entry' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                           {h.type === 'entry' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div>
                           <p className="text-[10px] font-black uppercase text-slate-900 leading-none">{h.productName}</p>
                           <p className="text-[7px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">
                              {h.type === 'entry' ? 'Dépense / Achat' : 'Consommation / Usage'}
                           </p>
                        </div>
                     </div>
                     <p className={`text-[13px] font-header italic ${h.type === 'entry' ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {h.type === 'entry' ? '-' : '+'}{h.totalValue.toLocaleString()} <span className="text-[8px] font-black uppercase">Fc</span>
                     </p>
                  </div>
                ))
              )}
           </div>

           <div className="mt-8 p-6 bg-slate-900 rounded-[2.5rem] text-white">
              <div className="flex items-center gap-3 mb-2">
                 <Wallet className="w-4 h-4 text-emerald-400" />
                 <p className="text-[9px] font-black uppercase tracking-widest text-emerald-200/60">Solde Référentiel</p>
              </div>
              <p className="text-xl font-header italic">{logisticsBalance.toLocaleString()} Fc</p>
              <button className="w-full mt-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[8px] font-black uppercase tracking-widest border border-white/10 transition-all flex items-center justify-center gap-2">
                 Détails du compte <ChevronRight className="w-3 h-3" />
              </button>
           </div>
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

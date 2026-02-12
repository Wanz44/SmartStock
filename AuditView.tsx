
import React, { useState, useMemo } from 'react';
import { 
  ClipboardCheck, Search, Filter, AlertTriangle, 
  CheckCircle2, Save, RotateCcw, TrendingDown, TrendingUp,
  MapPin, Layers, Info
} from 'lucide-react';
import { Product, Site } from './types';
import { Badge } from './Badge';
import { INITIAL_CATEGORIES } from './constants';

interface AuditViewProps {
  products: Product[];
  sites: Site[];
  exchangeRate: number;
  onUpdateStock: (prodId: string, amount: number, reason: string, type: 'adjustment') => void;
  // Fix: Added 'warning' to the notify type signature
  notify: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const AuditView = ({ products, sites, exchangeRate, onUpdateStock, notify }: AuditViewProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSite, setFilterSite] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [physicalCounts, setPhysicalCounts] = useState<Record<string, number>>({});
  const [globalReason, setGlobalReason] = useState('Audit périodique inventaire physique');

  // Filtrage des produits pour l'audit
  const auditList = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSite = filterSite === 'All' || p.siteId === filterSite;
      const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
      return matchesSearch && matchesSite && matchesCategory;
    });
  }, [products, searchTerm, filterSite, filterCategory]);

  // Calcul des écarts et impacts financiers
  const auditMetrics = useMemo(() => {
    let totalLoss = 0;
    let totalGain = 0;
    let diffCount = 0;

    // Explicitly cast Object.entries to resolve arithmetic operation type errors on count
    (Object.entries(physicalCounts) as [string, number][]).forEach(([id, count]) => {
      const product = products.find(p => p.id === id);
      if (product) {
        const diff = count - product.currentStock;
        const unitPriceFc = product.currency === '$' ? product.unitPrice * exchangeRate : product.unitPrice;
        const impact = diff * unitPriceFc;

        if (diff < 0) totalLoss += Math.abs(impact);
        if (diff > 0) totalGain += impact;
        if (diff !== 0) diffCount++;
      }
    });

    return { totalLoss, totalGain, netImpact: totalGain - totalLoss, diffCount };
  }, [physicalCounts, products, exchangeRate]);

  const handleSetAllToTheoretic = () => {
    const reset: Record<string, number> = {};
    auditList.forEach(p => { reset[p.id] = p.currentStock; });
    setPhysicalCounts(reset);
    notify("Toutes les quantités physiques ont été alignées sur le théorique.", "info");
  };

  const handleValidateAudit = () => {
    if (auditMetrics.diffCount === 0) {
      notify("Aucun écart n'a été saisi.", "info");
      return;
    }

    if (confirm(`Confirmer la régularisation de ${auditMetrics.diffCount} articles ? L'impact financier net est de ${auditMetrics.netImpact.toLocaleString()} Fc.`)) {
      // Explicitly cast Object.entries to resolve arithmetic operation type errors on count
      (Object.entries(physicalCounts) as [string, number][]).forEach(([id, count]) => {
        const product = products.find(p => p.id === id);
        if (product && count !== product.currentStock) {
          const diff = count - product.currentStock;
          onUpdateStock(id, diff, globalReason, 'adjustment');
        }
      });
      setPhysicalCounts({});
      notify(`Audit validé. ${auditMetrics.diffCount} stocks régularisés avec succès.`);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-32">
      {/* SYNTHÈSE AUDIT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
           <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Articles avec Écarts</p>
              <h4 className="text-3xl font-black italic text-[#1a3a22]">{auditMetrics.diffCount} / {auditList.length}</h4>
           </div>
           <div className="mt-4 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-slate-300" />
              <span className="text-[8px] font-bold text-slate-400 uppercase">Progression de l'inventaire</span>
           </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
           <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-4">Pertes Détectées (Manquants)</p>
           <h4 className="text-2xl font-black italic text-rose-500">-{auditMetrics.totalLoss.toLocaleString()} Fc</h4>
           <div className="mt-2 flex items-center gap-2">
              <TrendingDown className="w-3.5 h-3.5 text-rose-300" />
              <span className="text-[8px] font-bold text-slate-300 uppercase italic">Dépréciation stock</span>
           </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
           <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-4">Gains Détectés (Surplus)</p>
           <h4 className="text-2xl font-black italic text-emerald-600">+{auditMetrics.totalGain.toLocaleString()} Fc</h4>
           <div className="mt-2 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
              <span className="text-[8px] font-bold text-slate-300 uppercase italic">Réévaluation stock</span>
           </div>
        </div>
      </div>

      {/* FILTRES & ACTIONS */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6 no-print">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-4 flex-1">
             <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input 
                  type="text" 
                  placeholder="Rechercher par nom..." 
                  className="w-full bg-slate-50 border border-slate-100 pl-12 pr-4 py-3.5 rounded-2xl text-[11px] font-black uppercase italic outline-none focus:ring-2 focus:ring-[#1a3a22]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <select 
               className="bg-slate-50 border border-slate-100 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-[#1a3a22]"
               value={filterSite}
               onChange={(e) => setFilterSite(e.target.value)}
             >
                <option value="All">Tous les Sites</option>
                {sites.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
             </select>
             <select 
               className="bg-slate-50 border border-slate-100 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-[#1a3a22]"
               value={filterCategory}
               onChange={(e) => setFilterCategory(e.target.value)}
             >
                <option value="All">Catégories</option>
                {INITIAL_CATEGORIES.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
             </select>
          </div>
          <div className="flex gap-3">
             <button 
                onClick={handleSetAllToTheoretic}
                className="flex items-center gap-3 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
             >
                <RotateCcw className="w-4 h-4" /> Reset
             </button>
             <button 
                onClick={handleValidateAudit}
                className="flex items-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-emerald-700 transition-all active:scale-95"
             >
                <Save className="w-4 h-4" /> Appliquer Régularisations
             </button>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
           <div className="p-3 bg-amber-50 rounded-xl">
              <Info className="w-4 h-4 text-amber-600" />
           </div>
           <div className="flex-1">
              <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Motif de régularisation global</p>
              <input 
                type="text" 
                className="w-full bg-transparent border-none p-0 text-[12px] font-bold text-[#1a3a22] italic outline-none focus:ring-0"
                value={globalReason}
                onChange={(e) => setGlobalReason(e.target.value)}
              />
           </div>
        </div>
      </div>

      {/* TABLEAU D'AUDIT */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
         <table className="w-full text-left">
           <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
             <tr>
               <th className="px-10 py-6">Référence & Désignation</th>
               <th className="px-10 py-6 text-center">Site</th>
               <th className="px-10 py-6 text-center">Théorique (Système)</th>
               <th className="px-10 py-6 text-center">Physique (Réel)</th>
               <th className="px-10 py-6 text-center">Écart</th>
               <th className="px-10 py-6 text-right">Impact (Fc)</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-50">
             {auditList.length === 0 ? (
               <tr><td colSpan={6} className="px-10 py-20 text-center opacity-30 italic font-black text-[12px] uppercase">Aucun article ne correspond aux filtres</td></tr>
             ) : (
               auditList.map((p: Product) => {
                 const currentPhysical = physicalCounts[p.id] ?? p.currentStock;
                 const diff = currentPhysical - p.currentStock;
                 const unitPriceFc = p.currency === '$' ? p.unitPrice * exchangeRate : p.unitPrice;
                 const impact = diff * unitPriceFc;

                 return (
                   <tr key={p.id} className={`hover:bg-slate-50/50 transition-colors ${diff !== 0 ? 'bg-slate-50/20' : ''}`}>
                     <td className="px-10 py-6">
                        <p className="text-[8px] font-black text-slate-300 uppercase">{p.id.slice(-6)}</p>
                        <p className="text-[12px] font-black uppercase italic text-slate-900">{p.name}</p>
                     </td>
                     <td className="px-10 py-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                           <MapPin className="w-3 h-3 text-slate-300" />
                           <span className="text-[9px] font-black uppercase text-slate-400 italic">{sites.find(s => s.id === p.siteId)?.name || 'N/A'}</span>
                        </div>
                     </td>
                     <td className="px-10 py-6 text-center">
                        <span className="text-xl font-header text-slate-400">{p.currentStock}</span>
                        <span className="text-[9px] font-bold text-slate-300 ml-1">{p.unit}</span>
                     </td>
                     <td className="px-10 py-6 text-center">
                        <input 
                          type="number" 
                          className={`w-24 bg-white border ${diff !== 0 ? 'border-amber-300 shadow-inner' : 'border-slate-100'} rounded-xl px-4 py-3 text-center text-lg font-black italic outline-none focus:ring-2 focus:ring-[#1a3a22]`} 
                          value={currentPhysical} 
                          onChange={(e) => setPhysicalCounts({...physicalCounts, [p.id]: Number(e.target.value)})} 
                        />
                     </td>
                     <td className="px-10 py-6 text-center">
                        {diff === 0 ? (
                          <Badge variant="success">OK</Badge>
                        ) : (
                          <div className={`flex items-center justify-center gap-2 font-black italic text-lg ${diff > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                             {diff > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                             {diff > 0 ? '+' : ''}{diff}
                          </div>
                        )}
                     </td>
                     <td className={`px-10 py-6 text-right font-header italic text-lg ${impact === 0 ? 'text-slate-300' : impact > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {impact !== 0 ? `${impact.toLocaleString()} Fc` : '-'}
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

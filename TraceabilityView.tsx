
import React, { useState, useMemo } from 'react';
import { 
  Printer, Activity, History, FileDown, Calendar, 
  Filter, CalendarDays, MapPin, Search, RotateCcw,
  ArrowDownCircle, ArrowUpCircle, AlertCircle
} from 'lucide-react';
import { InventoryLog, AppSettings, Site } from './types';
import { Badge } from './Badge';

interface TraceabilityViewProps {
  history: InventoryLog[];
  settings: AppSettings;
  sites: Site[];
}

export const TraceabilityView = ({ history, settings, sites }: TraceabilityViewProps) => {
  const [monthFilter, setMonthFilter] = useState<string>(new Date().toISOString().slice(0, 7));
  const [siteFilter, setSiteFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredHistory = useMemo(() => {
    return history.filter(h => {
      const matchesMonth = !monthFilter || h.date.startsWith(monthFilter);
      const matchesSite = siteFilter === 'ALL' || h.siteId === siteFilter;
      const matchesSearch = h.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           h.id.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesMonth && matchesSite && matchesSearch;
    });
  }, [history, monthFilter, siteFilter, searchTerm]);

  const stats = useMemo(() => {
    const entries = filteredHistory.filter(h => h.type === 'entry').length;
    const exits = filteredHistory.filter(h => h.type === 'exit').length;
    const adjustments = filteredHistory.filter(h => h.type === 'adjustment').length;
    return { entries, exits, adjustments };
  }, [filteredHistory]);

  const handleResetFilters = () => {
    setMonthFilter(new Date().toISOString().slice(0, 7));
    setSiteFilter('ALL');
    setSearchTerm('');
  };

  const getOperationLabel = (type: string) => {
    switch(type) {
      case 'entry': return 'ENTRÉE';
      case 'exit': return 'SORTIE';
      case 'adjustment': return 'AJUSTEMENT';
      case 'transfer': return 'TRANSFERT';
      default: return type.toUpperCase();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-32">
       {/* EN-TÊTE D'IMPRESSION */}
       <div className="hidden print:block mb-10 border-b-2 border-slate-900 pb-8">
          <div className="flex justify-between items-start">
             <div className="flex items-center gap-4">
                <Activity className="w-12 h-12 text-[#1a3a22]" />
                <div>
                   <h1 className="text-2xl font-black italic uppercase text-slate-900 tracking-tighter leading-none">{settings.enterpriseName}</h1>
                   <p className="text-[10px] font-black uppercase text-slate-400 mt-1 tracking-widest">Registre d'Archive - {monthFilter || 'Global'}</p>
                </div>
             </div>
             <div className="text-right">
                <h2 className="text-xl font-header italic text-[#1a3a22]">Journal des Mouvements</h2>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Période : {monthFilter}</p>
             </div>
          </div>
       </div>

       {/* BARRE D'OUTILS & FILTRES ÉCRAN AVANCÉS */}
       <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6 no-print">
          <div className="flex flex-wrap items-center justify-between gap-6">
             <div className="flex items-center gap-4">
                <div className="p-4 bg-slate-900 rounded-[1.8rem] text-white">
                   <History className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Consultation des archives</p>
                   <h3 className="text-xl font-header italic text-slate-900 uppercase">Registre de Traçabilité</h3>
                </div>
             </div>
             <div className="flex gap-3">
                <button onClick={handleResetFilters} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all shadow-sm" title="Réinitialiser">
                   <RotateCcw className="w-5 h-5" />
                </button>
                <button onClick={() => window.print()} className="flex items-center gap-3 px-8 py-4 bg-[#1a3a22] text-white rounded-2xl text-[10px] font-black uppercase hover:bg-emerald-900 transition-all shadow-xl">
                   <Printer className="w-4 h-4" /> Imprimer Rapport
                </button>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-50">
             <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input 
                   type="text" 
                   placeholder="Produit ou Référence..." 
                   className="w-full bg-slate-50 border border-slate-100 pl-12 pr-4 py-4 rounded-2xl text-[11px] font-black uppercase italic outline-none focus:ring-2 focus:ring-[#1a3a22]"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <select 
                   className="w-full bg-slate-50 border border-slate-100 pl-12 pr-4 py-4 rounded-2xl text-[11px] font-black uppercase outline-none focus:ring-2 focus:ring-[#1a3a22] appearance-none"
                   value={siteFilter}
                   onChange={(e) => setSiteFilter(e.target.value)}
                >
                   <option value="ALL">Tous les Sites</option>
                   {sites.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                </select>
             </div>
             <div className="relative">
                <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input 
                   type="month" 
                   className="w-full bg-slate-50 border border-slate-100 pl-12 pr-4 py-4 rounded-2xl text-[11px] font-black uppercase outline-none focus:ring-2 focus:ring-[#1a3a22]"
                   value={monthFilter}
                   onChange={(e) => setMonthFilter(e.target.value)}
                />
             </div>
          </div>
       </div>

       {/* RÉSUMÉ DES FLUX FILTRÉS */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
          <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
             <div>
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Entrées de stock</p>
                <p className="text-3xl font-header italic text-emerald-500">{stats.entries}</p>
             </div>
             <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-500">
                <ArrowDownCircle className="w-6 h-6" />
             </div>
          </div>
          <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
             <div>
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Sorties de stock</p>
                <p className="text-3xl font-header italic text-rose-500">{stats.exits}</p>
             </div>
             <div className="p-3 bg-rose-50 rounded-2xl text-rose-500">
                <ArrowUpCircle className="w-6 h-6" />
             </div>
          </div>
          <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
             <div>
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Régularisations</p>
                <p className="text-3xl font-header italic text-amber-500">{stats.adjustments}</p>
             </div>
             <div className="p-3 bg-amber-50 rounded-2xl text-amber-500">
                <AlertCircle className="w-6 h-6" />
             </div>
          </div>
       </div>

       {/* TABLEAU DE DONNÉES */}
       <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl overflow-hidden print:shadow-none print:border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-10 py-7 w-48">Date & Heure</th>
                <th className="px-10 py-7">Désignation / Article</th>
                <th className="px-10 py-7 text-center">Type</th>
                <th className="px-10 py-7 text-center">Quantité</th>
                <th className="px-10 py-7 text-right">Solde Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-10 py-32 text-center opacity-30 italic font-black text-[12px] uppercase">
                    Aucun mouvement trouvé pour ces critères de filtrage.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-10 py-7">
                       <p className="text-[10px] font-black text-slate-900">{new Date(h.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                       <p className="text-[9px] font-bold text-slate-300 uppercase">{new Date(h.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-10 py-7">
                       <p className="text-[12px] font-black uppercase italic text-slate-900 group-hover:text-[#1a3a22] transition-colors">{h.productName}</p>
                       <div className="flex items-center gap-2 mt-1">
                          <MapPin className="w-2.5 h-2.5 text-slate-300" />
                          <p className="text-[8px] font-black text-slate-400 uppercase italic">
                             {sites.find(s => s.id === h.siteId)?.name || 'Point Inconnu'}
                          </p>
                       </div>
                       <p className="text-[8px] font-bold text-slate-300 uppercase mt-1 italic line-clamp-1">{h.reason || 'SANS MOTIF PARTICULIER'}</p>
                    </td>
                    <td className="px-10 py-7 text-center">
                       <Badge variant={h.type === 'entry' ? 'success' : h.type === 'exit' ? 'danger' : 'warning'}>
                          {getOperationLabel(h.type)}
                       </Badge>
                    </td>
                    <td className={`px-10 py-7 text-center font-black italic text-xl ${h.changeAmount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                       {h.changeAmount > 0 ? '+' : ''}{h.changeAmount}
                    </td>
                    <td className="px-10 py-7 text-right font-black text-slate-900 text-xl italic bg-slate-50/30">
                       {h.finalStock}
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

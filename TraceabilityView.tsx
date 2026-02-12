
import React, { useState, useMemo } from 'react';
import { Printer, Activity, History, FileDown, Calendar, Filter, CalendarDays } from 'lucide-react';
import { InventoryLog, AppSettings } from './types';
import { Badge } from './Badge';

interface TraceabilityViewProps {
  history: InventoryLog[];
  settings: AppSettings;
}

export const TraceabilityView = ({ history, settings }: TraceabilityViewProps) => {
  const [monthFilter, setMonthFilter] = useState<string>(new Date().toISOString().slice(0, 7));

  const filteredHistory = useMemo(() => {
    if (!monthFilter) return history;
    return history.filter(h => h.date.startsWith(monthFilter));
  }, [history, monthFilter]);

  const stats = useMemo(() => {
    const entries = filteredHistory.filter(h => h.type === 'entry').length;
    const exits = filteredHistory.filter(h => h.type === 'exit').length;
    const adjustments = filteredHistory.filter(h => h.type === 'adjustment').length;
    return { entries, exits, adjustments };
  }, [filteredHistory]);

  const handlePrint = () => {
    window.print();
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

  const currentYear = new Date().getFullYear();
  const monthsList = [
    { value: '01', label: 'Janvier' }, { value: '02', label: 'Février' }, { value: '03', label: 'Mars' },
    { value: '04', label: 'Avril' }, { value: '05', label: 'Mai' }, { value: '06', label: 'Juin' },
    { value: '07', label: 'Juillet' }, { value: '08', label: 'Août' }, { value: '09', label: 'Septembre' },
    { value: '10', label: 'Octobre' }, { value: '11', label: 'Novembre' }, { value: '12', label: 'Décembre' }
  ];

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

       {/* BARRE D'OUTILS & FILTRE ÉCRAN */}
       <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-6 no-print">
          <div className="flex items-center gap-6">
             <div className="p-4 bg-emerald-50 rounded-[2rem]">
                <CalendarDays className="w-6 h-6 text-emerald-600" />
             </div>
             <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Consultation par période</p>
                <select 
                  className="bg-transparent text-2xl font-header italic outline-none text-slate-900"
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                >
                  <option value="">TOUT L'HISTORIQUE</option>
                  {[currentYear, currentYear-1].map(year => (
                    monthsList.map(m => (
                      <option key={`${year}-${m.value}`} value={`${year}-${m.value}`}>{m.label.toUpperCase()} {year}</option>
                    ))
                  ))}
                </select>
             </div>
          </div>
          <div className="flex gap-3">
             <button onClick={handlePrint} className="flex items-center gap-2 px-8 py-4 bg-[#1a3a22] text-white rounded-2xl text-[10px] font-black uppercase hover:bg-emerald-900 transition-all shadow-xl">
                <Printer className="w-4 h-4" /> Imprimer Période
             </button>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center">
             <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Entrées enregistrées</p>
             <p className="text-3xl font-header italic text-emerald-500">{stats.entries}</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center">
             <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Sorties enregistrées</p>
             <p className="text-3xl font-header italic text-rose-500">{stats.exits}</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center">
             <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Opérations d'audit</p>
             <p className="text-3xl font-header italic text-amber-500">{stats.adjustments}</p>
          </div>
       </div>

       <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden print:shadow-none print:border-slate-200">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-10 py-6 w-48">Date & Heure</th>
                <th className="px-10 py-6">Désignation</th>
                <th className="px-10 py-6 text-center">Type Opération</th>
                <th className="px-10 py-6 text-center">Quantité</th>
                <th className="px-10 py-6 text-right">Solde Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredHistory.length === 0 ? (
                <tr><td colSpan={5} className="px-10 py-20 text-center opacity-30 italic font-black text-[12px] uppercase">Aucun mouvement pour cette période.</td></tr>
              ) : (
                filteredHistory.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-10 py-6">
                       <p className="text-[10px] font-bold text-slate-900">{new Date(h.date).toLocaleDateString()}</p>
                       <p className="text-[9px] font-bold text-slate-300">{new Date(h.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </td>
                    <td className="px-10 py-6">
                       <p className="text-[12px] font-black uppercase italic text-slate-900">{h.productName}</p>
                       <p className="text-[8px] font-black text-slate-400 uppercase italic mt-1">{h.reason || 'SANS MOTIF PARTICULIER'}</p>
                    </td>
                    <td className="px-10 py-6 text-center">
                       <Badge variant={h.type === 'entry' ? 'success' : h.type === 'exit' ? 'danger' : 'warning'}>{getOperationLabel(h.type)}</Badge>
                    </td>
                    <td className={`px-10 py-6 text-center font-black italic text-lg ${h.changeAmount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                       {h.changeAmount > 0 ? '+' : ''}{h.changeAmount}
                    </td>
                    <td className="px-10 py-6 text-right font-black text-slate-900 text-lg italic">{h.finalStock}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
       </div>
    </div>
  );
};


import React, { useState, useMemo } from 'react';
import { 
  History, Search, Filter, CalendarDays, MapPin, 
  Printer, ArrowDownCircle, ArrowUpCircle, ClipboardCheck, 
  ListChecks, Package, Lamp, FileDown, ChevronRight, Info,
  FileSpreadsheet
} from 'lucide-react';
import { InventoryLog, NeedReport, FurnitureAuditSession, Site, Product, AppSettings } from './types';
import { Badge } from './Badge';

interface GlobalHistoryViewProps {
  history: InventoryLog[];
  needsHistory: NeedReport[];
  furnitureAudits: FurnitureAuditSession[];
  sites: Site[];
  products: Product[];
  settings: AppSettings;
}

type EntryType = 'MOVEMENT' | 'NEED_REPORT' | 'FURNITURE_AUDIT';

interface UnifiedEntry {
  id: string;
  date: string;
  type: EntryType;
  subType: string;
  siteName: string;
  siteId: string;
  description: string;
  impactValue?: string;
  status?: string;
}

export const GlobalHistoryView = ({ 
  history, 
  needsHistory, 
  furnitureAudits, 
  sites, 
  products, 
  settings 
}: GlobalHistoryViewProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterSite, setFilterSite] = useState<string>('ALL');
  const [monthFilter, setMonthFilter] = useState<string>(new Date().toISOString().slice(0, 7));

  const unifiedHistory: UnifiedEntry[] = useMemo(() => {
    const entries: UnifiedEntry[] = [];

    // 1. Ajouter les mouvements de stock
    history.forEach(h => {
      entries.push({
        id: h.id,
        date: h.date,
        type: 'MOVEMENT',
        subType: h.type === 'entry' ? 'Entrée' : h.type === 'exit' ? 'Sortie' : h.type === 'adjustment' ? 'Audit/Ajustement' : 'Transfert',
        siteName: sites.find(s => s.id === h.siteId)?.name || 'Inconnu',
        siteId: h.siteId,
        description: `${h.productName} (${h.reason || 'R.A.S'})`,
        impactValue: `${h.changeAmount > 0 ? '+' : ''}${h.changeAmount} unités`,
        status: 'Validé'
      });
    });

    // 2. Ajouter les états de besoins
    needsHistory.forEach(n => {
      entries.push({
        id: n.id,
        date: n.date,
        type: 'NEED_REPORT',
        subType: 'État de Besoin',
        siteName: n.siteName,
        siteId: n.siteId,
        description: `${n.items.length} références planifiées`,
        impactValue: `${n.totalValueFc.toLocaleString()} Fc`,
        status: n.status
      });
    });

    // 3. Ajouter les audits de meubles
    furnitureAudits.forEach(a => {
      entries.push({
        id: a.id,
        date: a.date,
        type: 'FURNITURE_AUDIT',
        subType: 'Audit Mobilier',
        siteName: a.siteName,
        siteId: a.siteId,
        description: `Trimestre ${a.quarter} ${a.year} - ${a.items.length} éléments`,
        impactValue: `Écart: ${a.totalDifference}`,
        status: a.status
      });
    });

    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [history, needsHistory, furnitureAudits, sites]);

  const filteredData = useMemo(() => {
    return unifiedHistory.filter(entry => {
      const matchesSearch = entry.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           entry.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'ALL' || entry.type === filterType;
      const matchesSite = filterSite === 'ALL' || entry.siteId === filterSite;
      const matchesMonth = !monthFilter || entry.date.startsWith(monthFilter);
      return matchesSearch && matchesType && matchesSite && matchesMonth;
    });
  }, [unifiedHistory, searchTerm, filterType, filterSite, monthFilter]);

  const handlePrint = () => window.print();

  const handleExportCSV = () => {
    if (filteredData.length === 0) return;
    
    const headers = ["Date", "Heure", "Type", "ID", "Localisation", "Description", "Valeur/Impact", "Statut"];
    const rows = filteredData.map(e => {
      const d = new Date(e.date);
      return [
        d.toLocaleDateString(),
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        e.subType,
        e.id,
        e.siteName,
        `"${e.description.replace(/"/g, '""')}"`,
        e.impactValue,
        e.status
      ];
    });

    const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `tracabilite_export_${monthFilter || 'global'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-32">
       {/* EN-TÊTE PROFESSIONNEL */}
       <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-6 no-print">
          <div className="flex items-center gap-6">
             <div className="p-4 bg-slate-900 rounded-[2rem] text-white">
                <History className="w-6 h-6" />
             </div>
             <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Traçabilité Immuable</p>
                <h3 className="text-2xl font-header italic text-slate-900 uppercase">Registre Général des Activités</h3>
             </div>
          </div>
          <div className="flex gap-3">
             <button onClick={handleExportCSV} className="flex items-center gap-3 px-8 py-5 bg-slate-100 text-slate-700 rounded-3xl font-black text-[11px] uppercase shadow-sm hover:bg-slate-200 transition-all">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export CSV
             </button>
             <button onClick={handlePrint} className="flex items-center gap-3 px-8 py-5 bg-[#1a3a22] text-white rounded-3xl font-black text-[11px] uppercase shadow-xl hover:bg-emerald-900 transition-all">
                <Printer className="w-4 h-4" /> Imprimer Registre
             </button>
          </div>
       </div>

       {/* BARRE DE FILTRES AVANCÉE */}
       <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 no-print">
          <div className="relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
             <input 
               type="text" 
               placeholder="Rechercher Ref/Désignation..." 
               className="w-full bg-slate-50 border border-slate-100 pl-11 pr-4 py-3 rounded-xl text-[11px] font-black uppercase italic outline-none focus:ring-2 focus:ring-[#1a3a22]"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <select 
            className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-[#1a3a22]"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
             <option value="ALL">Tous les Types</option>
             <option value="MOVEMENT">Mouvements de Stock</option>
             <option value="NEED_REPORT">États de Besoins</option>
             <option value="FURNITURE_AUDIT">Audits Mobilier</option>
          </select>
          <select 
            className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-[#1a3a22]"
            value={filterSite}
            onChange={(e) => setFilterSite(e.target.value)}
          >
             <option value="ALL">Tous les Sites</option>
             {sites.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
          </select>
          <input 
            type="month" 
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl text-[10px] font-black outline-none focus:ring-2 focus:ring-[#1a3a22]"
          />
       </div>

       {/* TABLEAU DE TRAÇABILITÉ GLOBALE */}
       <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden print:shadow-none print:border-slate-300">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-8 py-6">Date & Heure</th>
                <th className="px-8 py-6">Type / Référence</th>
                <th className="px-8 py-6">Localisation</th>
                <th className="px-8 py-6">Détails de l'Activité</th>
                <th className="px-8 py-6 text-center">Impact / Valeur</th>
                <th className="px-8 py-6 text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.length === 0 ? (
                <tr>
                   <td colSpan={6} className="px-10 py-32 text-center opacity-30 italic font-black text-[12px] uppercase">
                      Aucune donnée de traçabilité trouvée pour ces critères
                   </td>
                </tr>
              ) : (
                filteredData.map((entry) => (
                  <tr key={entry.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                       <p className="text-[10px] font-black text-slate-900">{new Date(entry.date).toLocaleDateString()}</p>
                       <p className="text-[8px] font-bold text-slate-300 uppercase">{new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            entry.type === 'MOVEMENT' ? 'bg-emerald-50 text-emerald-600' :
                            entry.type === 'NEED_REPORT' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'
                          }`}>
                            {entry.type === 'MOVEMENT' ? <Package className="w-3.5 h-3.5" /> :
                             entry.type === 'NEED_REPORT' ? <ListChecks className="w-3.5 h-3.5" /> : <Lamp className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase text-slate-900">{entry.subType}</p>
                            <p className="text-[8px] font-bold text-slate-300 tracking-widest">{entry.id}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <p className="text-[10px] font-black uppercase italic text-slate-500 flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-slate-300" /> {entry.siteName}
                       </p>
                    </td>
                    <td className="px-8 py-6 max-w-xs">
                       <p className="text-[11px] font-bold uppercase italic text-slate-700 leading-relaxed truncate group-hover:whitespace-normal group-hover:overflow-visible group-hover:max-w-none">
                          {entry.description}
                       </p>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <span className="text-sm font-header italic text-slate-900">{entry.impactValue}</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <Badge variant={entry.status === 'Clôturé' || entry.status === 'Validé' ? 'success' : 'info'}>
                          {entry.status}
                       </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
       </div>

       {/* MESSAGE DE SÉCURITÉ */}
       <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center gap-4 no-print opacity-60">
          <Info className="w-5 h-5 text-slate-400" />
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-loose">
             Conformément aux normes d'audit, les données d'historique et de traçabilité sont immuables. 
             Les modifications manuelles ou suppressions sont impossibles dans ce registre pour garantir l'intégrité du patrimoine.
          </p>
       </div>
    </div>
  );
};

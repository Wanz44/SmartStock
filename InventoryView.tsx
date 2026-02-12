
import React, { useState, useMemo } from 'react';
import { Search, Plus, Download, Upload, Edit3, Minus, Printer, Activity, MapPin, Trash2 } from 'lucide-react';
import { Product, AppSettings, Site } from './types';
import { Badge } from './Badge';
import { INITIAL_CATEGORIES } from './constants';

interface InventoryViewProps {
  products: Product[];
  settings: AppSettings;
  sites: Site[];
  onMovement: (p: Product, type: 'entry' | 'exit') => void;
  onEdit: (p: Product) => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

export const InventoryView = ({ products, settings, sites, onMovement, onEdit, onImport, onAdd, onDelete }: InventoryViewProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterSite, setFilterSite] = useState('All');

  const exchangeRate = settings.exchangeRate;

  const getSiteName = (siteId: string) => {
    return sites.find(s => s.id === siteId)?.name || 'Inconnu';
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p: Product) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
      const matchesSite = filterSite === 'All' || p.siteId === filterSite;
      const isLow = p.currentStock <= p.minStock;
      const matchesStatus = filterStatus === 'All' || 
                           (filterStatus === 'Critique' && p.currentStock <= 0) ||
                           (filterStatus === 'Réappro' && isLow && p.currentStock > 0) ||
                           (filterStatus === 'Optimal' && !isLow);
      return matchesSearch && matchesCategory && matchesStatus && matchesSite;
    });
  }, [products, searchTerm, filterCategory, filterStatus, filterSite]);

  const handlePrint = () => {
    window.print();
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
                   <p className="text-[10px] font-black uppercase text-slate-400 mt-1 tracking-widest">Localisation : {settings.locationId}</p>
                </div>
             </div>
             <div className="text-right">
                <h2 className="text-xl font-header italic text-[#1a3a22]">Rapport d'Inventaire Officiel</h2>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Généré le : {new Date().toLocaleDateString('fr-FR')}</p>
             </div>
          </div>
       </div>

       {/* BARRE D'OUTILS ÉCRAN */}
       <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-6 no-print">
          <div className="flex items-center gap-4 flex-1 min-w-[300px]">
             <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input 
                  type="text" 
                  placeholder="Rechercher un article..." 
                  className="w-full bg-slate-50 border border-slate-100 pl-12 pr-4 py-3 rounded-xl text-[11px] font-black uppercase italic outline-none focus:ring-2 focus:ring-[#1a3a22]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <select 
               className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-[#1a3a22]"
               value={filterSite}
               onChange={(e) => setFilterSite(e.target.value)}
             >
                <option value="All">Tous les Sites</option>
                {sites.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
             </select>
             <select 
               className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-[#1a3a22]"
               value={filterCategory}
               onChange={(e) => setFilterCategory(e.target.value)}
             >
                <option value="All">Toutes Catégories</option>
                {INITIAL_CATEGORIES.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
             </select>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={onAdd} className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase hover:bg-emerald-700 transition-all shadow-lg">
                <Plus className="w-3.5 h-3.5" /> Ajouter
             </button>
             <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-xl text-[9px] font-black uppercase text-[#1a3a22] hover:bg-slate-50 transition-all">
                <Printer className="w-3.5 h-3.5" /> Imprimer
             </button>
          </div>
       </div>

       {/* TABLEAU D'INVENTAIRE */}
       <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden print:shadow-none print:border-slate-200">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 print:bg-slate-100">
              <tr>
                <th className="px-8 py-6 w-16 text-center">#</th>
                <th className="px-10 py-6">Référence & Désignation</th>
                <th className="px-10 py-6">Site</th>
                <th className="px-10 py-6">Catégorie</th>
                <th className="px-10 py-6">Stock Actuel</th>
                <th className="px-10 py-6">Statut</th>
                <th className="px-10 py-6">P.U.</th>
                <th className="px-10 py-6">Valorisation</th>
                <th className="px-10 py-6 text-right no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredProducts.map((p: Product, idx: number) => {
                const valFc = p.currentStock * (p.currency === '$' ? p.unitPrice * exchangeRate : p.unitPrice);
                const isLow = p.currentStock <= p.minStock;
                return (
                  <tr key={p.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6 text-center text-[10px] font-black text-slate-300">{idx + 1}</td>
                    <td className="px-10 py-6">
                       <p className="text-[8px] font-black text-slate-300 uppercase">SKU-{p.id.slice(-6)}</p>
                       <p className="text-[12px] font-black uppercase italic text-slate-900">{p.name}</p>
                    </td>
                    <td className="px-10 py-6">
                       <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-slate-300" />
                          <span className="text-[9px] font-black uppercase text-slate-500 italic">{getSiteName(p.siteId)}</span>
                       </div>
                    </td>
                    <td className="px-10 py-6">
                       <span className="text-[9px] font-black uppercase text-slate-400 border border-slate-100 px-2 py-1 rounded-lg">{p.category}</span>
                    </td>
                    <td className="px-10 py-6">
                       <span className="text-xl font-black italic">{p.currentStock}</span>
                       <span className="text-[9px] font-bold text-slate-300 ml-2">/ {p.minStock}</span>
                    </td>
                    <td className="px-10 py-6">
                       {p.currentStock <= 0 ? <Badge variant="danger">CRITIQUE</Badge> : isLow ? <Badge variant="warning">RÉAPPRO</Badge> : <Badge variant="success">OPTIMAL</Badge>}
                    </td>
                    <td className="px-10 py-6 font-bold text-slate-600 italic">
                       {p.unitPrice.toLocaleString()} {p.currency}
                    </td>
                    <td className="px-10 py-6 font-black italic text-slate-900">{valFc.toLocaleString()} Fc</td>
                    <td className="px-10 py-6 text-right no-print">
                       <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => onEdit(p)} title="Modifier" className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => onMovement(p, 'entry')} title="Entrée" className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"><Plus className="w-3.5 h-3.5" /></button>
                          <button onClick={() => onMovement(p, 'exit')} title="Sortie" className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-600 hover:text-white transition-all"><Minus className="w-3.5 h-3.5" /></button>
                          <button onClick={() => onDelete(p.id)} title="Supprimer" className="p-2.5 bg-slate-50 text-slate-300 rounded-xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
       </div>
    </div>
  );
};


import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, Plus, Download, Upload, Edit3, Printer, Activity, MapPin, 
  Trash2, FileDown, FileUp, FileText, Database, X, ChevronDown, 
  CheckCircle2, AlertCircle, Info, FileSpreadsheet, History, Minus, Copy, CheckSquare
} from 'lucide-react';
import { Product, AppSettings, Site } from './types';
import { Badge } from './Badge';

interface InventoryViewProps {
  products: Product[];
  settings: AppSettings;
  sites: Site[];
  onMovement: (p: Product, val: number) => void;
  onQuickInventory: (prodId: string) => void;
  onEdit: (p: Product) => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onCopyProducts: (ps: Product[]) => void;
}

export const InventoryView = ({ 
  products, 
  settings, 
  sites, 
  onMovement, 
  onQuickInventory,
  onEdit, 
  onImport, 
  onAdd, 
  onDelete,
  onCopyProducts
}: InventoryViewProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSite, setFilterSite] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All'); // Ajout du filtre catégorie
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exchangeRate = settings.exchangeRate;

  const filteredProducts = useMemo(() => {
    return products.filter((p: Product) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSite = filterSite === 'All' || p.siteId === filterSite;
      const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
      return matchesSearch && matchesSite && matchesCategory;
    });
  }, [products, searchTerm, filterSite, filterCategory]);

  const handleExportCSV = () => {
    if (products.length === 0) return alert("Aucune donnée à exporter.");
    const headers = ["N°", "ID", "Produit", "Catégorie", "Quantité", "Prix Unitaire (Fc)", "Prix Total (Fc)", "Site", "Statut"];
    const rows = products.map((p, idx) => {
      const siteName = sites.find(s => s.id === p.siteId)?.name || 'N/A';
      const isLow = p.currentStock <= p.minStock;
      const unitPriceFc = p.currency === '$' ? p.unitPrice * exchangeRate : p.unitPrice;
      const totalPriceFc = p.currentStock * unitPriceFc;
      return [
        idx + 1, 
        p.id, 
        p.name, 
        p.category, 
        p.currentStock, 
        unitPriceFc.toFixed(0),
        totalPriceFc.toFixed(0),
        siteName,
        isLow ? "CRITIQUE" : "OPTIMAL"
      ];
    });
    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(";")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `INVENTAIRE_SMARTSTOCK_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map(p => p.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleCopySelected = () => {
    const selectedProducts = products.filter(p => selectedIds.includes(p.id));
    onCopyProducts(selectedProducts);
    setSelectedIds([]);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-32">
      {/* TOOLBAR PROFESSIONNELLE */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-6 no-print">
        <div className="flex items-center gap-4 flex-1 min-w-[300px]">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input 
              type="text" 
              placeholder="Rechercher une référence ou un produit..." 
              className="w-full bg-slate-50 border border-slate-100 pl-14 pr-6 py-4 rounded-2xl text-[12px] font-black uppercase italic outline-none focus:ring-2 focus:ring-[#1a3a22]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select 
              className="bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl text-[11px] font-black uppercase outline-none focus:ring-2 focus:ring-[#1a3a22]"
              value={filterSite}
              onChange={(e) => setFilterSite(e.target.value)}
            >
              <option value="All">TOUS LES SITES</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
            </select>
            <select 
              className="bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl text-[11px] font-black uppercase outline-none focus:ring-2 focus:ring-[#1a3a22]"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="All">TOUTES CATÉGORIES</option>
              {settings.categories.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
            </select>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
             <button 
               onClick={handleCopySelected}
               className="flex items-center gap-3 px-8 py-4.5 bg-blue-600 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl animate-slide-in"
             >
               <Copy className="w-5 h-5" /> Copier ({selectedIds.length})
             </button>
          )}

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-3 px-8 py-4.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest hover:bg-emerald-100 transition-all shadow-sm"
          >
            <FileUp className="w-5 h-5" /> Importer
          </button>
          
          <button onClick={handleExportCSV} title="Exporter en CSV" className="p-4.5 bg-slate-50 text-slate-600 rounded-[1.5rem] hover:bg-blue-50 border border-slate-100 transition-all">
            <FileDown className="w-5 h-5" />
          </button>

          <button onClick={() => window.print()} className="flex items-center gap-3 px-8 py-4.5 bg-white border border-slate-100 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 shadow-sm transition-all">
            <Printer className="w-4 h-4" /> Imprimer
          </button>

          <button onClick={onAdd} className="flex items-center gap-3 px-8 py-4.5 bg-[#1a3a22] text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest hover:bg-emerald-900 transition-all shadow-xl active:scale-95">
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept=".csv, .xlsx, .xls" className="hidden" onChange={onImport} />
      </div>

      {/* TABLEAU RÉALIGNÉ : N°, ID, Produit, Catégorie, Quantité, Prix Unitaire, Prix Total, Site */}
      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 border-b border-slate-100">
            <tr>
              <th className="px-6 py-8 text-center w-16 no-print">
                <button onClick={toggleSelectAll} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                  <CheckSquare className={`w-5 h-5 ${selectedIds.length === filteredProducts.length && filteredProducts.length > 0 ? 'text-[#1a3a22]' : 'text-slate-300'}`} />
                </button>
              </th>
              <th className="px-6 py-8 text-center w-16">N°</th>
              <th className="px-6 py-8">ID / Réf</th>
              <th className="px-8 py-8">Produit</th>
              <th className="px-6 py-8 text-center">Catégorie</th>
              <th className="px-6 py-8 text-center">Quantité & Audit</th>
              {!settings.maskSensitiveData && <th className="px-6 py-8 text-right">Prix Unitaire</th>}
              {!settings.maskSensitiveData && <th className="px-6 py-8 text-right">Prix Total</th>}
              <th className="px-6 py-8">Site / Emplacement</th>
              <th className="px-6 py-8 text-right no-print">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredProducts.length === 0 ? (
              <tr><td colSpan={10} className="px-10 py-32 text-center opacity-20"><Database className="w-16 h-16 mx-auto mb-4" /><p className="text-xl font-header uppercase">Aucune donnée trouvée</p></td></tr>
            ) : (
              filteredProducts.map((p, idx) => {
                const isSelected = selectedIds.includes(p.id);
                const isLow = p.currentStock <= p.minStock;
                const unitPriceFc = p.currency === '$' ? p.unitPrice * exchangeRate : p.unitPrice;
                const totalPriceFc = p.currentStock * unitPriceFc;
                return (
                  <tr key={p.id} className={`group hover:bg-slate-50/50 transition-colors ${isLow ? 'bg-rose-50/20' : ''} ${isSelected ? 'bg-emerald-50/30' : ''}`}>
                    <td className="px-6 py-7 text-center no-print">
                      <button onClick={() => toggleSelectOne(p.id)} className="p-2 hover:bg-white rounded-lg transition-all shadow-sm">
                        <CheckSquare className={`w-5 h-5 ${isSelected ? 'text-[#1a3a22]' : 'text-slate-200'}`} />
                      </button>
                    </td>
                    <td className="px-6 py-7 text-center font-black text-slate-300 text-[10px] italic">{idx + 1}</td>
                    
                    <td className="px-6 py-7">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{p.id}</p>
                    </td>

                    <td className="px-8 py-7">
                       <div className="flex flex-col">
                          <p className="text-[13px] font-black uppercase italic text-slate-900 group-hover:text-[#1a3a22] leading-tight">{p.name}</p>
                          {isLow && <span className="text-[7px] font-black text-rose-500 uppercase mt-1 tracking-tighter animate-pulse flex items-center gap-1"><AlertCircle className="w-2 h-2" /> SEUIL CRITIQUE</span>}
                       </div>
                    </td>

                    <td className="px-6 py-7 text-center">
                      <span className="text-[9px] font-black uppercase text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{p.category}</span>
                    </td>

                    <td className="px-6 py-7 text-center">
                       <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center gap-3 no-print">
                             <button onClick={() => onMovement(p, -1)} className="p-1.5 bg-slate-100 text-slate-400 rounded-lg hover:bg-rose-100 hover:text-rose-500 transition-all"><Minus className="w-3.5 h-3.5" /></button>
                             <span className={`text-xl font-header italic ${isLow ? 'text-rose-500' : 'text-[#1a3a22]'}`}>{p.currentStock}</span>
                             <button onClick={() => onMovement(p, 1)} className="p-1.5 bg-slate-100 text-slate-400 rounded-lg hover:bg-emerald-100 hover:text-emerald-500 transition-all"><Plus className="w-3.5 h-3.5" /></button>
                             
                             <div className="h-4 w-px bg-slate-100 mx-1" />
                             
                             <button 
                               onClick={() => onQuickInventory(p.id)} 
                               title={`Inventaire Rapide (Cible: ${p.targetStock})`}
                               className="p-1.5 bg-indigo-50 text-indigo-400 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                             >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                             </button>
                          </div>
                          <span className="print:block hidden text-xl font-header italic text-[#1a3a22]">{p.currentStock}</span>
                          <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">{p.unit}</span>
                       </div>
                    </td>

                    {!settings.maskSensitiveData && (
                      <td className="px-6 py-7 text-right">
                        <p className="text-[11px] font-black italic text-slate-400">{unitPriceFc.toLocaleString()} <span className="text-[7px]">Fc</span></p>
                      </td>
                    )}

                    {!settings.maskSensitiveData && (
                      <td className="px-6 py-7 text-right">
                        <p className="text-sm font-header italic text-[#1a3a22]">{totalPriceFc.toLocaleString()} <span className="text-[8px] font-black">FC</span></p>
                      </td>
                    )}

                    <td className="px-6 py-7">
                      <p className="text-[9px] font-bold text-slate-400 flex items-center gap-1.5 uppercase">
                        <MapPin className="w-3 h-3 text-slate-300" /> {sites.find(s => s.id === p.siteId)?.name || 'N/A'}
                      </p>
                    </td>

                    <td className="px-6 py-7 text-right no-print">
                      <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => onCopyProducts([p])} title="Copier la fiche" className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Copy className="w-3.5 h-3.5" /></button>
                        <button onClick={() => onEdit(p)} title="Modifier" className="p-2 bg-slate-600 text-white rounded-lg hover:bg-[#1a3a22] transition-all shadow-sm"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => onDelete(p.id)} title="Supprimer" className="p-2 bg-rose-50 text-rose-300 rounded-lg hover:bg-rose-500 hover:text-white transition-all shadow-sm"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 flex items-center gap-4 no-print opacity-60">
        <Info className="w-5 h-5 text-slate-400" />
        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-loose">
          <b>Multi-sélection :</b> Cochez les cases à gauche pour copier plusieurs articles en lot et les dupliquer sur un autre site via l'onglet <i>"Sites"</i>.
        </p>
      </div>
    </div>
  );
};

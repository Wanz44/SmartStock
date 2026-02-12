
import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, Plus, Download, Upload, Edit3, Printer, Activity, MapPin, 
  Trash2, FileDown, FileUp, FileText, Database, X, ChevronDown, 
  CheckCircle2, AlertCircle, Info, FileSpreadsheet, History
} from 'lucide-react';
import { Product, AppSettings, Site } from './types';
import { Badge } from './Badge';

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

export const InventoryView = ({ 
  products, 
  settings, 
  sites, 
  onMovement, 
  onEdit, 
  onImport, 
  onAdd, 
  onDelete
}: InventoryViewProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterSite, setFilterSite] = useState('All');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exchangeRate = settings.exchangeRate;

  // EXPORTATION AVANCÉE CSV
  const handleExportCSV = () => {
    if (products.length === 0) return alert("Aucune donnée à exporter.");
    
    const headers = [
      "ID_ARTICLE", 
      "DESIGNATION", 
      "CATEGORIE", 
      "SITE", 
      "STOCK_ACTUEL", 
      "UNITE", 
      "SEUIL_MIN", 
      "PRIX_UNITAIRE", 
      "DEVISE", 
      "VALEUR_FC"
    ];

    const rows = products.map(p => {
      const siteName = sites.find(s => s.id === p.siteId)?.name || 'N/A';
      const valFc = p.currentStock * (p.currency === '$' ? p.unitPrice * exchangeRate : p.unitPrice);
      return [
        p.id,
        `"${p.name.replace(/"/g, '""')}"`,
        p.category,
        `"${siteName.replace(/"/g, '""')}"`,
        p.currentStock,
        p.unit,
        p.minStock,
        p.unitPrice,
        p.currency,
        valFc.toFixed(2)
      ];
    });

    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `SMARTSTOCK_INVENTAIRE_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // TÉLÉCHARGER MODÈLE D'IMPORT
  const downloadTemplate = () => {
    const headers = ["ID", "DESIGNATION", "CATEGORIE", "STOCK", "SEUIL_MIN", "UNITE", "PRIX", "DEVISE"];
    const sample = ["SKU-001", "RAMETTE PAPIER A4", "FOURNITURE", "50", "10", "RAMETTE", "5", "$"];
    const csvContent = "\uFEFF" + [headers, sample].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "MODELE_IMPORT_SMARTSTOCK.csv");
    link.click();
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p: Product) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
      const matchesSite = filterSite === 'All' || p.siteId === filterSite;
      const isLow = p.currentStock <= p.minStock;
      const matchesStatus = filterStatus === 'All' || (filterStatus === 'Critique' && isLow) || (filterStatus === 'Optimal' && !isLow);
      return matchesSearch && matchesCategory && matchesStatus && matchesSite;
    });
  }, [products, searchTerm, filterCategory, filterStatus, filterSite]);

  return (
    <div className="space-y-8 animate-fade-in pb-32">
      {/* HEADER PRINT */}
      <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-8">
        <h1 className="text-2xl font-black uppercase">{settings.printHeader}</h1>
        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">{settings.enterpriseName} | {new Date().toLocaleDateString()}</p>
      </div>

      {/* TOOLBAR AVANCÉE */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-6 no-print">
        <div className="flex items-center gap-4 flex-1 min-w-[300px]">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input 
              type="text" 
              placeholder="Référence ou désignation de l'article..." 
              className="w-full bg-slate-50 border border-slate-100 pl-14 pr-6 py-4 rounded-2xl text-[12px] font-black uppercase italic outline-none focus:ring-2 focus:ring-[#1a3a22]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl text-[11px] font-black uppercase outline-none focus:ring-2 focus:ring-[#1a3a22]"
            value={filterSite}
            onChange={(e) => setFilterSite(e.target.value)}
          >
            <option value="All">TOUS LES SITES</option>
            {sites.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
          </select>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-white text-slate-600 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all shadow-sm group relative"
              title="Importer CSV"
            >
              <FileUp className="w-5 h-5" />
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">IMPORT</span>
            </button>
            <button 
              onClick={handleExportCSV}
              className="p-3 bg-white text-slate-600 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm group relative"
              title="Exporter CSV"
            >
              <FileDown className="w-5 h-5" />
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">EXPORT</span>
            </button>
          </div>

          <button 
            onClick={() => window.print()} 
            className="flex items-center gap-3 px-8 py-4.5 bg-white border border-slate-100 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
          >
            <Printer className="w-4 h-4" /> Imprimer
          </button>

          <button 
            onClick={onAdd}
            className="flex items-center gap-3 px-8 py-4.5 bg-[#1a3a22] text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest hover:bg-emerald-900 transition-all shadow-xl active:scale-95"
          >
            <Plus className="w-4 h-4" /> ➕ Ajout Manuel
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={onImport} />
      </div>

      {/* TABLEAU PRINCIPAL */}
      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl overflow-hidden excel-print-mode">
        <table className="excel-table w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 border-b border-slate-100">
            <tr>
              <th className="px-10 py-8">Article & Référence</th>
              <th className="px-10 py-8">Catégorie</th>
              <th className="px-10 py-8 text-center">Stock</th>
              <th className="px-10 py-8 text-center">Unité</th>
              {!settings.maskSensitiveData && <th className="px-10 py-8 text-right">P.U. ({settings.primaryCurrency})</th>}
              <th className="px-10 py-8 text-right no-print">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-10 py-32 text-center">
                  <div className="opacity-20 flex flex-col items-center gap-4">
                    <Database className="w-16 h-16" />
                    <p className="text-xl font-header italic uppercase">Aucun article dans cette sélection</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => {
                const isLow = p.currentStock <= p.minStock;
                return (
                  <tr key={p.id} className={`group hover:bg-slate-50/50 transition-colors ${isLow ? 'stock-critical' : 'stock-optimal'}`}>
                    <td className="px-10 py-7">
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">{p.id}</p>
                      <p className="text-[14px] font-black uppercase italic text-slate-900 group-hover:text-[#1a3a22]">{p.name}</p>
                      <p className="text-[9px] font-bold text-slate-400 mt-1 flex items-center gap-1.5 uppercase">
                        <MapPin className="w-3 h-3" /> {sites.find(s => s.id === p.siteId)?.name || 'N/A'}
                      </p>
                    </td>
                    <td className="px-10 py-7">
                      <Badge variant="info">{p.category}</Badge>
                    </td>
                    <td className="px-10 py-7 text-center">
                       <div className="flex flex-col items-center">
                          <span className={`text-2xl font-header italic ${isLow ? 'text-rose-500 animate-pulse' : 'text-slate-900'}`}>
                            {p.currentStock}
                          </span>
                          {isLow && <span className="text-[8px] font-black text-rose-400 uppercase">Seuil Critique</span>}
                       </div>
                    </td>
                    <td className="px-10 py-7 text-center">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{p.unit}</span>
                    </td>
                    {!settings.maskSensitiveData && (
                      <td className="px-10 py-7 text-right">
                        <p className="text-lg font-header italic text-slate-900">{p.unitPrice.toLocaleString()} {p.currency}</p>
                      </td>
                    )}
                    <td className="px-10 py-7 text-right no-print">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => onMovement(p, 'entry')}
                          className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                          title="Entrée de stock"
                        >
                          <FileUp className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => onEdit(p)}
                          className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-[#1a3a22] hover:text-white transition-all shadow-sm"
                          title="Modifier"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => onDelete(p.id)}
                          className="p-3 bg-rose-50 text-rose-300 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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

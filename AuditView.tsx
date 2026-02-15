
import React, { useState, useMemo } from 'react';
import { 
  CheckSquare, Search, AlertCircle, CheckCircle2, 
  RotateCcw, Save, Filter, MapPin, Package,
  ArrowRightLeft, Info, HelpCircle
} from 'lucide-react';
import { Product, Site, AppSettings } from './types';
import { Badge } from './Badge';

interface AuditViewProps {
  products: Product[];
  sites: Site[];
  settings: AppSettings;
  exchangeRate: number;
  onUpdateStock: (prodId: string, amount: number, reason: string, type: 'adjustment') => void;
  notify: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

interface AuditRow {
  productId: string;
  physicalCount: string;
}

export const AuditView = ({ products, sites, settings, exchangeRate, onUpdateStock, notify }: AuditViewProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('All');
  const [auditData, setAuditData] = useState<AuditRow[]>([]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSite = selectedSiteId === 'All' || p.siteId === selectedSiteId;
      return matchesSearch && matchesSite;
    });
  }, [products, searchTerm, selectedSiteId]);

  const handleCountChange = (productId: string, value: string) => {
    setAuditData(prev => {
      const existing = prev.find(r => r.productId === productId);
      if (existing) {
        return prev.map(r => r.productId === productId ? { ...r, physicalCount: value } : r);
      }
      return [...prev, { productId, physicalCount: value }];
    });
  };

  const resetAudit = () => {
    if (confirm("Réinitialiser tous les comptages en cours ?")) {
      setAuditData([]);
    }
  };

  const applyAudit = () => {
    const changes = auditData.filter(row => row.physicalCount !== '');
    if (changes.length === 0) return notify("Aucun comptage saisi.", "warning");

    if (!confirm(`Souhaitez-vous appliquer ${changes.length} corrections de stock ? Un journal d'ajustement sera généré.`)) return;

    changes.forEach(row => {
      const product = products.find(p => p.id === row.productId);
      if (product) {
        const physical = parseInt(row.physicalCount);
        const difference = physical - product.currentStock;
        if (difference !== 0) {
          onUpdateStock(product.id, difference, `Audit Physique : ${physical}`, 'adjustment');
        }
      }
    });

    notify(`${changes.length} ajustements appliqués avec succès.`, "success");
    setAuditData([]);
  };

  const getStatus = (theoretical: number, physicalStr: string) => {
    if (physicalStr === '') return { label: 'En attente', variant: 'default' as const };
    const physical = parseInt(physicalStr);
    if (physical === theoretical) return { label: 'Conforme', variant: 'success' as const };
    if (physical > theoretical) return { label: 'Excédent', variant: 'info' as const };
    return { label: 'Manquant', variant: 'danger' as const };
  };

  const totalDiscrepancyValue = useMemo(() => {
    return auditData.reduce((acc, row) => {
      const product = products.find(p => p.id === row.productId);
      if (!product || row.physicalCount === '') return acc;
      const theoretical = product.currentStock;
      const physical = parseInt(row.physicalCount);
      const diff = physical - theoretical;
      const priceFc = product.currency === '$' ? product.unitPrice * exchangeRate : product.unitPrice;
      return acc + (diff * priceFc);
    }, 0);
  }, [auditData, products, exchangeRate]);

  return (
    <div className="space-y-8 animate-fade-in pb-32">
      {/* BARRE D'OUTILS AUDIT */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-6 no-print">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-indigo-50 rounded-[1.8rem] text-indigo-600">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Contrôle de conformité</p>
            <h3 className="text-xl font-header italic text-slate-900 uppercase">Audit & Écarts de Stock</h3>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={resetAudit} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all shadow-sm">
            <RotateCcw className="w-5 h-5" />
          </button>
          <button onClick={applyAudit} className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-indigo-700 transition-all shadow-xl">
            <Save className="w-4 h-4" /> Appliquer Corrections
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 no-print">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <input 
            type="text" 
            placeholder="Filtrer les articles..." 
            className="w-full bg-white border border-slate-100 pl-12 pr-4 py-4 rounded-2xl text-[11px] font-black uppercase italic outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <select 
            className="w-full bg-white border border-slate-100 pl-12 pr-4 py-4 rounded-2xl text-[11px] font-black uppercase outline-none focus:ring-2 focus:ring-indigo-500 appearance-none shadow-sm"
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
          >
            <option value="All">Tous les Sites</option>
            {sites.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
          </select>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
           <p className="text-[8px] font-black text-slate-400 uppercase leading-none">Valeur Écart :</p>
           <p className={`text-sm font-header italic ${totalDiscrepancyValue >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {totalDiscrepancyValue.toLocaleString()} FC
           </p>
        </div>
      </div>

      {/* TABLEAU D'AUDIT PHYSIQUE */}
      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
            <tr>
              <th className="px-10 py-7">Désignation</th>
              <th className="px-10 py-7 text-center">Stock Théorique</th>
              <th className="px-10 py-7 text-center">Comptage Physique</th>
              <th className="px-10 py-7 text-center">Écart</th>
              <th className="px-10 py-7 text-center">Statut</th>
              <th className="px-10 py-7">Site</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredProducts.length === 0 ? (
              <tr><td colSpan={6} className="px-10 py-32 text-center opacity-30 italic font-black text-[12px] uppercase">Aucun article à auditer</td></tr>
            ) : (
              filteredProducts.map((p) => {
                const row = auditData.find(r => r.productId === p.id);
                const physicalCount = row?.physicalCount || '';
                const diff = physicalCount !== '' ? parseInt(physicalCount) - p.currentStock : 0;
                const status = getStatus(p.currentStock, physicalCount);
                
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-10 py-7">
                       <p className="text-[12px] font-black uppercase italic text-slate-900 leading-tight">{p.name}</p>
                       <p className="text-[8px] font-bold text-slate-300 mt-1 uppercase">ID: {p.id}</p>
                    </td>
                    <td className="px-10 py-7 text-center">
                       <span className="text-xl font-header italic text-slate-400">{p.currentStock}</span>
                    </td>
                    <td className="px-10 py-7 text-center">
                       <input 
                         type="number" 
                         className="w-24 bg-slate-50 border border-slate-200 p-3 rounded-xl text-center text-xl font-header italic text-indigo-700 outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                         value={physicalCount}
                         onChange={(e) => handleCountChange(p.id, e.target.value)}
                         placeholder="?"
                       />
                    </td>
                    <td className="px-10 py-7 text-center">
                       <span className={`text-lg font-header italic ${diff === 0 ? 'text-slate-200' : diff > 0 ? 'text-indigo-500' : 'text-rose-500'}`}>
                          {diff > 0 ? '+' : ''}{diff}
                       </span>
                    </td>
                    <td className="px-10 py-7 text-center">
                       <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                    <td className="px-10 py-7">
                       <p className="text-[9px] font-bold text-slate-400 uppercase italic">
                         {sites.find(s => s.id === p.siteId)?.name || 'N/A'}
                       </p>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 flex items-center gap-4 no-print opacity-80">
        <Info className="w-5 h-5 text-indigo-400" />
        <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest leading-loose">
           <b>Processus d'Audit :</b> Saisissez les quantités réellement comptées physiquement. 
           Le système calculera automatiquement les écarts et ajustera vos stocks lors de la validation. 
           Toutes les régularisations sont enregistrées dans l'historique de traçabilité.
        </p>
      </div>
    </div>
  );
};

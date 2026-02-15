
import React, { useState, useMemo, useEffect } from 'react';
import { 
  ClipboardList, History, Plus, Save, 
  MapPin, ChevronRight, FileDown, Trash2,
  CheckCircle2, Printer, Activity, Edit3, Layers,
  CalendarDays, Filter, ShoppingCart, Search,
  ArrowRight, Calculator, FileSpreadsheet, X, Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Product, NeedReport, NeedItem, AppSettings, Site } from './types';
import { Badge } from './Badge';

interface NeedsReportViewProps {
  products: Product[];
  settings: AppSettings;
  needsHistory: NeedReport[];
  onSaveReport: (report: NeedReport) => void;
  onDeleteReport: (id: string) => void;
  sites: Site[];
  initialSiteId?: string;
}

export const NeedsReportView = ({ 
  products, 
  settings, 
  needsHistory, 
  onSaveReport, 
  onDeleteReport,
  sites,
  initialSiteId
}: NeedsReportViewProps) => {
  const [activeTab, setActiveTab] = useState<'new' | 'history' | 'consolidated'>('new');
  const [selectedSiteId, setSelectedSiteId] = useState<string>(initialSiteId || (sites.length > 0 ? sites[0].id : ''));
  const [viewingReport, setViewingReport] = useState<NeedReport | null>(null);
  const [draftItems, setDraftItems] = useState<NeedItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  
  // États pour le mode consolidé
  const [consolidatedSiteFilter, setConsolidatedSiteFilter] = useState<string>('All');
  const [consolidatedDraft, setConsolidatedDraft] = useState<NeedItem[]>([]);
  
  // Filtres Archive
  const [archiveMonthFilter, setArchiveMonthFilter] = useState<string>(new Date().toISOString().slice(0, 7));
  const [archiveSiteFilter, setArchiveSiteFilter] = useState<string>('All');

  const exchangeRate = settings.exchangeRate;

  // Calcul initial du site filtré pour le mode Nouveau
  const siteProducts = useMemo(() => {
    return products.filter(p => p.siteId === selectedSiteId);
  }, [products, selectedSiteId]);

  // Chargement automatique des suggestions lors de la sélection d'un site
  useEffect(() => {
    if (activeTab === 'new' && selectedSiteId) {
      const suggested = siteProducts
        .filter(p => p.currentStock <= p.minStock)
        .map(p => createNeedItem(p));
      setDraftItems(suggested);
    }
  }, [selectedSiteId, activeTab, siteProducts]);

  // Initialisation du mode consolidé
  useEffect(() => {
    if (activeTab === 'consolidated') {
      const baseList = products.filter(p => {
        const matchesSite = consolidatedSiteFilter === 'All' || p.siteId === consolidatedSiteFilter;
        return matchesSite && p.currentStock <= p.minStock;
      });
      setConsolidatedDraft(baseList.map(p => createNeedItem(p)));
    }
  }, [activeTab, consolidatedSiteFilter, products]);

  useEffect(() => {
    if (initialSiteId) {
      setSelectedSiteId(initialSiteId);
      setActiveTab('new');
    }
  }, [initialSiteId]);

  const createNeedItem = (p: Product): NeedItem => {
    const qtyToOrder = Math.max(1, p.targetStock - p.currentStock);
    const unitPriceFc = p.currency === '$' ? p.unitPrice * exchangeRate : p.unitPrice;
    return {
      productId: p.id,
      productName: p.name,
      standardNeed: p.monthlyNeed,
      currentStock: p.currentStock,
      quantityToOrder: qtyToOrder,
      unitPrice: p.unitPrice,
      currency: p.currency,
      totalCost: qtyToOrder * unitPriceFc
    };
  };

  const handleAddItem = () => {
    if (!selectedProductId) return;
    if (draftItems.find(i => i.productId === selectedProductId)) return;
    const product = products.find(p => p.id === selectedProductId);
    if (product) {
      setDraftItems([...draftItems, createNeedItem(product)]);
      setSelectedProductId('');
    }
  };

  const handleQuantityChange = (productId: string, newQty: number, mode: 'new' | 'consolidated') => {
    const updateFn = (prev: NeedItem[]) => prev.map(item => {
      if (item.productId === productId) {
        const unitPriceFc = item.currency === '$' ? item.unitPrice * exchangeRate : item.unitPrice;
        return { ...item, quantityToOrder: newQty, totalCost: newQty * unitPriceFc };
      }
      return item;
    });

    if (mode === 'new') setDraftItems(updateFn);
    else setConsolidatedDraft(updateFn);
  };

  const handleSave = () => {
    if (draftItems.length === 0) return;
    if (!selectedSiteId) {
      alert("Veuillez sélectionner un site");
      return;
    }
    const site = sites.find(s => s.id === selectedSiteId);
    const totalVal = draftItems.reduce((acc, curr) => acc + curr.totalCost, 0);
    const newReport: NeedReport = {
      id: `REQ-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      siteId: selectedSiteId,
      siteName: site?.name || 'Inconnu',
      items: draftItems,
      totalValueFc: totalVal,
      status: 'Validé'
    };
    onSaveReport(newReport);
    setDraftItems([]);
    setActiveTab('history');
  };

  const handleExportExcel = (items: NeedItem[], title: string) => {
    const data = items.map((it, idx) => ({
      "N°": idx + 1,
      "Désignation": it.productName,
      "Réf": it.productId,
      "Stock Actuel": it.currentStock,
      "Quantité Demandée": it.quantityToOrder,
      "P.U": it.unitPrice,
      "Devise": it.currency,
      "Total (FC)": it.totalCost
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Besoins");
    XLSX.writeFile(wb, `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const filteredNeedsHistory = useMemo(() => {
    return needsHistory.filter(r => {
      const matchMonth = !archiveMonthFilter || r.date.startsWith(archiveMonthFilter);
      const matchSite = archiveSiteFilter === 'All' || r.siteId === archiveSiteFilter;
      return matchMonth && matchSite;
    });
  }, [needsHistory, archiveMonthFilter, archiveSiteFilter]);

  const totalValueConsolidated = useMemo(() => {
    return consolidatedDraft.reduce((acc, it) => acc + it.totalCost, 0);
  }, [consolidatedDraft]);

  const PrintTemplate = ({ report }: { report: NeedReport }) => (
    <div className="excel-print-mode">
      <div className="flex justify-between items-start mb-10 border-b-4 border-emerald-800 pb-6">
         <div>
            <h1 className="text-3xl font-black italic uppercase text-emerald-900">{settings.enterpriseName}</h1>
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Logistique & Approvisionnement</p>
         </div>
         <div className="text-right">
            <h2 className="text-xl font-header italic text-emerald-900 uppercase">État de Besoin Officiel</h2>
            <p className="text-[10px] font-bold uppercase mt-1">N° DOCUMENT : {report.id}</p>
            <p className="text-[10px] font-bold uppercase">SITE : {report.siteName}</p>
            <p className="text-[10px] font-bold uppercase">DATE : {new Date(report.date).toLocaleDateString()}</p>
         </div>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-emerald-900 text-white text-[10px] font-black uppercase">
            <th className="border border-emerald-950 p-3">N°</th>
            <th className="border border-emerald-950 p-3 text-left">Désignation</th>
            <th className="border border-emerald-950 p-3">Qté</th>
            <th className="border border-emerald-950 p-3 text-right">P.U</th>
            <th className="border border-emerald-950 p-3 text-right">Total FC</th>
          </tr>
        </thead>
        <tbody>
          {report.items.map((it, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-emerald-50/30'}>
              <td className="border border-slate-200 p-3 text-center font-bold text-[10px]">{idx + 1}</td>
              <td className="border border-slate-200 p-3 font-bold uppercase text-[11px]">{it.productName}</td>
              <td className="border border-slate-200 p-3 text-center font-black text-lg italic">{it.quantityToOrder}</td>
              <td className="border border-slate-200 p-3 text-right font-bold text-[10px]">{it.unitPrice.toLocaleString()} {it.currency}</td>
              <td className="border border-slate-200 p-3 text-right font-black italic">{it.totalCost.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
           <tr className="bg-slate-100">
              <td colSpan={3} className="p-6 text-2xl font-header italic text-emerald-900 border border-slate-200 uppercase text-center">Montant Global</td>
              <td colSpan={2} className="p-6 text-3xl font-header italic text-right border border-slate-200 bg-emerald-900 text-white">
                 {report.totalValueFc.toLocaleString()} FC
              </td>
           </tr>
        </tfoot>
      </table>

      <div className="grid grid-cols-3 gap-6 mt-12 text-center text-[9px] font-black uppercase italic">
         <div className="border border-slate-300 p-10 rounded-2xl">Signature Demandeur</div>
         <div className="border border-slate-300 p-10 rounded-2xl">Visa Service Logistique</div>
         <div className="border border-slate-300 p-10 rounded-2xl">Approbation Direction</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-32">
      <div className="flex flex-wrap gap-4 no-print">
        <button 
          onClick={() => { setActiveTab('new'); setViewingReport(null); }} 
          className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
            activeTab === 'new' ? 'bg-[#1a3a22] text-white shadow-xl' : 'bg-white text-slate-400 border border-slate-100'
          }`}
        >
          <Plus className="w-4 h-4" /> Nouvelle Requête Site
        </button>
        <button 
          onClick={() => { setActiveTab('history'); setViewingReport(null); }} 
          className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
            activeTab === 'history' ? 'bg-blue-600 text-white shadow-xl' : 'bg-white text-slate-400 border border-slate-100'
          }`}
        >
          <History className="w-4 h-4" /> Archives par Site
        </button>
        <button 
          onClick={() => { setActiveTab('consolidated'); setViewingReport(null); }} 
          className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
            activeTab === 'consolidated' ? 'bg-emerald-600 text-white shadow-xl' : 'bg-white text-slate-400 border border-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" /> Besoins Consolidés
        </button>
      </div>

      {activeTab === 'new' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-4 space-y-6 no-print">
              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-10">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">1. Localisation Cible</label>
                    <div className="bg-slate-50 p-5 rounded-2xl flex items-center gap-4 border border-transparent focus-within:border-[#1a3a22] transition-all">
                       <MapPin className="w-6 h-6 text-[#1a3a22]" />
                       <select 
                         className="flex-1 bg-transparent text-[13px] font-black uppercase italic outline-none" 
                         value={selectedSiteId} 
                         onChange={(e) => { setSelectedSiteId(e.target.value); setDraftItems([]); }}
                       >
                         {sites.length === 0 ? <option value="">Aucun site</option> : sites.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                       </select>
                    </div>
                 </div>
                 
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">2. Article Additionnel</label>
                    <div className="flex gap-2">
                       <select 
                         className="flex-1 bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[10px] font-black uppercase outline-none" 
                         value={selectedProductId} 
                         onChange={(e) => setSelectedProductId(e.target.value)}
                       >
                          <option value="">Chercher un produit...</option>
                          {siteProducts.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
                       </select>
                       <button 
                         onClick={handleAddItem} 
                         disabled={!selectedProductId}
                         className="p-5 bg-[#1a3a22] text-white rounded-2xl shadow-lg hover:bg-emerald-900 transition-all disabled:opacity-30"
                       >
                         <Plus className="w-6 h-6" />
                       </button>
                    </div>
                 </div>
                 
                 <div className="pt-8 border-t border-slate-50">
                    <button 
                      onClick={handleSave} 
                      disabled={draftItems.length === 0} 
                      className="w-full bg-[#1a3a22] text-white py-8 rounded-[2.5rem] font-black text-[12px] uppercase tracking-widest shadow-2xl hover:bg-emerald-900 transition-all flex items-center justify-center gap-4 disabled:opacity-30"
                    >
                      <Save className="w-6 h-6" /> Valider le Rapport Site
                    </button>
                 </div>
              </div>
           </div>
           
           <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-[4rem] border border-slate-100 shadow-xl overflow-hidden min-h-[600px] flex flex-col">
                 <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Contenu du rapport prévisionnel</h4>
                    {draftItems.length > 0 && <Badge variant="warning">{draftItems.length} articles suggérés</Badge>}
                 </div>
                 <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white text-[9px] font-black uppercase text-slate-300 border-b border-slate-50">
                          <tr>
                            <th className="px-10 py-6">Désignation</th>
                            <th className="px-10 py-6 text-center">En Stock</th>
                            <th className="px-10 py-6 text-center">Requête</th>
                            <th className="px-10 py-6 text-right">Montant Est. (Fc)</th>
                            <th className="px-6 py-6"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {draftItems.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-10 py-40 text-center opacity-20 italic font-black text-[14px] uppercase">
                                Aucun article en rupture détecté sur ce site
                              </td>
                            </tr>
                          ) : (
                            draftItems.map((item) => (
                              <tr key={item.productId} className="group hover:bg-slate-50/30">
                                  <td className="px-10 py-6">
                                    <p className="text-[13px] font-black uppercase italic text-slate-900 leading-none">{item.productName}</p>
                                    <p className="text-[8px] font-bold text-slate-300 mt-1">ID: {item.productId}</p>
                                  </td>
                                  <td className="px-10 py-6 text-center font-bold text-slate-400">{item.currentStock}</td>
                                  <td className="px-10 py-6 text-center">
                                    <input 
                                      type="number" 
                                      className="w-24 bg-white border border-slate-100 p-4 rounded-xl text-center text-xl font-header italic outline-none focus:ring-2 focus:ring-[#1a3a22]" 
                                      value={item.quantityToOrder} 
                                      onChange={(e) => handleQuantityChange(item.productId, Number(e.target.value), 'new')} 
                                    />
                                  </td>
                                  <td className="px-10 py-6 text-right font-header italic text-slate-900 text-lg">{item.totalCost.toLocaleString()}</td>
                                  <td className="px-6 py-6 text-right">
                                    <button 
                                      onClick={() => setDraftItems(draftItems.filter(i => i.productId !== item.productId))} 
                                      className="p-3 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                    </table>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'history' && !viewingReport && (
        <div className="space-y-8 animate-fade-in">
           <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-wrap gap-6 no-print">
              <div className="flex-1 min-w-[200px] space-y-2">
                 <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Filtrer par Site</label>
                 <select 
                   className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-[11px] font-black uppercase outline-none"
                   value={archiveSiteFilter}
                   onChange={(e) => setArchiveSiteFilter(e.target.value)}
                 >
                    <option value="All">TOUS LES SITES</option>
                    {sites.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                 </select>
              </div>
              <div className="w-64 space-y-2">
                 <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Période (Mois)</label>
                 <input 
                   type="month" 
                   value={archiveMonthFilter}
                   onChange={(e) => setArchiveMonthFilter(e.target.value)}
                   className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-[11px] font-black outline-none"
                 />
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 no-print">
              {filteredNeedsHistory.length === 0 ? (
                <div className="col-span-full py-40 text-center opacity-20 italic font-black text-[14px] uppercase border-2 border-dashed border-slate-200 rounded-[4rem]">
                   Aucun rapport archivé pour ces critères
                </div>
              ) : (
                filteredNeedsHistory.map((report) => (
                  <div 
                    key={report.id} 
                    onClick={() => setViewingReport(report)} 
                    className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer group"
                  >
                     <div className="flex justify-between items-start mb-8">
                        <div className="p-5 bg-slate-50 rounded-[2rem] group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <ClipboardList className="w-8 h-8" />
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDeleteReport(report.id); }} 
                          className="p-3 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                     </div>
                     <h4 className="text-[14px] font-black uppercase italic text-slate-900 mb-2 leading-none">{report.id}</h4>
                     <p className="text-[10px] font-bold text-slate-400 uppercase mb-6 flex items-center gap-2">
                       <MapPin className="w-4 h-4 text-slate-300" /> {report.siteName}
                     </p>
                     <div className="flex justify-between items-end border-t border-slate-50 pt-6">
                        <div>
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Budget Total</p>
                          <p className="text-2xl font-header italic text-slate-900">{report.totalValueFc.toLocaleString()} Fc</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-black text-slate-300 uppercase mb-1">{report.items.length} Réf.</p>
                          <Badge variant="success">Archivé</Badge>
                        </div>
                     </div>
                  </div>
                ))
              )}
           </div>
        </div>
      )}

      {viewingReport && (
        <>
          <div className="no-print space-y-6">
             <div className="flex justify-between items-center">
               <button 
                 onClick={() => setViewingReport(null)} 
                 className="text-[10px] font-black uppercase text-slate-400 hover:text-[#1a3a22] flex items-center gap-3 bg-white px-6 py-3 rounded-full border border-slate-100 transition-all shadow-sm"
               >
                 <ChevronRight className="w-4 h-4 rotate-180" /> Retour au registre
               </button>
               <div className="flex gap-4">
                 <button 
                    onClick={() => handleExportExcel(viewingReport.items, viewingReport.id)} 
                    className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-100 text-slate-600 rounded-full font-black text-[10px] uppercase hover:bg-slate-50 transition-all shadow-sm"
                 >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel (.xlsx)
                 </button>
                 <button 
                    onClick={() => window.print()} 
                    className="flex items-center gap-3 px-6 py-3 bg-[#1a3a22] text-white rounded-full font-black text-[10px] uppercase hover:bg-emerald-900 transition-all shadow-lg"
                 >
                    <Printer className="w-4 h-4" /> PDF / Impression
                 </button>
               </div>
             </div>
             
             <div className="bg-white p-16 rounded-[5rem] border border-slate-100 shadow-2xl space-y-12">
                <div className="flex justify-between items-start">
                   <div>
                     <Badge variant="success">Document Certifié {viewingReport.status}</Badge>
                     <h3 className="text-5xl font-header italic mt-6 uppercase leading-none">{viewingReport.id}</h3>
                     <p className="text-[11px] font-black uppercase text-slate-400 tracking-[0.3em] mt-2">
                        Site : {viewingReport.siteName} — Date : {new Date(viewingReport.date).toLocaleDateString()}
                     </p>
                   </div>
                </div>
                
                <div className="overflow-hidden rounded-[3rem] border border-slate-100 shadow-inner">
                   <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                         <tr>
                           <th className="px-10 py-6">Désignation</th>
                           <th className="px-10 py-6 text-center">Qté Demandée</th>
                           <th className="px-10 py-6 text-right">Total Est. (Fc)</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {viewingReport.items.map((it, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="px-10 py-6 font-black uppercase italic text-slate-900">{it.productName}</td>
                              <td className="px-10 py-6 text-center font-black text-2xl italic text-[#1a3a22]">{it.quantityToOrder}</td>
                              <td className="px-10 py-6 text-right font-header italic text-xl">{it.totalCost.toLocaleString()}</td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
                <div className="flex justify-end p-10 bg-slate-50 rounded-[3rem]">
                   <div className="text-right">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Montant Global Approximatif</p>
                      <p className="text-4xl font-header italic text-[#1a3a22]">{viewingReport.totalValueFc.toLocaleString()} FC</p>
                   </div>
                </div>
             </div>
          </div>
          <PrintTemplate report={viewingReport} />
        </>
      )}

      {activeTab === 'consolidated' && (
        <div className="space-y-8 animate-fade-in">
          <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-10 no-print">
            <div className="flex items-center gap-8 flex-1">
              <div className="p-6 bg-emerald-50 rounded-[2.5rem] text-emerald-600 shadow-inner">
                <Layers className="w-10 h-10" />
              </div>
              <div className="flex-1 max-w-md">
                <p className="text-[12px] font-black uppercase text-slate-400 tracking-widest mb-2">Filtrage par source</p>
                <div className="bg-slate-50 p-2 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-emerald-500 ml-2" />
                  <select 
                    className="flex-1 bg-transparent py-2 text-[12px] font-black uppercase italic outline-none"
                    value={consolidatedSiteFilter}
                    onChange={(e) => setConsolidatedSiteFilter(e.target.value)}
                  >
                    <option value="All">Global - Tous les Sites</option>
                    {sites.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4">
               <button 
                onClick={() => handleExportExcel(consolidatedDraft, "Besoins_Consolides")}
                className="flex items-center gap-4 px-10 py-7 bg-white border border-slate-200 text-slate-700 rounded-[3rem] font-black text-[12px] uppercase shadow-lg hover:bg-slate-50 transition-all"
              >
                <FileSpreadsheet className="w-6 h-6 text-emerald-600" /> Excel
              </button>
              <button 
                onClick={() => window.print()} 
                className="flex items-center gap-4 px-12 py-7 bg-[#1a3a22] text-white rounded-[3rem] font-black text-[12px] uppercase shadow-2xl hover:bg-emerald-900 transition-all"
              >
                <Printer className="w-6 h-6" /> PDF / Imprimer
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-[4rem] border border-slate-100 shadow-xl overflow-hidden no-print">
            <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
               <div>
                  <h4 className="text-[12px] font-black uppercase text-slate-900">Articles en Rupture & Alerte</h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Source : {consolidatedSiteFilter === 'All' ? 'Réseau Complet' : sites.find(s => s.id === consolidatedSiteFilter)?.name}</p>
               </div>
               <Badge variant="warning">{consolidatedDraft.length} alertes actives</Badge>
            </div>
            
            <table className="w-full text-left">
              <thead className="bg-white text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-12 py-8">Article & Référence</th>
                  <th className="px-12 py-8 text-center">Stock Actuel</th>
                  <th className="px-12 py-8 text-center w-48">Commande</th>
                  <th className="px-12 py-8 text-right">Valeur Estimée (Fc)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {consolidatedDraft.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-12 py-40 text-center opacity-20 italic font-black text-[16px] uppercase">
                       Aucun besoin critique détecté sur la sélection actuelle
                    </td>
                  </tr>
                ) : (
                  consolidatedDraft.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 group transition-all">
                      <td className="px-12 py-7">
                        <p className="font-black uppercase italic text-slate-900 text-lg group-hover:text-[#1a3a22] transition-colors">{item.productName}</p>
                        <p className="text-[9px] font-bold text-slate-300 tracking-widest mt-1">ID: {item.productId}</p>
                      </td>
                      <td className="px-12 py-7 text-center">
                        <span className="bg-slate-100 px-4 py-2 rounded-xl text-[12px] font-black text-slate-500">{item.currentStock}</span>
                      </td>
                      <td className="px-12 py-7 text-center">
                        <div className="relative group/input">
                          <input 
                            type="number" 
                            className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center text-2xl font-header italic text-emerald-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                            value={item.quantityToOrder}
                            onChange={(e) => handleQuantityChange(item.productId, Number(e.target.value), 'consolidated')}
                          />
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 opacity-0 group-hover/input:opacity-100 transition-all">
                            <Badge variant="info">Modifier Qté</Badge>
                          </div>
                        </div>
                      </td>
                      <td className="px-12 py-7 text-right">
                        <p className="font-header italic text-slate-900 text-2xl">
                          {item.totalCost.toLocaleString()} <span className="text-[10px] font-black uppercase text-slate-300 ml-1">Fc</span>
                        </p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-900 text-white shadow-[0_-20px_50px_rgba(15,23,42,0.3)]">
                <tr>
                  <td colSpan={3} className="px-12 py-12 text-2xl font-header italic uppercase text-right border-r border-white/5">Budget Total Prévisionnel</td>
                  <td className="px-12 py-12 text-5xl font-header italic text-right text-emerald-400">
                    {totalValueConsolidated.toLocaleString()} <span className="text-xl">FC</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Version d'impression du consolidé */}
          <div className="excel-print-mode">
             <div className="flex justify-between items-start mb-12 border-b-4 border-slate-900 pb-8">
                <div>
                  <h1 className="text-4xl font-black italic uppercase text-slate-900">{settings.enterpriseName}</h1>
                  <p className="text-[12px] font-black uppercase text-slate-400 tracking-[0.4em] mt-2">Besoins Consolidés Globalisés</p>
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-header italic text-slate-900 uppercase">Rapport de Commande Groupé</h2>
                  <p className="text-[11px] font-bold uppercase mt-2">PÉRIMÈTRE : {consolidatedSiteFilter === 'All' ? 'GLOBAL RÉSEAU' : sites.find(s => s.id === consolidatedSiteFilter)?.name}</p>
                  <p className="text-[11px] font-bold uppercase">DATE : {new Date().toLocaleDateString()}</p>
                </div>
             </div>

             <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px] font-black uppercase">
                    <th className="border border-slate-900 p-4 w-12">N°</th>
                    <th className="border border-slate-900 p-4 text-left">Désignation Article</th>
                    <th className="border border-slate-900 p-4 text-center">En Stock</th>
                    <th className="border border-slate-900 p-4 text-center">À Commander</th>
                    <th className="border border-slate-900 p-4 text-right">Valeur Est. FC</th>
                  </tr>
                </thead>
                <tbody>
                  {consolidatedDraft.map((it, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="border border-slate-300 p-4 text-center font-bold">{idx + 1}</td>
                      <td className="border border-slate-300 p-4 font-black uppercase text-lg italic text-slate-900">{it.productName}</td>
                      <td className="border border-slate-300 p-4 text-center font-bold text-slate-400">{it.currentStock}</td>
                      <td className="border border-slate-300 p-4 text-center font-black text-3xl italic text-slate-900">{it.quantityToOrder}</td>
                      <td className="border border-slate-300 p-4 text-right font-header italic text-2xl">{it.totalCost.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                   <tr className="bg-slate-200">
                      <td colSpan={4} className="p-8 text-3xl font-header italic text-slate-900 text-right uppercase">Budget Global Consolidé</td>
                      <td className="p-8 text-5xl font-header italic text-right bg-slate-900 text-white">
                         {totalValueConsolidated.toLocaleString()} FC
                      </td>
                   </tr>
                </tfoot>
             </table>

             <div className="grid grid-cols-2 gap-10 mt-20 text-center text-[10px] font-black uppercase italic">
                <div className="border-t-2 border-slate-900 pt-10 px-10">Visa Logistique Opérationnelle</div>
                <div className="border-t-2 border-slate-900 pt-10 px-10">Direction des Achats & Finances</div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo, useEffect } from 'react';
import { 
  ClipboardList, History, Plus, Save, 
  MapPin, ChevronRight, FileDown, Trash2,
  CheckCircle2, Printer, Activity, Edit3, Layers,
  CalendarDays, Filter, ShoppingCart, Search,
  ArrowRight, Calculator, FileSpreadsheet
} from 'lucide-react';
import { Product, NeedReport, NeedItem, AppSettings, Site } from './types';
import { Badge } from './Badge';

interface NeedsReportViewProps {
  products: Product[];
  settings: AppSettings;
  needsHistory: NeedReport[];
  onSaveReport: (report: NeedReport) => void;
  onDeleteReport: (id: string) => void;
  sites: Site[];
}

export const NeedsReportView = ({ 
  products, 
  settings, 
  needsHistory, 
  onSaveReport, 
  onDeleteReport,
  sites 
}: NeedsReportViewProps) => {
  const [activeTab, setActiveTab] = useState<'new' | 'history' | 'consolidated'>('new');
  const [selectedSiteId, setSelectedSiteId] = useState<string>(sites.length > 0 ? sites[0].id : '');
  const [viewingReport, setViewingReport] = useState<NeedReport | null>(null);
  const [draftItems, setDraftItems] = useState<NeedItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [archiveMonthFilter, setArchiveMonthFilter] = useState<string>(new Date().toISOString().slice(0, 7));

  const exchangeRate = settings.exchangeRate;

  const siteProducts = useMemo(() => {
    return products.filter(p => p.siteId === selectedSiteId);
  }, [products, selectedSiteId]);

  useEffect(() => {
    if (activeTab === 'new' && draftItems.length === 0 && selectedSiteId) {
      const suggested = siteProducts
        .filter(p => p.currentStock < p.minStock)
        .map(p => createNeedItem(p));
      setDraftItems(suggested);
    }
  }, [selectedSiteId, activeTab, siteProducts]);

  const createNeedItem = (p: Product): NeedItem => {
    const qtyToOrder = Math.max(0, p.monthlyNeed - p.currentStock);
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

  const handleQuantityChange = (productId: string, newQty: number) => {
    setDraftItems(prev => prev.map(item => {
      if (item.productId === productId) {
        const unitPriceFc = item.currency === '$' ? item.unitPrice * exchangeRate : item.unitPrice;
        return { ...item, quantityToOrder: newQty, totalCost: newQty * unitPriceFc };
      }
      return item;
    }));
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
      id: `REQ-${Date.now()}`,
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

  const totalValueConsolidated = useMemo(() => {
    return products.reduce((acc, p) => {
      const qty = Math.max(0, p.monthlyNeed - p.currentStock);
      const priceFc = p.currency === '$' ? p.unitPrice * exchangeRate : p.unitPrice;
      return acc + (qty * priceFc);
    }, 0);
  }, [products, exchangeRate]);

  // Template d'impression spécifique Excel pour chaque site
  const PrintTemplate = ({ report }: { report: NeedReport }) => (
    <div className="excel-print-mode">
      <div className="excel-header-brand">
         <div>
            <h1 style={{fontSize: '24px', fontWeight: '900', color: '#1b5e20', textTransform: 'uppercase'}}>{settings.enterpriseName}</h1>
            <p style={{fontSize: '10px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase'}}>LOGISTIQUE & APPROVISIONNEMENT</p>
         </div>
         <div style={{textAlign: 'right'}}>
            <h2 style={{fontSize: '18px', fontWeight: '800', color: '#1b5e20'}}>ÉTAT DE BESOIN OFFICIEL</h2>
            <p style={{fontSize: '11px', fontWeight: 'bold'}}>SITE : {report.siteName.toUpperCase()}</p>
            <p style={{fontSize: '10px'}}>DATE : {new Date(report.date).toLocaleDateString()}</p>
         </div>
      </div>

      <table className="excel-table">
        <thead>
          <tr>
            <th style={{width: '40px'}}>N°</th>
            <th style={{textAlign: 'left'}}>DÉSIGNATION</th>
            <th style={{width: '100px'}}>QUANTITÉ</th>
            <th style={{width: '120px'}}>PRIX UNITAIRE</th>
            <th style={{width: '140px'}}>PRIX TOTAL</th>
            <th>COMMENTAIRE</th>
          </tr>
        </thead>
        <tbody>
          {report.items.map((it, idx) => (
            <tr key={idx}>
              <td style={{textAlign: 'center', fontWeight: 'bold'}}>{idx + 1})</td>
              <td style={{fontWeight: 'bold', textTransform: 'uppercase'}}>{it.productName}</td>
              <td style={{textAlign: 'center', fontWeight: '900'}}>{it.quantityToOrder}</td>
              <td style={{textAlign: 'right'}}>{it.unitPrice.toLocaleString()} {it.currency}</td>
              <td style={{textAlign: 'right', fontWeight: 'bold'}}>{it.totalCost.toLocaleString()} Fc</td>
              <td></td>
            </tr>
          ))}
          {[...Array(Math.max(0, 5 - report.items.length))].map((_, i) => (
            <tr key={`blank-${i}`} style={{height: '35px'}}>
              <td></td><td></td><td></td><td></td><td></td><td></td>
            </tr>
          ))}
        </tbody>
        <tfoot>
           <tr>
              <td colSpan={3} style={{border: 'none', background: '#1b5e20', color: 'white', padding: '20px', fontSize: '20px', fontWeight: '900', textAlign: 'center'}}>TOTAL</td>
              <td colSpan={3} className="excel-total-row" style={{padding: '15px'}}>
                 <div style={{fontSize: '22px'}}>{report.totalValueFc.toLocaleString()} Fc</div>
                 <div style={{fontSize: '16px', opacity: 0.8}}>{(report.totalValueFc / settings.exchangeRate).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} $</div>
              </td>
           </tr>
        </tfoot>
      </table>

      <div style={{marginTop: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', textAlign: 'center', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase'}}>
         <div style={{border: '1px solid #ccc', padding: '20px', borderRadius: '10px'}}>Signature Demandeur</div>
         <div style={{border: '1px solid #ccc', padding: '20px', borderRadius: '10px'}}>Visa Logistique</div>
         <div style={{border: '1px solid #ccc', padding: '20px', borderRadius: '10px'}}>Approbation Direction</div>
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
          <Plus className="w-4 h-4" /> Nouveau Rapport
        </button>
        <button 
          onClick={() => { setActiveTab('consolidated'); setViewingReport(null); }} 
          className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
            activeTab === 'consolidated' ? 'bg-emerald-600 text-white shadow-xl' : 'bg-white text-slate-400 border border-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" /> Vue Consolidée
        </button>
        <button 
          onClick={() => { setActiveTab('history'); setViewingReport(null); }} 
          className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
            activeTab === 'history' ? 'bg-blue-600 text-white shadow-xl' : 'bg-white text-slate-400 border border-slate-100'
          }`}
        >
          <History className="w-4 h-4" /> Archives Mensuelles
        </button>
      </div>

      {activeTab === 'new' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-4 space-y-6 no-print">
              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">1. Sélection du Site</label>
                    <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-4 border border-transparent focus-within:border-emerald-500">
                       <MapPin className="w-5 h-5 text-emerald-500" />
                       <select 
                         className="flex-1 bg-transparent text-[12px] font-black uppercase italic outline-none" 
                         value={selectedSiteId} 
                         onChange={(e) => { setSelectedSiteId(e.target.value); setDraftItems([]); }}
                         disabled={sites.length === 0}
                       >
                         {sites.length === 0 ? (
                           <option value="">Aucun site disponible</option>
                         ) : (
                           sites.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)
                         )}
                       </select>
                    </div>
                    {sites.length === 0 && (
                      <p className="text-[9px] font-black text-rose-500 text-center">
                        ⚠️ Créez d'abord un site dans "Gestion Sites"
                      </p>
                    )}
                 </div>
                 
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">2. Ajouter un Article</label>
                    <div className="flex gap-2">
                       <select 
                         className="flex-1 bg-slate-50 border border-slate-100 p-4 rounded-2xl text-[10px] font-black uppercase outline-none" 
                         value={selectedProductId} 
                         onChange={(e) => setSelectedProductId(e.target.value)}
                         disabled={!selectedSiteId || sites.length === 0}
                       >
                          <option value="">Sélectionner un produit...</option>
                          {siteProducts.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
                       </select>
                       <button 
                         onClick={handleAddItem} 
                         disabled={!selectedProductId}
                         className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg hover:bg-emerald-700 transition-all disabled:opacity-30"
                       >
                         <Plus className="w-5 h-5" />
                       </button>
                    </div>
                 </div>
                 
                 <div className="pt-6 border-t border-slate-50">
                    <button 
                      onClick={handleSave} 
                      disabled={draftItems.length === 0 || !selectedSiteId || sites.length === 0} 
                      className="w-full bg-[#1a3a22] text-white py-6 rounded-3xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-emerald-900 transition-all flex items-center justify-center gap-3 disabled:opacity-30"
                    >
                      <Save className="w-5 h-5" /> Enregistrer le Rapport
                    </button>
                 </div>
              </div>
           </div>
           
           <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden min-h-[500px]">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                       <tr>
                         <th className="px-10 py-6">Désignation</th>
                         <th className="px-10 py-6 text-center">Stock Actuel</th>
                         <th className="px-10 py-6 text-center">À Commander</th>
                         <th className="px-10 py-6 text-right">Coût Est. (Fc)</th>
                         <th className="px-6 py-6"></th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {draftItems.length === 0 ? (
                         <tr>
                           <td colSpan={5} className="px-10 py-32 text-center opacity-30 italic font-black text-[12px] uppercase">
                             {sites.length === 0 
                               ? "Créez d'abord un site pour commencer" 
                               : !selectedSiteId 
                                 ? "Sélectionnez un site" 
                                 : "Ajoutez des articles pour débuter"}
                           </td>
                         </tr>
                       ) : (
                         draftItems.map((item) => (
                           <tr key={item.productId} className="group hover:bg-slate-50/50 transition-colors">
                              <td className="px-10 py-6">
                                <p className="text-[12px] font-black uppercase italic text-slate-900">{item.productName}</p>
                              </td>
                              <td className="px-10 py-6 text-center font-bold text-slate-400">{item.currentStock}</td>
                              <td className="px-10 py-6 text-center">
                                <input 
                                  type="number" 
                                  className="w-20 bg-slate-50 border border-slate-100 p-3 rounded-xl text-center text-lg font-header italic outline-none focus:ring-2 focus:ring-[#1a3a22]" 
                                  value={item.quantityToOrder} 
                                  onChange={(e) => handleQuantityChange(item.productId, Number(e.target.value))} 
                                />
                              </td>
                              <td className="px-10 py-6 text-right font-header italic text-slate-900">{item.totalCost.toLocaleString()}</td>
                              <td className="px-6 py-6 text-right">
                                <button 
                                  onClick={() => setDraftItems(draftItems.filter(i => i.productId !== item.productId))} 
                                  className="p-2 text-slate-200 hover:text-rose-500 transition-colors"
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
      )}

      {activeTab === 'history' && !viewingReport && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 no-print">
           {needsHistory.filter(r => r.date.startsWith(archiveMonthFilter)).map((report) => (
             <div 
               key={report.id} 
               onClick={() => setViewingReport(report)} 
               className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
             >
                <div className="flex justify-between items-start mb-6">
                   <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-blue-600 group-hover:text-white">
                     <ClipboardList className="w-5 h-5" />
                   </div>
                   <button 
                     onClick={(e) => { e.stopPropagation(); onDeleteReport(report.id); }} 
                     className="p-2 text-slate-200 hover:text-rose-500"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
                <h4 className="text-[13px] font-black uppercase italic text-slate-900 mb-1">{report.id}</h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-4 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" /> {report.siteName}
                </p>
                <div className="flex justify-between items-end border-t border-slate-50 pt-4">
                   <div>
                     <p className="text-[8px] font-black text-slate-300">BUDGET</p>
                     <p className="text-xl font-header italic text-slate-900">{report.totalValueFc.toLocaleString()} Fc</p>
                   </div>
                   <div className="text-right">
                     <p className="text-[8px] font-black text-slate-300">ARTICLES</p>
                     <p className="text-lg font-black italic text-slate-400">{report.items.length}</p>
                   </div>
                </div>
             </div>
           ))}
        </div>
      )}

      {viewingReport && (
        <>
          <div className="no-print space-y-6">
             <button 
               onClick={() => setViewingReport(null)} 
               className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 flex items-center gap-2"
             >
               <ChevronRight className="w-4 h-4 rotate-180" /> Retour aux archives
             </button>
             
             <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl space-y-10">
                <div className="flex justify-between items-start">
                   <div>
                     <Badge variant="success">Rapport {viewingReport.status}</Badge>
                     <h3 className="text-4xl font-header italic mt-4">{viewingReport.id}</h3>
                     <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">
                       Généré le {new Date(viewingReport.date).toLocaleDateString()} pour {viewingReport.siteName}
                     </p>
                   </div>
                   <button 
                     onClick={() => window.print()} 
                     className="flex items-center gap-3 px-8 py-5 bg-emerald-600 text-white rounded-3xl font-black text-[11px] uppercase shadow-xl hover:bg-emerald-700 transition-all"
                   >
                     <Printer className="w-5 h-5" /> Imprimer Format Excel
                   </button>
                </div>
                
                <div className="overflow-hidden rounded-[2rem] border border-slate-50">
                   <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[8px] font-black uppercase text-slate-400 border-b">
                         <tr>
                           <th className="px-8 py-4">Article</th>
                           <th className="px-8 py-4 text-center">Qté Commandée</th>
                           <th className="px-8 py-4 text-right">Total (Fc)</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {viewingReport.items.map((it, idx) => (
                            <tr key={idx}>
                              <td className="px-8 py-5 font-black uppercase italic">{it.productName}</td>
                              <td className="px-8 py-5 text-center font-black text-lg italic">{it.quantityToOrder}</td>
                              <td className="px-8 py-5 text-right font-header italic">{it.totalCost.toLocaleString()}</td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
          {/* Template caché sur l'écran mais visible à l'impression */}
          <PrintTemplate report={viewingReport} />
        </>
      )}

      {activeTab === 'consolidated' && (
        <>
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-6 no-print">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-emerald-50 rounded-[2rem]">
                <Layers className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400">Calcul Global</p>
                <h3 className="text-2xl font-header italic text-slate-900 uppercase">Besoin Consolidé Réseau</h3>
              </div>
            </div>
            <button 
              onClick={() => window.print()} 
              className="flex items-center gap-3 px-8 py-5 bg-[#1a3a22] text-white rounded-3xl font-black text-[11px] uppercase shadow-xl hover:bg-emerald-900 transition-all"
            >
              <Printer className="w-4 h-4" /> Imprimer Rapport Global
            </button>
          </div>
          
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden no-print">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-10 py-6">Article</th>
                  <th className="px-10 py-6 text-center">Total Quantité</th>
                  <th className="px-10 py-6 text-right">Valeur Est. (Fc)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {products.filter(p => p.currentStock < p.minStock).map((p, idx) => {
                   const qty = Math.max(0, p.monthlyNeed - p.currentStock);
                   const priceFc = p.currency === '$' ? p.unitPrice * exchangeRate : p.unitPrice;
                   return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-10 py-6 font-black uppercase italic text-slate-900">{p.name}</td>
                      <td className="px-10 py-6 text-center font-black italic text-xl">{qty}</td>
                      <td className="px-10 py-6 text-right font-header italic text-slate-900 text-lg">
                        {(qty * priceFc).toLocaleString()} Fc
                      </td>
                    </tr>
                   );
                })}
              </tbody>
              <tfoot className="bg-emerald-900 text-white">
                <tr>
                  <td colSpan={2} className="px-10 py-8 text-xl font-header italic uppercase text-right">Budget Consolidé</td>
                  <td className="px-10 py-8 text-3xl font-header italic text-right">{totalValueConsolidated.toLocaleString()} Fc</td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          {/* Template Impression Consolidée */}
          <div className="excel-print-mode">
             <div className="excel-header-brand">
                <div>
                  <h1 style={{fontSize: '24px', fontWeight: '900', color: '#1b5e20'}}>SMARTSTOCK PRO</h1>
                  <p>CONSOLIDÉ GLOBAL RÉSEAU</p>
                </div>
                <div style={{textAlign: 'right'}}>
                  <h2>RAPPORT DE BESOINS CONSOLIDÉS</h2>
                  <p>DATE : {new Date().toLocaleDateString()}</p>
                </div>
             </div>
             
             <table className="excel-table">
                <thead>
                  <tr>
                    <th>N°</th>
                    <th style={{textAlign: 'left'}}>DÉSIGNATION</th>
                    <th>UNITÉ</th>
                    <th>TOTAL QTÉ</th>
                    <th>VALEUR EST. FC</th>
                    <th>COMMENTAIRE</th>
                  </tr>
                </thead>
                <tbody>
                   {products.filter(p => p.currentStock < p.minStock).map((p, idx) => {
                      const qty = Math.max(0, p.monthlyNeed - p.currentStock);
                      const priceFc = p.currency === '$' ? p.unitPrice * exchangeRate : p.unitPrice;
                      return (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td style={{fontWeight: 'bold'}}>{p.name.toUpperCase()}</td>
                          <td>{p.unit}</td>
                          <td style={{textAlign: 'center'}}>{qty}</td>
                          <td style={{textAlign: 'right'}}>{(qty * priceFc).toLocaleString()} Fc</td>
                          <td></td>
                        </tr>
                      );
                   })}
                </tbody>
                <tfoot>
                   <tr>
                     <td colSpan={4} style={{background: '#1b5e20', color: 'white', padding: '15px', textAlign: 'center', fontSize: '16px'}}>
                       VALEUR GLOBALE
                     </td>
                     <td colSpan={2} className="excel-total-row">
                       {totalValueConsolidated.toLocaleString()} Fc
                     </td>
                   </tr>
                </tfoot>
             </table>
          </div>
        </>
      )}
    </div>
  );
};
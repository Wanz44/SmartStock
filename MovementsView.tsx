
import React, { useState, useMemo } from 'react';
import { 
  Search, Plus, Minus, ArrowRight, Package, 
  History, Calendar, Info, MapPin, CheckCircle2, 
  AlertCircle, ChevronRight, ArrowDownCircle, ArrowUpCircle,
  Truck, ShoppingCart, UserCheck, Utensils, Construction, Trash2
} from 'lucide-react';
import { Product, Site, InventoryLog } from './types';
import { Badge } from './Badge';

interface MovementsViewProps {
  products: Product[];
  sites: Site[];
  history: InventoryLog[];
  onTransaction: (prodId: string, amount: number, reason: string, type: 'entry' | 'exit') => void;
}

type FlowType = 'ALL' | 'ENTRY' | 'EXIT';

export const MovementsView = ({ products, sites, history, onTransaction }: MovementsViewProps) => {
  const [activeTab, setActiveTab] = useState<FlowType>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSite, setFilterSite] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [subType, setSubType] = useState<string>('');

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSite = filterSite === 'All' || p.siteId === filterSite;
      return matchesSearch && matchesSite;
    });
  }, [products, searchTerm, filterSite]);

  const recentMovements = useMemo(() => {
    return history
      .filter(h => {
        if (activeTab === 'ENTRY') return h.type === 'entry';
        if (activeTab === 'EXIT') return h.type === 'exit';
        return true;
      })
      .slice(0, 15);
  }, [history, activeTab]);

  const handleProcess = (type: 'entry' | 'exit') => {
    if (!selectedProduct || !qty || Number(qty) <= 0) return;
    const amount = type === 'entry' ? Number(qty) : -Number(qty);
    const finalReason = `${subType}${reason ? ' - ' + reason : ''}`;
    onTransaction(selectedProduct.id, amount, finalReason, type);
    
    // Reset form
    setQty('');
    setReason('');
    setSubType('');
    setSelectedProduct(null);
  };

  const getSiteName = (id: string) => sites.find(s => s.id === id)?.name || 'N/A';

  const entrySubTypes = [
    { id: 'ACHAT', label: 'Achats Fournisseurs', icon: ShoppingCart },
    { id: 'TRANSFERT_IN', label: 'Transfert Entrant', icon: ArrowDownCircle },
    { id: 'RETOUR', label: 'Retour Client / Chantier', icon: Truck },
    { id: 'AJUSTEMENT_P', label: 'Ajustement Inventaire (+)', icon: CheckCircle2 }
  ];

  const exitSubTypes = [
    { id: 'CONSOMMATION', label: 'Consommation Interne', icon: Utensils },
    { id: 'LIVRAISON', label: 'Livraison / Expédition', icon: UserCheck },
    { id: 'TRANSFERT_OUT', label: 'Transfert Sortant', icon: ArrowUpCircle },
    { id: 'CASSE', label: 'Casse / Perte / Dégradation', icon: Trash2 }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-fade-in pb-32">
      
      {/* SECTION GAUCHE : SÉLECTION ARTICLE */}
      <div className="lg:col-span-3 space-y-6">
         <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-2">1. Recherche Article</h3>
            
            <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
               <input 
                 type="text" 
                 placeholder="Filtrer..." 
                 className="w-full bg-slate-50 border border-slate-100 pl-11 pr-4 py-3 rounded-2xl text-[10px] font-black uppercase italic outline-none focus:ring-2 focus:ring-[#1a3a22]"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>

            <select 
              className="w-full bg-slate-50 border border-slate-100 p-3 rounded-2xl text-[9px] font-black uppercase outline-none focus:ring-2 focus:ring-[#1a3a22]"
              value={filterSite}
              onChange={(e) => setFilterSite(e.target.value)}
            >
               <option value="All">Tout le Réseau</option>
               {sites.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
            </select>

            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
               {filteredProducts.map(p => (
                 <button 
                   key={p.id}
                   onClick={() => setSelectedProduct(p)}
                   className={`w-full p-3.5 rounded-2xl border transition-all flex items-center justify-between group ${
                     selectedProduct?.id === p.id 
                       ? 'bg-[#1a3a22] border-[#1a3a22] text-white shadow-lg' 
                       : 'bg-white border-slate-50 hover:border-emerald-200'
                   }`}
                 >
                    <div className="text-left">
                       <p className={`text-[10px] font-black uppercase italic tracking-tight ${selectedProduct?.id === p.id ? 'text-white' : 'text-slate-900'}`}>{p.name}</p>
                       <p className={`text-[7px] font-bold uppercase ${selectedProduct?.id === p.id ? 'text-emerald-300' : 'text-slate-300'}`}>{getSiteName(p.siteId)}</p>
                    </div>
                    <div className="text-right">
                       <p className={`text-[11px] font-black italic ${selectedProduct?.id === p.id ? 'text-white' : 'text-slate-400'}`}>{p.currentStock}</p>
                    </div>
                 </button>
               ))}
            </div>
         </div>
      </div>

      {/* SECTION CENTRALE : TRAITEMENT FLUX (ENTRÉES OU SORTIES) */}
      <div className="lg:col-span-6 space-y-6">
         {/* TABS DE NAVIGATION DES FLUX */}
         <div className="bg-white p-2 rounded-3xl border border-slate-100 shadow-sm flex gap-2">
            {[
              { id: 'ALL', label: 'Tous les Flux', icon: History },
              { id: 'ENTRY', label: 'Module Entrées', icon: ArrowDownCircle },
              { id: 'EXIT', label: 'Module Sorties', icon: ArrowUpCircle }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as FlowType)}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id ? 'bg-[#1a3a22] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
         </div>

         <div className={`bg-white p-10 rounded-[4rem] border border-slate-100 shadow-2xl min-h-[600px] flex flex-col justify-between transition-all ${!selectedProduct ? 'opacity-40 grayscale blur-[2px] pointer-events-none' : ''}`}>
            <div>
               <div className="flex justify-between items-start mb-10">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Traitement Logistique</h3>
                  {selectedProduct && <Badge variant={selectedProduct.currentStock <= selectedProduct.minStock ? 'danger' : 'success'}>Stock: {selectedProduct.currentStock} {selectedProduct.unit}</Badge>}
               </div>
               
               {selectedProduct && (
                 <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 mb-10 flex items-center gap-6 animate-fade-in">
                    <div className="p-5 bg-white rounded-[1.5rem] shadow-sm text-[#1a3a22]">
                       <Package className="w-10 h-10" />
                    </div>
                    <div className="flex-1">
                       <h4 className="text-4xl font-header italic text-[#1a3a22] leading-none">{selectedProduct.name}</h4>
                       <div className="flex items-center gap-4 mt-2">
                          <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest italic flex items-center gap-2">
                             <MapPin className="w-3 h-3" /> {getSiteName(selectedProduct.siteId)}
                          </p>
                          <div className="h-1 w-1 rounded-full bg-slate-300" />
                          <p className="text-[9px] font-black uppercase text-[#1a3a22] tracking-widest">Calcul auto : {selectedProduct.currentStock} + Δ = {selectedProduct.currentStock + (activeTab === 'EXIT' ? -Number(qty) : Number(qty)) || selectedProduct.currentStock}</p>
                       </div>
                    </div>
                 </div>
               )}

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase text-slate-400 ml-4">1. Type d'Opération</label>
                     <div className="grid grid-cols-1 gap-2">
                        {(activeTab === 'EXIT' ? exitSubTypes : entrySubTypes).map(type => (
                           <button
                             key={type.id}
                             onClick={() => setSubType(type.label)}
                             className={`flex items-center gap-3 p-4 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                               subType === type.label ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-white'
                             }`}
                           >
                              <type.icon className="w-4 h-4" />
                              {type.label}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-4">2. Quantité</label>
                        <div className="relative">
                           <input 
                             type="number" 
                             placeholder="0.00" 
                             className="w-full bg-slate-50 border border-slate-100 p-6 rounded-[2rem] text-5xl font-header italic outline-none focus:ring-4 focus:ring-[#1a3a22]/10"
                             value={qty}
                             onChange={(e) => setQty(e.target.value)}
                           />
                           <span className="absolute right-8 top-1/2 -translate-y-1/2 text-xl font-header text-slate-300 italic uppercase">
                             {selectedProduct?.unit || 'UNITÉS'}
                           </span>
                        </div>
                     </div>

                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-4">3. Remarques / Ref. Document</label>
                        <textarea 
                          placeholder="Numéro de BL, Facture, ou Nom du demandeur..." 
                          className="w-full bg-slate-50 border border-slate-100 p-5 rounded-[1.5rem] text-[11px] font-black italic outline-none focus:ring-2 focus:ring-[#1a3a22] h-24 resize-none"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                        />
                     </div>
                  </div>
               </div>
            </div>

            <div className="mt-12">
               <button 
                 onClick={() => handleProcess(activeTab === 'EXIT' ? 'exit' : 'entry')}
                 className={`w-full py-8 rounded-[2rem] font-black text-[13px] uppercase tracking-[0.3em] shadow-2xl transition-all flex items-center justify-center gap-4 ${
                   activeTab === 'EXIT' 
                     ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                     : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                 }`}
               >
                  {activeTab === 'EXIT' ? <ArrowUpCircle className="w-6 h-6" /> : <ArrowDownCircle className="w-6 h-6" />}
                  Valider {activeTab === 'EXIT' ? "la Sortie de Stock" : "l'Entrée de Stock"}
               </button>
            </div>
         </div>
         
         {!selectedProduct && (
           <div className="bg-[#1a3a22]/5 p-8 rounded-[3rem] border border-[#1a3a22]/10 flex items-center gap-6 animate-pulse">
              <Info className="w-6 h-6 text-[#1a3a22]" />
              <p className="text-[10px] font-bold text-[#1a3a22] uppercase italic leading-relaxed">
                 {activeTab === 'ALL' ? 'Mode Consultation :' : activeTab === 'EXIT' ? 'Module Sorties :' : 'Module Entrées :'} sélectionnez un article à gauche pour initier le traitement.
              </p>
           </div>
         )}
      </div>

      {/* SECTION DROITE : HISTORIQUE FILTRÉ */}
      <div className="lg:col-span-3 space-y-6">
         <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm h-full">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2 mb-8 flex items-center gap-2">
               <History className="w-4 h-4" /> Flux Récents {activeTab !== 'ALL' && `(${activeTab})`}
            </h3>
            
            <div className="space-y-4">
               {recentMovements.length === 0 ? (
                 <div className="py-24 text-center opacity-20 flex flex-col items-center gap-4">
                    <History className="w-10 h-10" />
                    <p className="text-[9px] font-black uppercase">Aucune archive</p>
                 </div>
               ) : (
                 recentMovements.map((h) => (
                   <div key={h.id} className="p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all group relative">
                      <div className="flex justify-between items-start mb-2">
                         <div className="flex flex-col gap-1">
                            <Badge variant={h.type === 'entry' ? 'success' : 'danger'}>{h.type === 'entry' ? 'Entrée' : 'Sortie'}</Badge>
                            <span className="text-[7px] font-black text-slate-300 uppercase italic tracking-widest">{h.id.slice(0, 10)}</span>
                         </div>
                         <span className="text-[8px] font-black text-slate-400">{new Date(h.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[10px] font-black uppercase italic text-slate-900 line-clamp-1">{h.productName}</p>
                      <p className="text-[7px] font-bold text-slate-400 uppercase italic mt-1">{h.reason?.slice(0, 30)}...</p>
                      <div className="flex items-end justify-between mt-3">
                         <div className="flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase italic">
                            <MapPin className="w-2 h-2" /> {getSiteName(h.siteId).slice(0, 10)}
                         </div>
                         <p className={`text-sm font-black italic ${h.changeAmount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                           {h.changeAmount > 0 ? '+' : ''}{h.changeAmount}
                         </p>
                      </div>
                   </div>
                 ))
               )}
            </div>

            {recentMovements.length > 0 && (
              <button className="w-full mt-6 py-4 rounded-2xl text-[9px] font-black uppercase text-slate-400 hover:text-[#1a3a22] hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                 Consulter tout le registre <ChevronRight className="w-3 h-3" />
              </button>
            )}
         </div>
      </div>
    </div>
  );
};

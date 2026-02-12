
import React, { useState, useMemo } from 'react';
import { 
  MapPin, Plus, Edit3, Trash2, Users, HardDrive, 
  Activity, CheckCircle2, AlertTriangle, Hammer, X, Save, 
  Package, Lamp, TrendingUp, ShieldCheck, User, BarChart3,
  ArrowRightLeft, Search, Box, CheckSquare, Layers
} from 'lucide-react';
import { Site, Product, Furniture } from './types';
import { Badge } from './Badge';

interface SitesViewProps {
  sites: Site[];
  setSites: (sites: Site[]) => void;
  products: Product[];
  setProducts: (products: Product[]) => void;
  furniture: Furniture[];
  setFurniture: (furniture: Furniture[]) => void;
  onAddProduct: (siteId: string) => void;
  onAddFurniture: (siteId: string) => void;
  notify: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  onTransaction: (prodId: string, amount: number, reason: string, type: 'transfer') => void;
}

export const SitesView = ({ 
  sites, setSites, products, setProducts, furniture, setFurniture, 
  onAddProduct, onAddFurniture, notify, onTransaction 
}: SitesViewProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningSite, setAssigningSite] = useState<Site | null>(null);
  const [assignSearch, setAssignSearch] = useState('');
  const [assignTab, setAssignTab] = useState<'products' | 'furniture'>('products');
  const [selectedToAssign, setSelectedToAssign] = useState<string[]>([]);

  const [newSiteData, setNewSiteData] = useState<Omit<Site, 'id'>>({
    name: '',
    location: '',
    capacity: 1000,
    status: 'Opérationnel',
    manager: ''
  });

  const getSiteProStats = (siteId: string) => {
    const siteProducts = products.filter(p => p.siteId === siteId);
    const totalQty = siteProducts.reduce((acc, p) => acc + p.currentStock, 0);
    const criticalCount = siteProducts.filter(p => p.currentStock <= p.minStock).length;
    const siteValue = siteProducts.reduce((acc, p) => {
      const price = p.currency === '$' ? p.unitPrice * 2800 : p.unitPrice;
      return acc + (p.currentStock * price);
    }, 0);
    
    const healthScore = siteProducts.length > 0 ? 100 - (criticalCount / siteProducts.length * 100) : 100;
    
    return { totalQty, criticalCount, skuCount: siteProducts.length, siteValue, healthScore };
  };

  const handleOpenAdd = () => {
    setEditingSite(null);
    setNewSiteData({ name: '', location: '', capacity: 1000, status: 'Opérationnel', manager: 'Responsable Logistique' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (site: Site) => {
    setEditingSite(site);
    setNewSiteData({ ...site });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Confirmez-vous la suppression de ce site ? Les données rattachées devront être réaffectées.")) {
      setSites(sites.filter(s => s.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSite) {
      setSites(sites.map(s => s.id === editingSite.id ? { ...newSiteData, id: s.id } as Site : s));
    } else {
      setSites([...sites, { ...newSiteData, id: `SITE-${Date.now()}` }]);
    }
    setIsModalOpen(false);
  };

  // Logique d'affectation d'articles existants
  const handleOpenAssign = (site: Site) => {
    setAssigningSite(site);
    setSelectedToAssign([]);
    setAssignSearch('');
    setIsAssignModalOpen(true);
  };

  const filteredToAssign = useMemo(() => {
    if (assignTab === 'products') {
      return products.filter(p => p.siteId !== assigningSite?.id && p.name.toLowerCase().includes(assignSearch.toLowerCase()));
    } else {
      return furniture.filter(f => f.siteId !== assigningSite?.id && f.name.toLowerCase().includes(assignSearch.toLowerCase()));
    }
  }, [products, furniture, assignTab, assignSearch, assigningSite]);

  const toggleSelection = (id: string) => {
    setSelectedToAssign(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleApplyAssignment = () => {
    if (!assigningSite || selectedToAssign.length === 0) return;

    if (assignTab === 'products') {
      const updatedProducts = products.map(p => {
        if (selectedToAssign.includes(p.id)) {
          // Log de transfert
          onTransaction(p.id, 0, `Transfert vers ${assigningSite.name}`, 'transfer');
          return { ...p, siteId: assigningSite.id };
        }
        return p;
      });
      setProducts(updatedProducts);
    } else {
      const updatedFurniture = furniture.map(f => {
        if (selectedToAssign.includes(f.id)) {
          return { ...f, siteId: assigningSite.id };
        }
        return f;
      });
      setFurniture(updatedFurniture);
    }

    notify(`${selectedToAssign.length} articles réaffectés vers ${assigningSite.name}.`);
    setIsAssignModalOpen(false);
  };

  return (
    <div className="space-y-10 animate-fade-in pb-32">
      {/* HEADER AVEC RÉSUMÉ GLOBAL */}
      <div className="flex flex-wrap items-center justify-between gap-6 no-print">
        <div>
          <h3 className="text-xl font-header italic uppercase flex items-center gap-3">
            <MapPin className="w-5 h-5 text-emerald-500" /> Hub Logistique Entreprise
          </h3>
          <p className="text-[10px] font-black uppercase text-slate-400 mt-1 tracking-widest">Gestion de {sites.length} points de stockage stratégiques</p>
        </div>
        <button onClick={handleOpenAdd} className="px-10 py-5 bg-[#1a3a22] text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-emerald-900 transition-all flex items-center gap-3">
           <Plus className="w-4 h-4" /> Ajouter un Site
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {sites.map(site => {
          const stats = getSiteProStats(site.id);
          const occupancyRate = Math.min(100, (stats.totalQty / site.capacity) * 100);
          
          return (
            <div key={site.id} className="bg-white rounded-[4rem] border border-slate-100 shadow-xl overflow-hidden group hover:border-emerald-200 transition-all">
              {/* HEADER DE CARTE */}
              <div className="p-8 pb-4 flex justify-between items-start">
                <div className={`w-14 h-14 rounded-3xl flex items-center justify-center ${site.status === 'Opérationnel' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                   {site.status === 'Opérationnel' ? <ShieldCheck className="w-7 h-7" /> : <AlertTriangle className="w-7 h-7" />}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenAssign(site)} title="Affecter des articles existants" className="p-3 bg-indigo-50 text-indigo-500 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all"><ArrowRightLeft className="w-4 h-4" /></button>
                  <button onClick={() => handleOpenEdit(site)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(site.id)} className="p-3 bg-slate-50 text-slate-300 rounded-2xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              {/* INFO PRINCIPALES */}
              <div className="px-8 space-y-2">
                 <h4 className="text-2xl font-header italic text-slate-900 uppercase leading-tight line-clamp-1">{site.name}</h4>
                 <p className="text-[9px] font-black uppercase text-slate-400 italic flex items-center gap-2">
                    <MapPin className="w-3 h-3" /> {site.location || 'Localisation non définie'}
                 </p>
              </div>

              {/* KPI PRO */}
              <div className="p-8 grid grid-cols-2 gap-4">
                 <div className="bg-slate-50 p-5 rounded-[2rem] border border-transparent group-hover:border-slate-100 transition-all">
                    <p className="text-[8px] font-black uppercase text-slate-400 mb-1">Valeur Stock</p>
                    <p className="text-lg font-header italic text-[#1a3a22]">{stats.siteValue.toLocaleString()} <span className="text-[8px]">Fc</span></p>
                 </div>
                 <div className="bg-slate-50 p-5 rounded-[2rem] border border-transparent group-hover:border-slate-100 transition-all text-right">
                    <p className="text-[8px] font-black uppercase text-slate-400 mb-1">Santé Site</p>
                    <div className="flex items-center justify-end gap-2">
                       <span className="text-lg font-header italic text-emerald-600">{Math.round(stats.healthScore)}%</span>
                       <Activity className={`w-4 h-4 ${stats.healthScore > 80 ? 'text-emerald-500' : stats.healthScore > 50 ? 'text-amber-500' : 'text-rose-500'}`} />
                    </div>
                 </div>
              </div>

              {/* BARRE D'OCCUPATION PROGRESSIVE */}
              <div className="px-8 space-y-3">
                 <div className="flex justify-between items-end">
                    <p className="text-[9px] font-black uppercase text-slate-400">Occupation Entrepôt</p>
                    <p className={`text-[11px] font-black italic ${occupancyRate > 90 ? 'text-rose-500' : 'text-emerald-500'}`}>{occupancyRate.toFixed(1)}%</p>
                 </div>
                 <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        occupancyRate > 90 ? 'bg-gradient-to-r from-rose-500 to-rose-600' : 
                        occupancyRate > 70 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 
                        'bg-gradient-to-r from-emerald-400 to-emerald-500'
                      }`} 
                      style={{ width: `${occupancyRate}%` }} 
                    />
                 </div>
                 <p className="text-[8px] font-bold text-slate-300 uppercase italic text-center">
                    {stats.totalQty} / {site.capacity} Unités Max
                 </p>
              </div>

              {/* FOOTER ACTIONS */}
              <div className="p-8 pt-10 flex items-center justify-between border-t border-slate-50 mt-4 bg-slate-50/50">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-[#1a3a22] font-black text-[10px] shadow-sm">
                       {site.manager?.slice(0, 2).toUpperCase() || 'AD'}
                    </div>
                    <div>
                       <p className="text-[8px] font-black uppercase text-slate-400">Gestionnaire</p>
                       <p className="text-[10px] font-bold text-slate-700 italic">{site.manager || 'Admin Système'}</p>
                    </div>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => onAddProduct(site.id)} className="w-10 h-10 bg-white text-emerald-600 rounded-xl flex items-center justify-center shadow-sm hover:bg-emerald-600 hover:text-white transition-all"><Package className="w-5 h-5" /></button>
                    <button onClick={() => onAddFurniture(site.id)} className="w-10 h-10 bg-white text-indigo-600 rounded-xl flex items-center justify-center shadow-sm hover:bg-indigo-600 hover:text-white transition-all"><Lamp className="w-5 h-5" /></button>
                 </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL CONFIGURATION SITE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
          <form onSubmit={handleSubmit} className="bg-white w-full max-w-xl rounded-[3.5rem] shadow-2xl p-12 space-y-8 animate-slide-in">
            <div className="flex justify-between items-center">
              <h3 className="text-3xl font-header italic uppercase">{editingSite ? 'Configuration Site' : 'Nouveau Site Strategique'}</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-50 rounded-full hover:bg-slate-200"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Désignation du Site</label>
                  <input required type="text" placeholder="ex: DEPOT CENTRAL SUD" value={newSiteData.name} onChange={(e) => setNewSiteData({...newSiteData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase italic outline-none focus:ring-2 focus:ring-emerald-500" />
               </div>

               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Capacité Volumique</label>
                     <input required type="number" placeholder="Quantité Max" value={newSiteData.capacity} onChange={(e) => setNewSiteData({...newSiteData, capacity: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-xl font-header italic outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Gestionnaire Titulaire</label>
                     <input required type="text" placeholder="Nom Complet" value={newSiteData.manager} onChange={(e) => setNewSiteData({...newSiteData, manager: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase italic outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Localisation Géographique</label>
                  <input required type="text" placeholder="Adresse ou Zone" value={newSiteData.location} onChange={(e) => setNewSiteData({...newSiteData, location: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black italic outline-none focus:ring-2 focus:ring-emerald-500" />
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4">État de Service</label>
                  <select value={newSiteData.status} onChange={(e) => setNewSiteData({...newSiteData, status: e.target.value as any})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase outline-none">
                     <option value="Opérationnel">OPÉRATIONNEL</option>
                     <option value="Maintenance">MAINTENANCE TECHNIQUE</option>
                     <option value="Saturé">SATURATION STOCK</option>
                  </select>
               </div>
            </div>

            <button type="submit" className="w-full bg-[#1a3a22] text-white py-8 rounded-[2.5rem] font-black text-[12px] uppercase tracking-widest shadow-2xl hover:bg-emerald-900 transition-all">
               {editingSite ? 'Sauvegarder les modifications' : 'Enregistrer en Hub'}
            </button>
          </form>
        </div>
      )}

      {/* MODAL AFFECTATION ARTICLES EXISTANTS */}
      {isAssignModalOpen && assigningSite && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl p-10 space-y-8 animate-slide-in flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-header italic uppercase">Affectation Rapide</h3>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1 italic">Assigner à : {assigningSite.name}</p>
              </div>
              <button type="button" onClick={() => setIsAssignModalOpen(false)} className="p-3 bg-slate-50 rounded-full hover:bg-slate-200"><X className="w-5 h-5" /></button>
            </div>

            {/* BARRE DE RECHERCHE & TABS */}
            <div className="space-y-4">
               <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input 
                    type="text" 
                    placeholder="Rechercher un article existant..." 
                    className="w-full bg-slate-50 border border-slate-100 pl-11 pr-4 py-3.5 rounded-2xl text-[11px] font-black uppercase italic outline-none focus:ring-2 focus:ring-indigo-500"
                    value={assignSearch}
                    onChange={(e) => setAssignSearch(e.target.value)}
                  />
               </div>
               <div className="flex bg-slate-50 p-1.5 rounded-2xl gap-1">
                  <button 
                    onClick={() => { setAssignTab('products'); setSelectedToAssign([]); }}
                    className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${assignTab === 'products' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-100'}`}
                  >
                    <Box className="w-3.5 h-3.5" /> Consommables
                  </button>
                  <button 
                    onClick={() => { setAssignTab('furniture'); setSelectedToAssign([]); }}
                    className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${assignTab === 'furniture' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-100'}`}
                  >
                    <Lamp className="w-3.5 h-3.5" /> Mobilier
                  </button>
               </div>
            </div>

            {/* LISTE DES ARTICLES */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[300px] space-y-2">
               {filteredToAssign.length === 0 ? (
                 <div className="py-20 text-center opacity-20 italic font-black text-[11px] uppercase">
                    Aucun article disponible pour transfert
                 </div>
               ) : (
                 filteredToAssign.map(item => {
                    const isSelected = selectedToAssign.includes(item.id);
                    const currentSiteName = sites.find(s => s.id === item.siteId)?.name || 'Inconnu';
                    
                    return (
                      <button 
                        key={item.id}
                        onClick={() => toggleSelection(item.id)}
                        className={`w-full p-5 rounded-2xl border transition-all flex items-center justify-between group ${
                          isSelected ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/10' : 'bg-white border-slate-100 hover:border-slate-200'
                        }`}
                      >
                         <div className="flex items-center gap-4">
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-transparent'}`}>
                               <CheckSquare className="w-3 h-3" />
                            </div>
                            <div className="text-left">
                               <p className="text-[11px] font-black uppercase italic text-slate-900 leading-none">{item.name}</p>
                               <p className="text-[8px] font-bold text-slate-400 uppercase italic mt-1.5 flex items-center gap-1">
                                  Actuellement sur : <span className="text-slate-900">{currentSiteName}</span>
                               </p>
                            </div>
                         </div>
                         <div className="text-right">
                            <Badge variant="info">
                               {'currentStock' in item ? `${(item as Product).currentStock} ${(item as Product).unit}` : `${(item as Furniture).currentCount} unit.`}
                            </Badge>
                         </div>
                      </button>
                    );
                 })
               )}
            </div>

            <div className="pt-6 border-t border-slate-50">
               <button 
                 onClick={handleApplyAssignment}
                 disabled={selectedToAssign.length === 0}
                 className="w-full bg-[#1a3a22] text-white py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-emerald-900 transition-all disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-3"
               >
                  <ArrowRightLeft className="w-5 h-5" /> 
                  Transférer {selectedToAssign.length} article(s) vers {assigningSite.name}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

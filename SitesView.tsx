
import React, { useState, useMemo } from 'react';
import { 
  MapPin, Plus, Edit3, Trash2, 
  Activity, AlertTriangle, X, Save, 
  Package, Lamp, ShieldCheck, ArrowRightLeft, Search, Box, CheckSquare, ClipboardPaste,
  ChevronDown, ChevronUp, Minus, CheckCircle2, AlertCircle, LayoutList, ClipboardList
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
  onGenerateNeeds: (siteId: string) => void; // Nouvelle action pour les besoins
  notify: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  onTransaction: (prodId: string, amount: number, reason: string, type: 'transfer' | 'adjustment' | 'manual_update') => void;
  onPasteProducts: (siteId: string) => void;
  copiedCount: number;
  onQuickInventory: (prodId: string) => void;
  onDeleteProduct: (id: string) => void;
}

export const SitesView = ({ 
  sites, setSites, products, setProducts, furniture, setFurniture, 
  onAddProduct, onAddFurniture, onGenerateNeeds, notify, onTransaction,
  onPasteProducts, copiedCount, onQuickInventory, onDeleteProduct
}: SitesViewProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningSite, setAssigningSite] = useState<Site | null>(null);
  const [assignSearch, setAssignSearch] = useState('');
  const [assignTab, setAssignTab] = useState<'products' | 'furniture'>('products');
  const [selectedToAssign, setSelectedToAssign] = useState<string[]>([]);
  
  // Site Inventory Modal state
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [activeSiteId, setActiveSiteId] = useState<string | null>(null);
  const [localSearch, setLocalSearch] = useState('');

  const [newSiteData, setNewSiteData] = useState<Omit<Site, 'id'>>({
    name: '',
    location: '',
    capacity: 2000,
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
    setNewSiteData({ name: '', location: '', capacity: 2000, status: 'Opérationnel', manager: 'Admin Logistique' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (site: Site) => {
    setEditingSite(site);
    setNewSiteData({ ...site });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Supprimer ce site ? Attention, vous devrez réaffecter ses stocks manuellement.")) {
      setSites(sites.filter(s => s.id !== id));
      notify("Site supprimé du réseau.");
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
          onTransaction(p.id, 0, `Transfert vers ${assigningSite.name}`, 'transfer' as any);
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

  const openInventoryModal = (siteId: string) => {
    setActiveSiteId(siteId);
    setLocalSearch('');
    setIsInventoryModalOpen(true);
  };

  const activeSite = useMemo(() => sites.find(s => s.id === activeSiteId), [sites, activeSiteId]);
  
  const siteProductsFiltered = useMemo(() => {
    if (!activeSiteId) return [];
    return products.filter(p => 
      p.siteId === activeSiteId && 
      (localSearch === '' || p.name.toLowerCase().includes(localSearch.toLowerCase()) || p.id.toLowerCase().includes(localSearch.toLowerCase()))
    );
  }, [products, activeSiteId, localSearch]);

  return (
    <div className="space-y-10 animate-fade-in pb-32">
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {sites.map(site => {
          const stats = getSiteProStats(site.id);
          const occupancyRate = Math.min(100, (stats.totalQty / site.capacity) * 100);
          
          return (
            <div key={site.id} className="bg-white rounded-[4rem] border border-slate-100 shadow-xl overflow-hidden group hover:border-emerald-200 transition-all flex flex-col h-full">
              <div className="p-8 pb-4 flex justify-between items-start">
                <div className={`w-14 h-14 rounded-3xl flex items-center justify-center ${site.status === 'Opérationnel' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {site.status === 'Opérationnel' ? <ShieldCheck className="w-7 h-7" /> : <AlertTriangle className="w-7 h-7" />}
                </div>
                <div className="flex gap-2">
                  {copiedCount > 0 && (
                    <button 
                      onClick={() => onPasteProducts(site.id)} 
                      title={`Coller ${copiedCount} article(s) ici`} 
                      className="flex items-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all animate-bounce shadow-inner"
                    >
                      <ClipboardPaste className="w-4 h-4" />
                      <span className="text-[10px] font-black">{copiedCount}</span>
                    </button>
                  )}
                  {/* Nouveau bouton : État de Besoin */}
                  <button onClick={() => onGenerateNeeds(site.id)} title="Générer État de Besoin" className="p-3 bg-amber-50 text-amber-600 rounded-2xl hover:bg-amber-600 hover:text-white transition-all"><ClipboardList className="w-4 h-4" /></button>
                  <button onClick={() => openInventoryModal(site.id)} title="Détails Inventaire Local" className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all"><LayoutList className="w-4 h-4" /></button>
                  <button onClick={() => handleOpenAssign(site)} title="Affecter des articles existants" className="p-3 bg-indigo-50 text-indigo-500 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all"><ArrowRightLeft className="w-4 h-4" /></button>
                  <button onClick={() => handleOpenEdit(site)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(site.id)} className="p-3 bg-slate-50 text-slate-300 rounded-2xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="px-8 space-y-2">
                <h4 className="text-2xl font-header italic text-slate-900 uppercase leading-tight line-clamp-1">{site.name}</h4>
                <p className="text-[9px] font-black uppercase text-slate-400 italic flex items-center gap-2">
                    <MapPin className="w-3 h-3" /> {site.location || 'Localisation non définie'}
                </p>
              </div>

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

              <div className="px-8 space-y-3 pb-8">
                 <div className="flex justify-between items-end">
                    <p className="text-[9px] font-black uppercase text-slate-400">Occupation Entrepôt</p>
                    <p className={`text-[11px] font-black italic ${occupancyRate > 90 ? 'text-rose-500' : 'text-emerald-500'}`}>{occupancyRate.toFixed(1)}%</p>
                 </div>
                 <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
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

              <div className="p-8 pt-10 flex items-center justify-between border-t border-slate-50 mt-auto bg-slate-50/50">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-[#1a3a22] font-black text-[10px] shadow-sm uppercase">
                       {site.manager?.slice(0, 2) || 'AD'}
                    </div>
                    <div>
                       <p className="text-[8px] font-black uppercase text-slate-400">Gestionnaire</p>
                       <p className="text-[10px] font-bold text-slate-700 italic">{site.manager || 'Admin Système'}</p>
                    </div>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => onAddProduct(site.id)} title="Ajouter Consommable" className="w-10 h-10 bg-white text-emerald-600 rounded-xl flex items-center justify-center shadow-sm hover:bg-emerald-600 hover:text-white transition-all"><Package className="w-5 h-5" /></button>
                    <button onClick={() => onAddFurniture(site.id)} title="Ajouter Mobilier" className="w-10 h-10 bg-white text-indigo-600 rounded-xl flex items-center justify-center shadow-sm hover:bg-indigo-600 hover:text-white transition-all"><Lamp className="w-5 h-5" /></button>
                 </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL INVENTAIRE DÉTAILLÉ */}
      {isInventoryModalOpen && activeSite && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in no-print">
            <div className="bg-white w-full max-w-5xl rounded-[4rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-in">
                <div className="p-10 pb-6 flex items-center justify-between border-b border-slate-50">
                    <div className="flex items-center gap-6">
                        <div className="p-5 bg-emerald-50 rounded-[2rem] text-emerald-600 shadow-inner">
                            <Box className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-header italic uppercase leading-none">Inventaire Détaillé : {activeSite.name}</h3>
                            <div className="flex items-center gap-4 mt-2">
                                <p className="text-[10px] font-black uppercase text-slate-400 italic flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5" /> {activeSite.location}
                                </p>
                                <div className="h-1 w-1 rounded-full bg-slate-300" />
                                <p className="text-[10px] font-black uppercase text-emerald-600 italic">{siteProductsFiltered.length} Articles en stock</p>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setIsInventoryModalOpen(false)} className="p-4 bg-slate-50 rounded-full hover:bg-slate-200 transition-all">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                <div className="px-10 py-6 bg-slate-50/50 flex flex-wrap items-center gap-6 no-print">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input 
                            type="text" 
                            placeholder="Rechercher une référence ou un produit dans ce site..." 
                            className="w-full bg-white border border-slate-200 pl-12 pr-4 py-4 rounded-2xl text-[11px] font-black uppercase italic outline-none focus:ring-2 focus:ring-emerald-500"
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => onGenerateNeeds(activeSite.id)} className="flex items-center gap-3 px-8 py-4 bg-amber-500 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-amber-600 transition-all">
                            <ClipboardList className="w-4 h-4" /> Besoins Site
                        </button>
                        <button onClick={() => onAddProduct(activeSite.id)} className="flex items-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-emerald-700 transition-all">
                            <Plus className="w-4 h-4" /> Ajouter Article
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-10 pt-4 custom-scrollbar">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b">
                                <tr>
                                    <th className="px-8 py-6">Désignation & Catégorie</th>
                                    <th className="px-8 py-6 text-center">Niveau de Stock</th>
                                    <th className="px-8 py-6 text-center">Statut Alerte</th>
                                    <th className="px-8 py-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {siteProductsFiltered.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-10 py-32 text-center opacity-30 italic font-black text-[14px] uppercase">
                                            Aucun produit ne correspond dans cet entrepôt
                                        </td>
                                    </tr>
                                ) : (
                                    siteProductsFiltered.map(p => {
                                        const isLow = p.currentStock <= p.minStock;
                                        return (
                                            <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-8 py-6">
                                                    <p className="text-[13px] font-black uppercase italic text-slate-900 group-hover:text-emerald-700 leading-tight transition-colors">{p.name}</p>
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        <span className="text-[8px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{p.category}</span>
                                                        <span className="text-[8px] font-bold text-slate-300 tracking-widest">REF: {p.id}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className="flex items-center gap-4">
                                                            <button onClick={() => onTransaction(p.id, -1, "Mise à jour rapide site", 'manual_update')} className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:bg-rose-100 hover:text-rose-500 transition-all"><Minus className="w-4 h-4" /></button>
                                                            <span className={`text-2xl font-header italic ${isLow ? 'text-rose-500 animate-pulse' : 'text-[#1a3a22]'}`}>{p.currentStock}</span>
                                                            <button onClick={() => onTransaction(p.id, 1, "Mise à jour rapide site", 'manual_update')} className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:bg-emerald-100 hover:text-emerald-500 transition-all"><Plus className="w-4 h-4" /></button>
                                                        </div>
                                                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">{p.unit}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    {isLow ? (
                                                        <Badge variant="danger">Critique: ≤ {p.minStock}</Badge>
                                                    ) : (
                                                        <Badge variant="success">Optimal</Badge>
                                                    )}
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                        <button 
                                                            onClick={() => onQuickInventory(p.id)} 
                                                            title={`Synchro Cible (${p.targetStock})`}
                                                            className="p-3 bg-indigo-50 text-indigo-500 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                        >
                                                            <CheckCircle2 className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => onDeleteProduct(p.id)} 
                                                            title="Supprimer la référence"
                                                            className="p-3 bg-rose-50 text-rose-300 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
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

                <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between no-print">
                    <div className="flex items-center gap-4 text-slate-400 italic">
                        <AlertCircle className="w-4 h-4" />
                        <p className="text-[9px] font-black uppercase tracking-widest">Fenêtre de Micro-Gestion Locale Active</p>
                    </div>
                    <button onClick={() => setIsInventoryModalOpen(false)} className="px-10 py-4 bg-[#1a3a22] text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-emerald-900 transition-all">
                        Fermer le Registre Site
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* MODAL SITE (AJOUT/MODIF) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
          <form onSubmit={handleSubmit} className="bg-white w-full max-w-xl rounded-[3.5rem] shadow-2xl p-12 space-y-8 animate-slide-in">
            <div className="flex justify-between items-center">
              <h3 className="text-3xl font-header italic uppercase">{editingSite ? 'Config Site' : 'Nouveau Site'}</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-50 rounded-full hover:bg-slate-200 transition-all"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Désignation du Site</label>
                  <input required type="text" placeholder="DEPOT CENTRAL SUD" value={newSiteData.name} onChange={(e) => setNewSiteData({...newSiteData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase italic outline-none focus:ring-2 focus:ring-emerald-500" />
               </div>

               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Capacité (Unités)</label>
                     <input required type="number" value={newSiteData.capacity} onChange={(e) => setNewSiteData({...newSiteData, capacity: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-xl font-header outline-none" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Gestionnaire</label>
                     <input required type="text" value={newSiteData.manager} onChange={(e) => setNewSiteData({...newSiteData, manager: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase outline-none" />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Localisation</label>
                  <input required type="text" value={newSiteData.location} onChange={(e) => setNewSiteData({...newSiteData, location: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black outline-none" />
               </div>
            </div>

            <button type="submit" className="w-full bg-[#1a3a22] text-white py-8 rounded-[2.5rem] font-black text-[12px] uppercase shadow-2xl hover:bg-emerald-900 transition-all">
               {editingSite ? 'Sauvegarder' : 'Créer le Site'}
            </button>
          </form>
        </div>
      )}

      {/* ASSIGN MODAL */}
      {isAssignModalOpen && assigningSite && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl p-10 space-y-8 animate-slide-in flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-header italic uppercase">Affectation d'Articles</h3>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1 italic">Transfert vers : {assigningSite.name}</p>
              </div>
              <button type="button" onClick={() => setIsAssignModalOpen(false)} className="p-3 bg-slate-50 rounded-full hover:bg-slate-200"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
               <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input 
                    type="text" 
                    placeholder="Rechercher article..." 
                    className="w-full bg-slate-50 border border-slate-100 pl-11 pr-4 py-3.5 rounded-2xl text-[11px] font-black uppercase italic outline-none focus:ring-2 focus:ring-indigo-500"
                    value={assignSearch}
                    onChange={(e) => setAssignSearch(e.target.value)}
                  />
               </div>
               <div className="flex bg-slate-50 p-1.5 rounded-2xl gap-1">
                  <button 
                    onClick={() => { setAssignTab('products'); setSelectedToAssign([]); }}
                    className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${assignTab === 'products' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-100'}`}
                  >
                    Consommables
                  </button>
                  <button 
                    onClick={() => { setAssignTab('furniture'); setSelectedToAssign([]); }}
                    className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${assignTab === 'furniture' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-100'}`}
                  >
                    Mobilier
                  </button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[300px] space-y-2">
               {filteredToAssign.length === 0 ? (
                 <div className="py-20 text-center opacity-20 italic font-black text-[11px] uppercase">
                    Aucun article disponible pour transfert
                 </div>
               ) : (
                 filteredToAssign.map(item => {
                    const isSelected = selectedToAssign.includes(item.id);
                    return (
                      <button 
                        key={item.id}
                        onClick={() => toggleSelection(item.id)}
                        className={`w-full p-5 rounded-2xl border transition-all flex items-center justify-between group ${
                          isSelected ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/10' : 'bg-white border-slate-100'
                        }`}
                      >
                         <div className="flex items-center gap-4 text-left">
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-transparent'}`}>
                               <CheckSquare className="w-3 h-3" />
                            </div>
                            <div>
                               <p className="text-[11px] font-black uppercase italic text-slate-900 leading-none">{item.name}</p>
                               <p className="text-[8px] font-bold text-slate-400 uppercase italic mt-1.5">
                                  Origine : {sites.find(s => s.id === item.siteId)?.name || 'Inconnu'}
                                </p>
                            </div>
                         </div>
                         <Badge variant="info">
                            {'currentStock' in item ? `${(item as Product).currentStock} ${(item as Product).unit}` : `${(item as Furniture).currentCount} unit.`}
                         </Badge>
                      </button>
                    );
                 })
               )}
            </div>

            <div className="pt-6 border-t border-slate-50">
               <button 
                 onClick={handleApplyAssignment}
                 disabled={selectedToAssign.length === 0}
                 className="w-full bg-[#1a3a22] text-white py-6 rounded-[2rem] font-black text-[11px] uppercase shadow-xl hover:bg-emerald-900 transition-all disabled:opacity-30 flex items-center justify-center gap-3"
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

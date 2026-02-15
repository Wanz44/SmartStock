
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
  onGenerateNeeds: (siteId: string) => void; 
  notify: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  onTransaction: (prodId: string, amount: number, reason: string, type: any) => void;
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
    if (window.confirm("SUPPRESSION SITE : Voulez-vous supprimer ce site du réseau ? Attention, tous les articles affectés devront être réassignés manuellement.")) {
      setSites(sites.filter(s => s.id !== id));
      notify("Site supprimé du réseau.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const confirmMsg = editingSite 
      ? `MODIFICATION : Voulez-vous enregistrer les changements pour le site "${newSiteData.name}" ?`
      : `CRÉATION : Ajouter le nouveau site "${newSiteData.name}" au réseau ?`;

    if (!window.confirm(confirmMsg)) return;

    if (editingSite) {
      setSites(sites.map(s => s.id === editingSite.id ? { ...newSiteData, id: s.id } as Site : s));
    } else {
      setSites([...sites, { ...newSiteData, id: `SITE-${Date.now()}` }]);
    }
    setIsModalOpen(false);
  };

  const handleApplyAssignment = () => {
    if (!assigningSite || selectedToAssign.length === 0) return;
    if (!window.confirm(`RÉAFFECTATION : Voulez-vous transférer ${selectedToAssign.length} articles vers "${assigningSite.name}" ?`)) return;

    if (assignTab === 'products') {
      setProducts(products.map(p => selectedToAssign.includes(p.id) ? { ...p, siteId: assigningSite.id } : p));
    } else {
      setFurniture(furniture.map(f => selectedToAssign.includes(f.id) ? { ...f, siteId: assigningSite.id } : f));
    }

    notify(`${selectedToAssign.length} articles réaffectés.`);
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
    return products.filter(p => p.siteId === activeSiteId && (localSearch === '' || p.name.toLowerCase().includes(localSearch.toLowerCase())));
  }, [products, activeSiteId, localSearch]);

  return (
    <div className="space-y-10 animate-fade-in pb-32">
      <div className="flex flex-wrap items-center justify-between gap-6 no-print">
        <div>
          <h3 className="text-xl font-header italic uppercase flex items-center gap-3"><MapPin className="w-5 h-5 text-emerald-500" /> Hub Logistique Entreprise</h3>
        </div>
        <button onClick={handleOpenAdd} className="px-10 py-5 bg-[#1a3a22] text-white rounded-[2rem] font-black text-[10px] uppercase shadow-2xl">Ajouter un Site</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {sites.map(site => {
          const stats = getSiteProStats(site.id);
          const occupancyRate = Math.min(100, (stats.totalQty / site.capacity) * 100);
          return (
            <div key={site.id} className="bg-white rounded-[4rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col h-full group hover:border-emerald-200 transition-all">
              <div className="p-8 pb-4 flex justify-between items-start">
                <div className={`w-14 h-14 rounded-3xl flex items-center justify-center ${site.status === 'Opérationnel' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}><ShieldCheck className="w-7 h-7" /></div>
                <div className="flex gap-2">
                  <button onClick={() => openInventoryModal(site.id)} className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all"><LayoutList className="w-4 h-4" /></button>
                  <button onClick={() => handleOpenEdit(site)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(site.id)} className="p-3 bg-slate-50 text-slate-300 rounded-2xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="px-8 space-y-2 mb-6">
                <h4 className="text-2xl font-header italic text-slate-900 uppercase leading-tight">{site.name}</h4>
                <p className="text-[9px] font-black uppercase text-slate-400 italic flex items-center gap-2"><MapPin className="w-3 h-3" /> {site.location}</p>
              </div>
              <div className="p-8 mt-auto border-t border-slate-50 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-[10px] uppercase">{site.manager?.slice(0, 2)}</div>
                    <p className="text-[10px] font-bold text-slate-700 italic">{site.manager}</p>
                 </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
          <form onSubmit={handleSubmit} className="bg-white w-full max-w-xl rounded-[3.5rem] shadow-2xl p-12 space-y-8 animate-slide-in">
            <div className="flex justify-between items-center">
              <h3 className="text-3xl font-header italic uppercase">{editingSite ? 'Config Site' : 'Nouveau Site'}</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-50 rounded-full hover:bg-slate-200"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-6">
               <input required type="text" placeholder="NOM DU SITE" value={newSiteData.name} onChange={(e) => setNewSiteData({...newSiteData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase italic outline-none" />
               <input required type="text" placeholder="LOCALISATION" value={newSiteData.location} onChange={(e) => setNewSiteData({...newSiteData, location: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase italic outline-none" />
            </div>
            <button type="submit" className="w-full bg-[#1a3a22] text-white py-8 rounded-[2.5rem] font-black text-[12px] uppercase shadow-2xl hover:bg-emerald-900 transition-all">Enregistrer le site</button>
          </form>
        </div>
      )}
    </div>
  );
};

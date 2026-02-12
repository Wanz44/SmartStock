
import React, { useState } from 'react';
import { 
  MapPin, Plus, Edit3, Trash2, Users, HardDrive, 
  Activity, CheckCircle2, AlertTriangle, Hammer, X, Save, 
  Package, Lamp
} from 'lucide-react';
import { Site, Product } from './types';
import { Badge } from './Badge';

interface SitesViewProps {
  sites: Site[];
  setSites: (sites: Site[]) => void;
  products: Product[];
  onAddProduct: (siteId: string) => void;
  onAddFurniture: (siteId: string) => void;
}

export const SitesView = ({ sites, setSites, products, onAddProduct, onAddFurniture }: SitesViewProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);

  const [newSiteData, setNewSiteData] = useState<Omit<Site, 'id'>>({
    name: '',
    location: '',
    capacity: 1000,
    status: 'Opérationnel',
    manager: ''
  });

  const getSiteInventoryStats = (siteId: string) => {
    const siteProducts = products.filter(p => p.siteId === siteId);
    const totalQty = siteProducts.reduce((acc, p) => acc + p.currentStock, 0);
    const criticalCount = siteProducts.filter(p => p.currentStock <= p.minStock).length;
    return { totalQty, criticalCount, skuCount: siteProducts.length };
  };

  const handleOpenAdd = () => {
    setEditingSite(null);
    setNewSiteData({ name: '', location: '', capacity: 1000, status: 'Opérationnel', manager: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (site: Site) => {
    setEditingSite(site);
    setNewSiteData({ ...site });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Supprimer ce site ?")) {
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

  return (
    <div className="space-y-8 animate-fade-in pb-32">
      <div className="flex justify-between items-center no-print">
        <h3 className="text-xl font-header italic uppercase">Réseau Logistique</h3>
        <button onClick={handleOpenAdd} className="px-8 py-4 bg-[#1a3a22] text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-emerald-900">
           Nouveau Site
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {sites.map(site => {
          const stats = getSiteInventoryStats(site.id);
          const occupancyRate = Math.min(100, (stats.totalQty / site.capacity) * 100);
          
          return (
            <div key={site.id} className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm group">
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div className={`p-4 rounded-[1.5rem] ${site.status === 'Opérationnel' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {site.status === 'Opérationnel' ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleOpenEdit(site)} className="p-2 text-slate-300 hover:text-indigo-600"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(site.id)} className="p-2 text-slate-300 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                <h4 className="text-2xl font-header italic text-slate-900 uppercase">{site.name}</h4>
                
                <div className="space-y-2">
                   <div className="flex justify-between text-[8px] font-black uppercase">
                      <span>Occupation</span>
                      <span className={occupancyRate > 90 ? 'text-rose-500' : 'text-emerald-500'}>{occupancyRate.toFixed(1)}%</span>
                   </div>
                   <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${occupancyRate > 90 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${occupancyRate}%` }} />
                   </div>
                </div>

                <div className="mt-8 flex gap-2 no-print">
                   <button onClick={() => onAddProduct(site.id)} className="flex-1 py-3 bg-emerald-50 text-emerald-700 rounded-xl text-[8px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all">
                      + Produit
                   </button>
                   <button onClick={() => onAddFurniture(site.id)} className="flex-1 py-3 bg-indigo-50 text-indigo-700 rounded-xl text-[8px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all">
                      + Mobilier
                   </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
          <form onSubmit={handleSubmit} className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl p-12 space-y-8">
            <h3 className="text-3xl font-header italic uppercase">{editingSite ? 'Modifier Site' : 'Nouveau Site'}</h3>
            <input required type="text" placeholder="Désignation" value={newSiteData.name} onChange={(e) => setNewSiteData({...newSiteData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black outline-none" />
            <input required type="number" placeholder="Capacité Max" value={newSiteData.capacity} onChange={(e) => setNewSiteData({...newSiteData, capacity: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-xl font-header italic outline-none" />
            <button type="submit" className="w-full bg-emerald-600 text-white py-6 rounded-3xl font-black text-[12px] uppercase shadow-xl hover:bg-emerald-700">Enregistrer le Site</button>
          </form>
        </div>
      )}
    </div>
  );
};

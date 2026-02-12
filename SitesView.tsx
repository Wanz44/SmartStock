
import React, { useState } from 'react';
import { 
  MapPin, Plus, Edit3, Trash2, Users, HardDrive, 
  Activity, CheckCircle2, AlertTriangle, Hammer, X, Save, 
  Copy, FileUp, Download, Package, Lamp
} from 'lucide-react';
import { Site, Product, Furniture } from './types';
import { Badge } from './Badge';

interface SitesViewProps {
  sites: Site[];
  setSites: (sites: Site[]) => void;
  products: Product[];
  onCopyData: (fromId: string, toId: string) => void;
  onImportCSV: (e: React.ChangeEvent<HTMLInputElement>, targetSiteId?: string) => void;
}

export const SitesView = ({ sites, setSites, products, onCopyData, onImportCSV }: SitesViewProps) => {
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
    if (confirm("Supprimer ce site ? Attention, assurez-vous qu'aucun article n'y est rattaché.")) {
      setSites(sites.filter(s => s.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSite) {
      setSites(sites.map(s => s.id === editingSite.id ? { ...newSiteData, id: s.id } as Site : s));
    } else {
      const newSite: Site = {
        ...newSiteData,
        id: `SITE-${Date.now()}`
      };
      setSites([...sites, newSite]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-32">
      <div className="flex justify-between items-center no-print">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-2xl">
            <MapPin className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-xl font-header italic uppercase">Réseau Logistique</h3>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">
              {sites.length} sites opérationnels à travers le réseau
            </p>
          </div>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={handleOpenAdd}
             className="flex items-center gap-3 px-8 py-4 bg-[#1a3a22] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-emerald-900 transition-all"
           >
             <Plus className="w-4 h-4" /> Nouveau Site
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {sites.map(site => {
          const stats = getSiteInventoryStats(site.id);
          const occupancyRate = Math.min(100, (stats.totalQty / site.capacity) * 100);
          
          return (
            <div key={site.id} className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div className={`p-4 rounded-[1.5rem] ${
                    site.status === 'Opérationnel' ? 'bg-emerald-50 text-emerald-600' :
                    site.status === 'Maintenance' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    {site.status === 'Opérationnel' ? <CheckCircle2 className="w-6 h-6" /> :
                     site.status === 'Maintenance' ? <Hammer className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleOpenEdit(site)} className="p-2 text-slate-300 hover:text-[#1a3a22] transition-colors"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(site.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                <div>
                  <h4 className="text-2xl font-header italic text-slate-900 uppercase leading-none mb-1">{site.name}</h4>
                  <p className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5 italic">
                    <MapPin className="w-3 h-3" /> {site.location}
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-50">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-300" />
                      <span className="text-[9px] font-black uppercase text-slate-400">Responsable</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-700 italic">{site.manager}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-3.5 h-3.5 text-slate-300" />
                      <span className="text-[9px] font-black uppercase text-slate-400">Capacité</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-700 italic">{site.capacity.toLocaleString()} U</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                    <span className="text-slate-400 italic">Occupation</span>
                    <span className={occupancyRate > 90 ? 'text-rose-500' : 'text-[#1a3a22]'}>{occupancyRate.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        occupancyRate > 90 ? 'bg-rose-500' : 'bg-[#1a3a22]'
                      }`} 
                      style={{ width: `${occupancyRate}%` }} 
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-emerald-600" />
                      <div>
                         <p className="text-[8px] font-black text-slate-400 uppercase">Consommables</p>
                         <p className="text-[11px] font-black italic">{stats.skuCount} Références</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[8px] font-black text-slate-400 uppercase">Alertes</p>
                      <p className={`text-[11px] font-black italic ${stats.criticalCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{stats.criticalCount}</p>
                   </div>
                </div>
              </div>

              <div className="mt-8 flex gap-2">
                 <button className="flex-1 py-3 bg-emerald-50 text-emerald-700 rounded-xl text-[8px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-2">
                    <Plus className="w-3 h-3" /> Ajouter Produit
                 </button>
                 <button className="flex-1 py-3 bg-indigo-50 text-indigo-700 rounded-xl text-[8px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2">
                    <Plus className="w-3 h-3" /> Ajouter Mobilier
                 </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL AJOUT / MODIFICATION */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
          <form onSubmit={handleSubmit} className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl p-12 space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-3xl font-header italic uppercase">{editingSite ? 'Modifier Site' : 'Nouveau Site'}</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-all"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Désignation du Site</label>
                <input required type="text" value={newSiteData.name} onChange={(e) => setNewSiteData({...newSiteData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase italic outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Localisation</label>
                <input required type="text" value={newSiteData.location} onChange={(e) => setNewSiteData({...newSiteData, location: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Manager</label>
                <input required type="text" value={newSiteData.manager} onChange={(e) => setNewSiteData({...newSiteData, manager: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Capacité Max</label>
                <input required type="number" value={newSiteData.capacity} onChange={(e) => setNewSiteData({...newSiteData, capacity: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-xl font-header italic outline-none" />
              </div>
            </div>

            <button type="submit" className="w-full bg-emerald-600 text-white py-6 rounded-3xl font-black text-[12px] uppercase shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3">
              <Save className="w-5 h-5" /> {editingSite ? 'Mettre à jour' : 'Créer le site'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

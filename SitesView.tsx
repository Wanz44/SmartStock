
import React, { useState } from 'react';
import { 
  MapPin, Plus, Edit3, Trash2, Users, HardDrive, 
  Activity, CheckCircle2, AlertTriangle, Hammer, X, Save, 
  Copy, FileUp, Download
} from 'lucide-react';
import { Site, Product } from './types';
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
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [cloneSourceId, setCloneSourceId] = useState<string>('');
  const [cloneTargetId, setCloneTargetId] = useState<string>('');

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

  const handleOpenClone = (siteId: string) => {
    setCloneSourceId(siteId);
    setCloneTargetId('');
    setIsCloneModalOpen(true);
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

  const handleConfirmClone = () => {
    if (!cloneSourceId || !cloneTargetId) return alert("Sélectionnez les sites source et destination.");
    if (cloneSourceId === cloneTargetId) return alert("Les sites doivent être différents.");
    onCopyData(cloneSourceId, cloneTargetId);
    setIsCloneModalOpen(false);
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
            <div key={site.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div className={`p-4 rounded-[2rem] ${
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

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => handleOpenClone(site.id)}
                    className="flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-400 rounded-xl text-[8px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all"
                  >
                    <Copy className="w-3 h-3" /> Cloner Vers...
                  </button>
                  <label className="flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-400 rounded-xl text-[8px] font-black uppercase cursor-pointer hover:bg-emerald-600 hover:text-white transition-all">
                    <FileUp className="w-3 h-3" /> Importer
                    <input type="file" accept=".csv" className="hidden" onChange={(e) => onImportCSV(e, site.id)} />
                  </label>
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
                    <span className="text-[10px] font-black text-slate-700 italic">{site.capacity.toLocaleString()} Unités</span>
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
              </div>

              <div className="mt-8 pt-6 grid grid-cols-2 gap-3 border-t border-slate-50">
                <div className="bg-slate-50 p-4 rounded-2xl text-center">
                  <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Articles</p>
                  <p className="text-lg font-black italic text-slate-900">{stats.skuCount}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl text-center">
                  <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Critiques</p>
                  <p className={`text-lg font-black italic ${stats.criticalCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{stats.criticalCount}</p>
                </div>
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
                <input 
                  required 
                  type="text" 
                  value={newSiteData.name} 
                  onChange={(e) => setNewSiteData({...newSiteData, name: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase italic outline-none focus:ring-2 focus:ring-emerald-500" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Localisation / Ville</label>
                <input 
                  required 
                  type="text" 
                  value={newSiteData.location} 
                  onChange={(e) => setNewSiteData({...newSiteData, location: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase outline-none focus:ring-2 focus:ring-emerald-500" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Manager Responsable</label>
                <input 
                  required 
                  type="text" 
                  value={newSiteData.manager} 
                  onChange={(e) => setNewSiteData({...newSiteData, manager: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase outline-none focus:ring-2 focus:ring-emerald-500" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Capacité Max (Unités)</label>
                <input 
                  required 
                  type="number" 
                  value={newSiteData.capacity} 
                  onChange={(e) => setNewSiteData({...newSiteData, capacity: Number(e.target.value)})} 
                  className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-xl font-header italic outline-none focus:ring-2 focus:ring-emerald-500" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Statut Opérationnel</label>
                <select 
                  value={newSiteData.status} 
                  onChange={(e) => setNewSiteData({...newSiteData, status: e.target.value as any})} 
                  className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Opérationnel">OPÉRATIONNEL</option>
                  <option value="Maintenance">MAINTENANCE</option>
                  <option value="Saturé">SATURÉ</option>
                </select>
              </div>
            </div>

            <button type="submit" className="w-full bg-emerald-600 text-white py-6 rounded-3xl font-black text-[12px] uppercase shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3">
              <Save className="w-5 h-5" /> {editingSite ? 'Mettre à jour' : 'Créer le site'}
            </button>
          </form>
        </div>
      )}

      {/* MODAL CLONAGE */}
      {isCloneModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-header italic uppercase">Clonage de Structure</h3>
              <button type="button" onClick={() => setIsCloneModalOpen(false)} className="p-2 bg-slate-100 rounded-full"><X className="w-4 h-4" /></button>
            </div>
            
            <p className="text-[11px] font-bold text-slate-400 uppercase italic leading-relaxed">
              Vous allez copier tous les articles référencés de <span className="text-slate-900">{sites.find(s => s.id === cloneSourceId)?.name}</span> vers un autre site. 
              Les stocks seront initialisés à zéro.
            </p>

            <div className="space-y-4">
               <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Site de destination</label>
                  <select 
                    value={cloneTargetId}
                    onChange={(e) => setCloneTargetId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[11px] font-black uppercase outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                     <option value="">Sélectionner un site...</option>
                     {sites.filter(s => s.id !== cloneSourceId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
               </div>

               <button 
                 onClick={handleConfirmClone}
                 className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black text-[10px] uppercase shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
               >
                 <Copy className="w-4 h-4" /> Confirmer la copie
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

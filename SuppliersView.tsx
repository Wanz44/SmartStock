import React, { useState, useMemo } from 'react';
import { 
  Truck, Plus, Search, Edit3, Trash2, Mail, 
  Phone, Star, Calendar, Filter, X, Save,
  CheckCircle2, AlertCircle, Info, ChevronRight,
  TrendingUp, Activity, BadgeCheck
} from 'lucide-react';
import { Supplier } from './types';
import { Badge } from './Badge';

interface SuppliersViewProps {
  suppliers: Supplier[];
  setSuppliers: (s: Supplier[]) => void;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SuppliersView = ({ suppliers, setSuppliers, notify }: SuppliersViewProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Tous');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [formData, setFormData] = useState<Omit<Supplier, 'id'>>({
    name: '',
    contact: '',
    email: '',
    category: 'Logistique',
    rating: 5,
    leadTimeDays: 3
  });

  const categories = useMemo(() => {
    const cats = new Set(suppliers.map(s => s.category));
    return ['Tous', ...Array.from(cats)];
  }, [suppliers]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           s.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'Tous' || s.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [suppliers, searchTerm, filterCategory]);

  const stats = useMemo(() => {
    const avgRating = suppliers.length ? (suppliers.reduce((acc, s) => acc + s.rating, 0) / suppliers.length).toFixed(1) : 0;
    const topRated = suppliers.filter(s => s.rating >= 4.5).length;
    return { count: suppliers.length, avgRating, topRated };
  }, [suppliers]);

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setFormData({ name: '', contact: '', email: '', category: 'Logistique', rating: 5, leadTimeDays: 3 });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({ ...supplier });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const supplier = suppliers.find(s => s.id === id);
    if (confirm(`Supprimer définitivement le fournisseur "${supplier?.name}" ?`)) {
      setSuppliers(suppliers.filter(s => s.id !== id));
      notify(`Fournisseur "${supplier?.name}" supprimé.`, 'error');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupplier) {
      setSuppliers(suppliers.map(s => s.id === editingSupplier.id ? { ...formData, id: s.id } as Supplier : s));
      notify(`Fiche fournisseur "${formData.name}" mise à jour.`);
    } else {
      const newSupplier: Supplier = { ...formData, id: `SUP-${Date.now()}` };
      setSuppliers([newSupplier, ...suppliers]);
      notify(`Nouveau fournisseur "${formData.name}" enregistré.`);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-10 animate-fade-in pb-32">
       {/* STATS HEADER */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
             <div className="flex justify-between items-start mb-4">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Partenaires Référencés</p>
                <Truck className="w-5 h-5 text-indigo-500" />
             </div>
             <h4 className="text-3xl font-black italic tracking-tighter text-slate-900">{stats.count}</h4>
             <div className="mt-2 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[8px] font-bold text-slate-300 uppercase italic">Base active</span>
             </div>
          </div>
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
             <div className="flex justify-between items-start mb-4">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Satisfaction Moyenne</p>
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
             </div>
             <h4 className="text-3xl font-black italic tracking-tighter text-slate-900">{stats.avgRating} / 5</h4>
             <div className="mt-2 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[8px] font-bold text-slate-300 uppercase italic">Fiabilité globale</span>
             </div>
          </div>
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
             <div className="flex justify-between items-start mb-4">
                {/* CORRECTION ICI : utilisation de &gt; au lieu de > */}
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Élite (Note &gt; 4.5)</p>
                <BadgeCheck className="w-5 h-5 text-emerald-500" />
             </div>
             <h4 className="text-3xl font-black italic tracking-tighter text-emerald-600">{stats.topRated}</h4>
             <div className="mt-2 flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
                <span className="text-[8px] font-bold text-slate-300 uppercase italic">Partenaires VIP</span>
             </div>
          </div>
       </div>

       {/* TOOLBAR */}
       <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-6 no-print">
          <div className="flex items-center gap-4 flex-1 min-w-[300px]">
             <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input 
                  type="text" 
                  placeholder="Rechercher un fournisseur..." 
                  className="w-full bg-slate-50 border border-slate-100 pl-12 pr-4 py-3.5 rounded-2xl text-[11px] font-black uppercase italic outline-none focus:ring-2 focus:ring-[#1a3a22]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <select 
               className="bg-slate-50 border border-slate-100 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-[#1a3a22]"
               value={filterCategory}
               onChange={(e) => setFilterCategory(e.target.value)}
             >
                {categories.map(c => <option key={c} value={c}>{c === 'Tous' ? 'TOUTES CATÉGORIES' : c.toUpperCase()}</option>)}
             </select>
          </div>
          <button onClick={handleOpenAdd} className="flex items-center gap-3 px-8 py-4.5 bg-[#1a3a22] text-white rounded-3xl font-black text-[11px] uppercase shadow-xl hover:bg-emerald-900 transition-all">
             <Plus className="w-4 h-4" /> Nouveau Fournisseur
          </button>
       </div>

       {/* GRID DES FOURNISSEURS */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredSuppliers.length === 0 ? (
            <div className="col-span-full py-32 text-center opacity-20 flex flex-col items-center gap-4">
               <Truck className="w-24 h-24" />
               <p className="text-xl font-header italic uppercase">Aucun fournisseur trouvé</p>
            </div>
          ) : (
            filteredSuppliers.map(s => (
              <div key={s.id} className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group flex flex-col justify-between">
                 <div className="space-y-6">
                    <div className="flex justify-between items-start">
                       <div className="p-4 bg-slate-50 rounded-[1.5rem] text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          <Truck className="w-6 h-6" />
                       </div>
                       <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenEdit(s)} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"><Edit3 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(s.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                       </div>
                    </div>

                    <div>
                       <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-2xl font-header italic text-slate-900 uppercase leading-none truncate max-w-[80%]">{s.name}</h4>
                          {s.rating >= 4.5 && <BadgeCheck className="w-5 h-5 text-emerald-500" />}
                       </div>
                       <Badge variant="info">{s.category}</Badge>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-slate-50">
                       <div className="flex items-center gap-3 text-slate-400">
                          <Mail className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold text-slate-600 truncate">{s.email}</span>
                       </div>
                       <div className="flex items-center gap-3 text-slate-400">
                          <Phone className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold text-slate-600">{s.contact}</span>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                       <div className="text-center">
                          <p className="text-[8px] font-black text-slate-300 uppercase mb-1">Délai Livr.</p>
                          <div className="flex items-center justify-center gap-1.5">
                             <Calendar className="w-3 h-3 text-slate-300" />
                             <span className="text-[11px] font-black italic">{s.leadTimeDays} Jours</span>
                          </div>
                       </div>
                       <div className="text-center">
                          <p className="text-[8px] font-black text-slate-300 uppercase mb-1">Note</p>
                          <div className="flex items-center justify-center gap-1">
                             <span className="text-[11px] font-black italic text-amber-500">{s.rating}</span>
                             <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          </div>
                       </div>
                    </div>
                 </div>

                 <button className="mt-8 w-full py-4 bg-slate-50 rounded-2xl text-[9px] font-black uppercase text-slate-400 hover:bg-[#1a3a22] hover:text-white transition-all flex items-center justify-center gap-2 group-hover:shadow-lg">
                    Historique Commandes <ChevronRight className="w-3 h-3" />
                 </button>
              </div>
            ))
          )}
       </div>

       {/* MODAL AJOUT/EDIT */}
       {isModalOpen && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
            <form onSubmit={handleSubmit} className="bg-white w-full max-w-xl rounded-[3.5rem] shadow-2xl p-12 space-y-8 overflow-y-auto max-h-[90vh]">
               <div className="flex justify-between items-center">
                  <h3 className="text-3xl font-header italic uppercase">{editingSupplier ? 'Modifier Fournisseur' : 'Nouveau Partenaire'}</h3>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-all"><X className="w-5 h-5" /></button>
               </div>

               <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2 space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Raison Sociale</label>
                     <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase italic outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Catégorie d'activité</label>
                     <input required type="text" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase outline-none" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Email Contact</label>
                     <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-bold outline-none" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Téléphone</label>
                     <input required type="text" value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-bold outline-none" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Délai Moyen (Jours)</label>
                     <input required type="number" value={formData.leadTimeDays} onChange={(e) => setFormData({...formData, leadTimeDays: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-xl font-header italic outline-none" />
                  </div>
                  <div className="col-span-2 space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Note de fiabilité (1-5)</label>
                     <input type="range" min="1" max="5" step="0.5" value={formData.rating} onChange={(e) => setFormData({...formData, rating: Number(e.target.value)})} className="w-full accent-amber-500" />
                     <div className="flex justify-center items-center gap-2 text-xl font-header italic text-amber-500">
                        {formData.rating} <Star className="w-5 h-5 fill-amber-500" />
                     </div>
                  </div>
               </div>

               <button type="submit" className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black text-[12px] uppercase shadow-xl hover:bg-indigo-800 transition-all flex items-center justify-center gap-3">
                  <Save className="w-5 h-5" /> {editingSupplier ? 'Mettre à jour' : 'Enregistrer le partenaire'}
               </button>
            </form>
         </div>
       )}

       <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center gap-4 no-print opacity-60">
          <Info className="w-5 h-5 text-slate-400" />
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-loose">
             La base de données fournisseurs est auditée chaque trimestre. Les délais de livraison sont calculés sur la base des réceptions effectives dans le module "Mouvements".
          </p>
       </div>
    </div>
  );
};

import React, { useState, useMemo, useRef } from 'react';
import { 
  Lamp, Plus, Search, Edit3, Trash2, MapPin, 
  Calendar, Printer, Activity, Filter, CheckCircle2, X, Save,
  Download, Upload, FileSpreadsheet, ArrowRightLeft, Info,
  History, ClipboardList, TrendingDown, TrendingUp, ChevronRight
} from 'lucide-react';
import { Furniture, Site, FurnitureAuditSession, FurnitureAuditItem } from './types';
import { Badge } from './Badge';

interface FurnitureViewProps {
  furniture: Furniture[];
  setFurniture: (f: Furniture[]) => void;
  furnitureAudits: FurnitureAuditSession[];
  setFurnitureAudits: (a: FurnitureAuditSession[]) => void;
  sites: Site[];
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type TabType = 'registry' | 'audits';

export const FurnitureView = ({ 
  furniture, 
  setFurniture, 
  furnitureAudits, 
  setFurnitureAudits, 
  sites, 
  notify 
}: FurnitureViewProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('registry');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSite, setFilterSite] = useState('All');
  const [filterCondition, setFilterCondition] = useState('All');
  
  // Modal states for Registry
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Furniture | null>(null);
  
  // Audit Session States
  const [activeSession, setActiveSession] = useState<FurnitureAuditSession | null>(null);
  const [viewingSession, setViewingSession] = useState<FurnitureAuditSession | null>(null);
  const [isNewAuditModalOpen, setIsNewAuditModalOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Omit<Furniture, 'id'>>({
    code: '',
    name: '',
    siteId: sites[0]?.id || '1',
    currentCount: 1,
    condition: 'Bon',
    lastChecked: new Date().toISOString()
  });

  // --- LOGIQUE REGISTRE ---

  const furnitureStats = useMemo(() => {
    return {
      total: furniture.reduce((acc, f) => acc + f.currentCount, 0),
      damaged: furniture.filter(f => f.condition === 'Endommagé').length,
      new: furniture.filter(f => f.condition === 'Neuf').length,
    };
  }, [furniture]);

  const filteredFurniture = useMemo(() => {
    return furniture.filter(f => {
      const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           f.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSite = filterSite === 'All' || f.siteId === filterSite;
      const matchesCondition = filterCondition === 'All' || f.condition === filterCondition;
      return matchesSearch && matchesSite && matchesCondition;
    });
  }, [furniture, searchTerm, filterSite, filterCondition]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ 
      code: `MOB-${Date.now().toString().slice(-6)}`, 
      name: '', 
      siteId: sites[0]?.id || '1', 
      currentCount: 1, 
      condition: 'Bon', 
      lastChecked: new Date().toISOString() 
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Furniture) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const item = furniture.find(f => f.id === id);
    if (confirm(`Supprimer l'actif "${item?.name}" du registre ?`)) {
      setFurniture(furniture.filter(f => f.id !== id));
      notify(`Actif "${item?.name}" supprimé.`, 'error');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      setFurniture(furniture.map(f => f.id === editingItem.id ? { ...formData, id: f.id } : f));
      notify(`Fiche actif "${formData.name}" mise à jour.`);
    } else {
      const newItem: Furniture = { ...formData, id: `F-${Date.now()}` };
      setFurniture([newItem, ...furniture]);
      notify(`Nouvel actif "${formData.name}" enregistré.`);
    }
    setIsModalOpen(false);
  };

  const getSiteName = (id: string) => sites.find(s => s.id === id)?.name || 'Inconnu';

  // --- LOGIQUE AUDIT TRIMESTRIEL ---

  const [newAuditData, setNewAuditData] = useState({
    siteId: sites[0]?.id || '1',
    quarter: 'Q1' as 'Q1' | 'Q2' | 'Q3' | 'Q4',
    year: new Date().getFullYear()
  });

  const handleStartNewAudit = () => {
    const site = sites.find(s => s.id === newAuditData.siteId);
    const siteFurniture = furniture.filter(f => f.siteId === newAuditData.siteId);
    
    if (siteFurniture.length === 0) {
      notify("Aucun meuble enregistré pour ce site.", "error");
      return;
    }

    const newSession: FurnitureAuditSession = {
      id: `AUD-${Date.now()}`,
      date: new Date().toISOString(),
      siteId: newAuditData.siteId,
      siteName: site?.name || 'Inconnu',
      quarter: newAuditData.quarter,
      year: newAuditData.year,
      status: 'En cours',
      totalDifference: 0,
      items: siteFurniture.map(f => ({
        furnitureId: f.id,
        furnitureName: f.name,
        furnitureCode: f.code,
        previousCount: f.currentCount,
        actualCount: f.currentCount, // Par défaut on suggère le théorique
        difference: 0,
        condition: f.condition,
        observation: ''
      }))
    };

    setActiveSession(newSession);
    setIsNewAuditModalOpen(false);
    notify(`Session d'audit ${newSession.quarter}-${newSession.year} ouverte pour ${newSession.siteName}.`);
  };

  const handleUpdateAuditItem = (furnitureId: string, count: number, condition?: any, observation?: string) => {
    if (!activeSession) return;
    
    const updatedItems = activeSession.items.map(item => {
      if (item.furnitureId === furnitureId) {
        const diff = count - item.previousCount;
        return {
          ...item,
          actualCount: count,
          difference: diff,
          condition: condition || item.condition,
          observation: observation !== undefined ? observation : item.observation
        };
      }
      return item;
    });

    const totalDiff = updatedItems.reduce((acc, curr) => acc + curr.difference, 0);
    setActiveSession({ ...activeSession, items: updatedItems, totalDifference: totalDiff });
  };

  const handleCloseAudit = () => {
    if (!activeSession) return;
    if (confirm("Clôturer définitivement cet audit ? Les quantités réelles mettront à jour le registre principal.")) {
      // Mettre à jour le registre principal
      const updatedFurniture = [...furniture];
      activeSession.items.forEach(auditItem => {
        const idx = updatedFurniture.findIndex(f => f.id === auditItem.furnitureId);
        if (idx !== -1) {
          updatedFurniture[idx] = {
            ...updatedFurniture[idx],
            currentCount: auditItem.actualCount,
            condition: auditItem.condition,
            lastChecked: new Date().toISOString()
          };
        }
      });

      setFurniture(updatedFurniture);
      setFurnitureAudits([{ ...activeSession, status: 'Clôturé' }, ...furnitureAudits]);
      setActiveSession(null);
      notify("Audit clôturé et inventaire mis à jour.");
    }
  };

  const handlePrintRegistry = () => window.print();

  return (
    <div className="space-y-8 animate-fade-in pb-32">
      {/* HEADER AVEC TABS PROFESSIONNEL */}
      <div className="flex flex-wrap items-center justify-between gap-6 no-print">
         <div className="bg-white p-2 rounded-3xl border border-slate-100 shadow-sm flex gap-2">
            <button
              onClick={() => setActiveTab('registry')}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'registry' ? 'bg-[#1a3a22] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              <Lamp className="w-4 h-4" /> Registre Actuel
            </button>
            <button
              onClick={() => setActiveTab('audits')}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'audits' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              <ClipboardList className="w-4 h-4" /> Audits Trimestriels
            </button>
         </div>

         {activeTab === 'registry' && (
           <button onClick={handleOpenAdd} className="flex items-center gap-3 px-8 py-5 bg-[#1a3a22] text-white rounded-3xl font-black text-[11px] uppercase shadow-xl hover:bg-emerald-900 transition-all">
              <Plus className="w-4 h-4" /> Nouvel Actif
           </button>
         )}

         {activeTab === 'audits' && !activeSession && (
           <button onClick={() => setIsNewAuditModalOpen(true)} className="flex items-center gap-3 px-8 py-5 bg-indigo-600 text-white rounded-3xl font-black text-[11px] uppercase shadow-xl hover:bg-indigo-800 transition-all">
              <Plus className="w-4 h-4" /> Nouvelle Session d'Audit
           </button>
         )}
      </div>

      {activeTab === 'registry' && (
        <>
          {/* REGISTRE SOMMAIRE */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Total Patrimoine Mobilier</p>
               <h4 className="text-3xl font-black italic tracking-tighter text-slate-900">{furnitureStats.total} <span className="text-lg text-slate-300">unités</span></h4>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
               <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-4">Éléments Endommagés</p>
               <h4 className="text-3xl font-black italic tracking-tighter text-rose-500">{furnitureStats.damaged}</h4>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
               <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-4">Excellent État (Neuf)</p>
               <h4 className="text-3xl font-black italic tracking-tighter text-emerald-600">{furnitureStats.new}</h4>
            </div>
          </div>

          {/* BARRE DE FILTRES REGISTRE */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-6 no-print">
            <div className="flex items-center gap-4 flex-1 min-w-[300px]">
               <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input 
                    type="text" 
                    placeholder="Recherche mobilier..." 
                    className="w-full bg-slate-50 border border-slate-100 pl-12 pr-4 py-3 rounded-xl text-[11px] font-black uppercase italic outline-none focus:ring-2 focus:ring-[#1a3a22]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
               <select 
                 className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-[#1a3a22]"
                 value={filterSite}
                 onChange={(e) => setFilterSite(e.target.value)}
               >
                  <option value="All">Tous les Sites</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
               </select>
            </div>
            <div className="flex gap-2">
               <button onClick={handlePrintRegistry} className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"><Printer className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-10 py-6">Code & Désignation</th>
                  <th className="px-10 py-6">Site</th>
                  <th className="px-10 py-6 text-center">Quantité</th>
                  <th className="px-10 py-6 text-center">État Physique</th>
                  <th className="px-10 py-6 text-right no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredFurniture.length === 0 ? (
                  <tr><td colSpan={5} className="px-10 py-24 text-center opacity-30 italic font-black text-[12px] uppercase">Aucun élément dans le registre</td></tr>
                ) : (
                  filteredFurniture.map((item) => (
                    <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-10 py-6">
                         <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">{item.code}</p>
                         <p className="text-[12px] font-black uppercase italic text-slate-900">{item.name}</p>
                      </td>
                      <td className="px-10 py-6">
                         <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase italic">
                            <MapPin className="w-3.5 h-3.5 text-slate-300" /> {getSiteName(item.siteId)}
                         </div>
                      </td>
                      <td className="px-10 py-6 text-center text-xl font-header italic">{item.currentCount}</td>
                      <td className="px-10 py-6 text-center">
                         <Badge variant={item.condition === 'Neuf' ? 'success' : item.condition === 'Bon' ? 'info' : item.condition === 'Usé' ? 'warning' : 'danger'}>
                           {item.condition}
                         </Badge>
                      </td>
                      <td className="px-10 py-6 text-right no-print">
                         <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                           <button onClick={() => handleOpenEdit(item)} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-[#1a3a22] hover:text-white transition-all"><Edit3 className="w-3.5 h-3.5" /></button>
                           <button onClick={() => handleDelete(item.id)} className="p-2.5 bg-slate-50 text-slate-300 rounded-xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                         </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'audits' && (
        <div className="space-y-10">
          {activeSession ? (
            /* SESSION D'AUDIT EN COURS */
            <div className="animate-fade-in space-y-8">
               <div className="bg-white p-10 rounded-[3rem] border-2 border-indigo-500 shadow-2xl space-y-6">
                  <div className="flex justify-between items-start">
                     <div>
                        <Badge variant="info">Audit en cours : {activeSession.quarter} {activeSession.year}</Badge>
                        <h3 className="text-4xl font-header italic mt-4 text-slate-900">{activeSession.siteName}</h3>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Comparaison : Registre vs Inventaire Physique</p>
                     </div>
                     <div className="flex gap-4">
                        <button onClick={() => setActiveSession(null)} className="px-8 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase">Suspendre</button>
                        <button onClick={handleCloseAudit} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl">Clôturer l'audit</button>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                     <div className="bg-slate-50 p-6 rounded-3xl text-center border border-slate-100">
                        <p className="text-[9px] font-black uppercase text-slate-400 mb-2">Articles Audités</p>
                        <p className="text-3xl font-black italic">{activeSession.items.length}</p>
                     </div>
                     <div className="bg-slate-50 p-6 rounded-3xl text-center border border-slate-100 col-span-2">
                        <p className="text-[9px] font-black uppercase text-slate-400 mb-2">Écart Total détecté</p>
                        <div className="flex items-center justify-center gap-4">
                           <p className={`text-4xl font-black italic ${activeSession.totalDifference === 0 ? 'text-slate-900' : activeSession.totalDifference > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {activeSession.totalDifference > 0 ? '+' : ''}{activeSession.totalDifference}
                           </p>
                           <Badge variant={activeSession.totalDifference === 0 ? 'success' : 'warning'}>{activeSession.totalDifference === 0 ? 'Conforme' : 'Écart détecté'}</Badge>
                        </div>
                     </div>
                     <div className="bg-[#1a3a22] p-6 rounded-3xl text-center text-white shadow-xl flex flex-col justify-center">
                        <Info className="w-6 h-6 mx-auto mb-2 text-emerald-400" />
                        <p className="text-[8px] font-bold uppercase opacity-60">L'inventaire trimestriel est obligatoire pour la certification patrimoniale.</p>
                     </div>
                  </div>

                  <div className="overflow-hidden rounded-[2.5rem] border border-slate-100">
                     <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b">
                           <tr>
                              <th className="px-10 py-6">Code & Nom</th>
                              <th className="px-10 py-6 text-center">Théorique</th>
                              <th className="px-10 py-6 text-center">Physique</th>
                              <th className="px-10 py-6 text-center">Écart</th>
                              <th className="px-10 py-6">État & Observation</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {activeSession.items.map((it) => (
                              <tr key={it.furnitureId}>
                                 <td className="px-10 py-6">
                                    <p className="text-[12px] font-black uppercase italic text-slate-900">{it.furnitureName}</p>
                                    <p className="text-[8px] font-bold text-slate-300 uppercase italic">{it.furnitureCode}</p>
                                 </td>
                                 <td className="px-10 py-6 text-center">
                                    <span className="text-xl font-header text-slate-300">{it.previousCount}</span>
                                 </td>
                                 <td className="px-10 py-6 text-center">
                                    <input 
                                       type="number" 
                                       className="w-24 bg-indigo-50 border border-indigo-100 p-3 rounded-xl text-center text-xl font-header italic outline-none focus:ring-2 focus:ring-indigo-500"
                                       value={it.actualCount}
                                       onChange={(e) => handleUpdateAuditItem(it.furnitureId, Number(e.target.value))}
                                    />
                                 </td>
                                 <td className="px-10 py-6 text-center">
                                    {it.difference === 0 ? <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" /> : (
                                       <span className={`text-xl font-black italic ${it.difference > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                          {it.difference > 0 ? '+' : ''}{it.difference}
                                       </span>
                                    )}
                                 </td>
                                 <td className="px-10 py-6 space-y-2">
                                    <select 
                                       className="w-full bg-slate-50 border border-slate-100 p-2 rounded-lg text-[9px] font-black uppercase italic"
                                       value={it.condition}
                                       onChange={(e) => handleUpdateAuditItem(it.furnitureId, it.actualCount, e.target.value)}
                                    >
                                       <option value="Neuf">NEUF</option>
                                       <option value="Bon">BON ÉTAT</option>
                                       <option value="Usé">USÉ</option>
                                       <option value="Endommagé">ENDOMMAGÉ</option>
                                    </select>
                                    <input 
                                       type="text" 
                                       placeholder="Observation..." 
                                       className="w-full bg-transparent border-b border-slate-100 text-[10px] font-bold outline-none italic"
                                       value={it.observation}
                                       onChange={(e) => handleUpdateAuditItem(it.furnitureId, it.actualCount, it.condition, e.target.value)}
                                    />
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
          ) : viewingSession ? (
            /* VUE ARCHIVE AUDIT */
            <div className="animate-fade-in space-y-8">
               <button onClick={() => setViewingSession(null)} className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 rotate-180" /> Retour aux archives
               </button>
               <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl space-y-10">
                  <div className="flex justify-between items-start">
                     <div>
                        <Badge variant="success">Audit Clôturé</Badge>
                        <h3 className="text-4xl font-header italic mt-4 uppercase">{viewingSession.siteName}</h3>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Rapport trimestriel - {viewingSession.quarter} {viewingSession.year}</p>
                     </div>
                     <button onClick={() => window.print()} className="p-5 bg-slate-50 rounded-3xl hover:bg-slate-100 transition-all"><Printer className="w-6 h-6 text-indigo-600" /></button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-center">
                        <p className="text-[9px] font-black uppercase text-slate-400 mb-2">Date d'audit</p>
                        <p className="text-lg font-black italic">{new Date(viewingSession.date).toLocaleDateString()}</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-center">
                        <p className="text-[9px] font-black uppercase text-slate-400 mb-2">Références</p>
                        <p className="text-lg font-black italic">{viewingSession.items.length}</p>
                    </div>
                    <div className={`p-6 rounded-3xl border text-center col-span-2 ${viewingSession.totalDifference === 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                        <p className="text-[9px] font-black uppercase mb-2">Solde global des écarts</p>
                        <p className="text-4xl font-black italic">{viewingSession.totalDifference > 0 ? '+' : ''}{viewingSession.totalDifference}</p>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-[2rem] border border-slate-50">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[8px] font-black uppercase text-slate-400 tracking-widest border-b">
                         <tr><th className="px-8 py-4">Désignation</th><th className="px-8 py-4 text-center">Précédent</th><th className="px-8 py-4 text-center">Actuel</th><th className="px-8 py-4 text-center">Écart</th><th className="px-8 py-4">État & Observations</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {viewingSession.items.map((it, idx) => (
                           <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="px-8 py-5">
                                 <p className="text-[11px] font-black uppercase italic">{it.furnitureName}</p>
                                 <p className="text-[8px] font-bold text-slate-300 uppercase">{it.furnitureCode}</p>
                              </td>
                              <td className="px-8 py-5 text-center font-bold text-slate-400">{it.previousCount}</td>
                              <td className="px-8 py-5 text-center font-black italic text-lg">{it.actualCount}</td>
                              <td className={`px-8 py-5 text-center font-black italic text-lg ${it.difference === 0 ? 'text-slate-200' : it.difference > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                 {it.difference > 0 ? '+' : ''}{it.difference}
                              </td>
                              <td className="px-8 py-5">
                                 <div className="flex items-center gap-2 mb-1">
                                    <Badge variant={it.condition === 'Neuf' ? 'success' : 'info'}>{it.condition}</Badge>
                                 </div>
                                 <p className="text-[9px] italic text-slate-400">{it.observation || 'R.A.S'}</p>
                              </td>
                           </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </div>
            </div>
          ) : (
            /* HISTORIQUE DES SESSIONS */
            <div className="animate-fade-in space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {furnitureAudits.length === 0 ? (
                    <div className="col-span-full py-32 text-center opacity-20 border-2 border-dashed border-slate-200 rounded-[4rem]">
                       <History className="w-20 h-20 mx-auto mb-6" />
                       <p className="text-xl font-header italic uppercase">Aucun audit archivé</p>
                       <p className="text-[10px] font-black uppercase mt-2">Commencez un nouvel inventaire trimestriel via le bouton ci-dessus</p>
                    </div>
                  ) : (
                    furnitureAudits.map(audit => (
                      <div 
                        key={audit.id} 
                        onClick={() => setViewingSession(audit)}
                        className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer group"
                      >
                         <div className="flex justify-between items-start mb-6">
                            <div className="p-4 bg-indigo-50 rounded-[1.5rem] text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                               <ClipboardList className="w-6 h-6" />
                            </div>
                            <Badge variant="success">{audit.status}</Badge>
                         </div>
                         <h4 className="text-[12px] font-black uppercase text-slate-400 tracking-widest">{audit.quarter} {audit.year}</h4>
                         <h3 className="text-2xl font-header italic text-slate-900 uppercase mt-1 mb-4">{audit.siteName}</h3>
                         
                         <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                            <div>
                               <p className="text-[8px] font-black text-slate-300 uppercase italic">Résultat Audit</p>
                               <p className={`text-2xl font-black italic ${audit.totalDifference === 0 ? 'text-slate-900' : audit.totalDifference > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  {audit.totalDifference > 0 ? '+' : ''}{audit.totalDifference}
                               </p>
                            </div>
                            <div className="text-right">
                               <p className="text-[8px] font-black text-slate-300 uppercase italic">Éléments</p>
                               <p className="text-lg font-black italic text-slate-400">{audit.items.length}</p>
                            </div>
                         </div>
                      </div>
                    ))
                  )}
               </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL AJOUT MEUBLE (REGISTRE) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
          <form onSubmit={handleSubmit} className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl p-12 space-y-8 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center">
              <h3 className="text-3xl font-header italic uppercase">{editingItem ? 'Modifier Fiche Meuble' : 'Nouveau Meuble'}</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-all"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Code d'Inventaire</label>
                <input required type="text" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase italic outline-none focus:ring-2 focus:ring-[#1a3a22]" />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Désignation du Meuble</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase italic outline-none focus:ring-2 focus:ring-[#1a3a22]" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Affectation (Site)</label>
                <select value={formData.siteId} onChange={(e) => setFormData({...formData, siteId: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase outline-none focus:ring-2 focus:ring-[#1a3a22]">
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Quantité initiale</label>
                <input required type="number" value={formData.currentCount} onChange={(e) => setFormData({...formData, currentCount: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-xl font-header italic outline-none focus:ring-2 focus:ring-[#1a3a22]" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">État Physique</label>
                <select value={formData.condition} onChange={(e) => setFormData({...formData, condition: e.target.value as any})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase outline-none focus:ring-2 focus:ring-[#1a3a22]">
                  <option value="Neuf">NEUF</option>
                  <option value="Bon">BON ÉTAT</option>
                  <option value="Usé">USÉ</option>
                  <option value="Endommagé">ENDOMMAGÉ</option>
                </select>
              </div>
            </div>
            <button type="submit" className="w-full bg-emerald-600 text-white py-6 rounded-3xl font-black text-[12px] uppercase shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3">
              <Save className="w-5 h-5" /> Enregistrer les modifications
            </button>
          </form>
        </div>
      )}

      {/* MODAL INITIALISATION AUDIT */}
      {isNewAuditModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-12 space-y-8">
             <div className="flex justify-between items-center">
                <h3 className="text-2xl font-header italic uppercase text-slate-900 leading-none">Lancer l'inventaire Trimestriel</h3>
                <button type="button" onClick={() => setIsNewAuditModalOpen(false)} className="p-2 bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
             </div>
             
             <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Choisir le Site</label>
                   <select 
                      className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase outline-none focus:ring-2 focus:ring-indigo-500"
                      value={newAuditData.siteId}
                      onChange={(e) => setNewAuditData({...newAuditData, siteId: e.target.value})}
                   >
                      {sites.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                   </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Trimestre</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase outline-none"
                        value={newAuditData.quarter}
                        onChange={(e) => setNewAuditData({...newAuditData, quarter: e.target.value as any})}
                      >
                         <option value="Q1">Q1 (JAN-MAR)</option>
                         <option value="Q2">Q2 (AVR-JUN)</option>
                         <option value="Q3">Q3 (JUL-SEP)</option>
                         <option value="Q4">Q4 (OCT-DEC)</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Année</label>
                      <input 
                        type="number" 
                        className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase outline-none"
                        value={newAuditData.year}
                        onChange={(e) => setNewAuditData({...newAuditData, year: Number(e.target.value)})}
                      />
                   </div>
                </div>

                <button 
                  onClick={handleStartNewAudit}
                  className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black text-[10px] uppercase shadow-xl hover:bg-indigo-800 transition-all flex items-center justify-center gap-3"
                >
                   <ClipboardList className="w-5 h-5" /> Initialiser la session
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};


import React, { useState, useMemo, useRef } from 'react';
import { 
  Lamp, Plus, Search, Edit3, Trash2, MapPin, 
  Calendar, Printer, Activity, Filter, CheckCircle2, X, Save,
  Download, Upload, FileSpreadsheet, ArrowRightLeft, Info,
  History, ClipboardList, TrendingDown, TrendingUp, ChevronRight, FileUp, MessageSquare, FileDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Furniture, Site, FurnitureAuditSession, FurnitureAuditItem } from './types';
import { Badge } from './Badge';

interface FurnitureViewProps {
  furniture: Furniture[];
  setFurniture: (f: Furniture[]) => void;
  furnitureAudits: FurnitureAuditSession[];
  setFurnitureAudits: (a: FurnitureAuditSession[]) => void;
  sites: Site[];
  notify: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  onImportFurniture: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

type TabType = 'registry' | 'audits';

export const FurnitureView = ({ 
  furniture, 
  setFurniture, 
  furnitureAudits, 
  setFurnitureAudits, 
  sites, 
  notify,
  onImportFurniture
}: FurnitureViewProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('registry');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSite, setFilterSite] = useState('All');
  const [filterCondition, setFilterCondition] = useState('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Furniture | null>(null);
  
  const furnitureImportRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Omit<Furniture, 'id'>>({
    code: '',
    name: '',
    siteId: sites[0]?.id || '',
    currentCount: 1,
    condition: 'Bon',
    lastChecked: new Date().toISOString(),
    comment: ''
  });

  const getSiteName = (id: string) => sites.find(s => s.id === id)?.name || 'Inconnu';

  const furnitureStats = useMemo(() => {
    return {
      total: furniture.reduce((acc, f) => acc + f.currentCount, 0),
      damaged: furniture.filter(f => f.condition === 'Endommagé').length,
      new: furniture.filter(f => f.condition === 'Neuf').length,
    };
  }, [furniture]);

  const filteredAndSortedFurniture = useMemo(() => {
    return furniture
      .filter(f => {
        const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             f.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             (f.comment || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSite = filterSite === 'All' || f.siteId === filterSite;
        const matchesCondition = filterCondition === 'All' || f.condition === filterCondition;
        return matchesSearch && matchesSite && matchesCondition;
      })
      .sort((a, b) => {
        const siteA = getSiteName(a.siteId).toLowerCase();
        const siteB = getSiteName(b.siteId).toLowerCase();
        if (siteA < siteB) return -1;
        if (siteA > siteB) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [furniture, searchTerm, filterSite, filterCondition, sites]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ 
      code: `MOB-${Date.now().toString().slice(-6)}`, 
      name: '', 
      siteId: sites[0]?.id || '', 
      currentCount: 1, 
      condition: 'Bon', 
      lastChecked: new Date().toISOString(),
      comment: ''
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
    if (window.confirm(`ALERTE SUPPRESSION : Voulez-vous supprimer définitivement l'actif "${item?.name}" du registre du patrimoine ?`)) {
      setFurniture(furniture.filter(f => f.id !== id));
      notify(`Actif "${item?.name}" supprimé.`, 'error');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.siteId) return notify("Veuillez sélectionner un service/site", "error");
    
    const confirmMsg = editingItem 
      ? `CONFIRMATION : Voulez-vous écraser les données de l'actif "${formData.name}" ?`
      : `CRÉATION : Enregistrer "${formData.name}" dans le patrimoine ?`;

    if (!window.confirm(confirmMsg)) return;

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

  const handleExportFurniture = () => {
    if (filteredAndSortedFurniture.length === 0) return notify("Aucune donnée à exporter.", "warning");
    
    const headers = ["Service", "Article", "Code", "Quantité", "État", "Observation"];
    const rows = filteredAndSortedFurniture.map(f => [
      getSiteName(f.siteId),
      f.name,
      f.code,
      f.currentCount,
      f.condition,
      (f.comment || "").replace(/;/g, ",") 
    ]);

    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(";")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `EXPORT_MOBILIER_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify("Registre mobilier exporté en CSV.");
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!window.confirm(`IMPORTATION PATRIMOINE : ${files.length} fichier(s) détecté(s). Voulez-vous lancer l'analyse ?`)) {
      e.target.value = '';
      return;
    }

    const siteMap = new Map(sites.map(s => [s.name.toLowerCase().trim(), s.id]));
    const defaultSiteId = sites.length > 0 ? sites[0].id : 'SITE-001';
    let allNewItems: Furniture[] = [];

    const filePromises = Array.from(files).map(file => {
      return new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const data = evt.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            if (rows.length < 2) return resolve();

            const headers = rows[0].map(h => String(h || '').toLowerCase().trim());
            const findIdx = (names: string[]) => headers.findIndex(h => names.some(n => h.includes(n.toLowerCase())));
            
            const idxName = findIdx(['nom', 'désignation', 'designation', 'article', 'item', 'meuble', 'actif']);
            const idxCode = findIdx(['code', 'référence', 'reference', 'ref', 'sku', 'id']);
            const idxQty = findIdx(['quantité', 'quantite', 'qty', 'nombre', 'count']);
            const idxCond = findIdx(['état', 'etat', 'condition', 'statut']);
            const idxSite = findIdx(['site', 'service', 'localisation', 'bureau', 'pièce']);
            const idxObs = findIdx(['observation', 'commentaire', 'comment', 'obs', 'note']);

            for (let i = 1; i < rows.length; i++) {
              const row = rows[i];
              if (!row || row.length === 0) continue;

              const name = idxName !== -1 ? String(row[idxName] || '').trim() : '';
              if (!name) continue;

              const siteName = idxSite !== -1 ? String(row[idxSite] || '').toLowerCase().trim() : '';
              const siteId = siteMap.get(siteName) || defaultSiteId;
              
              const rawCond = idxCond !== -1 ? String(row[idxCond] || '').trim().toLowerCase() : '';
              let condition: any = 'Bon';
              if (rawCond.includes('neuf')) condition = 'Neuf';
              else if (rawCond.includes('use') || rawCond.includes('usé')) condition = 'Usé';
              else if (rawCond.includes('endo') || rawCond.includes('casse')) condition = 'Endommagé';

              allNewItems.push({
                id: `F-IMP-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                siteId: siteId,
                name: name.toUpperCase(),
                code: idxCode !== -1 ? String(row[idxCode] || '').trim() : `MOB-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
                currentCount: idxQty !== -1 ? Number(row[idxQty]) || 1 : 1,
                condition: condition,
                lastChecked: new Date().toISOString(),
                comment: idxObs !== -1 ? String(row[idxObs] || '').trim() : ''
              });
            }
          } catch (err) {
            console.error("Erreur import patrimoine:", err);
          }
          resolve();
        };
        reader.readAsBinaryString(file);
      });
    });

    await Promise.all(filePromises);

    if (allNewItems.length > 0) {
      if (window.confirm(`RÉSULTAT PATRIMOINE : ${allNewItems.length} actifs détectés. Valider l'enregistrement dans le registre ?`)) {
        setFurniture([...allNewItems, ...furniture]);
        notify(`${allNewItems.length} article(s) de patrimoine importé(s) avec succès.`, 'success');
        setActiveTab('registry');
      }
    } else {
      notify("Aucune donnée de patrimoine valide détectée.", "error");
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-8 animate-fade-in pb-32">
      <div className="flex flex-wrap items-center justify-between gap-6 no-print">
         <div className="bg-white p-2 rounded-3xl border border-slate-100 shadow-sm flex gap-2">
            <button onClick={() => setActiveTab('registry')} className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'registry' ? 'bg-[#1a3a22] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
              <Lamp className="w-4 h-4" /> Registre du Patrimoine
            </button>
            <button onClick={() => setActiveTab('audits')} className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'audits' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
              <ClipboardList className="w-4 h-4" /> Journal d'Audit
            </button>
         </div>

         <div className="flex gap-4">
           {activeTab === 'registry' && (
             <>
               <input ref={furnitureImportRef} type="file" accept=".csv, .xlsx, .xls" className="hidden" multiple onChange={handleFileImport} />
               <button onClick={() => furnitureImportRef.current?.click()} className="flex items-center gap-3 px-8 py-5 bg-white border border-slate-200 text-slate-600 rounded-3xl font-black text-[11px] uppercase hover:bg-slate-50 transition-all shadow-sm">
                 <FileUp className="w-4 h-4 text-emerald-600" /> Importer Multi
               </button>
               <button onClick={handleExportFurniture} className="flex items-center gap-3 px-8 py-5 bg-white border border-slate-200 text-slate-600 rounded-3xl font-black text-[11px] uppercase hover:bg-slate-50 transition-all shadow-sm">
                 <FileDown className="w-4 h-4 text-blue-600" /> Exporter
               </button>
               <button onClick={handleOpenAdd} className="flex items-center gap-3 px-8 py-5 bg-[#1a3a22] text-white rounded-3xl font-black text-[11px] uppercase shadow-xl hover:bg-emerald-900 transition-all">
                  <Plus className="w-4 h-4" /> Nouvel Article
               </button>
             </>
           )}
         </div>
      </div>

      {activeTab === 'registry' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
               <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Mobiliers & Équipements</p>
                  <h4 className="text-3xl font-black italic tracking-tighter text-slate-900">{furnitureStats.total}</h4>
               </div>
               <div className="p-4 bg-slate-50 rounded-2xl text-slate-300">
                  <Lamp className="w-6 h-6" />
               </div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
               <div>
                  <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">Dégradés / Endommagés</p>
                  <h4 className="text-3xl font-black italic tracking-tighter text-rose-500">{furnitureStats.damaged}</h4>
               </div>
               <div className="p-4 bg-rose-50 rounded-2xl text-rose-500">
                  <TrendingDown className="w-6 h-6" />
               </div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
               <div>
                  <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">État Neuf / Parfait</p>
                  <h4 className="text-3xl font-black italic tracking-tighter text-emerald-600">{furnitureStats.new}</h4>
               </div>
               <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-500">
                  <TrendingUp className="w-6 h-6" />
               </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-6 no-print">
            <div className="flex items-center gap-4 flex-1 min-w-[300px]">
               <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input type="text" placeholder="Chercher par nom, code ou observation..." className="w-full bg-slate-50 border border-slate-100 pl-12 pr-4 py-3.5 rounded-2xl text-[11px] font-black uppercase italic outline-none focus:ring-2 focus:ring-[#1a3a22]" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
               </div>
               <select className="bg-slate-50 border border-slate-100 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-[#1a3a22]" value={filterSite} onChange={(e) => setFilterSite(e.target.value)}>
                  <option value="All">TOUS LES SERVICES</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
               </select>
            </div>
          </div>

          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden print:shadow-none print:border-slate-300">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-8 py-6">Service / Localisation</th>
                  <th className="px-8 py-6">Article & Code</th>
                  <th className="px-8 py-6 text-center">Quantité</th>
                  <th className="px-8 py-6 text-center">État</th>
                  <th className="px-8 py-6">Observation</th>
                  <th className="px-8 py-6 text-right no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredAndSortedFurniture.length === 0 ? (
                  <tr><td colSpan={6} className="px-10 py-32 text-center opacity-30 italic font-black text-[12px] uppercase">Aucun élément trouvé</td></tr>
                ) : (
                  filteredAndSortedFurniture.map((item) => (
                    <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6">
                         <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg text-slate-400"><MapPin className="w-3.5 h-3.5" /></div>
                            <span className="text-[11px] font-black uppercase italic text-slate-900">{getSiteName(item.siteId)}</span>
                         </div>
                      </td>
                      <td className="px-8 py-6">
                         <p className="text-[12px] font-black uppercase italic text-slate-900">{item.name}</p>
                         <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-1">Ref: {item.code}</p>
                      </td>
                      <td className="px-8 py-6 text-center">
                         <span className="text-xl font-header italic text-[#1a3a22]">{item.currentCount}</span>
                      </td>
                      <td className="px-8 py-6 text-center">
                         <Badge variant={item.condition === 'Neuf' ? 'success' : item.condition === 'Bon' ? 'info' : item.condition === 'Usé' ? 'warning' : 'danger'}>{item.condition}</Badge>
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex items-start gap-2 max-w-[200px]">
                            <MessageSquare className="w-3 h-3 text-slate-200 mt-0.5 shrink-0" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase italic leading-tight line-clamp-2">{item.comment || "R.A.S"}</p>
                         </div>
                      </td>
                      <td className="px-8 py-6 text-right no-print">
                         <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                           <button onClick={() => handleOpenEdit(item)} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-[#1a3a22] hover:text-white transition-all shadow-sm"><Edit3 className="w-3.5 h-3.5" /></button>
                           <button onClick={() => handleDelete(item.id)} className="p-2.5 bg-rose-50 text-rose-300 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"><Trash2 className="w-3.5 h-3.5" /></button>
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

      {/* MODAL AJOUT/EDIT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
          <form onSubmit={handleSubmit} className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl p-12 space-y-10 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center">
              <h3 className="text-3xl font-header italic uppercase">{editingItem ? 'Mise à jour Article' : 'Nouvel Article'}</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-all"><X className="w-6 h-6 text-slate-400" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="col-span-2 space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Désignation de l'Article</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase italic outline-none focus:ring-2 focus:ring-[#1a3a22]" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Affectation (Service / Site)</label>
                <select required value={formData.siteId} onChange={(e) => setFormData({...formData, siteId: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase outline-none">
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Quantité Unitaire</label>
                <input required type="number" value={formData.currentCount} onChange={(e) => setFormData({...formData, currentCount: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-2xl font-header italic outline-none" />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Commentaire / Observation</label>
                <textarea value={formData.comment} onChange={(e) => setFormData({...formData, comment: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[11px] font-bold uppercase italic outline-none h-24 resize-none" />
              </div>
            </div>
            <button type="submit" className="w-full bg-[#1a3a22] text-white py-8 rounded-[2.5rem] font-black text-[13px] uppercase shadow-2xl hover:bg-emerald-900 transition-all">
              <Save className="w-5 h-5 mr-3" /> Enregistrer les informations
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

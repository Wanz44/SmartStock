
import React, { useState, useEffect } from 'react';
import { 
  Building2, DollarSign, ShieldAlert, Database, 
  Save, Trash2, Download, RefreshCcw, BellRing,
  MapPin, Globe, List, Plus, Edit3, Check, X,
  Printer, Layout, EyeOff, Hash, Type, 
  Maximize, Minimize, Paintbrush, Palette, TableProperties,
  FileText, AlignLeft, AlignCenter, Bell, Tags, Box
} from 'lucide-react';
import { AppSettings } from './types';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onResetSystem: () => void;
  notify: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const SettingsView = ({ settings, onUpdateSettings, onResetSystem, notify }: SettingsViewProps) => {
  const [activeRibbon, setActiveRibbon] = useState<'IDENTITY' | 'EXCEL_STYLE' | 'SYSTEM'>('IDENTITY');
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  // Synchroniser avec les props seulement si le parent change (ex: reset ou import)
  // On évite de réinitialiser si l'utilisateur est en train de modifier localement
  useEffect(() => {
    setLocalSettings(settings);
    setHasChanges(false);
  }, [settings.enterpriseName, settings.locationId, settings.exchangeRate, settings.categories]);

  const handleChange = (key: keyof AppSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdateSettings(localSettings);
    setHasChanges(false);
    notify("Paramètres enregistrés avec succès !", "success");
  };

  const addCategory = () => {
    const val = newCategory.trim();
    if (!val) return;
    if (localSettings.categories.map(c => c.toUpperCase()).includes(val.toUpperCase())) {
      return notify("Cette catégorie existe déjà.", "warning");
    }
    
    const updatedCategories = [...localSettings.categories, val];
    // On met à jour localement ET on notifie le parent immédiatement pour la persistance
    const newSettings = { ...localSettings, categories: updatedCategories };
    setLocalSettings(newSettings);
    onUpdateSettings(newSettings);
    
    setNewCategory('');
    notify(`Catégorie "${val}" ajoutée et sauvegardée.`);
  };

  const removeCategory = (cat: string) => {
    if (confirm(`Supprimer la catégorie "${cat}" ? Les produits existants ne seront pas modifiés.`)) {
      const updatedCategories = localSettings.categories.filter(c => c !== cat);
      const newSettings = { ...localSettings, categories: updatedCategories };
      setLocalSettings(newSettings);
      onUpdateSettings(newSettings);
      notify(`Catégorie "${cat}" retirée.`);
    }
  };

  const handleExportBackup = () => {
    const data = {
      products: JSON.parse(localStorage.getItem('ss_products') || '[]'),
      furniture: JSON.parse(localStorage.getItem('ss_furniture') || '[]'),
      history: JSON.parse(localStorage.getItem('ss_history') || '[]'),
      sites: JSON.parse(localStorage.getItem('ss_sites') || '[]'),
      settings: localSettings
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartstock_full_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="space-y-10 animate-fade-in pb-48 relative">
      {/* NAVIGATION DU RUBAN DE PARAMÈTRES */}
      <div className="bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm flex gap-2 no-print">
         {[
           { id: 'IDENTITY', label: 'Identité & Catalogue', icon: Building2 },
           { id: 'EXCEL_STYLE', label: 'Style Excel (Impression)', icon: TableProperties },
           { id: 'SYSTEM', label: 'Maintenance Système', icon: Database }
         ].map(tab => (
           <button
             key={tab.id}
             onClick={() => setActiveRibbon(tab.id as any)}
             className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
               activeRibbon === tab.id ? 'bg-[#1a3a22] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'
             }`}
           >
              <tab.icon className="w-4 h-4" /> {tab.label}
           </button>
         ))}
      </div>

      <div className="animate-fade-in">
        {activeRibbon === 'IDENTITY' && (
          <div className="space-y-10">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-10">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                     <h3 className="text-xl font-header italic uppercase text-slate-900 border-l-4 border-emerald-500 pl-4">Entité & Localisation</h3>
                     <div className="space-y-4">
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Désignation Entreprise</label>
                           <input 
                              type="text" 
                              className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase italic outline-none focus:ring-2 focus:ring-[#1a3a22]" 
                              value={localSettings.enterpriseName}
                              onChange={(e) => handleChange('enterpriseName', e.target.value)}
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase text-slate-400 ml-2">ID Magasin / Dépôt Principal</label>
                           <input 
                              type="text" 
                              className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black outline-none focus:ring-2 focus:ring-[#1a3a22]" 
                              value={localSettings.locationId}
                              onChange={(e) => handleChange('locationId', e.target.value)}
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Taux de Change (1$ = ? Fc)</label>
                           <input 
                              type="number" 
                              className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-xl font-header italic outline-none focus:ring-2 focus:ring-[#1a3a22]" 
                              value={localSettings.exchangeRate}
                              onChange={(e) => handleChange('exchangeRate', Number(e.target.value))}
                           />
                        </div>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <h3 className="text-xl font-header italic uppercase text-slate-900 border-l-4 border-emerald-500 pl-4">Configuration des Rapports</h3>
                     <div className="space-y-4">
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase text-slate-400 ml-2 flex items-center gap-2">
                              <AlignLeft className="w-3 h-3" /> En-tête Personnalisé (Print)
                           </label>
                           <textarea 
                              rows={2}
                              className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[11px] font-black uppercase italic outline-none focus:ring-2 focus:ring-[#1a3a22] resize-none" 
                              placeholder="ex: REGISTRE OFFICIEL DE STOCK ET PATRIMOINE"
                              value={localSettings.printHeader}
                              onChange={(e) => handleChange('printHeader', e.target.value)}
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase text-slate-400 ml-2 flex items-center gap-2">
                              <AlignCenter className="w-3 h-3" /> Pied de Page / Signatures (Print)
                           </label>
                           <textarea 
                              rows={2}
                              className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[11px] font-black uppercase outline-none focus:ring-2 focus:ring-[#1a3a22] resize-none" 
                              placeholder="ex: Document généré par SmartStock Pro ERP System"
                              value={localSettings.printFooter}
                              onChange={(e) => handleChange('printFooter', e.target.value)}
                           />
                        </div>
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                           <p className="text-[8px] font-black uppercase text-amber-700 italic flex items-center gap-2">
                              <FileText className="w-3 h-3" /> Ces textes apparaîtront sur tous les PDF et impressions.
                           </p>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="pt-10 border-t border-slate-50 space-y-6">
                  <h3 className="text-xl font-header italic uppercase text-slate-900 border-l-4 border-emerald-500 pl-4">Notifications & Alertes</h3>
                  <div className="flex flex-wrap gap-4">
                    <div className="bg-slate-50 p-6 rounded-3xl flex-1 min-w-[200px] flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-2xl shadow-sm text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all">
                            <Bell className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[11px] font-black uppercase italic text-slate-900 leading-none">Alertes Stock Critique</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1 tracking-widest">Notification push en cas de seuil bas</p>
                          </div>
                      </div>
                      <input 
                        type="checkbox" 
                        className="w-6 h-6 accent-[#1a3a22] cursor-pointer" 
                        checked={localSettings.notificationsEnabled} 
                        onChange={(e) => handleChange('notificationsEnabled', e.target.checked)} 
                      />
                    </div>

                    <div className="bg-slate-50 p-6 rounded-3xl flex-1 min-w-[200px] flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 group-hover:bg-[#1a3a22] group-hover:text-white transition-all">
                            <EyeOff className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[11px] font-black uppercase italic text-slate-900 leading-none">Masquer Données Sensibles</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1 tracking-widest">Cache les prix et valeurs globales</p>
                          </div>
                      </div>
                      <input 
                        type="checkbox" 
                        className="w-6 h-6 accent-[#1a3a22] cursor-pointer" 
                        checked={localSettings.maskSensitiveData} 
                        onChange={(e) => handleChange('maskSensitiveData', e.target.checked)} 
                      />
                    </div>

                    <div className="bg-slate-50 p-6 rounded-3xl flex-1 min-w-[200px] flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 group-hover:bg-[#1a3a22] group-hover:text-white transition-all">
                            <Hash className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[11px] font-black uppercase italic text-slate-900 leading-none">Numérotation Pages</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1 tracking-widest">Affiche "Page X/Y" sur impression</p>
                          </div>
                      </div>
                      <input 
                        type="checkbox" 
                        className="w-6 h-6 accent-[#1a3a22] cursor-pointer" 
                        checked={localSettings.showPageNumbers} 
                        onChange={(e) => handleChange('showPageNumbers', e.target.checked)} 
                      />
                    </div>
                  </div>
               </div>
            </div>

            {/* GESTION DES CATÉGORIES DYNAMIQUE */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8 animate-fade-in">
                <div className="flex items-center gap-4">
                   <div className="p-4 bg-indigo-50 rounded-[1.5rem] text-indigo-600">
                      <Tags className="w-6 h-6" />
                   </div>
                   <div>
                      <h3 className="text-xl font-header italic uppercase">Gestion du Catalogue</h3>
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Contrôle dynamique des catégories de produits</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Ajouter une catégorie</label>
                        <div className="flex gap-2">
                           <input 
                              type="text" 
                              placeholder="ex: CONSOMMABLES TECHNIQUES" 
                              className="flex-1 bg-slate-50 border border-slate-100 p-4 rounded-2xl text-[11px] font-black uppercase outline-none focus:ring-2 focus:ring-indigo-500"
                              value={newCategory}
                              onChange={(e) => setNewCategory(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                           />
                           <button 
                             onClick={addCategory}
                             className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg"
                           >
                              <Plus className="w-5 h-5" />
                           </button>
                        </div>
                      </div>
                      <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100">
                         <p className="text-[9px] font-black text-blue-700 uppercase italic flex items-center gap-2 mb-2">
                           <Box className="w-3 h-3" /> Sauvegarde Automatique
                         </p>
                         <p className="text-[9px] font-bold text-blue-500 uppercase leading-relaxed">
                           Les catégories sont enregistrées instantanément. Elles apparaissent immédiatement dans les listes déroulantes de vos produits.
                         </p>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Catégories Actives ({localSettings.categories.length})</label>
                      <div className="flex flex-wrap gap-2 max-h-[250px] overflow-y-auto p-2 custom-scrollbar border border-slate-50 rounded-2xl">
                         {localSettings.categories.length === 0 ? (
                            <p className="text-[9px] font-black text-slate-300 uppercase italic p-4">Aucune catégorie configurée</p>
                         ) : (
                            localSettings.categories.map(cat => (
                               <div key={cat} className="group flex items-center gap-2 bg-slate-100 hover:bg-white hover:ring-2 hover:ring-indigo-500 px-4 py-2.5 rounded-xl transition-all shadow-sm">
                                  <span className="text-[10px] font-black uppercase text-slate-700">{cat}</span>
                                  <button 
                                    onClick={() => removeCategory(cat)}
                                    className="p-1 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                     <X className="w-3.5 h-3.5" />
                                  </button>
                               </div>
                            ))
                         )}
                      </div>
                   </div>
                </div>
            </div>
          </div>
        )}

        {activeRibbon === 'EXCEL_STYLE' && (
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-12 animate-fade-in">
             <div className="space-y-6">
                <div className="flex items-center gap-3 text-slate-400 mb-4">
                   <Type className="w-5 h-5" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Police & Typographie</span>
                </div>
                <div className="flex flex-wrap gap-6 items-center">
                   <div className="space-y-2 flex-1 min-w-[200px]">
                      <label className="text-[8px] font-black uppercase text-slate-300 ml-1">Famille de police</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-[12px] font-bold outline-none"
                        value={localSettings.printFontFamily}
                        onChange={(e) => handleChange('printFontFamily', e.target.value)}
                      >
                         <option value="Calibri">Calibri (Standard Excel)</option>
                         <option value="Inter">Inter (Moderne)</option>
                         <option value="Plus Jakarta Sans">Plus Jakarta (App Style)</option>
                         <option value="Courier New">Courier New (Monospace)</option>
                      </select>
                   </div>
                   <div className="space-y-2 w-32">
                      <label className="text-[8px] font-black uppercase text-slate-300 ml-1">Taille (pt)</label>
                      <input 
                        type="number" 
                        min="6" max="16" 
                        className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-center text-lg font-header italic outline-none"
                        value={localSettings.printFontSize}
                        onChange={(e) => handleChange('printFontSize', Number(e.target.value))}
                      />
                   </div>
                   <div className="flex items-center gap-4 pt-6">
                      <button 
                        onClick={() => handleChange('printBoldHeaders', !localSettings.printBoldHeaders)}
                        className={`w-12 h-12 rounded-xl border flex items-center justify-center font-black transition-all ${localSettings.printBoldHeaders ? 'bg-[#1a3a22] text-white border-[#1a3a22]' : 'bg-white border-slate-100 text-slate-300'}`}
                      >
                        G
                      </button>
                      <div className="h-10 w-px bg-slate-100" />
                      <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase text-slate-300 ml-1">Padding Cellules</label>
                        <input type="range" min="2" max="16" value={localSettings.printCellPadding} onChange={(e) => handleChange('printCellPadding', Number(e.target.value))} className="w-32 accent-[#1a3a22]" />
                      </div>
                   </div>
                </div>
             </div>

             <div className="space-y-6 pt-10 border-t border-slate-50">
                <div className="flex items-center gap-3 text-slate-400 mb-4">
                   <Palette className="w-5 h-5" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Styles de Cellules & Tableaux</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-6">
                      <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border-l-4 border-emerald-500">
                         <div>
                            <p className="text-[10px] font-black uppercase text-slate-700">Mise en forme conditionnelle</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase italic">Rouge/Vert auto sur impression</p>
                         </div>
                         <input type="checkbox" className="w-5 h-5 accent-emerald-500" checked={localSettings.printConditionalFormatting} onChange={(e) => handleChange('printConditionalFormatting', e.target.checked)} />
                      </div>

                      <div className="space-y-2">
                         <label className="text-[8px] font-black uppercase text-slate-300 ml-1">Couleur de Thème (En-têtes)</label>
                         <div className="flex gap-2">
                            {['#1a3a22', '#1e293b', '#1d4ed8', '#047857', '#b91c1c', '#000000'].map(c => (
                              <button 
                                key={c} 
                                onClick={() => handleChange('printThemeColor', c)} 
                                className={`w-8 h-8 rounded-full border-2 transition-all ${localSettings.printThemeColor === c ? 'border-blue-500 scale-125' : 'border-transparent'}`} 
                                style={{backgroundColor: c}} 
                              />
                            ))}
                         </div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div className="space-y-2">
                         <label className="text-[8px] font-black uppercase text-slate-300 ml-1">Alternance des lignes (Zebra stripes)</label>
                         <div className="flex gap-2">
                            {['#f0fdf4', '#f8fafc', '#f1f5f9', '#fffbeb', '#ffffff'].map(c => (
                              <button 
                                key={c} 
                                onClick={() => handleChange('printStripeColor', c)} 
                                className={`w-10 h-10 rounded-xl border transition-all ${localSettings.printStripeColor === c ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-100'}`} 
                                style={{backgroundColor: c}} 
                              />
                            ))}
                         </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[8px] font-black uppercase text-slate-300 ml-1">Épaisseur des Bordures</label>
                         <div className="flex gap-2">
                            {[0, 1, 2].map(w => (
                              <button 
                                key={w} 
                                onClick={() => handleChange('printBorderWidth', w)}
                                className={`flex-1 py-3 rounded-xl border text-[9px] font-black uppercase tracking-tighter ${localSettings.printBorderWidth === w ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                              >
                                {w === 0 ? 'Aucune' : w === 1 ? 'Fine' : 'Moyenne'}
                              </button>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>
             </div>

             {/* PREVIEW COMPACTE */}
             <div className="pt-10 border-t border-slate-50">
                <p className="text-[9px] font-black uppercase text-slate-300 mb-4 tracking-[0.2em] text-center">Aperçu du Rendu Impression</p>
                <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-inner scale-90 mx-auto max-w-lg origin-center">
                   <table className="w-full" style={{fontFamily: localSettings.printFontFamily, fontSize: `${localSettings.printFontSize}pt`, borderCollapse: 'collapse'}}>
                      <thead>
                         <tr style={{backgroundColor: localSettings.printThemeColor, color: 'white', fontWeight: localSettings.printBoldHeaders ? 'bold' : 'normal'}}>
                            <th style={{border: `${localSettings.printBorderWidth}px solid #333`, padding: `${localSettings.printCellPadding}px`}}>SKU</th>
                            <th style={{border: `${localSettings.printBorderWidth}px solid #333`, padding: `${localSettings.printCellPadding}px`}}>DÉSIGNATION</th>
                            <th style={{border: `${localSettings.printBorderWidth}px solid #333`, padding: `${localSettings.printCellPadding}px`}}>STOCK</th>
                         </tr>
                      </thead>
                      <tbody>
                         <tr>
                            <td style={{border: `${localSettings.printBorderWidth}px solid #ccc`, padding: `${localSettings.printCellPadding}px`}}>S-01</td>
                            <td style={{border: `${localSettings.printBorderWidth}px solid #ccc`, padding: `${localSettings.printCellPadding}px`}}>Exemple Article</td>
                            <td style={{border: `${localSettings.printBorderWidth}px solid #ccc`, padding: `${localSettings.printCellPadding}px`, color: localSettings.printConditionalFormatting ? '#b91c1c' : 'inherit'}}>12 (Critique)</td>
                         </tr>
                         <tr style={{backgroundColor: localSettings.printStripeColor}}>
                            <td style={{border: `${localSettings.printBorderWidth}px solid #ccc`, padding: `${localSettings.printCellPadding}px`}}>S-02</td>
                            <td style={{border: `${localSettings.printBorderWidth}px solid #ccc`, padding: `${localSettings.printCellPadding}px`}}>Second Article</td>
                            <td style={{border: `${localSettings.printBorderWidth}px solid #ccc`, padding: `${localSettings.printCellPadding}px`}}>54</td>
                         </tr>
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}

        {activeRibbon === 'SYSTEM' && (
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8 animate-fade-in">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-100 rounded-2xl">
                   <Database className="w-6 h-6 text-slate-600" />
                </div>
                <h3 className="text-xl font-header italic uppercase">Maintenance & Sauvegarde</h3>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button 
                  onClick={handleExportBackup}
                  className="flex flex-col items-center justify-center gap-4 p-10 rounded-[2.5rem] border border-slate-50 bg-slate-50 hover:bg-slate-100 transition-all group shadow-sm"
                >
                   <Download className="w-10 h-10 text-slate-300 group-hover:text-[#1a3a22] transition-colors" />
                   <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Exporter Sauvegarde (.JSON)</span>
                </button>
                
                <button 
                  onClick={() => confirm("Réinitialisation totale ?") && onResetSystem()}
                  className="flex flex-col items-center justify-center gap-4 p-10 rounded-[2.5rem] border border-rose-50 bg-rose-50 hover:bg-rose-100 transition-all group shadow-sm"
                >
                   <Trash2 className="w-10 h-10 text-rose-200 group-hover:text-rose-600 transition-colors" />
                   <span className="text-[11px] font-black uppercase tracking-widest text-rose-400 italic">RÉINITIALISATION TOTALE</span>
                </button>
             </div>
          </div>
        )}
      </div>

      {/* BOUTON DE SAUVEGARDE FLOTTANT */}
      {hasChanges && (
        <div className="fixed bottom-12 right-12 z-[1000] animate-slide-in no-print">
          <button 
            onClick={handleSave}
            className="flex items-center gap-4 px-10 py-6 bg-[#1a3a22] text-white rounded-[2rem] font-black text-[12px] uppercase tracking-widest shadow-[0_20px_50px_rgba(26,58,34,0.3)] hover:bg-emerald-800 transition-all hover:scale-105 active:scale-95"
          >
            <Save className="w-5 h-5" /> Enregistrer les modifications
          </button>
        </div>
      )}
    </div>
  );
};

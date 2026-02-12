import React, { useState } from 'react';
import { 
  Building2, DollarSign, ShieldAlert, Database, 
  Save, Trash2, Download, RefreshCcw, BellRing,
  MapPin, Globe, List, Plus, Edit3, Check, X
} from 'lucide-react';
import { AppSettings } from './types';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onResetSystem: () => void;
}

export const SettingsView = ({ settings, onUpdateSettings, onResetSystem }: SettingsViewProps) => {
  const [newUnit, setNewUnit] = useState('');
  const [editingUnit, setEditingUnit] = useState<{index: number, value: string} | null>(null);

  const handleChange = (key: keyof AppSettings, value: any) => {
    onUpdateSettings({ ...settings, [key]: value });
  };

  const handleAddUnit = () => {
    if (!newUnit.trim()) return;
    const cleanUnit = newUnit.trim().toUpperCase();
    if (settings.units.includes(cleanUnit)) return alert("Cette unité existe déjà.");
    handleChange('units', [...settings.units, cleanUnit]);
    setNewUnit('');
  };

  const handleRemoveUnit = (unitToRemove: string) => {
    if (confirm(`Supprimer l'unité "${unitToRemove}" ? Cela ne supprimera pas les produits l'utilisant mais ils devront être mis à jour manuellement.`)) {
      handleChange('units', settings.units.filter(u => u !== unitToRemove));
    }
  };

  const handleStartEdit = (index: number, value: string) => {
    setEditingUnit({ index, value });
  };

  const handleSaveEdit = () => {
    if (!editingUnit) return;
    const newUnits = [...settings.units];
    newUnits[editingUnit.index] = editingUnit.value.trim().toUpperCase();
    handleChange('units', newUnits);
    setEditingUnit(null);
  };

  const handleExportBackup = () => {
    const data = localStorage.getItem('ss_products');
    const blob = new Blob([data || '[]'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartstock_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="space-y-10 animate-fade-in pb-32">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* SECTION: Identité Corporate */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 rounded-2xl">
                 <Building2 className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-header italic uppercase">Identité Corporate</h3>
           </div>
           
           <div className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Nom de l'Entreprise</label>
                 <input 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[12px] font-black uppercase italic outline-none focus:ring-2 focus:ring-[#1a3a22]" 
                    value={settings.enterpriseName}
                    onChange={(e) => handleChange('enterpriseName', e.target.value)}
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Identifiant du Site (Location ID)</label>
                 <div className="relative">
                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input 
                       type="text" 
                       className="w-full bg-slate-50 border border-slate-100 pl-12 pr-5 py-5 rounded-2xl text-[12px] font-black uppercase outline-none focus:ring-2 focus:ring-[#1a3a22]" 
                       value={settings.locationId}
                       onChange={(e) => handleChange('locationId', e.target.value)}
                    />
                 </div>
              </div>
           </div>
        </div>

        {/* SECTION: Gestion des Unités */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8 row-span-2">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 rounded-2xl">
                 <List className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-header italic uppercase">Unités de Mesure</h3>
           </div>

           <div className="space-y-6">
              <div className="flex gap-2">
                 <input 
                    type="text" 
                    placeholder="Nouvelle unité (ex: CARTON)..."
                    className="flex-1 bg-slate-50 border border-slate-100 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddUnit()}
                 />
                 <button 
                    onClick={handleAddUnit}
                    className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
                 >
                    <Plus className="w-5 h-5" />
                 </button>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                 {settings.units.map((unit, idx) => (
                    <div key={idx} className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between group hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-100">
                       {editingUnit?.index === idx ? (
                          <div className="flex items-center gap-2 flex-1">
                             <input 
                                type="text"
                                className="flex-1 bg-white border border-indigo-200 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase outline-none"
                                value={editingUnit.value}
                                onChange={(e) => setEditingUnit({...editingUnit, value: e.target.value})}
                                autoFocus
                             />
                             <button onClick={handleSaveEdit} className="p-1.5 bg-emerald-500 text-white rounded-lg">
                               <Check className="w-3.5 h-3.5" />
                             </button>
                             <button onClick={() => setEditingUnit(null)} className="p-1.5 bg-slate-200 text-slate-500 rounded-lg">
                               <X className="w-3.5 h-3.5" />
                             </button>
                          </div>
                       ) : (
                          <>
                             <span className="text-[11px] font-black uppercase italic text-slate-700">{unit}</span>
                             <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                   onClick={() => handleStartEdit(idx, unit)}
                                   className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"
                                >
                                   <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                   onClick={() => handleRemoveUnit(unit)}
                                   className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                >
                                   <Trash2 className="w-3.5 h-3.5" />
                                </button>
                             </div>
                          </>
                       )}
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* SECTION: Configuration Financière */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-2xl">
                 <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-header italic uppercase">Configuration Financière</h3>
           </div>

           <div className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Taux de Change (1$ en Fc)</label>
                 <div className="flex gap-4">
                    <input 
                       type="number" 
                       className="flex-1 bg-slate-50 border border-slate-100 p-5 rounded-2xl text-xl font-header italic outline-none focus:ring-2 focus:ring-[#1a3a22]" 
                       value={settings.exchangeRate}
                       onChange={(e) => handleChange('exchangeRate', Number(e.target.value))}
                    />
                    <div className="bg-slate-900 text-white px-8 flex items-center rounded-2xl text-[10px] font-black uppercase">FC / USD</div>
                 </div>
              </div>
              <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl">
                 <div>
                    <p className="text-[11px] font-black uppercase italic text-slate-700">Devise de valorisation principale</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Utilisée pour les rapports analytiques</p>
                 </div>
                 <div className="flex gap-2">
                    {['Fc', '$'].map((curr) => (
                       <button 
                          key={curr}
                          onClick={() => handleChange('primaryCurrency', curr)}
                          className={`px-6 py-3 rounded-xl text-[10px] font-black transition-all ${settings.primaryCurrency === curr ? 'bg-[#1a3a22] text-white' : 'bg-white border border-slate-100 text-slate-400'}`}
                       >
                          {curr}
                       </button>
                    ))}
                 </div>
              </div>
           </div>
        </div>

        {/* SECTION: Politiques Logistiques */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-50 rounded-2xl">
                 <ShieldAlert className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-header italic uppercase">Politiques Logistiques</h3>
           </div>

           <div className="space-y-6">
              <div className="space-y-2">
                 <div className="flex justify-between items-end mb-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Seuil de Sécurité par Défaut (%)</label>
                    <span className="text-[12px] font-black text-[#1a3a22] italic">{settings.defaultSafetyMargin}%</span>
                 </div>
                 <input 
                    type="range" 
                    min="5" 
                    max="50" 
                    step="5"
                    className="w-full accent-[#1a3a22]" 
                    value={settings.defaultSafetyMargin}
                    onChange={(e) => handleChange('defaultSafetyMargin', Number(e.target.value))}
                 />
                 <p className="text-[8px] font-bold text-slate-300 uppercase italic">
                   Ajuste automatiquement le seuil critique lors de la création d'articles.
                 </p>
              </div>
              
              <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl">
                 <div className="flex items-center gap-4">
                    <BellRing className="w-5 h-5 text-slate-300" />
                    <div>
                       <p className="text-[11px] font-black uppercase italic text-slate-700">Alertes automatiques</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase">Notifications de rupture de stock</p>
                    </div>
                 </div>
                 <div className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={settings.autoBackup} 
                      onChange={(e) => handleChange('autoBackup', e.target.checked)} 
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                 </div>
              </div>
           </div>
        </div>

        {/* SECTION: Maintenance Système */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-100 rounded-2xl">
                 <Database className="w-6 h-6 text-slate-600" />
              </div>
              <h3 className="text-xl font-header italic uppercase">Maintenance Système</h3>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={handleExportBackup}
                className="flex flex-col items-center justify-center gap-4 p-8 rounded-[2rem] border border-slate-50 bg-slate-50 hover:bg-slate-100 transition-all group"
              >
                 <Download className="w-6 h-6 text-slate-400 group-hover:text-[#1a3a22] transition-colors" />
                 <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Exporter Sauvegarde</span>
              </button>
              
              <button 
                onClick={() => {
                   if(confirm("⚠️ RÉINITIALISATION TOTALE : Toutes vos données seront effacées (produits, historique, mobilier, sites, fournisseurs). Cette action est irréversible.")) {
                      onResetSystem();
                   }
                }}
                className="flex flex-col items-center justify-center gap-4 p-8 rounded-[2rem] border border-rose-50 bg-rose-50 hover:bg-rose-100 transition-all group"
              >
                 <Trash2 className="w-6 h-6 text-rose-300 group-hover:text-rose-600 transition-colors" />
                 <span className="text-[9px] font-black uppercase tracking-widest text-rose-400">RÉINITIALISATION COMPLÈTE</span>
              </button>
           </div>
           
           <div className="p-6 bg-slate-900 rounded-[2rem] text-white">
              <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-black uppercase italic">Statut Cloud Sync</span>
                 </div>
                 <span className="text-[8px] font-black bg-emerald-500 px-2 py-0.5 rounded text-white">ACTIF</span>
              </div>
              <p className="text-[9px] font-bold text-white/40 uppercase">
                Dernière synchronisation : Aujourd'hui, {new Date().toLocaleTimeString()}
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};
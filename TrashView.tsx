
import React from 'react';
import { Trash2, RotateCcw, AlertTriangle, Box, Lamp } from 'lucide-react';
import { Product, Furniture } from './types';
import { Badge } from './Badge';

interface TrashViewProps {
  products: Product[];
  furniture: Furniture[];
  onRestoreProduct: (id: string) => void;
  onDeleteProduct: (id: string) => void;
  onRestoreFurniture: (id: string) => void;
  onDeleteFurniture: (id: string) => void;
}

export const TrashView = ({ 
  products, 
  furniture, 
  onRestoreProduct, 
  onDeleteProduct, 
  onRestoreFurniture, 
  onDeleteFurniture 
}: TrashViewProps) => {
  const isEmpty = products.length === 0 && furniture.length === 0;

  return (
    <div className="space-y-10 animate-fade-in pb-32">
      <div className="bg-slate-900 p-12 rounded-[4rem] text-white flex items-center justify-between shadow-2xl">
         <div>
            <h3 className="text-3xl font-header italic uppercase">Corbeille de Sécurité</h3>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mt-2 italic">
               Les éléments supprimés sont conservés ici pour éviter toute perte de données accidentelle.
            </p>
         </div>
         <Trash2 className="w-16 h-16 text-slate-700" />
      </div>

      {isEmpty ? (
        <div className="py-40 text-center opacity-20">
           <Trash2 className="w-24 h-24 mx-auto mb-6" />
           <p className="text-xl font-header italic uppercase">La corbeille est vide</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* ARCHIVE CONSOMMABLES */}
          <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
             <h4 className="text-[11px] font-black uppercase text-slate-400 mb-8 flex items-center gap-3">
                <Box className="w-4 h-4" /> Consommables Archive ({products.length})
             </h4>
             <div className="space-y-4">
                {products.map(p => (
                   <div key={p.id} className="bg-slate-50 p-6 rounded-3xl flex items-center justify-between group hover:bg-slate-100 transition-all">
                      <div>
                         <p className="text-[12px] font-black uppercase italic text-slate-900">{p.name}</p>
                         <p className="text-[8px] font-bold text-slate-400 uppercase italic mt-1">ID: {p.id}</p>
                      </div>
                      <div className="flex gap-2">
                         <button onClick={() => onRestoreProduct(p.id)} className="p-3 bg-white text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                            <RotateCcw className="w-4 h-4" />
                         </button>
                         <button onClick={() => confirm("Supprimer définitivement ?") && onDeleteProduct(p.id)} className="p-3 bg-white text-rose-300 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-all shadow-sm">
                            <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                   </div>
                ))}
                {products.length === 0 && <p className="text-center text-[9px] font-black text-slate-300 italic">Aucun consommable archivé</p>}
             </div>
          </div>

          {/* ARCHIVE MOBILIER */}
          <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
             <h4 className="text-[11px] font-black uppercase text-slate-400 mb-8 flex items-center gap-3">
                <Lamp className="w-4 h-4" /> Mobilier Archive ({furniture.length})
             </h4>
             <div className="space-y-4">
                {furniture.map(f => (
                   <div key={f.id} className="bg-slate-50 p-6 rounded-3xl flex items-center justify-between group hover:bg-slate-100 transition-all">
                      <div>
                         <p className="text-[12px] font-black uppercase italic text-slate-900">{f.name}</p>
                         <p className="text-[8px] font-bold text-slate-400 uppercase italic mt-1">CODE: {f.code}</p>
                      </div>
                      <div className="flex gap-2">
                         <button onClick={() => onRestoreFurniture(f.id)} className="p-3 bg-white text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                            <RotateCcw className="w-4 h-4" />
                         </button>
                         <button onClick={() => confirm("Supprimer définitivement ?") && onDeleteFurniture(f.id)} className="p-3 bg-white text-rose-300 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-all shadow-sm">
                            <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                   </div>
                ))}
                {furniture.length === 0 && <p className="text-center text-[9px] font-black text-slate-300 italic">Aucun mobilier archivé</p>}
             </div>
          </div>
        </div>
      )}

      <div className="bg-amber-50 p-8 rounded-[3rem] border border-amber-100 flex items-center gap-6">
         <AlertTriangle className="w-8 h-8 text-amber-500" />
         <p className="text-[10px] font-black uppercase text-amber-900 leading-relaxed italic">
            Attention : La suppression définitive dans ce module est irréversible et effacera toutes les traces de l'élément dans les registres d'inventaire actifs.
         </p>
      </div>
    </div>
  );
};

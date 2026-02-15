
import React, { useState } from 'react';
import { ClipboardList, Play, Info, AlertCircle, CheckCircle2, FileText, Zap } from 'lucide-react';
import { Site, Product, AppSettings } from './types';

interface AutomatedImportViewProps {
  sites: Site[];
  settings: AppSettings;
  onImportProducts: (products: Product[]) => void;
  notify: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const AutomatedImportView = ({ sites, settings, onImportProducts, notify }: AutomatedImportViewProps) => {
  const [importText, setImportText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!importText.trim()) return notify("Veuillez coller des données à analyser.", "warning");
    if (sites.length === 0) return notify("Veuillez d'abord configurer un site logistique.", "error");

    setIsAnalyzing(true);
    
    // Simulation d'un délai de calcul pour l'effet "Moteur"
    await new Promise(resolve => setTimeout(resolve, 1500));

    const lines = importText.split('\n').filter(line => line.trim().includes(';'));
    const newProducts: Product[] = [];
    let errors = 0;

    const targetSiteId = sites[0].id; // Par défaut sur le premier site

    lines.forEach(line => {
      const parts = line.split(';').map(p => p.trim());
      
      // Format attendu: Nom;Quantité;Prix;Catégorie;Unité
      if (parts.length >= 2) {
        const name = parts[0].toUpperCase();
        const initialStock = Number(parts[1]) || 0;
        const unitPrice = Number(parts[2]) || 0;
        const category = parts[3] || settings.categories[0] || "Autre";
        const unit = parts[4] || settings.units[0] || "PIÈCE";

        newProducts.push({
          id: `IMP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          name,
          category,
          currentStock: initialStock,
          minStock: Math.floor(initialStock * 0.2), // Suggestion auto
          targetStock: Math.floor(initialStock * 1.5), // Suggestion auto
          monthlyNeed: Math.floor(initialStock * 0.5),
          unit,
          unitPrice,
          currency: 'Fc',
          siteId: targetSiteId,
          lastInventoryDate: new Date().toISOString()
        });
      } else {
        errors++;
      }
    });

    if (newProducts.length > 0) {
      onImportProducts(newProducts);
      notify(`${newProducts.length} articles analysés et ajoutés au stock.`, "success");
      setImportText('');
    } else {
      notify("Format invalide. Utilisez le point-virgule (;) comme séparateur.", "error");
    }

    setIsAnalyzing(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-32">
      {/* Badge de statut du moteur déplacé ici pour plus de discrétion */}
      <div className="flex items-center gap-2 px-6">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Moteur algorithmique opérationnel</p>
      </div>

      <div className="bg-white rounded-[3.5rem] shadow-xl border border-slate-100 overflow-hidden min-h-[500px] flex flex-col items-center justify-center p-12">
        <div className="w-full max-w-4xl space-y-10">
          <div className="flex items-center gap-6">
            <div className="p-6 bg-blue-50 rounded-[2rem] text-blue-600 shadow-inner">
               <ClipboardList className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-header italic uppercase text-slate-900">Console de traitement</h3>
              <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest mt-1">
                Collez vos données brutes séparées par des points-virgules (Nom ; Quantité ; Prix...).
              </p>
            </div>
          </div>

          <div className="relative group">
            <textarea
              className="w-full h-[350px] bg-slate-50 border border-slate-100 rounded-[2.5rem] p-10 font-mono text-[13px] text-slate-600 outline-none focus:ring-4 focus:ring-blue-100 transition-all resize-none shadow-inner"
              placeholder={`Exemple de format :\nCoca-Cola 33cl;50;1500;Boisson;pces\nFarine de blé 25kg;10;45000;Alimentaire;sac`}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
            <div className="absolute bottom-8 right-8 flex items-center gap-3 opacity-40 group-focus-within:opacity-100 transition-opacity">
              <Zap className="w-4 h-4 text-blue-500" />
              <span className="text-[9px] font-black uppercase text-slate-400">Analyse syntaxique active</span>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className={`flex items-center gap-4 px-12 py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl transition-all ${
                isAnalyzing ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-[#0f172a] text-white hover:bg-black hover:scale-105 active:scale-95'
              }`}
            >
              {isAnalyzing ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
              {isAnalyzing ? "Analyse en cours..." : "Analyser le texte"}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-8 rounded-[2.5rem] border border-blue-100 flex items-center gap-6 opacity-80">
        <Info className="w-6 h-6 text-blue-400" />
        <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest leading-loose">
          <b>Conseil Expert :</b> Le moteur détecte automatiquement le nom et la quantité. Le prix, la catégorie et l'unité sont optionnels mais recommandés pour un inventaire complet.
        </p>
      </div>
    </div>
  );
};

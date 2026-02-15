
import React, { useState, useEffect } from 'react';
import { Terminal, Play, ShieldAlert, Activity, FileText, Cpu, ChevronRight, Zap } from 'lucide-react';
import { Product, InventoryLog, Site, AppSettings } from './types';
import { getAutomatedAnalysis } from './services/analysisService';
import { Badge } from './Badge';

interface AnalyticsViewProps {
  products: Product[];
  history: InventoryLog[];
  sites: Site[];
  settings: AppSettings;
}

export const AnalyticsView = ({ products, history, sites, settings }: AnalyticsViewProps) => {
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-8));
  };

  const runAnalysis = async () => {
    setIsAnalysing(true);
    setReport(null);
    setLogs([]);
    
    addLog("Initialisation du moteur d'analyse JS...");
    await new Promise(r => setTimeout(r, 600));
    
    addLog("Chargement des datasets : " + products.length + " SKU détectés.");
    await new Promise(r => setTimeout(r, 400));
    
    addLog("Calcul des corrélations de flux (Entrées vs Sorties)...");
    await new Promise(r => setTimeout(r, 500));
    
    addLog("Évaluation des risques de rupture par site...");
    await new Promise(r => setTimeout(r, 300));

    const result = await getAutomatedAnalysis(products, history);
    setReport(result);
    setIsAnalysing(false);
    addLog("Analyse terminée avec succès.");
  };

  return (
    <div className="space-y-10 animate-fade-in">
      {/* HEADER TECHNIQUE COMPACT */}
      <div className="bg-[#0f172a] p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] -mr-20 -mt-20 group-hover:bg-emerald-500/20 transition-all duration-1000" />
         
         <div className="relative z-10 flex flex-wrap items-center justify-between gap-10">
            <div className="flex items-center gap-6">
               <div className="p-6 bg-emerald-500/20 rounded-[2.5rem] border border-emerald-500/30 text-emerald-400">
                  <Cpu className="w-10 h-10" />
               </div>
               <div>
                  <h3 className="text-3xl font-header italic uppercase leading-none tracking-tight">Moteur Algorithmique v2.5</h3>
                  <p className="text-[10px] font-black uppercase text-slate-400 mt-2 tracking-[0.3em] flex items-center gap-2">
                     <Zap className="w-3 h-3 text-emerald-500" /> Diagnostic Scripting JS & Python Logic (No-AI)
                  </p>
               </div>
            </div>
            
            <button 
              onClick={runAnalysis}
              disabled={isAnalysing}
              className={`flex items-center gap-4 px-12 py-7 rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.2em] shadow-2xl transition-all ${
                isAnalysing 
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-105 active:scale-95'
              }`}
            >
               {isAnalysing ? (
                 <Activity className="w-6 h-6 animate-spin" />
               ) : (
                 <Play className="w-6 h-6" />
               )}
               {isAnalysing ? 'Traitement en cours...' : 'Lancer l\'audit algorithmique'}
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         {/* CONSOLE DE LOGS */}
         <div className="lg:col-span-4 bg-[#0f172a] p-8 rounded-[3rem] border border-white/5 shadow-xl">
            <h4 className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-6 flex items-center gap-2">
               <Terminal className="w-4 h-4" /> Console d'exécution
            </h4>
            <div className="space-y-3 font-mono text-[10px] leading-relaxed">
               {logs.length === 0 ? (
                 <p className="text-slate-600 italic">Moteur prêt. En attente d'instruction...</p>
               ) : (
                 logs.map((log, i) => (
                   <p key={i} className="text-slate-300">
                      <span className="text-emerald-500/50 mr-2">»</span> {log}
                   </p>
                 ))
               )}
               {isAnalysing && (
                 <div className="pt-2">
                    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 animate-[loading_2s_ease-in-out_infinite]" style={{width: '30%'}} />
                    </div>
                 </div>
               )}
            </div>
         </div>

         {/* RAPPORT DE SORTIE */}
         <div className="lg:col-span-8 bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm min-h-[500px] relative overflow-hidden">
            <div className="flex justify-between items-center mb-10">
               <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-3">
                  <FileText className="w-5 h-5" /> Rapport Diagnostique Brut
               </h4>
               {report && <Badge variant="success">Code 200: OK</Badge>}
            </div>

            {!report && !isAnalysing ? (
              <div className="h-[400px] flex flex-col items-center justify-center text-center opacity-20">
                 <ShieldAlert className="w-20 h-20 mb-6 text-slate-300" />
                 <p className="text-xl font-header italic uppercase text-slate-400">En attente de traitement algorithmique</p>
                 <p className="text-[10px] font-black uppercase mt-2">Cliquez sur le bouton ci-dessus pour lancer l'analyse</p>
              </div>
            ) : isAnalysing ? (
              <div className="h-[400px] flex flex-col items-center justify-center text-center">
                 <div className="relative">
                    <div className="w-24 h-24 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
                    <Cpu className="w-8 h-8 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                 </div>
                 <p className="text-[11px] font-black uppercase mt-8 text-slate-400 animate-pulse tracking-widest">Génération du rapport déterministe...</p>
              </div>
            ) : (
              <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 font-mono text-[12px] leading-loose text-slate-700 overflow-x-auto animate-fade-in shadow-inner">
                 <pre className="whitespace-pre-wrap">{report}</pre>
              </div>
            )}
            
            {report && (
              <div className="mt-10 flex gap-4 no-print">
                 <button 
                   onClick={() => window.print()}
                   className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg"
                 >
                    Exporter PDF
                 </button>
                 <div className="flex-1" />
                 <div className="flex items-center gap-3 text-slate-300 italic text-[10px] font-bold uppercase">
                    <ChevronRight className="w-4 h-4" /> Analyse logicielle certifiée
                 </div>
              </div>
            )}
         </div>
      </div>
    </div>
  );
};

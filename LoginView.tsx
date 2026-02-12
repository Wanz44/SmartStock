
import React from 'react';
import { Activity, ShieldCheck, ArrowRight } from 'lucide-react';

interface LoginViewProps {
  enterpriseName: string;
  onLogin: () => void;
}

export const LoginView = ({ enterpriseName, onLogin }: LoginViewProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a3a22] p-6 relative overflow-hidden">
      {/* Éléments décoratifs en arrière-plan */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-400/5 rounded-full blur-[120px]" />
      
      <div className="bg-white w-full max-w-md rounded-[4rem] p-12 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] animate-fade-in relative z-10 border border-white/20">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
            <Activity className="w-10 h-10 text-[#1a3a22]" />
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter uppercase text-[#1a3a22] leading-tight">
            {enterpriseName}
          </h1>
          <div className="flex items-center justify-center gap-2 mt-3">
             <div className="h-px w-8 bg-slate-100" />
             <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Accès Sécurisé</p>
             <div className="h-px w-8 bg-slate-100" />
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center gap-4">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Session Administrateur</p>
              <p className="text-[11px] font-bold text-slate-700 italic">Authentification Locale Active</p>
            </div>
          </div>

          <div className="space-y-6">
            <button 
              onClick={onLogin} 
              className="group w-full bg-[#1a3a22] text-white py-7 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-900 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              Lancer la plateforme <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <div className="text-center">
              <p className="text-[12px] font-header italic text-slate-500 tracking-tight">
                By <span className="text-[#1a3a22] font-black">Bereckya MAYELE</span> logistics
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center border-t border-slate-50 pt-8">
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-300">
            SmartStock Pro Hub - Enterprise Edition
          </p>
        </div>
      </div>
      
      {/* Micro-points de fond */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
    </div>
  );
};

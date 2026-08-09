import React from 'react';
import { Target, Sparkles, FileSearch, ArrowRight, ShieldCheck, Cpu, LineChart } from 'lucide-react';

interface HeroProps {
  onStartUpload: () => void;
  onSelectSampleRole?: (roleId: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onStartUpload }) => {
  return (
    <div className="relative overflow-hidden bg-slate-950 text-white pt-12 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/3 right-10 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        
        {/* Tagline Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-cyan-300 text-xs font-semibold tracking-wide shadow-inner mb-6 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>An AI Career Platform by PMK</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight mb-6">
          RoleReady <span className="text-cyan-400">AI</span> <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-300 bg-clip-text text-transparent text-2xl sm:text-4xl">
            An AI Career Platform by PMK
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8">
          Upload your PDF resume, choose your target role, and get deep AI analysis—including skill gap radar, quantified bullet rewrites, actionable roadmaps, and custom interview prep.
        </p>

        {/* CTA Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <button
            onClick={onStartUpload}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-xl shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <FileSearch className="w-5 h-5 text-indigo-200" />
            <span>Analyze My Resume</span>
            <ArrowRight className="w-5 h-5 text-indigo-200" />
          </button>
        </div>

        {/* Trust Points */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center justify-center gap-2 py-1">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span>Gemini 3.6 Deep Engine</span>
          </div>
          <div className="flex items-center justify-center gap-2 py-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>100% PDF Text Extraction</span>
          </div>
          <div className="flex items-center justify-center gap-2 py-1">
            <Target className="w-4 h-4 text-blue-400" />
            <span>Role Alignment Score</span>
          </div>
          <div className="flex items-center justify-center gap-2 py-1">
            <LineChart className="w-4 h-4 text-purple-400" />
            <span>Actionable Growth Plan</span>
          </div>
        </div>

      </div>
    </div>
  );
};

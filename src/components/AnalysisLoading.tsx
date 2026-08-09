import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles, CheckCircle2, Cpu, FileSearch, ShieldCheck } from 'lucide-react';

interface AnalysisLoadingProps {
  targetRole: string;
}

export const AnalysisLoading: React.FC<AnalysisLoadingProps> = ({ targetRole }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    'Parsing PDF text layout and structure...',
    `Extracting core skills, frameworks, and experience metrics...`,
    `Comparing resume against modern ${targetRole} market requirements...`,
    'Generating quantified bullet point optimizations (STAR format)...',
    'Building 30-60-90 day career roadmap & tailored interview prep...',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1800);

    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-2xl relative overflow-hidden my-8">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Animated icon */}
        <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-400 opacity-30 blur-md animate-pulse"></div>
          <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-indigo-500/30 flex items-center justify-center text-indigo-400 relative shadow-xl">
            <Sparkles className="w-8 h-8 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
          Generating Career Intelligence Lens
        </h3>
        <p className="text-sm text-indigo-300 mb-8 font-medium">
          Evaluating role match for <span className="text-white font-bold">&quot;{targetRole}&quot;</span>
        </p>

        {/* Step Indicators */}
        <div className="w-full max-w-md space-y-3 text-left mb-8">
          {steps.map((step, idx) => {
            const isDone = idx < currentStep;
            const isCurrent = idx === currentStep;

            return (
              <div
                key={idx}
                className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs transition-all ${
                  isCurrent
                    ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200 font-semibold shadow-md'
                    : isDone
                    ? 'bg-slate-950/40 border-slate-800 text-slate-400'
                    : 'bg-slate-950/20 border-slate-850 text-slate-600'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                )}
                <span className="truncate">{step}</span>
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-md bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
          <div
            className="bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 h-full transition-all duration-500"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          ></div>
        </div>

        <p className="text-[11px] text-slate-400 mt-4">
          Powered by Gemini 3.6 Flash • Processing inline data securely
        </p>
      </div>
    </div>
  );
};

import React from 'react';
import { Upload, Briefcase, BarChart3 } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Upload PDF Resume',
      desc: 'Drag & drop your PDF resume or try our pre-loaded tech resumes. Text is parsed cleanly.',
      icon: Upload,
      color: 'from-indigo-500/20 to-indigo-600/10 text-indigo-400 border-indigo-500/30',
    },
    {
      num: '02',
      title: 'Select Target Role',
      desc: 'Choose from Software Engineer, Full-Stack, AI/ML, Data Scientist, Data Analyst, or custom roles.',
      icon: Briefcase,
      color: 'from-blue-500/20 to-blue-600/10 text-blue-400 border-blue-500/30',
    },
    {
      num: '03',
      title: 'Get AI Intelligence',
      desc: 'Receive match score, skill radar, bullet point rewrites, career roadmap & interview strategy.',
      icon: BarChart3,
      color: 'from-cyan-500/20 to-cyan-600/10 text-cyan-400 border-cyan-500/30',
    },
  ];

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-900 border-b border-slate-800">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">How RoleReady AI Works</h2>
          <p className="text-sm text-slate-400 mt-2">Three simple steps to unlock personalized AI career coaching</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div 
                key={step.num}
                className="relative bg-slate-950/80 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all shadow-md group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} border flex items-center justify-center shadow-inner`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-2xl font-black text-slate-700 group-hover:text-slate-500 transition-colors">
                    {step.num}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

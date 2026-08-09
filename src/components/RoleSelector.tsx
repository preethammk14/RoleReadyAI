import React from 'react';
import { Target, Code, Layers, Cpu, Database, BarChart, PlusCircle, UserCheck, Globe } from 'lucide-react';
import { TargetRole, ExperienceLevel, TargetCountry } from '../types';

interface RoleSelectorProps {
  selectedRole: TargetRole;
  customRole: string;
  selectedLevel: ExperienceLevel;
  selectedCountry: TargetCountry;
  onSelectRole: (role: TargetRole) => void;
  onChangeCustomRole: (val: string) => void;
  onSelectLevel: (level: ExperienceLevel) => void;
  onSelectCountry: (country: TargetCountry) => void;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  selectedRole,
  customRole,
  selectedLevel,
  selectedCountry,
  onSelectRole,
  onChangeCustomRole,
  onSelectLevel,
  onSelectCountry,
}) => {
  const roles: { id: TargetRole; name: string; desc: string; icon: any; color: string }[] = [
    {
      id: 'Software Engineer',
      name: 'Software Engineer',
      desc: 'Core backend, algorithms, distributed systems & clean architecture',
      icon: Code,
      color: 'from-blue-500/20 to-indigo-500/10 text-blue-400 border-blue-500/30',
    },
    {
      id: 'Full-Stack Developer',
      name: 'Full-Stack Developer',
      desc: 'End-to-end web apps, React/Next.js, Node.js, databases & APIs',
      icon: Layers,
      color: 'from-indigo-500/20 to-purple-500/10 text-indigo-400 border-indigo-500/30',
    },
    {
      id: 'AI/ML Engineer',
      name: 'AI/ML Engineer',
      desc: 'LLMs, PyTorch, RAG architectures, model fine-tuning & ML pipelines',
      icon: Cpu,
      color: 'from-cyan-500/20 to-emerald-500/10 text-cyan-400 border-cyan-500/30',
    },
    {
      id: 'Data Scientist',
      name: 'Data Scientist',
      desc: 'Predictive modeling, statistical analysis, Python, SQL & ML models',
      icon: Database,
      color: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30',
    },
    {
      id: 'Data Analyst',
      name: 'Data Analyst',
      desc: 'SQL, Tableau/Power BI, metric dashboards & business intelligence',
      icon: BarChart,
      color: 'from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/30',
    },
    {
      id: 'Custom',
      name: 'Other / Custom Role',
      desc: 'Specify a custom target role (e.g. DevOps, Cloud Architect, PM)',
      icon: PlusCircle,
      color: 'from-slate-700/40 to-slate-800/40 text-slate-300 border-slate-700',
    },
  ];

  const levels: ExperienceLevel[] = [
    'Entry-Level / Junior (0-2 yrs)',
    'Mid-Level (2-5 yrs)',
    'Senior Level (5-8 yrs)',
    'Lead / Staff / Executive (8+ yrs)',
  ];

  const countries: { id: TargetCountry; label: string; flag: string; currency: string }[] = [
    { id: 'United States', label: 'United States', flag: '🇺🇸', currency: 'USD ($)' },
    { id: 'India', label: 'India', flag: '🇮🇳', currency: 'INR (₹)' },
    { id: 'United Kingdom', label: 'United Kingdom', flag: '🇬🇧', currency: 'GBP (£)' },
    { id: 'Canada', label: 'Canada', flag: '🇨🇦', currency: 'CAD (C$)' },
    { id: 'Germany / Europe', label: 'Germany / Europe', flag: '🇩🇪', currency: 'EUR (€)' },
    { id: 'Australia', label: 'Australia', flag: '🇦🇺', currency: 'AUD (A$)' },
    { id: 'Singapore', label: 'Singapore', flag: '🇸🇬', currency: 'SGD (S$)' },
    { id: 'Remote / Global', label: 'Remote / Global', flag: '🌐', currency: 'Global' },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 space-y-6">
      
      {/* Target Role Header */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Step 2: Select Target Role & Market</h3>
            <p className="text-xs text-slate-400">Choose target role, career level, and job market for localized evaluation</p>
          </div>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;

            return (
              <button
                key={role.id}
                type="button"
                onClick={() => onSelectRole(role.id)}
                className={`flex flex-col text-left p-4 rounded-xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-indigo-950/60 border-indigo-500 shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${role.color} border flex items-center justify-center`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    isSelected ? 'border-indigo-400 bg-indigo-500' : 'border-slate-700'
                  }`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                  </div>
                </div>
                <h4 className="font-bold text-sm text-white mb-1">{role.name}</h4>
                <p className="text-xs text-slate-400 leading-snug">{role.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Custom Role Input */}
        {selectedRole === 'Custom' && (
          <div className="mt-4 p-3.5 rounded-xl bg-slate-950 border border-indigo-500/40 animate-fade-in">
            <label className="block text-xs font-semibold text-indigo-300 mb-1.5">
              Type Custom Target Role Name:
            </label>
            <input
              type="text"
              value={customRole}
              onChange={(e) => onChangeCustomRole(e.target.value)}
              placeholder="e.g., DevOps Engineer, Mobile iOS Developer, Solutions Architect"
              className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Target Job Market / Country */}
      <div className="pt-4 border-t border-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-slate-300">Target Job Market & Country:</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {countries.map((c) => {
            const isSelected = selectedCountry === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectCountry(c.id)}
                className={`flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-md'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-slate-100'
                }`}
              >
                <span className="flex items-center gap-1.5 truncate">
                  <span>{c.flag}</span>
                  <span className="truncate">{c.label}</span>
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ml-1 shrink-0 ${
                  isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-900 text-slate-400'
                }`}>
                  {c.currency}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Target Experience Level */}
      <div className="pt-4 border-t border-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <UserCheck className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-slate-300">Target Experience Tier:</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {levels.map((lvl) => {
            const isSelected = selectedLevel === lvl;
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => onSelectLevel(lvl)}
                className={`px-3 py-2 text-xs font-medium rounded-xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-md'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {lvl}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};

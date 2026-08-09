import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { 
  CheckCircle2, AlertTriangle, ArrowRight, Award, Zap, BookOpen, 
  Sparkles, Download, RefreshCw, Layers, CheckSquare, Square, 
  HelpCircle, TrendingUp, DollarSign, MapPin, MessageSquareText,
  Briefcase, Code2, Cpu, Wrench, ShieldCheck, Globe, FolderPlus, Check, Loader2
} from 'lucide-react';
import { AnalysisResult, ResumeData, User } from '../types';
import { AiAssistantChat } from './AiAssistantChat';

interface ResultsDashboardProps {
  analysis: AnalysisResult;
  targetRole: string;
  targetCountry?: string;
  resumeData: ResumeData | null;
  onReset: () => void;
  activeTabOverride?: 'overview' | 'roadmap' | 'bullets' | 'interview' | 'chat';
  user?: User | null;
  token?: string | null;
  onOpenAuth?: () => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  analysis,
  targetRole,
  targetCountry = 'United States',
  resumeData,
  onReset,
  activeTabOverride,
  user,
  token,
  onOpenAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'roadmap' | 'bullets' | 'interview' | 'chat'>(
    activeTabOverride || 'overview'
  );

  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  React.useEffect(() => {
    if (activeTabOverride) {
      setActiveTab(activeTabOverride);
    }
  }, [activeTabOverride]);

  const handleSaveToAccount = async () => {
    if (!user || !token) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    setSaveLoading(true);
    try {
      const res = await fetch('/api/analyses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: `${targetRole} Analysis (${targetCountry})`,
          targetRole,
          targetCountry,
          overallScore: analysis.overallScore,
          matchCategory: analysis.matchCategory,
          resumeData,
          analysisData: analysis,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save analysis.');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      alert(err.message || 'Error saving analysis.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();
      let y = 15;

      // Header title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(30, 41, 59);
      doc.text('RoleReady AI by PMK — Career Intelligence Report', 14, y);
      y += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Target Role: ${targetRole}  |  Market: ${targetCountry}  |  Generated: ${new Date().toLocaleDateString()}`, 14, y);
      y += 8;

      doc.setDrawColor(226, 232, 240);
      doc.line(14, y, 196, y);
      y += 10;

      // Score
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text(`Overall Role Alignment: ${analysis.overallScore}% (${analysis.matchCategory})`, 14, y);
      y += 8;

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      const headlineLines = doc.splitTextToSize(`"${analysis.headline}"`, 180);
      doc.text(headlineLines, 14, y);
      y += headlineLines.length * 5 + 6;

      // Summary
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      const summaryLines = doc.splitTextToSize(analysis.summary, 180);
      doc.text(summaryLines, 14, y);
      y += summaryLines.length * 4.5 + 8;

      // Confirmed Resume Skills
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('Confirmed Resume Technical Skills:', 14, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      const matchedText = analysis.skillsAnalysis.matchedTechnicalSkills.join(', ') || 'None identified';
      const matchedLines = doc.splitTextToSize(matchedText, 180);
      doc.text(matchedLines, 14, y);
      y += matchedLines.length * 4.5 + 8;

      // Missing Skill Gaps
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Missing Technical Skills to Bridge:', 14, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      const missingText = analysis.skillsAnalysis.missingTechnicalSkills.join(', ') || 'No critical gaps!';
      const missingLines = doc.splitTextToSize(missingText, 180);
      doc.text(missingLines, 14, y);
      y += missingLines.length * 4.5 + 10;

      // STAR Resume Bullet Rewrites
      if (y > 240) {
        doc.addPage();
        y = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('STAR Method Resume Bullet Rewrites:', 14, y);
      y += 8;

      (analysis.resumeOptimization.bulletFixes || []).forEach((fix, idx) => {
        if (y > 240) {
          doc.addPage();
          y = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.text(`Bullet Point #${idx + 1}:`, 14, y);
        y += 5;

        doc.setFont('helvetica', 'normal');
        const origLines = doc.splitTextToSize(`Original: ${fix.originalContext}`, 175);
        doc.text(origLines, 18, y);
        y += origLines.length * 4.5 + 2;

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(16, 185, 129); // green
        const sugLines = doc.splitTextToSize(`STAR Improvement: ${fix.suggestedImprovement}`, 175);
        doc.text(sugLines, 18, y);
        doc.setTextColor(51, 65, 85);
        y += sugLines.length * 4.5 + 6;
      });

      doc.save(`RoleReady_AI_Career_Report_${targetRole.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Error generating PDF report. Please try again.');
    }
  };


  React.useEffect(() => {
    if (activeTabOverride) {
      setActiveTab(activeTabOverride);
    }
  }, [activeTabOverride]);
  
  // Local state for checking off roadmap items
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({});

  const toggleAction = (key: string) => {
    setCompletedActions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return { text: 'text-emerald-400', border: 'border-emerald-500', bg: 'bg-emerald-500/10' };
    if (score >= 65) return { text: 'text-indigo-400', border: 'border-indigo-500', bg: 'bg-indigo-500/10' };
    if (score >= 50) return { text: 'text-amber-400', border: 'border-amber-500', bg: 'bg-amber-500/10' };
    return { text: 'text-rose-400', border: 'border-rose-500', bg: 'bg-rose-500/10' };
  };

  const scoreStyle = getScoreColor(analysis.overallScore);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-100">
      
      {/* 1. Header Score & Executive Summary Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        {/* Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8 relative z-10">
          
          {/* Score Circle Gauge */}
          <div className="flex flex-col items-center shrink-0">
            <div className={`relative w-36 h-36 rounded-full border-4 ${scoreStyle.border} ${scoreStyle.bg} flex items-center justify-center shadow-xl shadow-slate-950/50`}>
              <div className="text-center">
                <span className={`text-4xl sm:text-5xl font-black ${scoreStyle.text}`}>
                  {analysis.overallScore}
                </span>
                <span className="text-xs font-bold text-slate-400 block mt-0.5">/ 100 FIT</span>
              </div>
            </div>

            <span className={`mt-3 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide border ${scoreStyle.border} ${scoreStyle.bg} ${scoreStyle.text}`}>
              {analysis.matchCategory}
            </span>
          </div>

          {/* Headline & Summary */}
          <div className="flex-1 text-center lg:text-left">
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-3">
              <span className="px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                Target Role: {targetRole}
              </span>
              {targetCountry && (
                <span className="px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  Market: {targetCountry}
                </span>
              )}
              <span className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium">
                📄 {resumeData?.fileName || 'Uploaded Resume'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white leading-tight mb-3">
              {analysis.headline}
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6">
              {analysis.summary}
            </p>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
              <button
                onClick={() => setActiveTab('chat')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <MessageSquareText className="w-4 h-4" />
                <span>Ask AI Assistant</span>
              </button>

              <button
                onClick={handleSaveToAccount}
                disabled={saveLoading}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm border transition-all cursor-pointer ${
                  saveSuccess
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-cyan-950/60 hover:bg-cyan-900/80 border-cyan-500/40 text-cyan-300 shadow-md'
                }`}
              >
                {saveLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    <span>Saving...</span>
                  </>
                ) : saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Saved to Account!</span>
                  </>
                ) : (
                  <>
                    <FolderPlus className="w-4 h-4 text-cyan-400" />
                    <span>{user ? 'Save Report to Account' : 'Sign In to Save'}</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadPDF}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm border border-slate-700 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-400" />
                <span>Download PDF Report</span>
              </button>

              <button
                onClick={onReset}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs sm:text-sm border border-slate-700 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-slate-400" />
                <span>Re-Analyze</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'overview', label: 'Match Overview & Skills', icon: Award },
          { id: 'roadmap', label: 'Career Growth Roadmap', icon: TrendingUp },
          { id: 'bullets', label: 'Resume Rewrites (STAR)', icon: Zap },
          { id: 'interview', label: 'Interview Prep & Market', icon: BookOpen },
          { id: 'chat', label: 'Ask RoleReady AI', icon: MessageSquareText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. TAB CONTENT */}

      {/* TAB 1: OVERVIEW & SKILLS */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Strengths & Gaps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Strengths */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-4 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="font-bold text-white text-base">Key Core Strengths</h3>
              </div>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
                {analysis.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Gaps */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-4 text-amber-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-white text-base">Critical Skill Gaps</h3>
              </div>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
                {analysis.gaps.map((gap, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0"></span>
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Skill Breakdown Categories */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Code2 className="w-5 h-5 text-indigo-400" />
              <span>Detailed Skill Alignment Matrix</span>
            </h3>

            {/* Skill Category Progress Bars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {analysis.skillsAnalysis.skillScores.map((sc, idx) => (
                <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs font-semibold mb-2">
                    <span className="text-slate-200">{sc.category}</span>
                    <span className="text-indigo-400 font-bold">{sc.score} / {sc.maxScore}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all duration-700"
                      style={{ width: `${(sc.score / sc.maxScore) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Technical Skills Tags */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              
              {/* Matched */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">
                  ✓ Matched Technical Skills
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.skillsAnalysis.matchedTechnicalSkills.map((sk, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Missing */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-3">
                  ⚠ Missing Key Role Skills
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.skillsAnalysis.missingTechnicalSkills.map((sk, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Soft Skills */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3">
                  ★ Soft Skills & Leadership
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.skillsAnalysis.softSkills.map((sk, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* TAB 2: CAREER ROADMAP */}
      {activeTab === 'roadmap' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-lg space-y-8 animate-fade-in">
          <div>
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              <span>Tailored Actionable Career Roadmap</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">Track your progress step-by-step to reach full market readiness</p>
          </div>

          <div className="space-y-6">
            {[
              { key: 'short', title: 'Phase 1: Short-Term Action Plan', data: analysis.careerRoadmap.shortTerm, color: 'border-indigo-500 text-indigo-400 bg-indigo-500/10' },
              { key: 'med', title: 'Phase 2: Medium-Term Development', data: analysis.careerRoadmap.mediumTerm, color: 'border-blue-500 text-blue-400 bg-blue-500/10' },
              { key: 'long', title: 'Phase 3: Long-Term Growth & Mastery', data: analysis.careerRoadmap.longTerm, color: 'border-cyan-500 text-cyan-400 bg-cyan-500/10' },
            ].map((phase) => (
              <div key={phase.key} className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                  <h4 className="font-bold text-white text-sm">{phase.title}</h4>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${phase.color}`}>
                    {phase.data.timeFrame}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {phase.data.actions.map((act, idx) => {
                    const actionKey = `${phase.key}-${idx}`;
                    const isChecked = !!completedActions[actionKey];

                    return (
                      <div
                        key={idx}
                        onClick={() => toggleAction(actionKey)}
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-950/30 border-emerald-500/40 text-slate-400 line-through'
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-200'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                        <span className="text-xs sm:text-sm leading-relaxed">{act}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: RESUME OPTIMIZATION */}
      {activeTab === 'bullets' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-lg space-y-8 animate-fade-in">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <span>Grounded Resume Rewrites (STAR Format)</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Strictly Grounded in Resume Evidence
              </span>
            </div>
            <p className="text-xs text-slate-400">{analysis.resumeOptimization.overallAdvice}</p>
          </div>

          <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-xl p-3.5 text-xs text-indigo-300 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">Strict Evidence Policy:</strong>
              <span>Every rewrite below is strictly mapped to skills, technologies, and achievements extracted from your current resume. Missing target skills or roadmap recommendations are kept strictly separate and never falsely claimed as existing candidate experience.</span>
            </div>
          </div>

          {/* Bullet Fixes Comparison Cards */}
          <div className="space-y-6">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Quantified STAR-Format Bullet Rewrites:
            </h4>

            {analysis.resumeOptimization.bulletFixes.map((fix, idx) => {
              const cleanSuggestedImprovement = fix.suggestedImprovement
                ?.replace(/\s*[\(\[\{]?Quantification unavailable[^\)\]\}]*[\)\]\}]?/gi, '')
                ?.replace(/\s*[\(\[\{]?No measurable result[^\)\]\}]*[\)\]\}]?/gi, '')
                ?.replace(/\s*[\(\[\{]?Quantification missing[^\)\]\}]*[\)\]\}]?/gi, '')
                ?.trim();

              return (
                <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono font-bold text-amber-400">Improvement Example #{idx + 1}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Original / Weakness */}
                    <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-rose-400 block mb-1">Original Context / Weak Bullet:</span>
                      <p className="text-xs text-slate-300 font-mono italic">{fix.originalContext}</p>
                    </div>

                    {/* Suggested Rewrite */}
                    <div className="bg-indigo-950/40 p-3.5 rounded-lg border border-indigo-500/40">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">Recommended High-Impact Bullet:</span>
                      <p className="text-xs text-emerald-200 font-mono font-semibold">{cleanSuggestedImprovement || fix.suggestedImprovement}</p>
                    </div>

                  </div>

                  <div className="text-xs text-slate-400 pt-1 border-t border-slate-850 flex items-start gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span><strong>Why this works:</strong> {fix.reason}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Formatting & ATS Recommendations */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
            <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-3">
              Formatting & ATS Layout Recommendations:
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              {analysis.resumeOptimization.formattingFeedback.map((fb, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-indigo-400 font-bold">•</span>
                  <span>{fb}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* TAB 4: INTERVIEW PREP & MARKET */}
      {activeTab === 'interview' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Market Insights Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
            <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <span>Target Role Market Demand & Salary Insights</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Demand Level</span>
                <span className="text-lg font-extrabold text-cyan-400">{analysis.marketInsights.demandLevel}</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Estimated Salary Range</span>
                <span className="text-lg font-extrabold text-emerald-400">{analysis.marketInsights.avgSalaryRange}</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Top Locations / Remote</span>
                <span className="text-xs font-semibold text-slate-200">{analysis.marketInsights.topHiringLocationsOrRemote}</span>
              </div>

            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Key Industry Hiring Trends:</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.marketInsights.keyIndustryTrends.map((tr, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300">
                    🔥 {tr}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Interview Questions */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-lg space-y-6">
            <div>
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-400" />
                <span>Tailored Technical & Behavioral Interview Strategy</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">High-probability interview questions customized to your specific background</p>
            </div>

            <div className="space-y-4">
              {analysis.interviewPrep.likelyQuestions.map((q, idx) => (
                <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide">
                      Q{idx + 1} [{q.category}]
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-sm sm:text-base">{q.question}</h4>
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-850 text-xs text-slate-300 space-y-1">
                    <p><strong>💡 Recruiter Tip:</strong> {q.tip}</p>
                    <p className="text-indigo-300"><strong>Outline:</strong> {q.sampleAnswerOutline}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Technical Focus Areas */}
            <div className="pt-4 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                Key Technical Concepts to Review Before Interviews:
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.interviewPrep.technicalFocusAreas.map((fa, idx) => (
                  <span key={idx} className="px-3 py-1.5 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-medium">
                    ⚡ {fa}
                  </span>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 5: ASK AI ASSISTANT */}
      {activeTab === 'chat' && (
        <div className="animate-fade-in">
          <AiAssistantChat
            resumeText={resumeData?.rawText}
            targetRole={targetRole}
            targetCountry={targetCountry}
            analysis={analysis}
          />
        </div>
      )}

      {/* Floating Ask AI Assistant Button when on other tabs */}
      {activeTab !== 'chat' && (
        <button
          onClick={() => {
            setActiveTab('chat');
            window.scrollTo({ top: 300, behavior: 'smooth' });
          }}
          className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2.5 px-5 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 text-white font-bold text-xs sm:text-sm shadow-2xl shadow-indigo-500/40 hover:shadow-indigo-500/60 hover:scale-105 transition-all cursor-pointer border border-cyan-300/30"
        >
          <MessageSquareText className="w-4 h-4 text-cyan-200 animate-pulse" />
          <span>Ask RoleReady AI</span>
          <span className="text-[10px] bg-cyan-950/80 text-cyan-300 font-extrabold px-1.5 py-0.5 rounded border border-cyan-500/30">
            PMK
          </span>
        </button>
      )}

    </div>
  );
};

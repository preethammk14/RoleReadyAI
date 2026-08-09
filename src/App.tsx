import React, { useState, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { HowItWorks } from './components/HowItWorks';
import { ResumeUploader } from './components/ResumeUploader';
import { RoleSelector } from './components/RoleSelector';
import { AnalysisLoading } from './components/AnalysisLoading';
import { ResultsDashboard } from './components/ResultsDashboard';
import { AuthModal } from './components/AuthModal';
import { SavedDashboard } from './components/SavedDashboard';
import { Footer } from './components/Footer';
import { ResumeData, TargetRole, ExperienceLevel, TargetCountry, AnalysisResult, User, SavedAnalysisItem } from './types';
import { FileSearch, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

export default function App() {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [targetRole, setTargetRole] = useState<TargetRole>('Full-Stack Developer');
  const [customRole, setCustomRole] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('Mid-Level (2-5 yrs)');
  const [targetCountry, setTargetCountry] = useState<TargetCountry>('United States');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTabOverride, setActiveTabOverride] = useState<'overview' | 'roadmap' | 'bullets' | 'interview' | 'chat' | undefined>(undefined);

  // Auth & Saved State
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('roleready_token'));
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSavedDashboardOpen, setIsSavedDashboardOpen] = useState(false);

  const uploadSectionRef = useRef<HTMLDivElement>(null);

  // On Mount: Check User Session
  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            setUser(data.user);
          } else {
            // Stale token
            localStorage.removeItem('roleready_token');
            setToken(null);
            setUser(null);
          }
        })
        .catch(() => {
          // Silent catch on network check
        });
    }
  }, [token]);

  const handleAuthSuccess = (loggedUser: User, authToken: string) => {
    setUser(loggedUser);
    setToken(authToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('roleready_token');
    setToken(null);
    setUser(null);
  };

  const handleSelectSavedAnalysis = (saved: SavedAnalysisItem) => {
    setAnalysisResult(saved.analysisData);
    if (saved.resumeData) {
      setResumeData(saved.resumeData);
    }
    setTargetRole((saved.targetRole as TargetRole) || 'Full-Stack Developer');
    setTargetCountry((saved.targetCountry as TargetCountry) || 'United States');
    setErrorMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToUpload = () => {
    uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleStartAnalysis = async () => {
    if (!resumeData) {
      setErrorMessage('Please upload a PDF resume or choose a sample resume first.');
      scrollToUpload();
      return;
    }

    const effectiveRole = targetRole === 'Custom' ? customRole.trim() : targetRole;
    if (targetRole === 'Custom' && !effectiveRole) {
      setErrorMessage('Please type a custom target role name.');
      return;
    }

    setErrorMessage(null);
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64: resumeData.pdfBase64,
          rawText: resumeData.rawText,
          targetRole: effectiveRole,
          customTargetRole: targetRole === 'Custom' ? customRole : undefined,
          experienceLevel,
          targetCountry,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to complete analysis.');
      }

      setAnalysisResult(data.analysis);
      // Scroll to results top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during AI analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setResumeData(null);
    setErrorMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const effectiveRoleName = targetRole === 'Custom' ? (customRole || 'Custom Role') : targetRole;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Persistent Navigation Header */}
      <Header 
        onReset={handleReset} 
        hasAnalysis={!!analysisResult} 
        onOpenAssistant={() => setActiveTabOverride('chat')}
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenSaved={() => setIsSavedDashboardOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Flow Content */}
      <main className="flex-1">
        {!analysisResult && !isAnalyzing ? (
          <>
            {/* Hero Section */}
            <Hero onStartUpload={scrollToUpload} />

            {/* How It Works Section */}
            <HowItWorks />

            {/* Core Interactive Setup Form */}
            <div ref={uploadSectionRef} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
              
              <div className="text-center max-w-2xl mx-auto mb-8">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
                  Interactive Evaluation
                </span>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mt-3">
                  Upload Resume & Select Career Goal
                </h2>
                <p className="text-sm text-slate-400 mt-2">
                  Our Gemini AI model will extract skills, project achievements, and evaluate alignment.
                </p>
              </div>

              {/* Error Alert if any */}
              {errorMessage && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center gap-3 animate-fade-in">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <span className="font-semibold">{errorMessage}</span>
                </div>
              )}

              {/* Step 1: Resume Upload */}
              <ResumeUploader
                resumeData={resumeData}
                onResumeLoaded={(data) => {
                  setResumeData(data);
                  setErrorMessage(null);
                }}
                onClearResume={() => setResumeData(null)}
              />

              {/* Step 2: Target Role & Market Selection */}
              <RoleSelector
                selectedRole={targetRole}
                customRole={customRole}
                selectedLevel={experienceLevel}
                selectedCountry={targetCountry}
                onSelectRole={setTargetRole}
                onChangeCustomRole={setCustomRole}
                onSelectLevel={setExperienceLevel}
                onSelectCountry={setTargetCountry}
              />

              {/* Analyze CTA Trigger Button */}
              <div className="pt-4 flex flex-col items-center">
                <button
                  onClick={handleStartAnalysis}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-extrabold text-base shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-5 h-5 text-indigo-200" />
                  <span>Analyze Career Alignment for {effectiveRoleName}</span>
                  <ArrowRight className="w-5 h-5 text-indigo-200" />
                </button>
                <p className="text-xs text-slate-500 mt-2">
                  Takes ~5 seconds • Powered by Gemini 3.6 Flash
                </p>
              </div>

            </div>
          </>
        ) : isAnalyzing ? (
          /* Loading State */
          <div className="py-12">
            <AnalysisLoading targetRole={effectiveRoleName} />
          </div>
        ) : (
          /* Results Dashboard View */
          <ResultsDashboard
            analysis={analysisResult!}
            targetRole={effectiveRoleName}
            targetCountry={targetCountry}
            resumeData={resumeData}
            onReset={handleReset}
            activeTabOverride={activeTabOverride}
            user={user}
            token={token}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}
      </main>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Saved Analyses Dashboard Drawer */}
      <SavedDashboard
        isOpen={isSavedDashboardOpen}
        onClose={() => setIsSavedDashboardOpen(false)}
        onSelectAnalysis={handleSelectSavedAnalysis}
        token={token}
      />

      {/* Global Footer */}
      <Footer />

    </div>
  );
}

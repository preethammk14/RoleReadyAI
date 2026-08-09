export type TargetRole = 
  | 'Software Engineer'
  | 'Full-Stack Developer'
  | 'AI/ML Engineer'
  | 'Data Scientist'
  | 'Data Analyst'
  | 'Custom';

export type TargetCountry = 
  | 'United States'
  | 'India'
  | 'United Kingdom'
  | 'Canada'
  | 'Germany / Europe'
  | 'Australia'
  | 'Singapore'
  | 'Remote / Global';

export type ExperienceLevel = 
  | 'Entry-Level / Junior (0-2 yrs)'
  | 'Mid-Level (2-5 yrs)'
  | 'Senior Level (5-8 yrs)'
  | 'Lead / Staff / Executive (8+ yrs)';

export interface BulletFix {
  originalContext: string;
  suggestedImprovement: string;
  reason: string;
}

export interface InterviewQuestion {
  question: string;
  category: 'Technical' | 'Behavioral' | 'System Design' | 'Domain Specific';
  tip: string;
  sampleAnswerOutline: string;
}

export interface SkillCategoryScore {
  category: string;
  score: number;
  maxScore: number;
}

export interface AnalysisResult {
  overallScore: number;
  headline: string;
  summary: string;
  matchCategory: 'Exceptional Match' | 'Strong Match' | 'Moderate Match' | 'Significant Gaps';
  
  strengths: string[];
  gaps: string[];

  skillsAnalysis: {
    matchedTechnicalSkills: string[];
    missingTechnicalSkills: string[];
    softSkills: string[];
    skillScores: SkillCategoryScore[];
  };

  careerRoadmap: {
    shortTerm: { timeFrame: string; actions: string[] };
    mediumTerm: { timeFrame: string; actions: string[] };
    longTerm: { timeFrame: string; actions: string[] };
  };

  resumeOptimization: {
    overallAdvice: string;
    bulletFixes: BulletFix[];
    formattingFeedback: string[];
  };

  interviewPrep: {
    likelyQuestions: InterviewQuestion[];
    technicalFocusAreas: string[];
  };

  marketInsights: {
    demandLevel: 'Very High' | 'High' | 'Moderate' | 'Niche';
    avgSalaryRange: string;
    topHiringLocationsOrRemote: string;
    keyIndustryTrends: string[];
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export interface ResumeData {
  fileName: string;
  fileSize?: number;
  pdfBase64?: string; // base64 representation if PDF uploaded
  rawText?: string;   // extracted text or pasted text
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface SavedAnalysisItem {
  id: string;
  userId: string;
  title: string;
  targetRole: string;
  targetCountry: string;
  experienceLevel: string;
  overallScore: number;
  matchCategory: string;
  resumeData: ResumeData | null;
  analysisData: AnalysisResult;
  createdAt: string;
  updatedAt: string;
}


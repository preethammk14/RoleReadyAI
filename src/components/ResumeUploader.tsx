import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Trash2, Eye, EyeOff, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { ResumeData } from '../types';
import { SAMPLE_RESUMES, SampleResume } from '../data/sampleResumes';

interface ResumeUploaderProps {
  resumeData: ResumeData | null;
  onResumeLoaded: (data: ResumeData) => void;
  onClearResume: () => void;
  isExtracting?: boolean;
}

export const ResumeUploader: React.FC<ResumeUploaderProps> = ({
  resumeData,
  onResumeLoaded,
  onClearResume,
  isExtracting: parentExtracting = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showExtractedText, setShowExtractedText] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setErrorMessage(null);
    setShowExtractedText(false);
    onClearResume(); // Instantly clear any previously loaded resume so old data is never reused

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Please upload a valid PDF file (.pdf format).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('File size exceeds 15MB limit. Please upload a smaller PDF resume.');
      return;
    }

    setLoading(true);

    try {
      const reader = new FileReader();

      reader.onload = async () => {
        try {
          const base64String = reader.result as string;

          // Send to server PDF parser
          const response = await fetch('/api/extract-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pdfBase64: base64String }),
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            throw new Error(data.error || 'Failed to extract text from PDF.');
          }

          if (!data.text || data.text.length < 20) {
            setErrorMessage('Extracted PDF text is too sparse. If your PDF is a scanned image, try another text-based PDF or select a sample resume.');
          }

          onResumeLoaded({
            fileName: file.name,
            fileSize: file.size,
            pdfBase64: base64String,
            rawText: data.text || '',
          });
        } catch (err: any) {
          setErrorMessage(err.message || 'Error processing PDF document.');
        } finally {
          setLoading(false);
        }
      };

      reader.onerror = () => {
        setErrorMessage('Failed to read local PDF file.');
        setLoading(false);
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during PDF upload.');
      setLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleSelectSample = (sample: SampleResume) => {
    setErrorMessage(null);
    onResumeLoaded({
      fileName: sample.fileName,
      fileSize: 1024 * 45, // simulated size
      rawText: sample.text,
    });
  };

  const isLoading = loading || parentExtracting;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Upload className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Step 1: Upload Resume</h3>
            <p className="text-xs text-slate-400">Upload your PDF resume or select a sample resume</p>
          </div>
        </div>

        {resumeData && (
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Resume Loaded
          </span>
        )}
      </div>

      {/* Error Message Alert */}
      {errorMessage && (
        <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{errorMessage}</p>
            <p className="mt-1 text-rose-200/80">Make sure your file is an unencrypted PDF with readable text layer.</p>
          </div>
        </div>
      )}

      {/* Main Upload Drop Zone / Active File View */}
      {!resumeData ? (
        <div>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-indigo-400 bg-indigo-950/40 scale-[1.01]'
                : 'border-slate-700 bg-slate-950/50 hover:border-indigo-500/50 hover:bg-slate-950/80'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {isLoading ? (
              <div className="py-6 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
                <p className="text-sm font-semibold text-indigo-300">Extracting PDF Content & Formatting...</p>
                <p className="text-xs text-slate-400">Parsing text structures with server-side engine</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                  <FileText className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Drop your PDF resume here, or <span className="text-indigo-400 underline underline-offset-2">browse files</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Supports standard PDF resumes up to 15MB</p>
                </div>
              </div>
            )}
          </div>

          {/* Sample Resumes Section */}
          <div className="mt-5 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Or try with a pre-loaded sample tech resume:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {SAMPLE_RESUMES.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => handleSelectSample(sample)}
                  type="button"
                  className="flex items-center justify-between p-2.5 text-left rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/60 transition-all text-xs group"
                >
                  <div className="truncate mr-2">
                    <p className="font-semibold text-slate-200 group-hover:text-indigo-300 truncate">{sample.title}</p>
                    <p className="text-[10px] text-slate-400">{sample.targetRole}</p>
                  </div>
                  <span className="text-[10px] font-medium text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 shrink-0">
                    Load
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Active File View Card */
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-white text-sm truncate">{resumeData.fileName}</h4>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                  {resumeData.fileSize && (
                    <span>{(resumeData.fileSize / 1024).toFixed(1)} KB</span>
                  )}
                  {resumeData.rawText && (
                    <span>• {resumeData.rawText.split(/\s+/).filter(Boolean).length} words extracted</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
              {resumeData.rawText && (
                <button
                  type="button"
                  onClick={() => setShowExtractedText(!showExtractedText)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                >
                  {showExtractedText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showExtractedText ? 'Hide Text' : 'View Text'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Replace</span>
              </button>

              <button
                type="button"
                onClick={onClearResume}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg border border-rose-500/20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>

          </div>

          {/* Hidden File Input for Replace */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Extracted Text Preview Collapse */}
          {showExtractedText && resumeData.rawText && (
            <div className="mt-4 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300">Extracted Plain Text Preview:</span>
                <span className="text-[10px] text-slate-400">{resumeData.rawText.length} characters</span>
              </div>
              <div className="max-h-48 overflow-y-auto p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed select-text">
                {resumeData.rawText}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

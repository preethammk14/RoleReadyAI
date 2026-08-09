import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, HelpCircle, ShieldCheck, Globe, Mic, MicOff, Square } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, AnalysisResult } from '../types';

interface AiAssistantChatProps {
  resumeText?: string;
  targetRole: string;
  targetCountry?: string;
  analysis: AnalysisResult;
}

export const AiAssistantChat: React.FC<AiAssistantChatProps> = ({
  resumeText,
  targetRole,
  targetCountry = 'United States',
  analysis,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello! I am your RoleReady AI Assistant by PMK. I have thoroughly analyzed your resume for the **${targetRole}** role in **${targetCountry}**.\n\nAsk me anything about:\n- Your skill gaps & how to bridge them\n- Step-by-step career roadmap execution\n- STAR resume bullet rewrites grounded strictly in your resume evidence\n- Interview prep questions for ${targetRole} in ${targetCountry}`,
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const topMissingSkill = analysis.skillsAnalysis.missingTechnicalSkills[0] || 'Cloud & Architecture';

  const quickQuestions = [
    `How can I address my skill gap in ${topMissingSkill} for ${targetCountry}?`,
    `Give me a 30-second elevator pitch for a ${targetRole} based strictly on my resume.`,
    'Rewrite my experience bullet points using STAR format without fabricating skills.',
    `What interview questions and salary range should I expect in ${targetCountry}?`,
    'Summarize my top 3 strengths and top 3 growth areas.',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Handle Speech Recognition (Speech-to-Text)
  const toggleListening = async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechNotice('Speech recognition is not supported in this browser. Please type your message.');
      setTimeout(() => setSpeechNotice(null), 5000);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    // Explicitly request microphone permissions first if supported
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Stop stream immediately since WebSpeech API manages its own stream
        stream.getTracks().forEach((track) => track.stop());
      } catch (err: any) {
        console.warn('Microphone permission error:', err);
        setSpeechNotice('Microphone access denied or unavailable. Please enable mic permissions in your browser.');
        setTimeout(() => setSpeechNotice(null), 5000);
        return;
      }
    }

    try {
      setSpeechNotice(null);
      const recognition = new SpeechRecognition();
      recognition.continuous = false; // continuous false is more stable across network calls
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setInput(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechNotice('Microphone permission was denied.');
        } else if (event.error === 'no-speech') {
          setSpeechNotice('No speech detected. Please speak clearly into your mic.');
        } else if (event.error === 'network') {
          setSpeechNotice('Speech network service unavailable. Try speaking again or type your question below.');
        } else {
          setSpeechNotice(`Speech input notice: ${event.error}`);
        }
        setTimeout(() => setSpeechNotice(null), 5000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      setSpeechNotice('Failed to start microphone. Please check permissions.');
      setTimeout(() => setSpeechNotice(null), 5000);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          resumeText,
          targetRole,
          targetCountry,
          analysisSummary: {
            overallScore: analysis.overallScore,
            headline: analysis.headline,
            summary: analysis.summary,
            strengths: analysis.strengths,
            gaps: analysis.gaps,
            matchedTechnicalSkills: analysis.skillsAnalysis.matchedTechnicalSkills,
            missingTechnicalSkills: analysis.skillsAnalysis.missingTechnicalSkills,
            softSkills: analysis.skillsAnalysis.softSkills,
            careerRoadmap: analysis.careerRoadmap,
            resumeOptimization: analysis.resumeOptimization,
            interviewPrep: analysis.interviewPrep,
            marketInsights: analysis.marketInsights,
          },
          history: messages,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to get AI response.');
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: data.reply,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: `⚠️ Error: ${err.message || 'Unable to connect to RoleReady AI Assistant. Please try again.'}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[640px]">
      
      {/* Header */}
      <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-500 to-cyan-400 p-0.5 shadow-md">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-cyan-400">
              <Bot className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-white text-sm">RoleReady AI Assistant</h4>
              <span className="text-[10px] uppercase font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded">by PMK</span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>Context-aware for {targetRole}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-cyan-300">
                <Globe className="w-3 h-3 text-cyan-400" />
                {targetCountry}
              </span>
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Grounded in Resume Evidence</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-950/60">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 font-bold ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-cyan-400 border border-slate-700'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[88%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
              }`}
            >
              {msg.sender === 'user' ? (
                <div className="whitespace-pre-wrap">{msg.text}</div>
              ) : (
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h1 className="text-base font-bold text-white border-b border-slate-800 pb-1 my-2">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-sm font-bold text-cyan-300 my-1.5">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-xs sm:text-sm font-semibold text-cyan-300 my-1">{children}</h3>,
                    p: ({ children }) => <p className="mb-2 last:mb-0 text-slate-200 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 my-2 text-slate-200">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 my-2 text-slate-200">{children}</ol>,
                    li: ({ children }) => <li className="text-slate-200">{children}</li>,
                    strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
                    em: ({ children }) => <em className="italic text-cyan-200">{children}</em>,
                    code: ({ children, className }) => {
                      const isInline = !className;
                      return isInline ? (
                        <code className="bg-slate-950 text-cyan-300 px-1.5 py-0.5 rounded border border-slate-800 text-[11px] font-mono">{children}</code>
                      ) : (
                        <code className="block bg-slate-950 text-slate-200 p-2.5 rounded-lg border border-slate-800 text-xs font-mono overflow-x-auto my-2">{children}</code>
                      );
                    },
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-2 border-cyan-500/50 pl-3 py-0.5 italic text-slate-300 my-2 bg-cyan-950/20 rounded-r">{children}</blockquote>
                    ),
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              )}
              <span className="block text-[10px] opacity-50 mt-1.5 text-right">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-4 text-xs text-cyan-300 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Analyzing resume context & drafting personalized response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Speech Notice Toast */}
      {speechNotice && (
        <div className="bg-amber-950/80 border-t border-amber-800/80 text-amber-200 text-xs px-4 py-1.5 text-center flex items-center justify-center gap-2 animate-fade-in">
          <span>{speechNotice}</span>
        </div>
      )}

      {/* Quick Prompts Suggestions */}
      <div className="bg-slate-900/90 border-t border-slate-800/80 px-4 py-2.5 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        {quickQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={loading}
            className="text-[11px] whitespace-nowrap bg-slate-950 hover:bg-cyan-950/60 hover:text-cyan-300 text-slate-400 border border-slate-800 hover:border-cyan-500/40 px-3 py-1 rounded-full transition-colors cursor-pointer shrink-0"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isListening
                ? 'Listening... Speak into your microphone...'
                : `Ask RoleReady AI about your ${targetRole} resume alignment in ${targetCountry}...`
            }
            disabled={loading}
            className={`flex-1 bg-slate-900 border ${
              isListening ? 'border-red-500/80 ring-2 ring-red-500/20 text-red-200' : 'border-slate-800 focus:border-cyan-500 text-white'
            } rounded-xl px-4 py-2.5 text-xs sm:text-sm placeholder-slate-500 focus:outline-none transition-all`}
          />

          {/* Voice Input Microphone Button */}
          <button
            type="button"
            onClick={toggleListening}
            disabled={loading}
            title={isListening ? 'Stop recording voice input' : 'Ask by voice (Speech-to-Text)'}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer shrink-0 flex items-center justify-center ${
              isListening
                ? 'bg-red-600/20 border-red-500 text-red-400 animate-pulse'
                : 'bg-slate-900 border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300'
            }`}
          >
            {isListening ? <Square className="w-4 h-4 fill-current text-red-400" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-40 text-white font-medium transition-all shadow-md cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
};



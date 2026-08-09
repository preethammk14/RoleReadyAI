import React from 'react';
import { Compass, RefreshCw, MessageSquareText, FolderKanban, User as UserIcon, LogOut, LogIn } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  onReset?: () => void;
  hasAnalysis?: boolean;
  onOpenAssistant?: () => void;
  user?: User | null;
  onOpenAuth?: () => void;
  onOpenSaved?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onReset,
  hasAnalysis,
  onOpenAssistant,
  user,
  onOpenAuth,
  onOpenSaved,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={onReset}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Compass className="w-5 h-5 text-cyan-400 group-hover:rotate-45 transition-transform duration-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white">
                RoleReady <span className="text-cyan-400 font-extrabold">AI</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                by PMK
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block">
              An AI Career Platform by PMK
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              {/* Saved Dashboard Trigger */}
              <button
                onClick={onOpenSaved}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/30 rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                <FolderKanban className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Saved Analyses</span>
              </button>

              {/* User Avatar & Logout */}
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1">
                <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <span className="text-xs font-medium text-slate-300 hidden md:inline max-w-[120px] truncate">
                  {user.name || user.email}
                </span>
                <button
                  onClick={onLogout}
                  className="text-slate-400 hover:text-rose-400 transition-colors ml-1"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 rounded-lg transition-all shadow-md cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In / Register</span>
            </button>
          )}

          {hasAnalysis && onOpenAssistant && (
            <button
              onClick={onOpenAssistant}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/30 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <MessageSquareText className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden lg:inline">Ask AI</span>
            </button>
          )}

          {hasAnalysis && onReset && (
            <button
              onClick={onReset}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Analysis</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};



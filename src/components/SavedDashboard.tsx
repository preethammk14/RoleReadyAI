import React, { useState, useEffect } from 'react';
import { X, FolderKanban, Calendar, Globe, Award, Trash2, Edit3, ArrowUpRight, Search, Loader2, Sparkles, Check } from 'lucide-react';
import { SavedAnalysisItem } from '../types';

interface SavedDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAnalysis: (saved: SavedAnalysisItem) => void;
  token: string | null;
}

export const SavedDashboard: React.FC<SavedDashboardProps> = ({
  isOpen,
  onClose,
  onSelectAnalysis,
  token,
}) => {
  const [items, setItems] = useState<SavedAnalysisItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Editing state for inline renaming
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [renameLoading, setRenameLoading] = useState(false);

  useEffect(() => {
    if (isOpen && token) {
      fetchAnalyses();
    }
  }, [isOpen, token]);

  const fetchAnalyses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/analyses', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load saved analyses.');
      }
      setItems(data.analyses || []);
    } catch (err: any) {
      setError(err.message || 'Error loading saved items.');
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async (id: string) => {
    if (!editingTitle.trim() || !token) return;
    setRenameLoading(true);
    try {
      const res = await fetch(`/api/analyses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: editingTitle }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to rename.');
      }
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, title: editingTitle } : item))
      );
      setEditingId(null);
    } catch (err: any) {
      alert(err.message || 'Error renaming analysis.');
    } finally {
      setRenameLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return;
    if (!window.confirm('Are you sure you want to delete this saved analysis report?')) return;

    try {
      const res = await fetch(`/api/analyses/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete.');
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      alert(err.message || 'Error deleting analysis.');
    }
  };

  if (!isOpen) return null;

  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.targetRole.toLowerCase().includes(search.toLowerCase()) ||
      item.targetCountry.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-500 to-cyan-400 p-0.5 shadow-md">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-cyan-400">
                <FolderKanban className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Your Saved Career Analyses</h3>
                <span className="text-[10px] uppercase font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                  PMK Dashboard
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Reopen, rename, or review full career roadmaps & STAR rewrites.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-3 bg-slate-900/80 border-b border-slate-800/60 flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search saved analyses by role, country, or title..."
            className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
              <p className="text-xs text-slate-400">Loading your saved career reports...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center">
              {error}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center space-y-3 max-w-sm mx-auto">
              <Sparkles className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No Saved Analyses Found</p>
              <p className="text-xs text-slate-500">
                Run an evaluation on your resume and click &quot;Save Report to Account&quot; to keep it permanently in your dashboard.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectAnalysis(item);
                    onClose();
                  }}
                  className="bg-slate-950 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 hover:bg-slate-900/60 transition-all cursor-pointer group flex flex-col justify-between relative shadow-md"
                >
                  <div>
                    {/* Top row: Badges & Score */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                          {item.targetRole}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded flex items-center gap-1">
                          <Globe className="w-3 h-3 text-cyan-400" />
                          {item.targetCountry}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                        <Award className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{item.overallScore}%</span>
                      </div>
                    </div>

                    {/* Title & Rename input */}
                    {editingId === item.id ? (
                      <div className="flex items-center gap-2 mb-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          className="flex-1 bg-slate-900 border border-cyan-500 rounded px-2 py-1 text-xs text-white focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleRename(item.id)}
                          disabled={renameLoading}
                          className="p-1 bg-cyan-600 text-white rounded hover:bg-cyan-500"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors line-clamp-1">
                          {item.title}
                        </h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(item.id);
                            setEditingTitle(item.title);
                          }}
                          className="text-slate-500 hover:text-cyan-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Rename report"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                      {item.analysisData.headline || item.analysisData.summary}
                    </p>
                  </div>

                  {/* Footer Row */}
                  <div className="pt-3 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-600" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleDelete(item.id, e)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                        title="Delete saved analysis"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <span className="text-cyan-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>Reopen Report</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

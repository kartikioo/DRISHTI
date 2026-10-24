import React, { useState, useEffect } from 'react';
import { HistoryList } from '../components/HistoryList.jsx';
import { analysisService } from '../services/analysisService.js';
import { History, Search, RefreshCw, Filter, Volume2 } from 'lucide-react';
import { useSpeech } from '../contexts/SpeechContext.jsx';
import { useAccessibility } from '../contexts/AccessibilityContext.jsx';

export const HistoryPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMode, setSelectedMode] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [total, setTotal] = useState(0);

  const { speak } = useSpeech();
  const { playChime, announce } = useAccessibility();

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await analysisService.getHistory({
        limit: 50,
        mode: selectedMode === 'all' ? '' : selectedMode
      });
      setItems(res?.items || []);
      setTotal(res?.total || 0);
      announce(`Loaded ${res?.items?.length || 0} history records`);
    } catch (err) {
      console.warn('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [selectedMode]);

  const handleDelete = async (id) => {
    try {
      await analysisService.deleteById(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      playChime('success');
    } catch (err) {
      console.error('Delete error:', err);
      // Fallback local state removal
      setItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // Filter items by search query
  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.summary?.toLowerCase().includes(query) ||
      item.detected_text?.toLowerCase().includes(query) ||
      item.mode?.toLowerCase().includes(query)
    );
  });

  return (
    <main id="main-content" className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-drishti-500/20 text-drishti-400 border border-drishti-500/30 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">Scene Capture History</h1>
            <p className="text-xs text-slate-400">
              Review and replay previous audio descriptions and OCR transcriptions
            </p>
          </div>
        </div>

        <button
          onClick={loadHistory}
          disabled={loading}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 self-start sm:self-auto focus:ring-2 focus:ring-yellow-400"
          title="Refresh History"
          aria-label="Refresh history records"
        >
          <RefreshCw className={`w-4 h-4 text-drishti-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search captured text, objects, or notes..."
            className="w-full p-3 pl-10 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:ring-2 focus:ring-drishti-400"
            aria-label="Search previous analyses"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
        </div>

        {/* Mode Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'All Modes' },
            { id: 'general', label: 'General' },
            { id: 'text', label: 'Text/OCR' },
            { id: 'hazards', label: 'Hazards' },
            { id: 'currency', label: 'Currency' },
            { id: 'people', label: 'People' },
            { id: 'qa', label: 'Q&A' }
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setSelectedMode(mode.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap border ${
                selectedMode === mode.id
                  ? 'bg-drishti-500 text-slate-950 border-drishti-400 shadow-glow-primary'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed List */}
      <HistoryList
        items={filteredItems}
        onDelete={handleDelete}
        loading={loading}
      />

    </main>
  );
};

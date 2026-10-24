import React, { useState } from 'react';
import { Volume2, Trash2, Calendar, Eye, FileText, AlertTriangle, Coins, Users, MessageSquare, Copy, Check } from 'lucide-react';
import { useSpeech } from '../contexts/SpeechContext.jsx';
import { useAccessibility } from '../contexts/AccessibilityContext.jsx';

export const HistoryCard = ({ item, onDelete }) => {
  const { speak } = useSpeech();
  const { playChime, announce } = useAccessibility();
  const [copied, setCopied] = useState(false);

  const getModeIcon = (mode) => {
    switch (mode) {
      case 'text': return FileText;
      case 'hazards': return AlertTriangle;
      case 'currency': return Coins;
      case 'people': return Users;
      case 'qa': return MessageSquare;
      default: return Eye;
    }
  };

  const Icon = getModeIcon(item.mode);
  const formattedDate = new Date(item.created_at).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleSpeak = () => {
    playChime('click');
    speak(item.audio_transcript || item.summary, true);
    announce(`Speaking analysis from ${formattedDate}`);
  };

  const handleCopy = () => {
    playChime('click');
    navigator.clipboard.writeText(item.summary);
    setCopied(true);
    announce('Summary copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    playChime('alert');
    if (window.confirm('Delete this analysis from your history?')) {
      onDelete(item.id);
      announce('Analysis deleted');
    }
  };

  return (
    <div
      className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-3 shadow-lg"
      role="article"
      aria-label={`Analysis from ${formattedDate}. Mode: ${item.mode}. Summary: ${item.summary}`}
    >
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-slate-800 text-drishti-400 border border-slate-700">
              <Icon className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {item.mode || 'general'}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <Calendar className="w-3 h-3" />
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Thumbnail if available */}
        {item.image_url && (
          <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-950 mb-3 border border-slate-800/80">
            <img
              src={item.image_url}
              alt="Snapshot associated with this scene analysis"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Summary */}
        <p className="text-sm text-slate-200 line-clamp-3 leading-relaxed font-normal">
          {item.summary}
        </p>

        {/* Hazards tag if any */}
        {item.hazards && item.hazards.length > 0 && (
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-red-400 font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{item.hazards.length} Safety Hazard(s) detected</span>
          </div>
        )}
      </div>

      {/* Bottom Action Buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
        <button
          onClick={handleSpeak}
          className="px-3 py-1.5 rounded-xl bg-drishti-500 hover:bg-drishti-400 text-slate-950 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-glow-primary focus:ring-2 focus:ring-yellow-400"
          aria-label="Speak this historical analysis aloud"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Speak</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs transition-colors focus:ring-2 focus:ring-yellow-400"
            title="Copy Text"
            aria-label="Copy summary to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleDelete}
            className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/30 text-xs transition-colors focus:ring-2 focus:ring-yellow-400"
            title="Delete Item"
            aria-label="Delete this analysis record"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

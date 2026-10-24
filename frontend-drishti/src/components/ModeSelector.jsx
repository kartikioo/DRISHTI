import React from 'react';
import { Eye, FileText, AlertTriangle, Coins, Users, MessageSquareQuote, Search } from 'lucide-react';
import { useAccessibility } from '../contexts/AccessibilityContext.jsx';

export const MODES = [
  {
    id: 'general',
    label: 'General Scan',
    shortDesc: 'People, layout & items',
    icon: Eye,
    color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/40'
  },
  {
    id: 'find',
    label: 'Find Object',
    shortDesc: 'Keys, cup, phone (Clock)',
    icon: Search,
    color: 'from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/40'
  },
  {
    id: 'hazards',
    label: 'Safety Alert',
    shortDesc: 'Red alert & hazards',
    icon: AlertTriangle,
    color: 'from-red-500/20 to-rose-500/20 text-red-400 border-red-500/40'
  },
  {
    id: 'text',
    label: 'Read Text',
    shortDesc: 'Books, labels & medicine',
    icon: FileText,
    color: 'from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/40'
  },
  {
    id: 'currency',
    label: 'Currency & Coins',
    shortDesc: '₹ notes, coins & total',
    icon: Coins,
    color: 'from-yellow-500/20 to-amber-500/20 text-yellow-400 border-yellow-500/40'
  },
  {
    id: 'people',
    label: 'People Count',
    shortDesc: 'Count & surroundings',
    icon: Users,
    color: 'from-purple-500/20 to-indigo-500/20 text-purple-400 border-purple-500/40'
  },
  {
    id: 'qa',
    label: 'Ask Drishti',
    shortDesc: 'Ask a direct question',
    icon: MessageSquareQuote,
    color: 'from-pink-500/20 to-rose-500/20 text-pink-400 border-pink-500/40'
  }
];

export const ModeSelector = ({ currentMode, onSelectMode, onOpenQaModal }) => {
  const { playChime, triggerHaptic, announce } = useAccessibility();

  const handleSelect = (modeId) => {
    playChime('click');
    triggerHaptic([30]);
    onSelectMode(modeId);
    const modeObj = MODES.find((m) => m.id === modeId);
    announce(`Vision mode switched to ${modeObj?.label || modeId}`);
    
    if (modeId === 'qa' && onOpenQaModal) {
      onOpenQaModal();
    }
  };

  return (
    <div className="w-full" role="region" aria-label="Vision Analysis Mode Selection">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Vision Mode (Press 'M' to cycle)
        </label>
        <span className="text-[11px] text-slate-500 hidden sm:inline">
          Specialized AI reasoning for blind accessibility
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {MODES.map((mode) => {
          const Icon = mode.icon;
          const isSelected = currentMode === mode.id;

          return (
            <button
              key={mode.id}
              onClick={() => handleSelect(mode.id)}
              className={`p-2.5 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between relative overflow-hidden group focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                isSelected
                  ? 'bg-slate-800/90 border-drishti-400 shadow-glow-primary scale-[1.02]'
                  : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'
              }`}
              aria-pressed={isSelected}
              aria-label={`${mode.label}: ${mode.shortDesc}`}
            >
              {/* Top Row: Icon & Active Dot */}
              <div className="flex items-center justify-between mb-1.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
                    isSelected ? 'bg-drishti-500/20 text-drishti-300 border-drishti-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-drishti-400 shadow-[0_0_8px_#4ade80]" />
                )}
              </div>

              {/* Text */}
              <div>
                <span className={`block text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                  {mode.label}
                </span>
                <span className="text-[10px] text-slate-400 line-clamp-1 block">
                  {mode.shortDesc}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

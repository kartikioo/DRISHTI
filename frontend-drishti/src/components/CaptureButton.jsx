import React from 'react';
import { Camera, Sparkles, RefreshCw } from 'lucide-react';
import { useAccessibility } from '../contexts/AccessibilityContext.jsx';

export const CaptureButton = ({ onClick, isAnalyzing, disabled }) => {
  const { playChime, triggerHaptic, announce } = useAccessibility();

  const handleCapture = () => {
    if (disabled || isAnalyzing) return;
    playChime('capture');
    triggerHaptic([60, 40, 80]);
    announce('Capturing image. Analyzing surroundings with AI.');
    onClick();
  };

  return (
    <div className="flex flex-col items-center gap-2 w-full max-w-md mx-auto my-3">
      <button
        onClick={handleCapture}
        disabled={disabled || isAnalyzing}
        className={`w-full py-4 sm:py-5 px-8 rounded-2xl font-extrabold text-base sm:text-lg transition-all duration-200 flex items-center justify-center gap-3 relative overflow-hidden shadow-2xl focus:outline-none focus:ring-4 focus:ring-yellow-400 ${
          isAnalyzing
            ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
            : disabled
            ? 'bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-800'
            : 'bg-gradient-to-r from-drishti-500 via-emerald-400 to-cyan-500 hover:from-drishti-400 hover:to-cyan-400 text-slate-950 shadow-glow-primary active:scale-[0.98]'
        }`}
        aria-label="Capture image and analyze scene with AI. Keyboard shortcut: Spacebar or key C."
      >
        {isAnalyzing ? (
          <>
            <RefreshCw className="w-6 h-6 animate-spin text-drishti-400" />
            <span className="tracking-wide text-white">Analyzing Surroundings...</span>
          </>
        ) : (
          <>
            <div className="w-8 h-8 rounded-full bg-slate-950/20 flex items-center justify-center">
              <Camera className="w-5 h-5 text-slate-950" />
            </div>
            <span className="tracking-wide">DESCRIBE SCENE</span>
            <Sparkles className="w-5 h-5 opacity-70" />
          </>
        )}
      </button>

      {/* Keyboard hotkey hint for screen reader and keyboard navigators */}
      <p className="text-xs text-slate-400 font-medium tracking-wide flex items-center gap-1.5">
        <span>Shortcut:</span>
        <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 text-[11px] font-mono shadow-sm">
          Space
        </kbd>
        <span>or</span>
        <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 text-[11px] font-mono shadow-sm">
          C
        </kbd>
      </p>
    </div>
  );
};

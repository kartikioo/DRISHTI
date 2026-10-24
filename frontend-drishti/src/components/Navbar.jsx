import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Eye, Volume2, VolumeX, EyeOff, Sparkles, History, Settings, User, LogOut, Sun, Contrast, ShieldAlert, Mic, MicOff } from 'lucide-react';
import { useSpeech } from '../contexts/SpeechContext.jsx';
import { useAccessibility } from '../contexts/AccessibilityContext.jsx';
import { useVoiceControl } from '../contexts/VoiceControlContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

export const Navbar = ({ onOpenAuth, onOpenApiKeyModal, onOpenEmergency }) => {
  const location = useLocation();
  const { isSpeaking, stop, autoSpeak, setAutoSpeak } = useSpeech();
  const { contrastMode, setContrastMode, soundCues, setSoundCues, playChime, announce } = useAccessibility();
  const { isEnabled: isVoiceEnabled, toggleVoiceControl, isListening: isVoiceListening } = useVoiceControl();
  const { user, isAuthenticated, isGuest, logout } = useAuth();

  const cycleContrast = () => {
    playChime('click');
    let next = 'standard';
    if (contrastMode === 'standard') next = 'yellow-black';
    else if (contrastMode === 'yellow-black') next = 'white-black';
    else next = 'standard';
    setContrastMode(next);
    announce(`Contrast mode set to ${next}`);
  };

  const toggleSound = () => {
    const next = !soundCues;
    setSoundCues(next);
    announce(next ? 'Sound cues enabled' : 'Sound cues muted');
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Logo */}
        <Link
          to="/"
          className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 rounded-lg p-1"
          aria-label="Drishti Accessibility Assistant - Home"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-drishti-500 to-cyan-500 p-0.5 shadow-glow-primary group-hover:scale-105 transition-transform flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Eye className="w-5 h-5 text-drishti-400 group-hover:text-cyan-400 transition-colors" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white brand-font group-hover:text-drishti-300 transition-colors">
                DRISHTI
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-drishti-500/20 text-drishti-300 border border-drishti-500/30 font-medium">
                AI Vision
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Eyes for the Blind</p>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
          <Link
            to="/"
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              location.pathname === '/'
                ? 'bg-drishti-500 text-slate-950 font-semibold shadow-glow-primary'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Eye className="w-4 h-4" />
            Assistant
          </Link>
          <Link
            to="/history"
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              location.pathname === '/history'
                ? 'bg-drishti-500 text-slate-950 font-semibold shadow-glow-primary'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <History className="w-4 h-4" />
            History
          </Link>
          <Link
            to="/settings"
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              location.pathname === '/settings'
                ? 'bg-drishti-500 text-slate-950 font-semibold shadow-glow-primary'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
        </nav>

        {/* Right Accessibility, Voice & Emergency Controls */}
        <div className="flex items-center gap-2">
          
          {/* Emergency SOS Contact Button */}
          {onOpenEmergency && (
            <button
              onClick={onOpenEmergency}
              className="px-2.5 py-1.5 rounded-xl bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-500/60 transition-all flex items-center gap-1.5 text-xs font-bold shadow-[0_0_12px_rgba(239,68,68,0.4)] focus:ring-2 focus:ring-yellow-400"
              title="Open Emergency Contact / Call (Say 'Emergency')"
              aria-label="Open emergency contact modal or dial"
            >
              <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
              <span>SOS</span>
            </button>
          )}

          {/* Voice Control Quick Toggle */}
          <button
            onClick={toggleVoiceControl}
            className={`p-2 rounded-lg border transition-colors ${
              isVoiceEnabled
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
            title={isVoiceEnabled ? 'Voice Control Active (Click to mute)' : 'Voice Control Muted (Click to enable)'}
            aria-label={isVoiceEnabled ? 'Voice control is listening. Press to disable.' : 'Voice control is disabled. Press to enable.'}
          >
            {isVoiceEnabled ? <Mic className="w-5 h-5 animate-pulse" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* Active Speaking Indicator & Instant Stop */}
          {isSpeaking && (
            <button
              onClick={stop}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors animate-pulse text-xs font-semibold"
              title="Stop Speech (Key: S)"
              aria-label="Stop audio speech playback"
            >
              <VolumeX className="w-4 h-4" />
              <span className="hidden sm:inline">Speaking (Stop)</span>
            </button>
          )}

          {/* Quick Contrast Theme Button */}
          <button
            onClick={cycleContrast}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-yellow-400 hover:border-yellow-400/50 transition-colors"
            title={`Cycle Contrast Mode (Current: ${contrastMode})`}
            aria-label={`Cycle Contrast Mode. Currently ${contrastMode}. Press to change.`}
          >
            <Contrast className="w-5 h-5" />
          </button>

          {/* Quick Sound Cues Toggle */}
          <button
            onClick={toggleSound}
            className={`p-2 rounded-lg border transition-colors ${
              soundCues
                ? 'bg-slate-900 border-slate-800 text-drishti-400 hover:border-drishti-400/50'
                : 'bg-slate-900/50 border-slate-800/50 text-slate-500 hover:text-slate-400'
            }`}
            title={soundCues ? 'Sound Cues Enabled (Click to mute)' : 'Sound Cues Muted (Click to enable)'}
            aria-label={soundCues ? 'Mute audio tones' : 'Enable audio tones'}
          >
            {soundCues ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* Auth Button or User Badge */}
          {isAuthenticated && !isGuest ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <span className="text-xs text-slate-300 hidden lg:inline-block max-w-[120px] truncate">
                {user?.full_name || user?.email}
              </span>
              <button
                onClick={logout}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/40 transition-colors"
                title="Log Out"
                aria-label="Log out of account"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
              aria-label="Sign In or Create Account"
            >
              <User className="w-3.5 h-3.5 text-drishti-400" />
              <span className="hidden sm:inline">{isGuest ? 'Sign In' : 'Sign In'}</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
};

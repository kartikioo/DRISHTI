import React, { useState } from 'react';
import {
  Settings,
  Eye,
  Contrast,
  Type,
  Volume2,
  Smartphone,
  Key,
  Keyboard,
  Play,
  RotateCcw,
  Check,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { useSpeech } from '../contexts/SpeechContext.jsx';
import { useAccessibility } from '../contexts/AccessibilityContext.jsx';

export const SettingsPage = () => {
  const {
    voices,
    selectedVoice,
    setSelectedVoice,
    rate,
    setRate,
    pitch,
    setPitch,
    autoSpeak,
    setAutoSpeak,
    speak
  } = useSpeech();

  const {
    contrastMode,
    setContrastMode,
    fontScale,
    setFontScale,
    soundCues,
    setSoundCues,
    haptics,
    setHaptics,
    playChime,
    triggerHaptic,
    announce
  } = useAccessibility();

  // AI settings
  const [aiProvider, setAiProvider] = useState(() => localStorage.getItem('drishti_user_ai_provider') || 'gemini');
  const [aiKey, setAiKey] = useState(() => localStorage.getItem('drishti_user_ai_key') || '');
  const [aiModel, setAiModel] = useState(() => {
    const saved = localStorage.getItem('drishti_user_ai_model');
    if (!saved || ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-pro'].includes(saved)) {
      return 'gemini-3.8-flash';
    }
    return saved;
  });
  const [keySaved, setKeySaved] = useState(false);

  const handleSaveAi = (e) => {
    e.preventDefault();
    playChime('click');
    if (aiKey.trim()) {
      localStorage.setItem('drishti_user_ai_provider', aiProvider);
      localStorage.setItem('drishti_user_ai_key', aiKey.trim());
      localStorage.setItem('drishti_user_ai_model', aiModel.trim());
    } else {
      localStorage.removeItem('drishti_user_ai_provider');
      localStorage.removeItem('drishti_user_ai_key');
      localStorage.removeItem('drishti_user_ai_model');
    }
    setKeySaved(true);
    announce('AI Vision configuration saved.');
    setTimeout(() => setKeySaved(false), 2000);
  };

  const handleTestVoice = () => {
    playChime('click');
    speak(
      `Hello! This is Drishti's narration voice speaking at ${rate} times speed. I am ready to guide you through your surroundings.`,
      true
    );
  };

  const handleTestChime = () => {
    playChime('success');
    triggerHaptic([60, 40, 80]);
  };

  const handleSpeakShortcuts = () => {
    speak(
      'Drishti Keyboard Shortcuts: Spacebar or key C to capture and describe surroundings. Key S to stop speech. Key R to replay description. Key M to change vision mode. Key T to switch contrast themes. Question mark to listen to help.',
      true
    );
  };

  return (
    <main id="main-content" className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-8">
      
      {/* Page Title */}
      <div className="flex items-center gap-3 p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-drishti-500/20 text-drishti-400 border border-drishti-500/30 flex items-center justify-center">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Accessibility & AI Settings</h1>
          <p className="text-xs text-slate-400">
            Customize visual contrast, text scaling, speech voice, and AI keys
          </p>
        </div>
      </div>

      {/* 1. VISUAL ACCESSIBILITY & CONTRAST */}
      <section className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-5">
        <div className="flex items-center gap-2.5">
          <Contrast className="w-5 h-5 text-yellow-400" />
          <h2 className="text-base font-bold text-white">High Contrast & Visual Theme</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              id: 'standard',
              label: 'Standard Dark',
              desc: 'Modern sleek dark mode with emerald accents',
              border: 'border-slate-700 bg-slate-950'
            },
            {
              id: 'yellow-black',
              label: 'Yellow on Black',
              desc: 'Maximum contrast recommended for low vision',
              border: 'border-yellow-400 bg-black text-yellow-400'
            },
            {
              id: 'white-black',
              label: 'White on Black',
              desc: 'Crisp high-contrast monochrome layout',
              border: 'border-white bg-black text-white'
            }
          ].map((theme) => (
            <button
              key={theme.id}
              onClick={() => {
                playChime('click');
                setContrastMode(theme.id);
                announce(`Contrast mode set to ${theme.label}`);
              }}
              className={`p-4 rounded-2xl border text-left transition-all relative ${theme.border} ${
                contrastMode === theme.id ? 'ring-4 ring-yellow-400/50 scale-[1.02]' : 'opacity-80 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm">{theme.label}</span>
                {contrastMode === theme.id && <Check className="w-4 h-4 text-yellow-400" />}
              </div>
              <p className="text-xs opacity-75">{theme.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* 2. TEXT SCALING */}
      <section className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-5">
        <div className="flex items-center gap-2.5">
          <Type className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white">Font Size Scaling</h2>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'normal', label: 'Normal (100%)', scale: 'text-sm' },
            { id: 'large', label: 'Large (115%)', scale: 'text-base font-bold' },
            { id: 'xlarge', label: 'Extra Large (130%)', scale: 'text-lg font-black' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                playChime('click');
                setFontScale(item.id);
                announce(`Font scale set to ${item.label}`);
              }}
              className={`p-4 rounded-2xl border text-center transition-all ${
                fontScale === item.id
                  ? 'bg-drishti-500/20 border-drishti-400 text-white shadow-glow-primary'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span className={`block ${item.scale}`}>{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 3. AUDIO CUES & HAPTICS */}
      <section className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2.5">
          <Volume2 className="w-5 h-5 text-drishti-400" />
          <h2 className="text-base font-bold text-white">Audio Tones & Tactile Feedback</h2>
        </div>

        <div className="space-y-3">
          {/* Sound Cues */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <div>
              <p className="text-sm font-semibold text-white">Audio Chimes & Cues</p>
              <p className="text-xs text-slate-400">Play auditory tones on capture, alerts, and completion</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleTestChime}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold transition-colors"
              >
                Test Tone
              </button>
              <button
                onClick={() => setSoundCues(!soundCues)}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                  soundCues ? 'bg-drishti-500' : 'bg-slate-700'
                }`}
                aria-label="Toggle sound cues"
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${soundCues ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          {/* Haptics */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <div>
              <p className="text-sm font-semibold text-white">Haptic Vibration</p>
              <p className="text-xs text-slate-400">Vibrate mobile phone when tapping buttons and detecting hazards</p>
            </div>
            <button
              onClick={() => setHaptics(!haptics)}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                haptics ? 'bg-drishti-500' : 'bg-slate-700'
              }`}
              aria-label="Toggle haptics"
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${haptics ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </section>

      {/* 4. SPEECH SYNTHESIS & VOICE TUNING */}
      <section className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Volume2 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Text-to-Speech Engine</h2>
          </div>
          <button
            onClick={handleTestVoice}
            className="px-3.5 py-1.5 rounded-xl bg-drishti-500 hover:bg-drishti-400 text-slate-950 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-glow-primary"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" />
            <span>Test Voice</span>
          </button>
        </div>

        <div className="space-y-4">
          {/* Voice Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Narrator Voice:
            </label>
            <select
              value={selectedVoice?.name || ''}
              onChange={(e) => {
                const v = voices.find((voice) => voice.name === e.target.value);
                if (v) setSelectedVoice(v);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 text-xs focus:ring-2 focus:ring-drishti-400"
            >
              {voices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>

          {/* Speed Rate Slider */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1.5">
              <span className="font-semibold">Speech Speed Rate:</span>
              <span className="font-bold text-drishti-400">{rate}x</span>
            </div>
            <input
              type="range"
              min="0.75"
              max="2.0"
              step="0.05"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              className="w-full accent-drishti-500 cursor-pointer"
            />
          </div>

          {/* Pitch Slider */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1.5">
              <span className="font-semibold">Voice Pitch:</span>
              <span className="font-bold text-cyan-400">{pitch}</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.4"
              step="0.05"
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Auto Speak Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <div>
              <p className="text-sm font-semibold text-white">Auto-Speak New Analyses</p>
              <p className="text-xs text-slate-400">Instantly vocalize scene descriptions as soon as AI completes</p>
            </div>
            <button
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                autoSpeak ? 'bg-drishti-500' : 'bg-slate-700'
              }`}
              aria-label="Toggle auto speak"
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${autoSpeak ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </section>

      {/* 5. VISION AI ENGINE CONFIG */}
      <section className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2.5">
          <Key className="w-5 h-5 text-drishti-400" />
          <h2 className="text-base font-bold text-white">Vision AI Engine Configuration</h2>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Drishti uses a provider-independent AI architecture. You can set your key in <code className="text-drishti-300 font-mono">backend/.env</code> or enter it below to run in this browser.
        </p>

        <form onSubmit={handleSaveAi} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setAiProvider('gemini');
                setAiModel('gemini-3.8-flash');
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                aiProvider === 'gemini'
                  ? 'bg-drishti-500/20 border-drishti-400 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <div className="font-bold text-xs">Google Gemini Vision</div>
              <div className="text-[11px] text-slate-400 mt-1">gemini-3.8-flash (Latest / Fast)</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setAiProvider('openai');
                setAiModel('gpt-4o-mini');
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                aiProvider === 'openai'
                  ? 'bg-cyan-500/20 border-cyan-400 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <div className="font-bold text-xs">OpenAI Vision</div>
              <div className="text-[11px] text-slate-400 mt-1">gpt-4o-mini / gpt-4o</div>
            </button>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-300">
                {aiProvider === 'gemini' ? 'Gemini API Key:' : 'OpenAI API Key:'}
              </label>
              {aiProvider === 'gemini' && (
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-drishti-400 hover:underline flex items-center gap-1"
                >
                  <span>Get free Gemini key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <input
              type="password"
              value={aiKey}
              onChange={(e) => setAiKey(e.target.value)}
              placeholder="Paste your API Key here"
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono focus:ring-2 focus:ring-drishti-400"
            />
          </div>

          <div className="flex items-center justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-drishti-500 hover:bg-drishti-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-2 shadow-glow-primary"
            >
              {keySaved ? <Check className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
              <span>{keySaved ? 'Saved!' : 'Save AI Credentials'}</span>
            </button>
          </div>
        </form>
      </section>

      {/* 6. KEYBOARD SHORTCUTS REFERENCE */}
      <section className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Keyboard className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">Keyboard Shortcuts Cheatsheet</h2>
          </div>

          <button
            onClick={handleSpeakShortcuts}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
            aria-label="Speak keyboard shortcuts aloud"
          >
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Read Aloud</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {[
            { key: 'Space / C', desc: 'Capture image & describe scene' },
            { key: 'S', desc: 'Instantly stop speech narration' },
            { key: 'R', desc: 'Replay current description' },
            { key: 'M', desc: 'Cycle through 6 vision modes' },
            { key: 'T', desc: 'Cycle High Contrast themes' },
            { key: '?', desc: 'Read shortcuts aloud anytime' }
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
            >
              <span className="text-slate-300">{item.desc}</span>
              <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 font-mono text-slate-200 font-bold text-[11px]">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
};

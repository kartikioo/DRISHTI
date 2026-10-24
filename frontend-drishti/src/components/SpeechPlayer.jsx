import React, { useState } from 'react';
import { Volume2, VolumeX, Play, Pause, RotateCcw, FastForward, Sliders, Check } from 'lucide-react';
import { useSpeech } from '../contexts/SpeechContext.jsx';
import { useAccessibility } from '../contexts/AccessibilityContext.jsx';

export const SpeechPlayer = ({ textToSpeak, label = 'Speech Player' }) => {
  const {
    isSpeaking,
    isPaused,
    speak,
    stop,
    pause,
    resume,
    rate,
    setRate,
    pitch,
    setPitch,
    autoSpeak,
    setAutoSpeak,
    voices,
    selectedVoice,
    setSelectedVoice
  } = useSpeech();

  const { playChime, announce } = useAccessibility();
  const [showSettings, setShowSettings] = useState(false);

  const handlePlay = () => {
    playChime('click');
    if (isPaused) {
      resume();
      announce('Resumed speech');
    } else {
      speak(textToSpeak, true);
      announce('Playing speech narration');
    }
  };

  const handlePause = () => {
    playChime('click');
    pause();
    announce('Paused speech');
  };

  const handleStop = () => {
    playChime('click');
    stop();
    announce('Stopped speech');
  };

  const handleReplay = () => {
    playChime('click');
    speak(textToSpeak, true);
    announce('Replaying speech from beginning');
  };

  const toggleAutoSpeak = () => {
    playChime('click');
    const next = !autoSpeak;
    setAutoSpeak(next);
    announce(next ? 'Auto-speak enabled' : 'Auto-speak disabled');
  };

  if (!textToSpeak) return null;

  return (
    <div
      className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md transition-all"
      role="region"
      aria-label={label}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        {/* Left: Playback Status */}
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
              isSpeaking
                ? 'bg-drishti-500/20 text-drishti-300 border-drishti-500/40 animate-pulse'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Narration Audio</span>
              {isSpeaking && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">
                  Playing
                </span>
              )}
            </h4>
            <p className="text-xs text-cyan-300/90 font-medium">
              {selectedVoice ? selectedVoice.name.split('-')[0].trim() : 'System Voice'} • {rate}x speed • Say <strong className="text-yellow-300">"Go Back"</strong> or press <strong className="text-yellow-300">B</strong> to return
            </p>
          </div>
        </div>

        {/* Right: Audio Action Buttons */}
        <div className="flex items-center gap-2">
          {isSpeaking && !isPaused ? (
            <button
              onClick={handlePause}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-colors flex items-center gap-1.5 focus:ring-2 focus:ring-yellow-400"
              aria-label="Pause speech"
            >
              <Pause className="w-4 h-4" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={handlePlay}
              className="px-3.5 py-1.5 rounded-xl bg-drishti-500 hover:bg-drishti-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-glow-primary focus:ring-2 focus:ring-yellow-400"
              aria-label="Play spoken description"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>{isPaused ? 'Resume' : 'Speak'}</span>
            </button>
          )}

          <button
            onClick={handleReplay}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors focus:ring-2 focus:ring-yellow-400"
            title="Replay from start (Key: R)"
            aria-label="Replay audio from beginning. Shortcut key R."
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleStop}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors focus:ring-2 focus:ring-yellow-400"
            title="Stop Speech (Key: S)"
            aria-label="Stop audio speech. Shortcut key S."
          >
            <VolumeX className="w-4 h-4 text-red-400" />
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-xl border text-xs transition-colors focus:ring-2 focus:ring-yellow-400 ${
              showSettings
                ? 'bg-slate-800 text-cyan-400 border-cyan-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Speech Voice & Speed Settings"
            aria-label="Toggle voice and speed settings"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Voice Tuning Drawer */}
      {showSettings && (
        <div className="pt-3 border-t border-slate-800/80 mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* Rate / Speed */}
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Speech Speed:</span>
              <span className="font-semibold text-drishti-400">{rate}x</span>
            </div>
            <input
              type="range"
              min="0.75"
              max="2.0"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              className="w-full accent-drishti-500 cursor-pointer"
              aria-label={`Speech rate: currently ${rate} times speed`}
            />
          </div>

          {/* Voice Selector */}
          <div>
            <label className="block text-slate-300 mb-1">Voice Character:</label>
            <select
              value={selectedVoice?.name || ''}
              onChange={(e) => {
                const v = voices.find((voice) => voice.name === e.target.value);
                if (v) setSelectedVoice(v);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:ring-2 focus:ring-yellow-400"
              aria-label="Select text-to-speech voice"
            >
              {voices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>

          {/* Auto-Speak Toggle */}
          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2">
            <span className="text-slate-300">Auto-Speak Results:</span>
            <button
              onClick={toggleAutoSpeak}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 focus:ring-2 focus:ring-yellow-400 ${
                autoSpeak ? 'bg-drishti-500' : 'bg-slate-700'
              }`}
              aria-label={`Auto-speak is currently ${autoSpeak ? 'enabled' : 'disabled'}`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  autoSpeak ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

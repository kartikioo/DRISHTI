import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Check, X, ExternalLink, ShieldCheck, Cpu } from 'lucide-react';
import { useAccessibility } from '../contexts/AccessibilityContext.jsx';

export const ApiKeyModal = ({ isOpen, onClose }) => {
  const [provider, setProvider] = useState(() => localStorage.getItem('drishti_user_ai_provider') || 'gemini');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('drishti_user_ai_key') || '');
  const [model, setModel] = useState(() => {
    const saved = localStorage.getItem('drishti_user_ai_model');
    if (!saved || ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-pro'].includes(saved)) {
      return 'gemini-3.8-flash';
    }
    return saved;
  });
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const { playChime, announce } = useAccessibility();

  const handleSave = (e) => {
    e.preventDefault();
    playChime('click');

    if (apiKey.trim()) {
      localStorage.setItem('drishti_user_ai_provider', provider);
      localStorage.setItem('drishti_user_ai_key', apiKey.trim());
      localStorage.setItem('drishti_user_ai_model', model.trim());
      setSaved(true);
      announce('AI API Key saved to local session.');
    } else {
      localStorage.removeItem('drishti_user_ai_provider');
      localStorage.removeItem('drishti_user_ai_key');
      localStorage.removeItem('drishti_user_ai_model');
      setSaved(true);
      announce('AI API key cleared. Using backend .env default.');
    }

    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  const handleClear = () => {
    playChime('click');
    setApiKey('');
    localStorage.removeItem('drishti_user_ai_key');
    localStorage.removeItem('drishti_user_ai_provider');
    localStorage.removeItem('drishti_user_ai_model');
    announce('Cleared user AI key');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="api-modal-title"
    >
      <div className="w-full max-w-lg p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative text-left">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-drishti-500/20 text-drishti-400 border border-drishti-500/30 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 id="api-modal-title" className="text-base font-bold text-white">
                Vision AI Configuration
              </h3>
              <p className="text-xs text-slate-400">Configure provider & API keys for live scene analysis</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors focus:ring-2 focus:ring-yellow-400"
            aria-label="Close API Key dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              AI Vision Provider:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setProvider('gemini');
                  setModel('gemini-3.8-flash');
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  provider === 'gemini'
                    ? 'bg-drishti-500/15 border-drishti-400 text-white shadow-glow-primary'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>Google Gemini</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-normal">
                    Latest / Fast
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">gemini-3.8-flash</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProvider('openai');
                  setModel('gpt-4o-mini');
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  provider === 'openai'
                    ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-glow-accent'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>OpenAI Vision</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">gpt-4o-mini / gpt-4o</div>
              </button>
            </div>
          </div>

          {/* API Key Input */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-300">
                {provider === 'gemini' ? 'Google Gemini API Key:' : 'OpenAI API Key:'}
              </label>
              {provider === 'gemini' && (
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-drishti-400 hover:underline flex items-center gap-1"
                >
                  <span>Get free key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={provider === 'gemini' ? 'AIzaSy...' : 'sk-proj-...'}
                className="w-full p-3 pr-10 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-600 text-xs font-mono focus:ring-2 focus:ring-drishti-400"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                aria-label={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
              💡 Tip: You can also configure <code className="text-drishti-300 font-mono">AI_API_KEY</code> directly in <code className="text-drishti-300 font-mono">DRISHTI/backend-drishti/.env</code>.
            </p>
          </div>

          {/* Model Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Model Identifier:
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:ring-2 focus:ring-drishti-400"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-slate-400 hover:text-red-400 transition-colors"
            >
              Clear Key
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-drishti-500 hover:bg-drishti-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-glow-primary focus:ring-2 focus:ring-yellow-400"
              >
                {saved ? <Check className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                <span>{saved ? 'Saved!' : 'Save & Use'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

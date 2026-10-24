import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, MessageSquare, X, Send, Sparkles } from 'lucide-react';
import { useAccessibility } from '../contexts/AccessibilityContext.jsx';

export const VoiceQuestionModal = ({ isOpen, onClose, onSubmit, initialQuestion = '', title = 'Ask Drishti' }) => {
  const [question, setQuestion] = useState(initialQuestion);
  const [isListening, setIsListening] = useState(false);
  const [hasSpeechRec, setHasSpeechRec] = useState(false);
  const recognitionRef = useRef(null);

  const { playChime, triggerHaptic, announce } = useAccessibility();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRec) {
        setHasSpeechRec(true);
        const recognition = new SpeechRec();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          playChime('capture');
          triggerHaptic([50]);
          announce('Microphone listening. Speak your question.');
        };

        recognition.onresult = (event) => {
          const spoken = event.results[0][0].transcript;
          setQuestion(spoken);
          setIsListening(false);
          announce(`Captured speech: ${spoken}`);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [playChime, triggerHaptic, announce]);

  useEffect(() => {
    if (isOpen) {
      setQuestion(initialQuestion);
    }
  }, [isOpen, initialQuestion]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Already started
      }
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!question.trim()) return;
    playChime('click');
    onSubmit(question.trim());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qa-modal-title"
    >
      <div className="w-full max-w-lg p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative text-left">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 id="qa-modal-title" className="text-base font-bold text-white">
                {title}
              </h3>
              <p className="text-xs text-slate-400">Speak or type what you'd like to inspect</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors focus:ring-2 focus:ring-yellow-400"
            aria-label="Close question dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Question Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Is there a clear path forward? What is the expiration date on this carton? Are there any stairs?"
              rows={3}
              className="w-full p-3.5 pr-12 rounded-2xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-drishti-400 resize-none"
              autoFocus
              aria-label="Your question about this scene"
            />

            {/* Voice Dictation Button */}
            {hasSpeechRec && (
              <button
                type="button"
                onClick={toggleListening}
                className={`absolute right-3 top-3 p-2 rounded-xl transition-all ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
                title={isListening ? 'Stop Listening' : 'Speak Question with Microphone'}
                aria-label={isListening ? 'Listening. Click to stop.' : 'Dictate question with voice.'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-drishti-400" />}
              </button>
            )}
          </div>

          {/* Quick Prompts Suggestions */}
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">
              Suggested Questions:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Is my path clear to walk forward?',
                'Read all text on this label',
                'What denomination is this banknote?',
                'Is someone standing near me?'
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setQuestion(suggestion)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-[11px] text-slate-300 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!question.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-drishti-500 to-cyan-500 hover:from-drishti-400 hover:to-cyan-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5 shadow-glow-primary disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-yellow-400"
            >
              <Send className="w-4 h-4" />
              <span>Ask Drishti</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

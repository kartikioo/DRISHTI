import React, { useState } from 'react';
import {
  Volume2,
  AlertTriangle,
  Compass,
  FileText,
  Boxes,
  Info,
  MessageSquare,
  Copy,
  Check,
  Sparkles,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Search,
  Coins,
  Users,
  Clock,
  Pill,
  BookOpen,
  Laptop,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import { SpeechPlayer } from './SpeechPlayer.jsx';
import { useSpeech } from '../contexts/SpeechContext.jsx';
import { useAccessibility } from '../contexts/AccessibilityContext.jsx';

export const AnalysisResult = ({ result, onOpenFollowUp, onGoBack }) => {
  const { speak } = useSpeech();
  const { playChime, triggerHaptic, announce, startEmergencyBeep, stopEmergencyBeep, isEmergencyBeeping } = useAccessibility();
  const [copied, setCopied] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [showDetailed, setShowDetailed] = useState(false);

  if (!result) return null;

  const {
    mode,
    summary,
    detailedDescription,
    detectedText,
    detectedObjects = [],
    peopleCount = 0,
    peopleDetails,
    currencyDetails,
    hazards = [],
    navigationAdvice,
    audioTranscript,
    aiProvider,
    aiModel,
    latencyMs
  } = result;

  const handleCopySummary = () => {
    playChime('click');
    const textToCopy = `DRISHTI Analysis:\nSummary: ${summary}\n\nNavigation: ${navigationAdvice || 'None'}\n\nDetected Text: ${detectedText || 'None'}\n\nDetails: ${detailedDescription}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    announce('Analysis results copied to clipboard');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyTextOnly = () => {
    if (!detectedText) return;
    playChime('click');
    navigator.clipboard.writeText(detectedText);
    setCopiedText(true);
    announce('Detected text copied to clipboard');
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleSpeakSummaryOnly = () => {
    playChime('click');
    speak(summary, true);
  };

  const handleSpeakTextAloud = () => {
    if (!detectedText) return;
    playChime('click');
    speak(`The text reads: ${detectedText}`, true);
    announce('Reading detected text aloud');
  };

  const handleSpeakCurrency = () => {
    if (!currencyDetails) return;
    playChime('click');
    const total = currencyDetails.totalValue || 0;
    const unit = currencyDetails.currencyUnit || 'Rupees';
    const breakdown = currencyDetails.breakdown && currencyDetails.breakdown.length > 0
      ? currencyDetails.breakdown.join(', ')
      : 'no coin breakdown available';
    speak(`Total currency detected: ${total} ${unit}. Breakdown: ${breakdown}`, true);
    announce(`Speaking currency: ${total} ${unit}`);
  };

  const handleSpeakClockDirections = () => {
    playChime('click');
    const objectList = (Array.isArray(detectedObjects) ? detectedObjects : [])
      .filter((o) => o && (o.name || typeof o === 'string'))
      .map((o) => {
        const name = typeof o === 'string' ? o : o.name;
        const clock = o.clockPosition || o.position || 'front';
        const distance = o.distance ? `, ${o.distance} away` : '';
        return `${name} at your ${clock}${distance}`;
      })
      .join('. ');
    speak(`Clock positions of objects around you: ${objectList || 'None specified'}`, true);
    announce('Speaking clock positions of objects');
  };

  const hasCriticalHazards = Array.isArray(hazards) && hazards.length > 0;
  const isMedicineText = detectedText && /(mg|tablet|capsule|dosage|syrup|expiry|pharma|exp:|rx|dose)/i.test(detectedText);

  return (
    <div
      className="w-full space-y-4 my-6 animate-fadeIn"
      role="region"
      aria-label="Auditory Scene Description Results"
    >
      {/* 1. Auditory Scene Description Guide Banner with Go Back Button */}
      <div className="p-4 rounded-2xl bg-slate-900/95 border-2 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.25)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-cyan-200 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center shrink-0 animate-pulse">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-white text-sm sm:text-base tracking-wide uppercase">
                Auditory Scene Description
              </span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold">
                Active
              </span>
            </div>
            <p className="text-xs text-cyan-200/90 mt-0.5">
              Audio narration is vocalized aloud. Say <strong className="text-yellow-300">"Go Back"</strong> or press <strong className="text-yellow-300">Key B / Esc</strong> to return to camera.
            </p>
          </div>
        </div>

        {onGoBack && (
          <button
            onClick={onGoBack}
            className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 active:bg-cyan-500 text-slate-950 font-black text-xs sm:text-sm shrink-0 flex items-center justify-center gap-2 shadow-glow-primary transition-all active:scale-95 focus:ring-4 focus:ring-yellow-400 border border-cyan-300"
            aria-label="Go Back to Live Camera Scanner. Say 'Go Back' or press B."
          >
            <ArrowLeft className="w-4 h-4 stroke-[3]" />
            <span>Go Back to Camera</span>
          </button>
        )}
      </div>

      {/* 2. Speech Player for Audio Narration */}
      <SpeechPlayer
        textToSpeak={audioTranscript || summary}
        label="AI Spoken Scene Narration"
      />

      {/* 2. Urgent Hazard Alert Banner */}
      {hasCriticalHazards && (
        <div
          className="p-4 rounded-2xl bg-red-950/70 border-2 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)] backdrop-blur-md"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center shrink-0 animate-pulse">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-extrabold text-red-300 tracking-wide uppercase">
                  Safety Alert & Obstacles Detected
                </h3>

                <div className="space-y-2 mt-2">
                  {hazards.map((hazard, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-red-900/40 border border-red-500/40 text-xs sm:text-sm text-red-200"
                    >
                      <p className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>{hazard.type || hazard.description || hazard}</span>
                      </p>
                      {hazard.advice && (
                        <p className="text-xs text-red-300/90 mt-1 pl-5">
                          <span className="font-semibold text-white">Action:</span> {hazard.advice}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Beep Alarm Control */}
            <div>
              {isEmergencyBeeping ? (
                <button
                  onClick={stopEmergencyBeep}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-yellow-300 border border-yellow-500/50 text-xs font-bold transition-all focus:ring-2 focus:ring-yellow-400"
                  aria-label="Silence Emergency Beep Alarm"
                >
                  Silence Beep
                </button>
              ) : (
                <button
                  onClick={startEmergencyBeep}
                  className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-glow-primary focus:ring-2 focus:ring-yellow-400"
                  aria-label="Trigger Audible Alarm Beep"
                >
                  Sound Alarm
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. FIND OBJECT (Clock Face Radar Section - Only in Find Mode) */}
      {mode === 'find' && (
        <div className="p-5 rounded-2xl bg-cyan-950/40 border-2 border-cyan-500/60 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Find Object — Clock Position Radar</h3>
                <p className="text-xs text-cyan-300">12 o'clock is directly straight ahead</p>
              </div>
            </div>

            <button
              onClick={handleSpeakClockDirections}
              className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-glow-primary focus:ring-2 focus:ring-yellow-400"
              aria-label="Read clock positions of items aloud"
            >
              <Volume2 className="w-4 h-4 fill-slate-950" />
              <span>Read Directions</span>
            </button>
          </div>

          {Array.isArray(detectedObjects) && detectedObjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 mt-3">
              {detectedObjects.map((obj, i) => {
                const name = typeof obj === 'string' ? obj : obj?.name || 'Object';
                const distance = obj?.distance ? `Distance: ~${obj.distance}` : 'Near you';
                const clock = obj?.clockPosition || "12 o'clock";
                return (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-950/80 border border-cyan-500/30 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-sm text-white block capitalize">
                        {name}
                      </span>
                      <span className="text-xs text-slate-400">
                        {distance}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono text-xs font-bold block">
                        {clock}
                      </span>
                      <span className="text-[10px] text-slate-400">clock dial</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/30 mt-3 flex items-center justify-between gap-3 text-xs sm:text-sm text-slate-300">
              <span className="font-semibold text-amber-300">
                Clock position cannot find. This object cannot be found in this view.
              </span>
              <button
                onClick={() => speak(audioTranscript || 'Clock position cannot find. This object cannot be found in this view. If you show a watch or clock, the time will be detected.', true)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 hover:text-white flex items-center gap-1 border border-slate-700"
              >
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Listen</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. CURRENCY IDENTIFIER (Banknotes & Coins - Indian Rupee INR) */}
      {(mode === 'currency' || (currencyDetails && currencyDetails.totalValue > 0)) && (
        <div className="p-5 rounded-2xl bg-yellow-950/40 border-2 border-yellow-500/60 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 flex items-center justify-center">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Indian Currency Total & Breakdown</h3>
                <p className="text-xs text-yellow-300">Banknotes & coins identified</p>
              </div>
            </div>

            <button
              onClick={handleSpeakCurrency}
              className="px-3.5 py-1.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-glow-primary focus:ring-2 focus:ring-yellow-400"
              aria-label="Speak currency total aloud"
            >
              <Volume2 className="w-4 h-4 fill-slate-950" />
              <span>Listen Total</span>
            </button>
          </div>

          {/* Big Total Value Display */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-yellow-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Calculated Amount</span>
              <div className="text-3xl font-black text-yellow-400 font-mono">
                ₹{currencyDetails?.totalValue || 0}
                <span className="text-sm font-normal text-slate-300 ml-2">
                  ({currencyDetails?.currencyUnit || 'INR'})
                </span>
              </div>
            </div>

            {currencyDetails?.breakdown && currencyDetails.breakdown.length > 0 && (
              <div className="flex flex-wrap gap-1.5 max-w-sm">
                {currencyDetails.breakdown.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-yellow-500/20 text-yellow-200 border border-yellow-500/30 text-xs font-semibold"
                  >
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. READ TEXT (Document, Book, Sign & Medicine OCR) */}
      {(mode === 'text' || (detectedText && detectedText.trim().length > 0)) && (
        <div className="p-5 rounded-2xl bg-blue-950/40 border-2 border-blue-500/60 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center justify-center">
                {isMedicineText ? <Pill className="w-5 h-5 text-emerald-400" /> : <FileText className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{isMedicineText ? 'Medicine & Prescription Reading' : 'Detected Text & Document Reading'}</span>
                  {isMedicineText && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold uppercase">
                      Medical
                    </span>
                  )}
                </h3>
                <p className="text-xs text-blue-300">Books, paperwork, signs, medicine dosage & labels</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSpeakTextAloud}
                className="px-3.5 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-glow-primary focus:ring-2 focus:ring-yellow-400"
                aria-label="Read detected text out loud"
              >
                <Volume2 className="w-4 h-4 fill-slate-950" />
                <span>Read Text Aloud</span>
              </button>

              <button
                onClick={handleCopyTextOnly}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs transition-colors flex items-center gap-1 focus:ring-2 focus:ring-yellow-400"
                title="Copy Detected Text"
                aria-label="Copy text to clipboard"
              >
                {copiedText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {detectedText && detectedText.trim().length > 0 ? (
            <div className="p-4 rounded-xl bg-slate-950/90 border border-blue-500/30 font-mono text-sm sm:text-base text-slate-100 whitespace-pre-wrap leading-relaxed select-text">
              {detectedText}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-blue-500/30 text-xs sm:text-sm text-slate-300 flex items-center justify-between gap-3">
              <span className="font-semibold text-amber-300">
                Reading text in medicine and book cannot be detected.
              </span>
              <button
                onClick={() => speak('Reading text in medicine and book cannot be detected. Please hold the medicine package or book directly in front of the camera.', true)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 hover:text-white flex items-center gap-1 border border-slate-700"
              >
                <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Listen</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 6. GENERAL SCENE SCANNER (Instant Summary + People Count) */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-drishti-500/20 text-drishti-400 border border-drishti-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Instant Scene Summary</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSpeakSummaryOnly}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs transition-colors flex items-center gap-1.5 focus:ring-2 focus:ring-yellow-400"
              title="Speak summary aloud"
              aria-label="Speak summary aloud"
            >
              <Volume2 className="w-4 h-4 text-drishti-400" />
              <span className="hidden sm:inline">Listen</span>
            </button>

            <button
              onClick={handleCopySummary}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs transition-colors flex items-center gap-1.5 focus:ring-2 focus:ring-yellow-400"
              title="Copy analysis text"
              aria-label="Copy analysis text to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        <p className="text-base sm:text-lg text-slate-100 font-medium leading-relaxed">
          {summary}
        </p>

        {/* People Count Badge if applicable */}
        {peopleCount > 0 && (
          <div className="mt-3 p-3 rounded-xl bg-purple-950/30 border border-purple-500/40 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-purple-300 uppercase tracking-wide">
                People Nearby: {peopleCount} detected
              </p>
              <p className="text-xs text-purple-100/90 font-medium">
                {peopleDetails || `${peopleCount} person(s) surrounded near your space.`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 7. Actionable Navigation Advice Card */}
      {navigationAdvice && (
        <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/40 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300 mb-1">
                Navigation & Movement Guidance
              </h4>
              <p className="text-sm text-cyan-100 font-medium leading-relaxed">
                {navigationAdvice}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 8. Surrounding Objects & Layout Inventory */}
      {Array.isArray(detectedObjects) && detectedObjects.length > 0 && mode !== 'find' && (
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-white">
              Surrounding Everyday Objects ({detectedObjects.length})
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {detectedObjects.map((obj, i) => {
              const name = typeof obj === 'string' ? obj : obj?.name || 'Object';
              const positionTag = (obj && typeof obj === 'object') ? (obj.clockPosition || obj.position || obj.distance || '') : '';
              return (
                <div
                  key={i}
                  className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-slate-200 capitalize">
                    {name}
                  </span>
                  {positionTag && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-drishti-300 border border-slate-700">
                      {positionTag}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 9. Detailed Environment Description (Collapsible) */}
      {detailedDescription && (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
          <button
            onClick={() => setShowDetailed(!showDetailed)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/30 transition-colors focus:ring-2 focus:ring-yellow-400"
            aria-expanded={showDetailed}
          >
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Detailed Spatial Breakdown & Layout
              </span>
            </div>
            {showDetailed ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showDetailed && (
            <div className="p-4 pt-1 border-t border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed space-y-2">
              <p>{detailedDescription}</p>
            </div>
          )}
        </div>
      )}

      {/* 10. Prominent Full-Width Bottom Go Back Action Button */}
      {onGoBack && (
        <button
          id="btn-go-back-bottom"
          onClick={onGoBack}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-400 via-drishti-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 active:scale-[0.99] text-slate-950 font-black text-base sm:text-lg flex items-center justify-center gap-3 shadow-[0_0_35px_rgba(6,182,212,0.4)] transition-all focus:ring-4 focus:ring-yellow-400 border-2 border-cyan-300 group"
          aria-label="Go Back to Live Camera Viewfinder to scan again. Shortcut key B or Escape."
        >
          <ArrowLeft className="w-6 h-6 stroke-[3] group-hover:-translate-x-1 transition-transform" />
          <span>← Return to Live Camera (Scan Again)</span>
        </button>
      )}

      {/* 11. Bottom Action & Metadata Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-400">
        <button
          onClick={onOpenFollowUp}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 font-semibold transition-colors flex items-center justify-center gap-2 focus:ring-2 focus:ring-yellow-400"
          aria-label="Ask a follow-up question about this captured scene"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Ask Drishti a Follow-Up Question</span>
        </button>

        <div className="flex items-center gap-3 self-center sm:self-auto text-[11px] text-slate-500">
          {aiProvider && (
            <span>
              Provider: <strong className="text-slate-400">{aiProvider}</strong> ({aiModel || 'vision'})
            </span>
          )}
          {latencyMs > 0 && <span>• {latencyMs}ms</span>}
        </div>
      </div>
    </div>
  );
};

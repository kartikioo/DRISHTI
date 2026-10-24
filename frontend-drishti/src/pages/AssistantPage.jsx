import React, { useState, useEffect, useCallback } from 'react';
import { CameraView } from '../components/CameraView.jsx';
import { CameraControls } from '../components/CameraControls.jsx';
import { CaptureButton } from '../components/CaptureButton.jsx';
import { ModeSelector } from '../components/ModeSelector.jsx';
import { ImagePreview } from '../components/ImagePreview.jsx';
import { AnalysisResult } from '../components/AnalysisResult.jsx';
import { VoiceQuestionModal } from '../components/VoiceQuestionModal.jsx';
import { ApiKeyModal } from '../components/ApiKeyModal.jsx';
import { useCamera } from '../hooks/useCamera.js';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts.js';
import { useSpeech } from '../contexts/SpeechContext.jsx';
import { useAccessibility } from '../contexts/AccessibilityContext.jsx';
import { useVoiceControl } from '../contexts/VoiceControlContext.jsx';
import { analysisService } from '../services/analysisService.js';
import {
  Key,
  HelpCircle,
  AlertCircle,
  Info,
  Sparkles,
  ShieldAlert,
  Search,
  RotateCcw,
  Mic,
  MicOff,
  PhoneCall,
  Volume2,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';

export const AssistantPage = ({ onOpenEmergency }) => {
  const [currentMode, setCurrentMode] = useState('general');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [currentResult, setCurrentResult] = useState(null);
  const [error, setError] = useState('');
  const [isRedScreenAlert, setIsRedScreenAlert] = useState(false);

  // Modals
  const [isQaModalOpen, setIsQaModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // Camera hook
  const {
    videoRef,
    isStreaming,
    hasPermission,
    errorMessage,
    facingMode,
    torchSupported,
    torchOn,
    startStream,
    stopStream,
    switchCamera,
    toggleTorch,
    captureFrame
  } = useCamera();

  // Speech and Accessibility
  const { speak, stop: stopSpeech, autoSpeak } = useSpeech();
  const {
    playChime,
    triggerHaptic,
    announce,
    contrastMode,
    setContrastMode,
    startEmergencyBeep,
    stopEmergencyBeep,
    isEmergencyBeeping
  } = useAccessibility();

  // Hands-free Voice Control
  const {
    isSupported: isVoiceSupported,
    isListening: isVoiceListening,
    isEnabled: isVoiceEnabled,
    toggleVoiceControl,
    lastCommand,
    registerCommandHandlers
  } = useVoiceControl();

  // Initialize camera stream on mount
  useEffect(() => {
    startStream();
    announce('Drishti Assistant ready. Camera loaded. Hands-free voice control is listening.');
    return () => {
      stopStream();
      stopSpeech();
      stopEmergencyBeep();
    };
  }, []);

  // Main Scene Capture & AI Analysis function
  const handleCaptureAndAnalyze = useCallback(async (promptOverride = '') => {
    if (isAnalyzing) return;
    setError('');

    let imagePayload = null;

    if (isStreaming) {
      // Capture live frame from video stream
      const frame = await captureFrame();
      if (!frame || !frame.dataUrl) {
        setError('Failed to capture frame from camera stream. Please ensure camera access is enabled or upload a photo.');
        playChime('alert');
        return;
      }
      setCapturedImage(frame.dataUrl);
      imagePayload = frame.dataUrl;
    } else if (capturedImage) {
      // Use existing uploaded/previewed image
      imagePayload = capturedImage;
    } else {
      setError('No camera stream or image available. Please start the camera or upload a photo.');
      playChime('alert');
      return;
    }

    setIsAnalyzing(true);
    playChime('capture');
    triggerHaptic([50]);
    announce('Analyzing scene with artificial intelligence...');

    try {
      const activePrompt = promptOverride || customPrompt;
      const response = await analysisService.analyzeImage(
        imagePayload,
        currentMode,
        activePrompt
      );

      setCurrentResult(response);
      playChime('success');
      triggerHaptic([60, 40, 60]);

      const returnGuide = 'To return to live camera, say "Go Back", press the B key, or click Go Back to Camera.';

      // If hazards present, trigger emergency beep alarm and red alert
      if (response.hazards && response.hazards.length > 0) {
        setIsRedScreenAlert(true);
        startEmergencyBeep();
        announce(`Safety warning: ${response.hazards.length} obstacle detected. Stand steady. ${returnGuide}`);
      } else {
        announce(`Auditory scene description ready. ${returnGuide}`);
      }

      // Auto-speak narration if enabled, and append spoken guidance to guide the user on how to return
      if (autoSpeak) {
        const transcript = response.audioTranscript || response.summary || 'Scene analysis completed.';
        const spokenWithGuide = `${transcript}. ${returnGuide}`;
        speak(spokenWithGuide, true);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      const errMsg = err.message || 'Vision analysis failed. Please check your internet connection and AI API key.';
      setError(errMsg);
      playChime('alert');
      announce(`Error: ${errMsg}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    isAnalyzing,
    isStreaming,
    capturedImage,
    captureFrame,
    currentMode,
    customPrompt,
    playChime,
    triggerHaptic,
    announce,
    autoSpeak,
    speak,
    startEmergencyBeep
  ]);

  // Dedicated Go Back handler to return from Auditory Scene Description to Live Camera
  const handleGoBack = useCallback(() => {
    playChime('click');
    stopSpeech();
    stopEmergencyBeep();
    setCapturedImage(null);
    setCurrentResult(null);
    setError('');
    announce('Returned to live camera scanner. Ready to scan.');
    speak('Returned to live camera viewfinder.', true);
    if (!isStreaming) {
      startStream();
    }
  }, [playChime, stopSpeech, stopEmergencyBeep, announce, speak, isStreaming, startStream]);

  // Wire Voice Control Command Handlers
  useEffect(() => {
    registerCommandHandlers({
      onScan: () => {
        announce('Voice command received: Tap to scan.');
        handleCaptureAndAnalyze();
      },
      onGoBack: () => {
        announce('Voice command received: Go back to camera.');
        handleGoBack();
      },
      onRetake: () => {
        announce('Voice command received: Re-take tab.');
        handleGoBack();
      },
      onSafetyAlert: () => {
        setCurrentMode('hazards');
        setIsRedScreenAlert(true);
        startEmergencyBeep();
        announce('Voice command received: Safety Alert active. Beep alarm on. Stand steady.');
        handleCaptureAndAnalyze();
      },
      onFindObject: (target) => {
        setCurrentMode('find');
        const item = target || 'keys, phone, cup, or charger';
        setCustomPrompt(item);
        announce(`Voice command received: Finding object ${item}.`);
        handleCaptureAndAnalyze(`Locate ${item} using clock face directions`);
      },
      onReadText: () => {
        setCurrentMode('text');
        announce('Voice command received: Read Text mode. Transcribing books, signs, and medicines.');
        handleCaptureAndAnalyze();
      },
      onCurrency: () => {
        setCurrentMode('currency');
        announce('Voice command received: Currency mode. Calculating notes and coins.');
        handleCaptureAndAnalyze();
      },
      onGeneralScan: () => {
        setCurrentMode('general');
        announce('Voice command received: General scan. Describing people and layout.');
        handleCaptureAndAnalyze();
      },
      onEmergencyContact: () => {
        announce('Voice command received: Opening emergency contact.');
        if (onOpenEmergency) onOpenEmergency();
      },
      onStopSpeech: () => {
        stopSpeech();
        stopEmergencyBeep();
        announce('Speech stopped.');
      },
      onReplay: () => {
        if (currentResult?.audioTranscript || currentResult?.summary) {
          speak(currentResult.audioTranscript || currentResult.summary, true);
        }
      }
    });
  }, [
    registerCommandHandlers,
    handleCaptureAndAnalyze,
    handleGoBack,
    currentResult,
    startEmergencyBeep,
    stopEmergencyBeep,
    announce,
    stopSpeech,
    speak,
    onOpenEmergency
  ]);

  // File Upload Fallback Handler
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    playChime('click');
    const reader = new FileReader();
    reader.onload = () => {
      setCapturedImage(reader.result);
      announce('Photo uploaded successfully. Press capture or say "tap to scan" to analyze.');
    };
    reader.readAsDataURL(file);
  };

  // Mode cycling via keyboard 'M'
  const handleCycleMode = () => {
    const modeList = ['general', 'find', 'hazards', 'text', 'currency', 'people', 'qa'];
    const nextIndex = (modeList.indexOf(currentMode) + 1) % modeList.length;
    const nextMode = modeList[nextIndex];
    setCurrentMode(nextMode);
    announce(`Vision mode: ${nextMode}`);
  };

  // Spoken Shortcuts Help
  const handleSpeakShortcuts = () => {
    speak(
      'Drishti Voice & Keyboard Controls: Say "Tap to Scan" or press Spacebar to inspect what is in front of you. When viewing an auditory scene description, say "Go Back", press Key B, or press Escape to return to the live camera scanner. Say "Safety Alert" for hazard alarm. Say "Find Object" for clock directions. Say "Read Text" for books, labels and medicines. Say "Currency" for Indian Rupee notes and coins. Say "Emergency Contact" for distress call.',
      true
    );
  };

  // Keyboard Shortcuts Hook
  useKeyboardShortcuts({
    onCapture: () => handleCaptureAndAnalyze(),
    onGoBack: handleGoBack,
    onStopSpeech: () => {
      stopSpeech();
      stopEmergencyBeep();
    },
    onReplaySpeech: () => {
      if (currentResult?.audioTranscript || currentResult?.summary) {
        speak(currentResult.audioTranscript || currentResult.summary, true);
      }
    },
    onNextMode: handleCycleMode,
    onToggleTheme: () => {
      const next = contrastMode === 'standard' ? 'yellow-black' : contrastMode === 'yellow-black' ? 'white-black' : 'standard';
      setContrastMode(next);
    },
    onOpenHelp: handleSpeakShortcuts
  });

  return (
    <main id="main-content" className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-5">
      
      {/* 1. SAFETY ALERT (Red Screen Alert Banner & Beep Controls) */}
      {(isRedScreenAlert || currentMode === 'hazards') && (
        <div
          className="p-5 rounded-3xl bg-red-950/90 border-4 border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.7)] flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse backdrop-blur-md"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black shrink-0 shadow-lg">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wide">
                Safety Alert Active — Red Hazard Screen
              </h2>
              <p className="text-xs text-red-200">
                {isEmergencyBeeping ? 'Audible warning beeps active • Scanning floor & walkway' : 'Obstacle & hazard inspection mode'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {isEmergencyBeeping ? (
              <button
                onClick={stopEmergencyBeep}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-yellow-300 font-bold text-xs border border-yellow-500/50 shadow-sm transition-colors focus:ring-2 focus:ring-yellow-400"
              >
                Silence Beep
              </button>
            ) : (
              <button
                onClick={startEmergencyBeep}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-glow-primary transition-colors focus:ring-2 focus:ring-yellow-400"
              >
                Turn On Beep
              </button>
            )}

            <button
              onClick={() => {
                stopEmergencyBeep();
                setIsRedScreenAlert(false);
                setCurrentMode('general');
                announce('Exited Safety Alert mode. Switched to General Scan.');
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 text-slate-200 hover:text-white font-bold text-xs border border-slate-700 transition-colors focus:ring-2 focus:ring-yellow-400"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 2. Hands-Free Voice Control Status Bar */}
      <div
        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isVoiceListening
            ? 'bg-emerald-950/40 border-emerald-500/50 shadow-[0_0_20px_rgba(52,211,153,0.2)]'
            : 'bg-slate-900/60 border-slate-800'
        }`}
        role="region"
        aria-label="Hands-Free Voice Control Status"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
              isVoiceListening
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}
          >
            {isVoiceEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Hands-Free Voice Control</h3>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  isVoiceListening
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {isVoiceListening ? 'Listening Live' : isVoiceEnabled ? 'Ready' : 'Paused'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Say: <strong className="text-emerald-300">"Tap to Scan"</strong>,{' '}
              <strong className="text-cyan-300">"Re-take"</strong>,{' '}
              <strong className="text-red-300">"Safety Alert"</strong>,{' '}
              <strong className="text-blue-300">"Find Object"</strong>, or{' '}
              <strong className="text-yellow-300">"Read Text"</strong>
            </p>
            {lastCommand && (
              <p className="text-[11px] text-drishti-300 mt-0.5">
                Recognized Command: <strong>"{lastCommand}"</strong>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onOpenEmergency && (
            <button
              onClick={onOpenEmergency}
              className="px-3 py-1.5 rounded-xl bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-500/50 text-xs font-bold transition-colors flex items-center gap-1.5 focus:ring-2 focus:ring-yellow-400"
              title="Open Emergency Contact"
            >
              <PhoneCall className="w-3.5 h-3.5 text-red-400" />
              <span>SOS Contact</span>
            </button>
          )}

          <button
            onClick={toggleVoiceControl}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all focus:ring-2 focus:ring-yellow-400 ${
              isVoiceEnabled
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-glow-primary'
            }`}
          >
            {isVoiceEnabled ? 'Mute Mic' : 'Start Voice Control'}
          </button>
        </div>
      </div>

      {/* 3. Mode Selector Tabs */}
      <ModeSelector
        currentMode={currentMode}
        onSelectMode={(mode) => {
          setCurrentMode(mode);
          if (mode === 'hazards') {
            setIsRedScreenAlert(true);
            startEmergencyBeep();
          } else {
            setIsRedScreenAlert(false);
            stopEmergencyBeep();
          }
        }}
        onOpenQaModal={() => setIsQaModalOpen(true)}
      />

      {/* 4. Find Object Quick Chips (Only in Find Mode) */}
      {currentMode === 'find' && (
        <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/40 space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-cyan-300 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" />
              <span>Target Object Locator (Clock Face Directions)</span>
            </span>
            <span className="text-[11px] text-slate-400">Click or say "Find [object]"</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {['Clock / Watch (Time)', 'Keys', 'Phone', 'Cup / Mug', 'Water Bottle', 'Charger', 'Laptop', 'Wallet', 'Glasses'].map((item) => (
              <button
                key={item}
                onClick={() => {
                  const query = item.includes('Clock') ? 'clock or watch and detect the exact time' : `Locate ${item}`;
                  setCustomPrompt(query);
                  announce(`Searching for ${item}`);
                  handleCaptureAndAnalyze(query);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/50 text-xs font-semibold transition-all focus:ring-2 focus:ring-yellow-400"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. Main Content: Dedicated Auditory Scene Description View OR Live Camera Scanner */}
      {currentResult ? (
        <section
          aria-label="Auditory Scene Description View"
          className="space-y-4 animate-fadeIn"
        >
          {/* Top Auditory Scene Description Navigation & Return Bar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/95 border-2 border-cyan-400 shadow-[0_0_35px_rgba(6,182,212,0.25)] backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                id="btn-go-back-top"
                onClick={handleGoBack}
                className="px-5 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 active:bg-cyan-500 text-slate-950 font-black text-sm sm:text-base flex items-center gap-2.5 shadow-glow-primary transition-all active:scale-95 focus:ring-4 focus:ring-yellow-400 border border-cyan-300 shrink-0"
                aria-label="Go Back to live camera scanner. Voice command: say 'Go Back'. Keyboard shortcut: press Escape or B."
              >
                <ArrowLeft className="w-5 h-5 stroke-[3]" />
                <span>← Go Back to Camera</span>
              </button>
              <div>
                <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Auditory Scene Description</span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold">
                    Active
                  </span>
                </h2>
                <p className="text-xs text-cyan-200/90 font-medium mt-0.5">
                  Audio narration ready • Say <strong className="text-yellow-300">"Go Back"</strong> or press <strong className="text-yellow-300">Esc / B</strong> to return
                </p>
              </div>
            </div>

            {/* Compact Snapshot Preview Thumbnail so screen is never a blank black frame */}
            {capturedImage && (
              <div className="flex items-center gap-3 self-start sm:self-auto bg-slate-950/80 p-2 pr-3.5 rounded-xl border border-slate-800">
                <img
                  src={capturedImage}
                  alt="Captured snapshot photo"
                  className="w-14 h-12 object-cover rounded-lg border border-slate-700 shadow-sm"
                />
                <div className="text-[11px] leading-tight">
                  <span className="text-slate-400 block font-semibold">Analyzed Photo</span>
                  <span className="text-emerald-400 font-bold">Processed</span>
                </div>
              </div>
            )}
          </div>

          {/* Analysis Results & Speech Narration with Go Back functionality */}
          <AnalysisResult
            result={currentResult}
            onOpenFollowUp={() => setIsQaModalOpen(true)}
            onGoBack={handleGoBack}
          />
        </section>
      ) : (
        <section aria-label="Camera and Scanner View" className="space-y-4">
          {/* Re-take Tab / Discard Bar (Prominent when image is snapshot and waiting to analyze) */}
          {capturedImage && (
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 animate-fadeIn">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-cyan-200">Snapshot Captured</span>
                <span className="text-xs text-slate-400 hidden sm:inline">— ready to describe or retake</span>
              </div>
              <button
                onClick={handleGoBack}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-glow-primary focus:ring-2 focus:ring-yellow-400"
                title="Discard snapshot and return to live camera (Say 'Re-take')"
                aria-label="Re-take snapshot and resume camera"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Re-take Tab</span>
              </button>
            </div>
          )}

          {/* Camera Viewport or Captured Snapshot Preview */}
          <div className="space-y-3">
            {capturedImage ? (
              <div
                className="relative w-full aspect-[4/3] sm:aspect-[16/9] max-h-[520px] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex items-center justify-center group"
                role="region"
                aria-label="Captured photo snapshot"
              >
                <img
                  src={capturedImage}
                  alt="Captured scene for AI accessibility analysis"
                  className="w-full h-full object-cover"
                />

                {/* AI Analyzing Scanner Beam Overlay while processing */}
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] flex flex-col items-center justify-center z-20">
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-drishti-400 to-transparent shadow-[0_0_15px_#22c55e] animate-scan" />
                    <div className="px-5 py-3 rounded-2xl bg-slate-900/90 border border-drishti-400/50 shadow-glow-primary flex items-center gap-3">
                      <RefreshCw className="w-5 h-5 text-drishti-400 animate-spin" />
                      <div className="text-left">
                        <p className="text-sm font-bold text-white">Analyzing Scene with AI...</p>
                        <p className="text-xs text-drishti-300">Processing visual information</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Top Status Badge */}
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-xs">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="font-medium text-slate-200">Captured Snapshot</span>
                </div>

                {/* Mode Tag */}
                <div className="absolute bottom-4 left-4 z-10 px-3 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-800 text-xs font-bold text-drishti-300 uppercase tracking-wider">
                  {currentMode} Mode
                </div>
              </div>
            ) : (
              <CameraView
                videoRef={videoRef}
                isStreaming={isStreaming}
                hasPermission={hasPermission}
                errorMessage={errorMessage}
                isAnalyzing={isAnalyzing}
                onRetryCamera={() => startStream()}
                onFileUpload={handleFileUpload}
              />
            )}

            {/* Camera Device Controls */}
            <CameraControls
              isStreaming={isStreaming}
              facingMode={facingMode}
              torchSupported={torchSupported}
              torchOn={torchOn}
              onSwitchCamera={switchCamera}
              onToggleTorch={toggleTorch}
              onToggleStream={() => (isStreaming ? stopStream() : startStream())}
              onFileUpload={handleFileUpload}
            />
          </div>

          {/* Extra Large Accessible Capture Button (Tap to Scan) */}
          <CaptureButton
            onClick={() => handleCaptureAndAnalyze()}
            isAnalyzing={isAnalyzing}
            disabled={!isStreaming && !capturedImage}
          />
        </section>
      )}

      {/* Error Alert (if any) */}
      {error && (
        <div
          className="p-4 rounded-2xl bg-red-950/60 border-2 border-red-500/80 text-red-200 text-xs sm:text-sm flex items-start gap-3 shadow-lg"
          role="alert"
        >
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-red-100">Analysis Notification</p>
            <p className="mt-0.5 leading-relaxed">{error}</p>
            {error.includes('AI_API_KEY') && (
              <button
                onClick={() => setIsApiKeyModalOpen(true)}
                className="mt-2.5 px-3 py-1.5 rounded-lg bg-red-500 text-white font-bold text-xs hover:bg-red-400 transition-colors shadow-sm"
              >
                Enter API Key Now
              </button>
            )}
          </div>
        </div>
      )}

      {/* 10. Voice & Text Question Modal for Ask Drishti */}
      <VoiceQuestionModal
        isOpen={isQaModalOpen}
        onClose={() => setIsQaModalOpen(false)}
        onSubmit={(question) => {
          setCustomPrompt(question);
          handleCaptureAndAnalyze(question);
        }}
        title={currentResult ? 'Ask Follow-Up on Scene' : 'Ask Drishti About View'}
      />

      {/* 11. AI Key & Provider Config Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
      />

    </main>
  );
};

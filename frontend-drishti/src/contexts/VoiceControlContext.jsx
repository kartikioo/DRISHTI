import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useSpeech } from './SpeechContext.jsx';
import { useAccessibility } from './AccessibilityContext.jsx';

const VoiceControlContext = createContext(null);

export const VoiceControlProvider = ({ children }) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isEnabled, setIsEnabled] = useState(() => localStorage.getItem('drishti_voice_control') !== 'false');
  const [lastCommand, setLastCommand] = useState('');
  const [lastTranscript, setLastTranscript] = useState('');

  const recognitionRef = useRef(null);
  const commandHandlersRef = useRef({});
  const isEnabledRef = useRef(isEnabled);
  isEnabledRef.current = isEnabled;

  const { speak } = useSpeech();
  const { playChime, triggerHaptic, announce } = useAccessibility();

  // Register command handlers dynamically from AssistantPage
  const registerCommandHandlers = useCallback((handlers) => {
    commandHandlersRef.current = { ...commandHandlersRef.current, ...handlers };
  }, []);

  // Parse spoken command against Drishti intents
  const processSpokenTranscript = useCallback((rawText) => {
    const text = rawText.toLowerCase().trim();
    setLastTranscript(rawText);

    const handlers = commandHandlersRef.current;
    if (!handlers) return;

    // 1. Scan / Capture Intent ("tap to scan", "scan", "capture", "take photo", "analyze")
    if (
      text.includes('tap to scan') ||
      text.includes('scan') ||
      text.includes('capture') ||
      text.includes('take photo') ||
      text.includes('analyze') ||
      text.includes('tell me what is in front')
    ) {
      setLastCommand('Tap to Scan');
      playChime('click');
      triggerHaptic([40, 40]);
      if (handlers.onScan) handlers.onScan();
      return;
    }

    // 2. Go Back / Return to Camera Intent ("go back", "back", "back to camera", "return", "return to camera", "camera", "live view", "scan again")
    if (
      text.includes('go back') ||
      text.includes('back to camera') ||
      text.includes('back') ||
      text.includes('return to camera') ||
      text.includes('return') ||
      text.includes('live view') ||
      text.includes('live camera') ||
      text.includes('open camera') ||
      text.includes('camera screen') ||
      text.includes('scan again') ||
      text.includes('scan another') ||
      text.includes('viewfinder')
    ) {
      setLastCommand('Go Back to Camera');
      playChime('click');
      triggerHaptic([50]);
      if (handlers.onGoBack) handlers.onGoBack();
      else if (handlers.onRetake) handlers.onRetake();
      return;
    }

    // 3. Retake / Discard Intent ("retake", "re-take", "retake tab", "discard", "clear", "cancel")
    if (
      text.includes('retake') ||
      text.includes('re-take') ||
      text.includes('discard') ||
      text.includes('take another') ||
      text.includes('clear') ||
      text.includes('start over')
    ) {
      setLastCommand('Re-take');
      playChime('click');
      triggerHaptic([50]);
      if (handlers.onRetake) handlers.onRetake();
      else if (handlers.onGoBack) handlers.onGoBack();
      return;
    }

    // 3. Safety Alert Intent ("safety alert", "tap to safety alert", "hazard", "danger")
    if (
      text.includes('safety alert') ||
      text.includes('safety') ||
      text.includes('hazard') ||
      text.includes('danger') ||
      text.includes('obstacle')
    ) {
      setLastCommand('Safety Alert');
      playChime('alert');
      triggerHaptic([60, 40, 60]);
      if (handlers.onSafetyAlert) handlers.onSafetyAlert();
      return;
    }

    // 4. Find Object Intent ("find object", "clock position", "find clock", "watch", "time", "keys", "cup", "phone")
    if (
      text.includes('clock position') ||
      text.includes('find clock') ||
      text.includes('detect time') ||
      text.includes('watch') ||
      text.includes('what time is it') ||
      text.includes('find object') ||
      text.includes('find') ||
      text.includes('locate') ||
      text.includes('where is my')
    ) {
      setLastCommand('Find Object');
      playChime('click');
      triggerHaptic([40]);
      let target = '';
      if (text.includes('clock') || text.includes('watch') || text.includes('time')) {
        target = 'clock or watch time';
      } else if (text.includes('find my ')) target = text.split('find my ')[1];
      else if (text.includes('find ')) target = text.split('find ')[1];
      else if (text.includes('locate ')) target = text.split('locate ')[1];

      if (handlers.onFindObject) handlers.onFindObject(target.trim());
      return;
    }

    // 5. Read Text Intent ("read text", "read medicine", "medicine", "read book", "book", "label")
    if (
      text.includes('read text') ||
      text.includes('read medicine') ||
      text.includes('medicine') ||
      text.includes('read book') ||
      text.includes('book') ||
      text.includes('read signing') ||
      text.includes('read label') ||
      text.includes('read')
    ) {
      setLastCommand('Read Text (Medicine & Book)');
      playChime('click');
      triggerHaptic([40]);
      if (handlers.onReadText) handlers.onReadText();
      return;
    }

    // 6. Currency Intent ("currency", "identify currency", "banknote", "coin", "rupee", "rupees", "money")
    if (
      text.includes('currency') ||
      text.includes('rupee') ||
      text.includes('rupees') ||
      text.includes('coin') ||
      text.includes('coins') ||
      text.includes('banknote') ||
      text.includes('money')
    ) {
      setLastCommand('Currency & Coins');
      playChime('click');
      triggerHaptic([40]);
      if (handlers.onCurrency) handlers.onCurrency();
      return;
    }

    // 7. General Scanner Intent ("general scan", "general", "surroundings", "people count", "layout")
    if (
      text.includes('general scan') ||
      text.includes('general') ||
      text.includes('surroundings') ||
      text.includes('layout')
    ) {
      setLastCommand('General Scan');
      playChime('click');
      triggerHaptic([40]);
      if (handlers.onGeneralScan) handlers.onGeneralScan();
      return;
    }

    // 8. Emergency Contact Intent ("emergency contact", "emergency", "call for help", "sos")
    if (
      text.includes('emergency contact') ||
      text.includes('emergency') ||
      text.includes('call contact') ||
      text.includes('sos') ||
      text.includes('help')
    ) {
      setLastCommand('Emergency Contact');
      playChime('alert');
      triggerHaptic([100, 50, 100]);
      if (handlers.onEmergencyContact) handlers.onEmergencyContact();
      return;
    }

    // 9. Stop Speech Intent ("stop", "quiet", "silence", "be quiet", "pause")
    if (
      text.includes('stop') ||
      text.includes('quiet') ||
      text.includes('silence') ||
      text.includes('shut up') ||
      text.includes('be quiet')
    ) {
      setLastCommand('Stop Speech');
      if (handlers.onStopSpeech) handlers.onStopSpeech();
      return;
    }

    // 10. Replay Intent ("replay", "repeat", "read again")
    if (
      text.includes('repeat') ||
      text.includes('replay') ||
      text.includes('again')
    ) {
      setLastCommand('Replay Speech');
      if (handlers.onReplay) handlers.onReplay();
      return;
    }
  }, [playChime, triggerHaptic]);

  // Initialize browser speech recognition engine
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);
    const recognition = new SpeechRec();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript;
      processSpokenTranscript(transcript);
    };

    recognition.onerror = (event) => {
      // In Chromium 'no-speech' happens frequently when user is quiet
      if (event.error !== 'no-speech') {
        console.warn('Voice control recognition error:', event.error);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      // Auto-restart if voice control is still enabled
      if (isEnabledRef.current) {
        setTimeout(() => {
          if (isEnabledRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              // Ignore if already active
            }
          }
        }, 300);
      }
    };

    recognitionRef.current = recognition;

    if (isEnabled) {
      try {
        recognition.start();
      } catch (e) {
        // Handled
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, [processSpokenTranscript, isEnabled]);

  const toggleVoiceControl = useCallback(() => {
    const nextState = !isEnabled;
    setIsEnabled(nextState);
    isEnabledRef.current = nextState;
    localStorage.setItem('drishti_voice_control', nextState.toString());

    if (nextState) {
      playChime('success');
      triggerHaptic([60, 40, 60]);
      announce('Voice control enabled. Listening for commands.');
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {}
      }
    } else {
      playChime('click');
      announce('Voice control disabled.');
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
    }
  }, [isEnabled, playChime, triggerHaptic, announce]);

  return (
    <VoiceControlContext.Provider
      value={{
        isSupported,
        isListening,
        isEnabled,
        lastCommand,
        lastTranscript,
        toggleVoiceControl,
        registerCommandHandlers
      }}
    >
      {children}
    </VoiceControlContext.Provider>
  );
};

export const useVoiceControl = () => {
  const context = useContext(VoiceControlContext);
  if (!context) {
    throw new Error('useVoiceControl must be used within a VoiceControlProvider');
  }
  return context;
};

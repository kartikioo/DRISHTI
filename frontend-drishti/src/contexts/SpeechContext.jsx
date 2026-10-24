import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const SpeechContext = createContext(null);

export const SpeechProvider = ({ children }) => {
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [rate, setRate] = useState(() => parseFloat(localStorage.getItem('drishti_speech_rate') || '1.0'));
  const [pitch, setPitch] = useState(() => parseFloat(localStorage.getItem('drishti_speech_pitch') || '1.0'));
  const [autoSpeak, setAutoSpeak] = useState(() => localStorage.getItem('drishti_auto_speak') !== 'false');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentText, setCurrentText] = useState('');

  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);
  const currentUtteranceRef = useRef(null);

  // Load available system voices
  useEffect(() => {
    if (!synthRef.current) return;

    const updateVoices = () => {
      const available = synthRef.current.getVoices();
      setVoices(available);
      
      // Default to an English voice or first available
      const savedVoiceName = localStorage.getItem('drishti_voice_name');
      const preferred = available.find((v) => v.name === savedVoiceName) ||
                        available.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Siri'))) ||
                        available.find((v) => v.lang.startsWith('en')) ||
                        available[0];

      if (preferred) {
        setSelectedVoice(preferred);
      }
    };

    updateVoices();
    if (synthRef.current.onvoiceschanged !== undefined) {
      synthRef.current.onvoiceschanged = updateVoices;
    }
  }, []);

  // Save settings changes to localStorage
  useEffect(() => {
    localStorage.setItem('drishti_speech_rate', rate.toString());
  }, [rate]);

  useEffect(() => {
    localStorage.setItem('drishti_speech_pitch', pitch.toString());
  }, [pitch]);

  useEffect(() => {
    localStorage.setItem('drishti_auto_speak', autoSpeak.toString());
  }, [autoSpeak]);

  useEffect(() => {
    if (selectedVoice) {
      localStorage.setItem('drishti_voice_name', selectedVoice.name);
    }
  }, [selectedVoice]);

  // Cancel speech on unmount
  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentText('');
    }
  }, []);

  const pause = useCallback(() => {
    if (synthRef.current && isSpeaking) {
      synthRef.current.pause();
      setIsPaused(true);
    }
  }, [isSpeaking]);

  const resume = useCallback(() => {
    if (synthRef.current && isPaused) {
      synthRef.current.resume();
      setIsPaused(false);
    }
  }, [isPaused]);

  const speak = useCallback((text, priority = false) => {
    if (!synthRef.current || !text) return;

    // Clean text of markdown code blocks or asterisks before speaking
    const cleanedText = text
      .replace(/[*#_`~]/g, '')
      .replace(/https?:\/\/\S+/g, 'link')
      .trim();

    if (!cleanedText) return;

    // Unpause in case browser is in paused state
    if (synthRef.current.paused) {
      synthRef.current.resume();
    }

    // Cancel current speech if priority
    if (priority || synthRef.current.speaking || synthRef.current.pending) {
      synthRef.current.cancel();
    }

    // Small delay ensures previous cancel() in Chrome has cleanly finished
    setTimeout(() => {
      if (!synthRef.current) return;

      if (synthRef.current.paused) {
        synthRef.current.resume();
      }

      const utterance = new SpeechSynthesisUtterance(cleanedText);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      utterance.rate = rate;
      utterance.pitch = pitch;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
        setCurrentText(cleanedText);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentText('');
        if (typeof window !== 'undefined') window._activeUtterance = null;
      };

      utterance.onerror = (e) => {
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.warn('Speech synthesis utterance error:', e);
        }
        setIsSpeaking(false);
        setIsPaused(false);
        if (typeof window !== 'undefined') window._activeUtterance = null;
      };

      // Store in window to avoid Chrome V8 garbage collection dropping the utterance
      if (typeof window !== 'undefined') {
        window._activeUtterance = utterance;
      }
      currentUtteranceRef.current = utterance;
      synthRef.current.speak(utterance);
    }, 60);
  }, [selectedVoice, rate, pitch]);

  return (
    <SpeechContext.Provider
      value={{
        voices,
        selectedVoice,
        setSelectedVoice,
        rate,
        setRate,
        pitch,
        setPitch,
        autoSpeak,
        setAutoSpeak,
        isSpeaking,
        isPaused,
        currentText,
        speak,
        stop,
        pause,
        resume
      }}
    >
      {children}
    </SpeechContext.Provider>
  );
};

export const useSpeech = () => {
  const context = useContext(SpeechContext);
  if (!context) {
    throw new Error('useSpeech must be used within a SpeechProvider');
  }
  return context;
};

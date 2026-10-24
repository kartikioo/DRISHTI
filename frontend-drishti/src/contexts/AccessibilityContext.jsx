import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const AccessibilityContext = createContext(null);

export const AccessibilityProvider = ({ children }) => {
  const [contrastMode, setContrastMode] = useState(() => localStorage.getItem('drishti_contrast') || 'standard');
  const [fontScale, setFontScale] = useState(() => localStorage.getItem('drishti_font_scale') || 'normal');
  const [soundCues, setSoundCues] = useState(() => localStorage.getItem('drishti_sound_cues') !== 'false');
  const [haptics, setHaptics] = useState(() => localStorage.getItem('drishti_haptics') !== 'false');
  const [announcement, setAnnouncement] = useState('');

  const audioCtxRef = useRef(null);

  // Apply contrast theme & font scaling to root HTML document
  useEffect(() => {
    localStorage.setItem('drishti_contrast', contrastMode);
    const root = document.documentElement;
    root.classList.remove('theme-yellow-black', 'theme-white-black');
    if (contrastMode === 'yellow-black') {
      root.classList.add('theme-yellow-black');
    } else if (contrastMode === 'white-black') {
      root.classList.add('theme-white-black');
    }
  }, [contrastMode]);

  useEffect(() => {
    localStorage.setItem('drishti_font_scale', fontScale);
    const root = document.documentElement;
    root.classList.remove('font-scale-large', 'font-scale-xlarge');
    if (fontScale === 'large') {
      root.classList.add('font-scale-large');
    } else if (fontScale === 'xlarge') {
      root.classList.add('font-scale-xlarge');
    }
  }, [fontScale]);

  useEffect(() => {
    localStorage.setItem('drishti_sound_cues', soundCues.toString());
  }, [soundCues]);

  useEffect(() => {
    localStorage.setItem('drishti_haptics', haptics.toString());
  }, [haptics]);

  // Audio synthesizer helper (Web Audio API)
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playTone = useCallback((freq, duration = 0.15, type = 'sine') => {
    if (!soundCues) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Web Audio error:', e);
    }
  }, [soundCues, getAudioContext]);

  // Accessibility Audio Cues
  const playChime = useCallback((cueType) => {
    if (!soundCues) return;
    switch (cueType) {
      case 'capture':
        playTone(523.25, 0.12, 'sine'); // C5
        setTimeout(() => playTone(659.25, 0.18, 'sine'), 120); // E5
        break;
      case 'success':
        playTone(440, 0.1, 'sine'); // A4
        setTimeout(() => playTone(554.37, 0.1, 'sine'), 100); // C#5
        setTimeout(() => playTone(659.25, 0.25, 'triangle'), 200); // E5
        break;
      case 'alert':
      case 'hazard':
        playTone(880, 0.15, 'square'); // High A5 alert
        setTimeout(() => playTone(880, 0.2, 'square'), 180);
        break;
      case 'click':
        playTone(400, 0.05, 'triangle');
        break;
      default:
        playTone(440, 0.1, 'sine');
    }
  }, [soundCues, playTone]);

  // Haptic feedback
  const triggerHaptic = useCallback((pattern = [50]) => {
    if (haptics && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Ignore if unsupported or restricted
      }
    }
  }, [haptics]);

  // Screen reader live announcement
  const announce = useCallback((text) => {
    setAnnouncement(text);
    // Clear after delay so repeated messages are re-announced
    setTimeout(() => {
      setAnnouncement('');
    }, 4000);
  }, []);

  const emergencyIntervalRef = useRef(null);
  const [isEmergencyBeeping, setIsEmergencyBeeping] = useState(false);

  const startEmergencyBeep = useCallback(() => {
    if (emergencyIntervalRef.current) return;
    setIsEmergencyBeeping(true);
    playTone(880, 0.22, 'square');
    emergencyIntervalRef.current = setInterval(() => {
      playTone(880, 0.18, 'square');
      setTimeout(() => playTone(659.25, 0.18, 'square'), 200);
    }, 650);
  }, [playTone]);

  const stopEmergencyBeep = useCallback(() => {
    if (emergencyIntervalRef.current) {
      clearInterval(emergencyIntervalRef.current);
      emergencyIntervalRef.current = null;
    }
    setIsEmergencyBeeping(false);
  }, []);

  useEffect(() => {
    return () => {
      if (emergencyIntervalRef.current) {
        clearInterval(emergencyIntervalRef.current);
      }
    };
  }, []);

  return (
    <AccessibilityContext.Provider
      value={{
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
        announcement,
        announce,
        startEmergencyBeep,
        stopEmergencyBeep,
        isEmergencyBeeping
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

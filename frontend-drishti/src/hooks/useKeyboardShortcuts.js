import { useEffect } from 'react';

/**
 * Global Accessibility Keyboard Shortcuts
 * Allows visually impaired users to operate Drishti hands-free with single keystrokes.
 */
export const useKeyboardShortcuts = ({
  onCapture,
  onStopSpeech,
  onReplaySpeech,
  onNextMode,
  onToggleTheme,
  onOpenHelp,
  onGoBack
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing inside an input or textarea
      const target = e.target;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      // 'B', 'Escape', or 'Backspace' for Go Back to Camera
      if (key === 'b' || key === 'escape' || key === 'backspace') {
        if (key === 'escape' || key === 'backspace') e.preventDefault();
        if (onGoBack) onGoBack();
        return;
      }

      // Spacebar or 'C' for Capture
      if (key === 'c' || (e.code === 'Space' && !e.repeat)) {
        if (e.code === 'Space') e.preventDefault();
        if (onCapture) onCapture();
      }

      // 'S' for Stop Speech
      if (key === 's') {
        if (onStopSpeech) onStopSpeech();
      }

      // 'R' for Replay Speech
      if (key === 'r') {
        if (onReplaySpeech) onReplaySpeech();
      }

      // 'M' for Next Mode
      if (key === 'm') {
        if (onNextMode) onNextMode();
      }

      // 'T' for Contrast Theme
      if (key === 't') {
        if (onToggleTheme) onToggleTheme();
      }

      // '?' for Spoken Keyboard Help
      if (key === '?' || (e.shiftKey && key === '/')) {
        if (onOpenHelp) onOpenHelp();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCapture, onStopSpeech, onReplaySpeech, onNextMode, onToggleTheme, onOpenHelp, onGoBack]);
};

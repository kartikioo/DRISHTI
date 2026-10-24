import React from 'react';
import { useAccessibility } from '../contexts/AccessibilityContext.jsx';

/**
 * Screen-Reader Live Region
 * Inaudible to sighted users, but immediately voiced by Screen Readers (VoiceOver, NVDA, TalkBack)
 */
export const AudioAnnouncer = () => {
  const { announcement } = useAccessibility();

  return (
    <div
      aria-live="assertive"
      aria-atomic="true"
      className="sr-only"
      id="drishti-live-announcer"
    >
      {announcement}
    </div>
  );
};

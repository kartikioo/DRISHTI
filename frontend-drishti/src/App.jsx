import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { SpeechProvider } from './contexts/SpeechContext.jsx';
import { AccessibilityProvider } from './contexts/AccessibilityContext.jsx';
import { VoiceControlProvider } from './contexts/VoiceControlContext.jsx';
import { AudioAnnouncer } from './components/AudioAnnouncer.jsx';
import { Navbar } from './components/Navbar.jsx';
import { AuthModal } from './components/AuthModal.jsx';
import { ApiKeyModal } from './components/ApiKeyModal.jsx';
import { EmergencyModal } from './components/EmergencyModal.jsx';
import { AssistantPage } from './pages/AssistantPage.jsx';
import { HistoryPage } from './pages/HistoryPage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { Eye, Heart } from 'lucide-react';

export const App = () => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isApiKeyOpen, setIsApiKeyOpen] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <SpeechProvider>
            <AccessibilityProvider>
              <VoiceControlProvider>
                <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 transition-colors">
              
              {/* Screen reader live region */}
              <AudioAnnouncer />

              {/* Navigation Header */}
              <Navbar
                onOpenAuth={() => setIsAuthOpen(true)}
                onOpenApiKeyModal={() => setIsApiKeyOpen(true)}
                onOpenEmergency={() => setIsEmergencyOpen(true)}
              />

              {/* Page View Routes */}
              <div className="flex-1">
                <Routes>
                  <Route path="/" element={<AssistantPage onOpenEmergency={() => setIsEmergencyOpen(true)} />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>

              {/* Global Modals */}
              <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
              <ApiKeyModal isOpen={isApiKeyOpen} onClose={() => setIsApiKeyOpen(false)} />
              <EmergencyModal isOpen={isEmergencyOpen} onClose={() => setIsEmergencyOpen(false)} />

              {/* Accessible Footer */}
              <footer className="border-t border-slate-900 bg-slate-950/90 py-6 px-4 text-center text-xs text-slate-500">
                <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-drishti-400" />
                    <span className="font-bold text-slate-300">DRISHTI</span>
                    <span>— Eyes for the Blind</span>
                  </div>
                  <p className="flex items-center gap-1">
                    <span>Engineered for Accessibility & Independence</span>
                  </p>
                  <p className="text-[11px] text-slate-600">
                    WCAG 2.1 AAA Compliant Design
                  </p>
                </div>
              </footer>

            </div>
            </VoiceControlProvider>
          </AccessibilityProvider>
        </SpeechProvider>
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>
  );
};

export default App;

import React, { useState } from 'react';
import { User, Lock, Mail, UserPlus, X, LogIn, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useAccessibility } from '../contexts/AccessibilityContext.jsx';

export const AuthModal = ({ isOpen, onClose }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, register, loginAsGuest } = useAuth();
  const { playChime, triggerHaptic, announce } = useAccessibility();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    playChime('click');

    try {
      if (isRegister) {
        await register({ email, password, full_name: fullName });
        announce('Account registered successfully.');
      } else {
        await login({ email, password });
        announce('Logged in successfully.');
      }
      playChime('success');
      triggerHaptic([50, 50]);
      onClose();
    } catch (err) {
      playChime('alert');
      setError(err.message || 'Authentication failed. Please verify credentials.');
      announce(`Authentication error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuest = async () => {
    playChime('click');
    setSubmitting(true);
    try {
      await loginAsGuest();
      playChime('success');
      announce('Signed in as Guest User.');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative text-left">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors focus:ring-2 focus:ring-yellow-400"
          aria-label="Close authentication window"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Heading */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-drishti-500/20 text-drishti-400 border border-drishti-500/30 flex items-center justify-center">
            {isRegister ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
          </div>
          <div>
            <h3 id="auth-modal-title" className="text-lg font-bold text-white">
              {isRegister ? 'Create Drishti Account' : 'Welcome to Drishti'}
            </h3>
            <p className="text-xs text-slate-400">
              {isRegister ? 'Save your analyses and accessibility preferences' : 'Sign in to access your scene history'}
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Full Name:
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Sharma"
                  className="w-full p-3 pl-10 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:ring-2 focus:ring-drishti-400"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Email Address:
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full p-3 pl-10 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:ring-2 focus:ring-drishti-400"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Password:
            </label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3 pl-10 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:ring-2 focus:ring-drishti-400"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-drishti-500 to-cyan-500 hover:from-drishti-400 hover:to-cyan-400 text-slate-950 font-bold text-sm transition-all shadow-glow-primary flex items-center justify-center gap-2 focus:ring-2 focus:ring-yellow-400 disabled:opacity-50"
          >
            <span>{isRegister ? 'Register Account' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Or</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {/* Instant Guest Mode Button */}
        <button
          onClick={handleGuest}
          disabled={submitting}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-2 focus:ring-2 focus:ring-yellow-400"
        >
          <ShieldCheck className="w-4 h-4 text-drishti-400" />
          <span>Continue Instantly as Guest (Zero Setup)</span>
        </button>

        {/* Toggle Register/Login */}
        <div className="mt-5 text-center">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="text-xs text-drishti-400 hover:text-drishti-300 font-medium underline"
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Create One"}
          </button>
        </div>
      </div>
    </div>
  );
};

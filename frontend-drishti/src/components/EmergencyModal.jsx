import React, { useState, useEffect } from 'react';
import { Phone, PhoneCall, AlertTriangle, X, Save, ShieldAlert, HeartHandshake } from 'lucide-react';
import { useAccessibility } from '../contexts/AccessibilityContext.jsx';
import { useSpeech } from '../contexts/SpeechContext.jsx';

export const EmergencyModal = ({ isOpen, onClose }) => {
  const [name, setName] = useState(() => localStorage.getItem('drishti_emergency_name') || 'Primary Emergency Contact');
  const [phone, setPhone] = useState(() => localStorage.getItem('drishti_emergency_phone') || '112');
  const [isEditing, setIsEditing] = useState(false);

  const { playChime, triggerHaptic, announce } = useAccessibility();
  const { speak } = useSpeech();

  useEffect(() => {
    if (isOpen) {
      announce(`Emergency contact is ${name}, telephone number ${phone}.`);
      speak(`Emergency contact: ${name}, phone number: ${phone}. Press Call Now to dial immediately.`, true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('drishti_emergency_name', name);
    localStorage.setItem('drishti_emergency_phone', phone);
    setIsEditing(false);
    playChime('success');
    triggerHaptic([50]);
    announce('Emergency contact updated successfully');
    speak(`Emergency contact updated. ${name}, ${phone}`, true);
  };

  const handleCall = () => {
    playChime('alert');
    triggerHaptic([100, 50, 100]);
    announce(`Calling emergency contact: ${phone}`);
    window.location.href = `tel:${phone}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-950/80 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="emergency-dialog-title"
    >
      <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border-2 border-red-500/80 shadow-[0_0_50px_rgba(239,68,68,0.5)] relative text-left">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-red-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center animate-pulse">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 id="emergency-dialog-title" className="text-lg font-black text-red-200 uppercase tracking-wide">
                Emergency Contact
              </h3>
              <p className="text-xs text-red-300">Quick assistance & distress dial</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors focus:ring-2 focus:ring-yellow-400"
            aria-label="Close emergency modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big Call Button */}
        <div className="mb-6">
          <button
            onClick={handleCall}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-lg transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(239,68,68,0.6)] focus:ring-4 focus:ring-yellow-400 active:scale-[0.98]"
            aria-label={`Call emergency contact ${name} at number ${phone}`}
          >
            <PhoneCall className="w-6 h-6 animate-bounce" />
            <span>Call {phone} Now</span>
          </button>
        </div>

        {/* Contact Information & Editor */}
        {!isEditing ? (
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold uppercase">Contact Name</span>
              <span className="text-sm font-bold text-white">{name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold uppercase">Phone Number</span>
              <span className="text-base font-extrabold text-drishti-400 font-mono">{phone}</span>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs text-cyan-400 hover:text-cyan-300 underline font-semibold focus:ring-2 focus:ring-yellow-400"
              >
                Change Contact Number
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-3 mb-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-yellow-400"
                placeholder="e.g. Caregiver, Family, 112"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-mono focus:ring-2 focus:ring-yellow-400"
                placeholder="e.g. 112 or +91-9876543210"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-drishti-500 text-slate-950 font-bold text-xs flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Number</span>
              </button>
            </div>
          </form>
        )}

        {/* Footer info */}
        <p className="text-[11px] text-center text-slate-400">
          Tip: You can activate this anytime by speaking <strong className="text-red-300">"Emergency Contact"</strong> or pressing the SOS button.
        </p>
      </div>
    </div>
  );
};

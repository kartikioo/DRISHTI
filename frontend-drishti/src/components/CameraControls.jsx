import React from 'react';
import { FlipHorizontal, Zap, ZapOff, Upload, Pause, Play, RefreshCw } from 'lucide-react';
import { useAccessibility } from '../contexts/AccessibilityContext.jsx';

export const CameraControls = ({
  isStreaming,
  facingMode,
  torchSupported,
  torchOn,
  onSwitchCamera,
  onToggleTorch,
  onToggleStream,
  onFileUpload
}) => {
  const { playChime, triggerHaptic, announce } = useAccessibility();

  const handleSwitch = () => {
    playChime('click');
    triggerHaptic([40]);
    onSwitchCamera();
    announce(`Switched to ${facingMode === 'environment' ? 'front' : 'rear'} camera`);
  };

  const handleTorch = () => {
    playChime('click');
    triggerHaptic([40]);
    onToggleTorch();
    announce(torchOn ? 'Flashlight off' : 'Flashlight on');
  };

  const handleStreamToggle = () => {
    playChime('click');
    triggerHaptic([40]);
    onToggleStream();
    announce(isStreaming ? 'Camera paused' : 'Camera resumed');
  };

  return (
    <div
      className="flex items-center justify-between gap-2 p-2 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 w-full"
      role="toolbar"
      aria-label="Camera controls"
    >
      <div className="flex items-center gap-2">
        {/* Flip Camera */}
        <button
          onClick={handleSwitch}
          className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5 focus:ring-2 focus:ring-yellow-400"
          title="Switch Camera (Front/Rear)"
          aria-label={`Switch camera. Currently using ${facingMode === 'environment' ? 'rear' : 'front'} camera.`}
        >
          <FlipHorizontal className="w-4 h-4 text-cyan-400" />
          <span className="hidden sm:inline">Flip Camera</span>
        </button>

        {/* Torch Toggle (if supported) */}
        {torchSupported && (
          <button
            onClick={handleTorch}
            className={`p-2.5 rounded-xl border text-xs font-medium transition-colors flex items-center gap-1.5 focus:ring-2 focus:ring-yellow-400 ${
              torchOn
                ? 'bg-yellow-400/20 text-yellow-300 border-yellow-400/50'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700/80'
            }`}
            title="Toggle Flashlight"
            aria-label={torchOn ? 'Turn flashlight off' : 'Turn flashlight on'}
          >
            {torchOn ? <Zap className="w-4 h-4 text-yellow-400" /> : <ZapOff className="w-4 h-4" />}
            <span className="hidden sm:inline">Torch</span>
          </button>
        )}

        {/* Pause/Resume Stream */}
        <button
          onClick={handleStreamToggle}
          className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5 focus:ring-2 focus:ring-yellow-400"
          title={isStreaming ? 'Pause Camera Feed' : 'Resume Camera Feed'}
          aria-label={isStreaming ? 'Pause camera feed' : 'Resume camera feed'}
        >
          {isStreaming ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
          <span className="hidden sm:inline">{isStreaming ? 'Pause' : 'Resume'}</span>
        </button>
      </div>

      {/* File Upload Fallback */}
      <div>
        <label className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 focus-within:ring-2 focus-within:ring-yellow-400">
          <Upload className="w-4 h-4 text-drishti-400" />
          <span className="hidden sm:inline">Upload Image</span>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={onFileUpload}
          />
        </label>
      </div>
    </div>
  );
};

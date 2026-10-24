import React from 'react';
import { Camera, CameraOff, AlertCircle, RefreshCw, Upload, Eye } from 'lucide-react';

export const CameraView = ({
  videoRef,
  isStreaming,
  hasPermission,
  errorMessage,
  isAnalyzing,
  onRetryCamera,
  onFileUpload
}) => {
  return (
    <div
      className="relative w-full aspect-[4/3] sm:aspect-[16/9] max-h-[520px] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex items-center justify-center group"
      role="region"
      aria-label="Live camera viewfinder"
    >
      {/* Live Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isStreaming ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label="Camera live preview stream"
      />

      {/* Viewfinder Target Framing & Reticle */}
      {isStreaming && !isAnalyzing && (
        <div className="absolute inset-0 pointer-events-none p-6 sm:p-10 flex flex-col justify-between">
          <div className="flex justify-between">
            <div className="w-8 h-8 border-t-2 border-l-2 border-drishti-400 rounded-tl-lg" />
            <div className="w-8 h-8 border-t-2 border-r-2 border-drishti-400 rounded-tr-lg" />
          </div>
          
          {/* Subtle center crosshair for positioning assistance */}
          <div className="self-center flex items-center justify-center opacity-40">
            <div className="w-8 h-0.5 bg-drishti-400" />
            <div className="h-8 w-0.5 bg-drishti-400 absolute" />
          </div>

          <div className="flex justify-between">
            <div className="w-8 h-8 border-b-2 border-l-2 border-drishti-400 rounded-bl-lg" />
            <div className="w-8 h-8 border-b-2 border-r-2 border-drishti-400 rounded-br-lg" />
          </div>
        </div>
      )}

      {/* AI Analyzing Scanner Beam */}
      {isAnalyzing && (
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] flex flex-col items-center justify-center z-20">
          {/* Animated vertical scanline */}
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

      {/* Permission Denied or Camera Error Fallback */}
      {!isStreaming && (
        <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center bg-slate-950/95 z-10">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mb-4">
            <CameraOff className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-bold text-white mb-2">Camera Unavailable</h3>
          <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
            {errorMessage || 'Camera is currently stopped or permission is required to analyze surroundings.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onRetryCamera}
              className="px-5 py-2.5 rounded-xl bg-drishti-500 hover:bg-drishti-400 text-slate-950 font-semibold text-sm transition-all flex items-center gap-2 shadow-glow-primary focus:ring-2 focus:ring-yellow-400"
            >
              <Camera className="w-4 h-4" />
              <span>Start Camera</span>
            </button>

            <label className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm transition-all cursor-pointer flex items-center gap-2 focus-within:ring-2 focus-within:ring-yellow-400">
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Upload Photo</span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={onFileUpload}
              />
            </label>
          </div>
        </div>
      )}

      {/* Top Status Badge */}
      {isStreaming && (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-xs">
          <span className="w-2 h-2 rounded-full bg-drishti-500 animate-pulse" />
          <span className="font-medium text-slate-200">Live Camera Feed</span>
        </div>
      )}
    </div>
  );
};

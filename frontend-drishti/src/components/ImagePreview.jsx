import React, { useState } from 'react';
import { X, ZoomIn, RefreshCw, Eye } from 'lucide-react';

export const ImagePreview = ({ imageUrl, onDiscard, mode }) => {
  const [isZoomed, setIsZoomed] = useState(false);

  if (!imageUrl) return null;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-2 shadow-xl">
      <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 group">
        <img
          src={imageUrl}
          alt="Captured scene for AI accessibility analysis"
          className={`w-full h-full object-cover transition-transform duration-300 ${
            isZoomed ? 'scale-125 cursor-zoom-out' : 'cursor-zoom-in'
          }`}
          onClick={() => setIsZoomed(!isZoomed)}
        />

        {/* Action Overlay */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
          <button
            onClick={() => setIsZoomed(!isZoomed)}
            className="p-1.5 rounded-lg bg-slate-950/80 backdrop-blur-md text-slate-300 hover:text-white border border-slate-700 text-xs transition-colors"
            title={isZoomed ? 'Zoom Out' : 'Zoom In'}
            aria-label={isZoomed ? 'Zoom out image' : 'Zoom in image'}
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          {onDiscard && (
            <button
              onClick={onDiscard}
              className="p-1.5 rounded-lg bg-slate-950/80 backdrop-blur-md text-red-400 hover:text-red-300 border border-red-500/30 text-xs transition-colors"
              title="Discard & Retake"
              aria-label="Discard captured image and retake"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Mode Tag */}
        {mode && (
          <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] font-semibold text-drishti-300 uppercase tracking-wider">
            {mode} Mode
          </div>
        )}
      </div>
    </div>
  );
};

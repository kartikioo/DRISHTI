import { useState, useRef, useEffect, useCallback } from 'react';

export const useCamera = () => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [hasPermission, setHasPermission] = useState(null); // null = unknown, true, false
  const [isStreaming, setIsStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // default to back camera for environment exploration
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  const startStream = useCallback(async (facing = facingMode) => {
    stopStream();
    setErrorMessage('');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasPermission(false);
      setErrorMessage('Camera access is not supported by this browser.');
      return;
    }

    try {
      const constraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setHasPermission(true);
      setIsStreaming(true);

      // Check for torch/flashlight capability
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};
        setTorchSupported(Boolean(capabilities.torch));
      }
    } catch (err) {
      console.warn('Camera stream error:', err);
      setHasPermission(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Camera permission was denied. Please allow camera access in your browser settings or upload an image.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('No camera device found on this machine. You can use the photo upload option below.');
      } else {
        setErrorMessage(`Unable to access camera: ${err.message}`);
      }
    }
  }, [facingMode, stopStream]);

  // Toggle flashlight / torch
  const toggleTorch = useCallback(async () => {
    if (!streamRef.current || !torchSupported) return;
    try {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        const nextState = !torchOn;
        await videoTrack.applyConstraints({
          advanced: [{ torch: nextState }]
        });
        setTorchOn(nextState);
      }
    } catch (e) {
      console.warn('Failed to toggle torch:', e);
    }
  }, [torchSupported, torchOn]);

  // Flip camera between environment and user
  const switchCamera = useCallback(() => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startStream(nextMode);
  }, [facingMode, startStream]);

  // Capture still image snapshot from video frame
  const captureFrame = useCallback(async () => {
    if (!videoRef.current || !isStreaming) return null;

    const video = videoRef.current;

    // Ensure video element has loaded frames and non-zero dimensions
    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      await new Promise((resolve) => {
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if ((video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) || attempts > 20) {
            clearInterval(interval);
            resolve();
          }
        }, 50);
      });
    }

    const width = video.videoWidth > 0 ? video.videoWidth : 1280;
    const height = video.videoHeight > 0 ? video.videoHeight : 720;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Flip horizontally if front user camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    } catch (e) {
      console.warn('Canvas drawImage error:', e);
    }

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve({
            blob,
            dataUrl: canvas.toDataURL('image/jpeg', 0.90)
          });
        },
        'image/jpeg',
        0.90
      );
    });
  }, [isStreaming, facingMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  return {
    videoRef,
    isStreaming,
    hasPermission,
    errorMessage,
    facingMode,
    torchSupported,
    torchOn,
    startStream,
    stopStream,
    switchCamera,
    toggleTorch,
    captureFrame
  };
};

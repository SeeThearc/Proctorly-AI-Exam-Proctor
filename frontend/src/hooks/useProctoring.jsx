import { useState, useEffect, useRef, useCallback } from 'react';
import mlService from '../services/mlService';
import socketService from '../services/socketService';
import api from '../services/api';

const useProctoring = (sessionId, proctoringSettings) => {
  const [warningCount, setWarningCount] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [violations, setViolations] = useState([]);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);

  const videoRef = useRef(null);
  const lastViolationRef = useRef(null);
  const streamRef = useRef(null);

  // ── Webcam init ────────────────────────────────────────────────────────────
  const initializeWebcam = useCallback(async () => {
    try {
      console.log('🎥 Requesting webcam...');
      if (!videoRef.current) throw new Error('videoRef not mounted yet');

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
      await _attachAndPlay(mediaStream);
      setCameraReady(true);
      return true;
    } catch (err) {
      const msg =
        err.name === 'NotAllowedError' ? 'Camera permission denied.' :
        err.name === 'NotFoundError'   ? 'No camera found.' :
        err.name === 'NotReadableError'? 'Camera in use by another app.' :
        err.message || 'Camera error';
      console.error('❌ Webcam error:', msg);
      setError(msg);
      return false;
    }
  }, []);

  // Internal helper — attaches stream to current videoRef and plays it
  const _attachAndPlay = async (mediaStream) => {
    const v = videoRef.current;
    if (!v) return;
    v.srcObject = mediaStream;
    v.muted = true;
    v.playsInline = true;
    try { await v.play(); } catch (e) { console.warn('play():', e.message); }
  };

  // Wait until the video element is truly playing (readyState >= 2, width > 0)
  const _waitForVideoReady = async (maxMs = 8000) => {
    const start = Date.now();
    while (Date.now() - start < maxMs) {
      const v = videoRef.current;
      if (v && v.readyState >= 2 && v.videoWidth > 0) {
        // Ensure it's playing
        if (v.paused) {
          try { await v.play(); } catch (_) {}
        }
        if (!v.paused) {
          console.log(`✅ Video ready — readyState:${v.readyState} width:${v.videoWidth} paused:${v.paused}`);
          return true;
        }
      }
      await new Promise(r => setTimeout(r, 150));
    }
    console.warn('⚠️ Video readiness timeout — proceeding anyway');
    return false;
  };

  // ── Violation logger ───────────────────────────────────────────────────────
  const logViolation = useCallback(async (violationType, severity = 'medium', metadata = {}, preSnapshot = null) => {
    if (!sessionId) return;

    const now = Date.now();
    if (
      lastViolationRef.current &&
      lastViolationRef.current.type === violationType &&
      now - lastViolationRef.current.timestamp < 3000
    ) return;
    lastViolationRef.current = { type: violationType, timestamp: now };

    try {
      // Use the frame captured at detection time if available;
      // fall back to a fresh capture for event-based violations (tab-switch etc.)
      const snapshot = preSnapshot || (videoRef.current ? mlService.captureSnapshot(videoRef.current) : null);

      const response = await api.post(`/proctoring/violation/${sessionId}`, {
        violationType, severity, snapshot,
        metadata: { timestamp: new Date().toISOString(), ...metadata },
      });
      if (response.data.success) {
        setWarningCount(response.data.warningCount);
        setViolations(prev => [...prev, response.data.violation]);
        if (socketService.isConnected()) {
          socketService.emitViolation({ sessionId, violationType, severity, warningCount: response.data.warningCount });
        }
        if (response.data.autoSubmitted) {
          window.dispatchEvent(new CustomEvent('auto-submit-exam'));
        }
      }
    } catch (err) {
      console.error('❌ logViolation error:', err);
    }
  }, [sessionId]);

  // ── Tab switch ─────────────────────────────────────────────────────────────
  const handleTabSwitch = useCallback(() => {
    if (proctoringSettings?.enableTabSwitch && document.hidden) {
      const snap = videoRef.current ? mlService.captureSnapshot(videoRef.current) : null;
      window.proctoringViolationHandlers?.onTabSwitch
        ? window.proctoringViolationHandlers.onTabSwitch(snap)
        : logViolation('tab-switch', 'high', {}, snap);
    }
  }, [proctoringSettings, logViolation]);

  const handleWindowBlur = useCallback(() => {
    if (proctoringSettings?.enableTabSwitch) {
      const snap = videoRef.current ? mlService.captureSnapshot(videoRef.current) : null;
      window.proctoringViolationHandlers?.onTabSwitch
        ? window.proctoringViolationHandlers.onTabSwitch(snap)
        : logViolation('tab-switch', 'high', {}, snap);
    }
  }, [proctoringSettings, logViolation]);

  // ── Start proctoring ───────────────────────────────────────────────────────
  const startProctoring = useCallback(async () => {
    try {
      console.log('🚀 startProctoring called');
      console.log('   videoRef.current:', videoRef.current);
      console.log('   streamRef.current:', streamRef.current);

      // Attach the existing stream to whatever video element is currently mounted
      if (streamRef.current && videoRef.current) {
        console.log('🔗 Attaching existing stream to current video element');
        await _attachAndPlay(streamRef.current);
      } else {
        console.log('📷 No existing stream — initializing webcam');
        const ok = await initializeWebcam();
        if (!ok) { console.error('❌ Webcam init failed'); return false; }
      }

      // 🔑 KEY: poll until video is genuinely playing before starting ML
      const ready = await _waitForVideoReady(8000);
      console.log('Video ready for ML:', ready);

      // Load ML models
      const modelsLoaded = await mlService.loadModels();
      console.log('ML models loaded:', modelsLoaded);

      // Load face descriptor
      try {
        const meRes = await api.get('/auth/me');
        const descriptor = meRes.data?.user?.faceDescriptor;
        if (descriptor?.length) {
          mlService.setFaceDescriptor(descriptor);
          console.log('✅ Face descriptor set');
        }
      } catch (e) { console.warn('Face descriptor load failed:', e.message); }

      // Start ML monitoring with a getter so it always gets the live DOM node
      if (modelsLoaded) {
        mlService.startMonitoring(() => videoRef.current, {
          // snapshot = the exact video frame captured at the moment of detection
          onNoFace: (snapshot) => {
            window.proctoringViolationHandlers?.onNoFace
              ? window.proctoringViolationHandlers.onNoFace(snapshot)
              : logViolation('no-face-detected', 'high', {}, snapshot);
          },
          onMultipleFaces: (count, snapshot) => {
            window.proctoringViolationHandlers?.onMultipleFaces
              ? window.proctoringViolationHandlers.onMultipleFaces(count, snapshot)
              : logViolation('multiple-faces', 'high', { faceCount: String(count) }, snapshot);
          },
          onFaceMismatch: (snapshot) => {
            window.proctoringViolationHandlers?.onFaceMismatch
              ? window.proctoringViolationHandlers.onFaceMismatch(snapshot)
              : logViolation('face-not-matching', 'high', {}, snapshot);
          },
          onHeadMovement: (direction, snapshot) => {
            window.proctoringViolationHandlers?.onHeadMovement
              ? window.proctoringViolationHandlers.onHeadMovement(direction, snapshot)
              : logViolation('excessive-head-movement', 'medium', { direction }, snapshot);
          },
          onSuccess: () => {},
          onError: (err) => console.error('ML loop error:', err),
        });
        console.log('✅ ML monitoring started');
      }

      // Tab-switch listeners
      document.addEventListener('visibilitychange', handleTabSwitch);
      window.addEventListener('blur', handleWindowBlur);

      // Socket
      const token = localStorage.getItem('token');
      if (token && !socketService.isConnected()) socketService.connect(token);
      if (sessionId) socketService.joinSession(sessionId);

      setIsMonitoring(true);
      return true;
    } catch (err) {
      console.error('❌ startProctoring error:', err);
      setError('Failed to start proctoring: ' + err.message);
      return false;
    }
  }, [sessionId, proctoringSettings, initializeWebcam, logViolation, handleTabSwitch, handleWindowBlur]);

  // ── Stop proctoring ────────────────────────────────────────────────────────
  const stopProctoring = useCallback(() => {
    mlService.stopMonitoring();
    document.removeEventListener('visibilitychange', handleTabSwitch);
    window.removeEventListener('blur', handleWindowBlur);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setStream(null);
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsMonitoring(false);
    setCameraReady(false);
    console.log('🛑 Proctoring stopped');
  }, [handleTabSwitch, handleWindowBlur]);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      mlService.stopMonitoring();
      document.removeEventListener('visibilitychange', handleTabSwitch);
      window.removeEventListener('blur', handleWindowBlur);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  return {
    videoRef,
    warningCount, isMonitoring, violations, stream, error, cameraReady,
    startProctoring, stopProctoring, logViolation, initializeWebcam,
  };
};

export default useProctoring;
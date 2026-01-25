import { useState, useEffect, useRef, useCallback } from 'react';
import mlService from '../services/mlService';
import socketService from '../services/socketService';
import api from '../services/api';

/**
 * Main proctoring hook that handles: 
 * - Webcam initialization
 * - Face detection monitoring
 * - Violation logging
 * - Warning system
 * - Auto-submission
 */
const useProctoring = (sessionId, proctoringSettings) => {
  const [warningCount, setWarningCount] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [violations, setViolations] = useState([]);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);

  const videoRef = useRef(null);
  const socketRef = useRef(null);
  const lastViolationRef = useRef(null);
  const monitoringIntervalRef = useRef(null);

  /**
   * Initialize webcam
   */
  const initializeWebcam = useCallback(async () => {
  try {
    console.log('🎥 Initializing webcam...');
    console.log('📹 VideoRef status:', {
      exists: !!videoRef,
      current: !!videoRef?. current,
      element: videoRef?.current
    });

    // ✅ Simple check - if no videoRef, fail gracefully
    if (!videoRef || !videoRef.current) {
      console.error('❌ videoRef. current is null! ');
      throw new Error('Video element not found');
    }

    console.log('✅ Video element found:', videoRef.current);

    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user'
      },
      audio: false
    });

    console.log('✅ Media stream obtained');

    setStream(mediaStream);
    
    console.log('📺 Setting video source.. .');
    videoRef.current. srcObject = mediaStream;
    
    // Set video attributes
    videoRef.current.muted = true;
    videoRef.current.playsInline = true;
    videoRef.current.autoplay = true;

    // Wait for video to be ready
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error('❌ Video loading timeout');
        reject(new Error('Video loading timeout'));
      }, 10000);

      const onCanPlay = async () => {
        console.log('✅ Video can play');
        clearTimeout(timeout);
        
        try {
          await videoRef.current.play();
          console.log('✅ Video playing');
          console.log('📐 Video dimensions:', {
            width: videoRef.current.videoWidth,
            height: videoRef.current.videoHeight
          });
          
          setCameraReady(true);
          console.log('✅ Webcam initialized successfully');
          
          videoRef.current.removeEventListener('canplay', onCanPlay);
          videoRef.current.removeEventListener('error', onError);
          
          resolve(true);
        } catch (playError) {
          console.error('❌ Error playing video:', playError);
          clearTimeout(timeout);
          reject(playError);
        }
      };

      const onError = (err) => {
        console.error('❌ Video element error:', err);
        clearTimeout(timeout);
        videoRef.current.removeEventListener('canplay', onCanPlay);
        videoRef.current.removeEventListener('error', onError);
        reject(new Error('Video element error'));
      };

      videoRef.current.addEventListener('canplay', onCanPlay, { once: true });
      videoRef.current.addEventListener('error', onError, { once: true });

      videoRef.current.load();
    });

  } catch (error) {
    console.error('❌ Error accessing webcam:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message
    });
    
    let errorMessage = 'Failed to access camera';
    if (error.name === 'NotAllowedError') {
      errorMessage = 'Camera permission denied.  Please allow camera access.';
    } else if (error.name === 'NotFoundError') {
      errorMessage = 'No camera found. Please connect a camera.';
    } else if (error.name === 'NotReadableError') {
      errorMessage = 'Camera is already in use by another application.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    setError(errorMessage);
    alert(errorMessage);
    return false;
  }
}, []);

  /**
   * Log violation to backend
   */
  const logViolation = useCallback(async (violationType, severity = 'medium', metadata = {}) => {
    if (!sessionId) {
      console.error('No session ID provided');
      return;
    }

    // Prevent duplicate violations within 2 seconds
    const now = Date.now();
    const lastViolationKey = `${violationType}-${now}`;
    
    if (lastViolationRef.current && 
        lastViolationRef. current.type === violationType &&
        (now - lastViolationRef. current.timestamp) < 2000) {
      console.log('⏭️ Skipping duplicate violation');
      return;
    }

    lastViolationRef.current = {
      type: violationType,
      timestamp: now
    };

    try {
      console.log(`⚠️ Logging violation:  ${violationType}`);

      // Capture snapshot
      const snapshot = videoRef.current ?  mlService.captureSnapshot(videoRef.current) : null;

      const response = await api.post(`/proctoring/violation/${sessionId}`, {
        violationType,
        severity,
        snapshot,
        metadata:  {
          timestamp: new Date().toISOString(),
          ...metadata
        }
      });

      if (response.data.success) {
        const newWarningCount = response.data.warningCount;
        setWarningCount(newWarningCount);
        setViolations(prev => [...prev, response.data.violation]);

        // Emit to socket for real-time monitoring
        if (socketService.isConnected()) {
          socketService.emitViolation({
            sessionId,
            violationType,
            severity,
            warningCount: newWarningCount
          });
        }

        console.log(`📊 Warning count: ${newWarningCount}/${proctoringSettings?. warningThreshold || 3}`);

        // Auto-submit if threshold reached
        if (response.data.autoSubmitted) {
          console.log('🛑 Auto-submit triggered');
          handleAutoSubmit();
        }
      }
    } catch (error) {
      console.error('❌ Error logging violation:', error);
    }
  }, [sessionId, proctoringSettings]);

  /**
   * Handle auto-submit
   */
  const handleAutoSubmit = useCallback(() => {
    console.log('🚨 Maximum warnings reached - Auto-submitting exam');
    
    // Stop monitoring
    stopProctoring();
    
    // Emit custom event that exam component can listen to
    window.dispatchEvent(new CustomEvent('auto-submit-exam'));
  }, []);

  /**
   * Start proctoring
   */
  const startProctoring = useCallback(async () => {
    try {
      console.log('🚀 Starting proctoring...');

      // Initialize webcam
      const webcamInitialized = await initializeWebcam();
      if (!webcamInitialized) {
        console.error('❌ Webcam initialization failed');
        return false;
      }

      console.log('✅ Webcam initialized, loading ML models...');

      // Load ML models
      console.log('📥 Loading ML models...');
      const modelsLoaded = await mlService.loadModels();
      if (!modelsLoaded) {
        console.warn('⚠️ ML models failed to load, continuing without face detection');
      } else {
        console.log('✅ ML models loaded');
      }

      // Get registered face descriptor from user context/API
      const storedDescriptor = null; // TODO: Load from user profile
      if (storedDescriptor) {
        mlService.setFaceDescriptor(storedDescriptor);
      }

      // ✅ Start ML monitoring with window handlers
      if (modelsLoaded) {
        console.log('👁️ Starting ML monitoring...');
        mlService.startMonitoring(videoRef.current, {
          onNoFace: () => {
            if (proctoringSettings?.enableFaceDetection) {
              // ✅ Use window handler if available (for modal display)
              if (window.proctoringViolationHandlers?. onNoFace) {
                window.proctoringViolationHandlers.onNoFace();
              } else {
                // Fallback to direct logging
                logViolation('no-face-detected', 'high');
              }
            }
          },
          onMultipleFaces: (count) => {
            if (proctoringSettings?.enableMultipleFaceDetection) {
              // ✅ Use window handler if available (for modal display)
              if (window.proctoringViolationHandlers?.onMultipleFaces) {
                window.proctoringViolationHandlers.onMultipleFaces(count);
              } else {
                // Fallback to direct logging
                logViolation('multiple-faces', 'high', { faceCount: count });
              }
            }
          },
          onFaceMismatch: () => {
            if (window.proctoringViolationHandlers?.onFaceMismatch) {
              window.proctoringViolationHandlers.onFaceMismatch();
            } else {
              logViolation('face-not-matching', 'high');
            }
          },
          onHeadMovement: (direction) => {
            if (proctoringSettings?.enableHeadMovement) {
              // ✅ Use window handler if available (for modal display)
              if (window.proctoringViolationHandlers?.onHeadMovement) {
                window. proctoringViolationHandlers.onHeadMovement(direction);
              } else {
                // Fallback to direct logging
                logViolation('excessive-head-movement', 'medium', { direction });
              }
            }
          },
          onSuccess: () => {
            // All checks passed - do nothing
          },
          onError: (error) => {
            console.error('ML monitoring error:', error);
          }
        });
      } else {
        console.log('⚠️ Skipping ML monitoring - models not loaded');
      }

      // Connect to socket
      const token = localStorage.getItem('token');
      if (token && ! socketService.isConnected()) {
        console.log('🔌 Connecting to socket...');
        socketService.connect(token);
      }

      if (sessionId) {
        console.log('🚪 Joining session:', sessionId);
        socketService. joinSession(sessionId);
      }

      setIsMonitoring(true);
      console.log('✅ Proctoring started successfully');
      return true;
    } catch (error) {
      console.error('❌ Error starting proctoring:', error);
      console.error('Error stack:', error.stack);
      setError('Failed to start proctoring:  ' + error.message);
      return false;
    }
  }, [sessionId, proctoringSettings, initializeWebcam, logViolation]);

  /**
   * Stop proctoring
   */
  const stopProctoring = useCallback(() => {
    console.log('🛑 Stopping proctoring...');

    // Stop ML monitoring
    mlService.stopMonitoring();

    // Stop webcam stream
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('📷 Webcam track stopped');
      });
      setStream(null);
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsMonitoring(false);
    setCameraReady(false);
    console.log('✅ Proctoring stopped');
  }, [stream]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    // Only cleanup when component actually unmounts, not on every render
    return () => {
      console.log('🧹 useProctoring cleanup - component unmounting');
      stopProctoring();
    };
  }, []); // Empty dependency array - only run on mount/unmount

  return {
    videoRef,
    warningCount,
    isMonitoring,
    violations,
    stream,
    error,
    cameraReady,
    startProctoring,
    stopProctoring,
    logViolation,
    initializeWebcam
  };
};

export default useProctoring;
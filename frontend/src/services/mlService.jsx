import * as faceapi from 'face-api.js';

class MLService {
  constructor() {
    this.modelsLoaded = false;
    this. faceDescriptor = null;
    this.detectionInterval = null;
    this.modelPath = '/models'; // Path to face-api.js models
    
    // ✅ NEW:  Tracking for stable detection
    this.noFaceCount = 0;
    this. multipleFaceCount = 0;
    this.headMovementCount = 0;
    
    // ✅ NEW:  Thresholds to prevent false positives
    this. DETECTION_THRESHOLD = 3; // Need 3 consecutive detections before triggering
    this.FACE_MATCH_THRESHOLD = 0.6; // Face verification threshold
  }

  /**
   * Load all required face-api.js models
   * Must be called before any face detection
   */
  async loadModels() {
    if (this.modelsLoaded) {
      console.log('✅ Models already loaded');
      return true;
    }

    try {
      console.log('📥 Loading face detection models...');

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(this.modelPath),
        faceapi.nets.faceLandmark68Net.loadFromUri(this. modelPath),
        faceapi.nets.faceRecognitionNet.loadFromUri(this. modelPath),
        faceapi.nets.faceExpressionNet.loadFromUri(this.modelPath)
      ]);

      this.modelsLoaded = true;
      console.log('✅ Face detection models loaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Error loading face detection models:', error);
      console.error('Make sure models are placed in /public/models/ folder');
      return false;
    }
  }

  /**
   * Capture face descriptor for registration/verification
   * Used during initial face setup
   * @param {HTMLVideoElement} videoElement - Video element showing webcam
   * @returns {Array|null} - 128-dimensional face descriptor array
   */
  async captureFaceDescriptor(videoElement) {
    if (!this.modelsLoaded) {
      console.log('Loading models first...');
      await this.loadModels();
    }

    try {
      const detection = await faceapi
        .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions({
          inputSize: 416,
          scoreThreshold: 0.5
        }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        this.faceDescriptor = Array.from(detection.descriptor);
        console.log('✅ Face descriptor captured successfully');
        return this.faceDescriptor;
      } else {
        console.log('⚠️ No face detected');
        return null;
      }
    } catch (error) {
      console.error('❌ Error capturing face descriptor:', error);
      return null;
    }
  }

  /**
   * Detect all faces in video stream
   * @param {HTMLVideoElement} videoElement
   * @returns {Array} - Array of detected faces with landmarks and descriptors
   */
  async detectFaces(videoElement) {
    if (!this.modelsLoaded) {
      await this.loadModels();
    }

    try {
      // ✅ Adjusted for better detection
      const detections = await faceapi
        .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions({
          inputSize:  416, // Good balance of speed and accuracy
          scoreThreshold:  0.4 // Lower threshold to detect faces more easily
        }))
        .withFaceLandmarks()
        .withFaceDescriptors();

      return detections;
    } catch (error) {
      console.error('❌ Error detecting faces:', error);
      return [];
    }
  }

  /**
   * Verify if detected face matches registered face
   * @param {Array} detectedDescriptor - Current face descriptor
   * @param {Array} registeredDescriptor - Stored face descriptor
   * @returns {boolean} - True if faces match
   */
  verifyFace(detectedDescriptor, registeredDescriptor) {
    if (! detectedDescriptor || !registeredDescriptor) {
      return true; // ✅ Skip verification if no registered face
    }

    try {
      const distance = faceapi.euclideanDistance(
        detectedDescriptor,
        registeredDescriptor
      );

      const isMatch = distance < this.FACE_MATCH_THRESHOLD;

      console.log(`👤 Face verification:  distance=${distance.toFixed(3)}, match=${isMatch}`);
      return isMatch;
    } catch (error) {
      console.error('❌ Error verifying face:', error);
      return true; // ✅ Don't fail on error
    }
  }

  /**
   * Detect head movement using face landmarks
   * @param {Object} landmarks - Face landmarks from detection
   * @returns {Object} - { isLookingAway, direction }
   */
  detectHeadMovement(landmarks) {
    if (!landmarks) {
      return { isLookingAway: false, direction: null };
    }

    try {
      const nose = landmarks.getNose();
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();

      if (! nose || !leftEye || ! rightEye || nose.length === 0 || leftEye.length === 0 || rightEye.length === 0) {
        return { isLookingAway:  false, direction: null };
      }

      // Calculate eye centers
      const leftEyeCenter = {
        x: leftEye. reduce((sum, p) => sum + p.x, 0) / leftEye.length,
        y: leftEye.reduce((sum, p) => sum + p.y, 0) / leftEye.length
      };

      const rightEyeCenter = {
        x: rightEye.reduce((sum, p) => sum + p.x, 0) / rightEye.length,
        y: rightEye.reduce((sum, p) => sum + p.y, 0) / rightEye.length
      };

      const eyeCenter = {
        x: (leftEyeCenter.x + rightEyeCenter.x) / 2,
        y: (leftEyeCenter.y + rightEyeCenter.y) / 2
      };

      // Get nose tip (bottom of nose)
      const noseTip = nose[nose.length - 1];

      // Calculate face width for relative measurements
      const faceWidth = Math.abs(rightEyeCenter.x - leftEyeCenter.x);

      // Calculate offset ratios (normalized by face width)
      const horizontalOffset = (noseTip.x - eyeCenter.x) / faceWidth;
      const verticalOffset = (noseTip.y - eyeCenter.y) / faceWidth;

      // ✅ More lenient thresholds to allow natural movement
      const horizontalThreshold = 0.4; // Increased from 0.25 (allows more side movement)
      const verticalThreshold = 0.45; // Increased from 0.3 (allows more up/down movement)

      let direction = null;
      let isLookingAway = false;

      // Check horizontal movement (left/right)
      if (Math.abs(horizontalOffset) > horizontalThreshold) {
        direction = horizontalOffset > 0 ? 'right' : 'left';
        isLookingAway = true;
      }
      // Check vertical movement (up/down)
      else if (verticalOffset > verticalThreshold) {
        direction = 'down';
        isLookingAway = true;
      } else if (verticalOffset < -verticalThreshold) {
        direction = 'up';
        isLookingAway = true;
      }

      return { isLookingAway, direction, horizontalOffset, verticalOffset };
    } catch (error) {
      console.error('❌ Error detecting head movement:', error);
      return { isLookingAway: false, direction: null };
    }
  }

  /**
   * Capture snapshot from video element
   * @param {HTMLVideoElement} videoElement
   * @returns {string} - Base64 encoded image
   */
  captureSnapshot(videoElement) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas. getContext('2d');
      ctx.drawImage(videoElement, 0, 0, canvas. width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (error) {
      console.error('❌ Error capturing snapshot:', error);
      return null;
    }
  }

  /**
   * Start continuous face monitoring
   * @param {HTMLVideoElement} videoElement
   * @param {Object} callbacks - Callback functions for different events
   */
  startMonitoring(videoElement, callbacks = {}) {
    // Stop existing monitoring if any
    if (this. detectionInterval) {
      this.stopMonitoring();
    }

    console.log('👁️ Starting face monitoring.. .');

    // ✅ Reset counters
    this.noFaceCount = 0;
    this.multipleFaceCount = 0;
    this.headMovementCount = 0;

    this.detectionInterval = setInterval(async () => {
      try {
        const detections = await this.detectFaces(videoElement);

        // ✅ No face detected - need consecutive detections
        if (detections. length === 0) {
          this.noFaceCount++;
          this.multipleFaceCount = 0; // Reset other counters
          this.headMovementCount = 0;

          if (this.noFaceCount >= this.DETECTION_THRESHOLD) {
            console.log(`⚠️ No face detected (${this.noFaceCount} consecutive times)`);
            callbacks.onNoFace && callbacks.onNoFace();
            this.noFaceCount = 0; // Reset after triggering
          }
          return;
        }

        // ✅ Multiple faces detected - need consecutive detections
        if (detections.length > 1) {
          this.multipleFaceCount++;
          this.noFaceCount = 0; // Reset other counters
          this.headMovementCount = 0;

          if (this.multipleFaceCount >= this. DETECTION_THRESHOLD) {
            console.log(`⚠️ Multiple faces detected:  ${detections.length} (${this. multipleFaceCount} consecutive times)`);
            callbacks.onMultipleFaces && callbacks.onMultipleFaces(detections. length);
            this.multipleFaceCount = 0; // Reset after triggering
          }
          return;
        }

        // ✅ Exactly one face detected - reset no-face and multiple-face counters
        this. noFaceCount = 0;
        this.multipleFaceCount = 0;

        const detection = detections[0];

        // Face verification (if registered descriptor exists)
        if (this.faceDescriptor) {
          const isMatch = this.verifyFace(
            detection.descriptor,
            this.faceDescriptor
          );

          if (!isMatch) {
            console. log('⚠️ Face does not match registered user');
            callbacks. onFaceMismatch && callbacks.onFaceMismatch();
            return;
          }
        }

        // ✅ Head movement detection - need consecutive detections
        const headMovement = this.detectHeadMovement(detection.landmarks);
        if (headMovement. isLookingAway) {
          this.headMovementCount++;

          if (this.headMovementCount >= this. DETECTION_THRESHOLD) {
            console.log(`⚠️ Head movement detected: looking ${headMovement.direction} (${this.headMovementCount} consecutive times)`);
            console.log(`   Offsets: horizontal=${headMovement. horizontalOffset?. toFixed(3)}, vertical=${headMovement.verticalOffset?. toFixed(3)}`);
            callbacks.onHeadMovement && callbacks.onHeadMovement(headMovement.direction);
            this.headMovementCount = 0; // Reset after triggering
          }
        } else {
          this.headMovementCount = 0; // Reset if looking at screen
        }

        // ✅ All checks passed
        if (detections.length === 1 && ! headMovement.isLookingAway) {
          callbacks.onSuccess && callbacks.onSuccess(detection);
        }

      } catch (error) {
        console.error('❌ Error in monitoring loop:', error);
        callbacks.onError && callbacks. onError(error);
      }
    }, 3000); // Check every 3 seconds
  }

  /**
   * Stop face monitoring
   */
  stopMonitoring() {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
      console.log('🛑 Face monitoring stopped');
    }

    // ✅ Reset counters
    this.noFaceCount = 0;
    this.multipleFaceCount = 0;
    this.headMovementCount = 0;
  }

  /**
   * Set registered face descriptor
   * @param {Array} descriptor - 128-dimensional face descriptor
   */
  setFaceDescriptor(descriptor) {
    this.faceDescriptor = descriptor;
  }

  /**
   * Get registered face descriptor
   * @returns {Array|null}
   */
  getFaceDescriptor() {
    return this.faceDescriptor;
  }

  /**
   * Clear registered face descriptor
   */
  clearFaceDescriptor() {
    this.faceDescriptor = null;
  }

  /**
   * Check if models are loaded
   * @returns {boolean}
   */
  areModelsLoaded() {
    return this.modelsLoaded;
  }
}

// Export singleton instance
export default new MLService();
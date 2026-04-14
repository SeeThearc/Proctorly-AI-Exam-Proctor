import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import mlService from '../../services/mlService';
import socketService from '../../services/socketService';
import useProctoring from '../../hooks/useProctoring';
import useFullscreen from '../../hooks/useFullscreen';
import Button from '../../components/Common/Button';
import Modal from '../../components/Common/Modal';
import './ExamAttempt.css';

const ExamAttempt = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [examStarted, setExamStarted] = useState(false);

  // ── Face verification state ─────────────────────────────────────────────
  const [faceVerified, setFaceVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [referenceSnapshot, setReferenceSnapshot] = useState(null); // stored photo from DB
  const [cameraInitialized, setCameraInitialized] = useState(false);

  // ── Violation modal state ────────────────────────────────────────────────
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [violationMessage, setViolationMessage] = useState('');
  const [violationType, setViolationType] = useState('');
  const [isProcessingViolation, setIsProcessingViolation] = useState(false);
  // Snapshot captured at detection time — stored here until logViolation is called
  const violationSnapshotRef = useRef(null);

  const autoSubmitRef = useRef(false);

  // Initialize proctoring hook
  const {
    videoRef,
    warningCount,
    violations,
    stream,
    startProctoring,
    stopProctoring,
    logViolation,
    initializeWebcam,
  } = useProctoring(session?._id, exam?.proctoringSettings);

  // Fullscreen management
  const handleFullscreenViolation = async () => {
    if (!examStarted || isProcessingViolation) return;
    setIsProcessingViolation(true);

    if (videoRef.current) {
      violationSnapshotRef.current = mlService.captureSnapshot(videoRef.current);
    }
    
    setViolationType('fullscreen-exit');
    setViolationMessage('You exited fullscreen mode! Please click OK to return to fullscreen.');
    setShowViolationModal(true);
  };
  const { isFullscreen, enterFullscreen } = useFullscreen(handleFullscreenViolation);

  // ── Monitor fullscreen during exam ────────────────────────────────────────
  useEffect(() => {
    if (!examStarted) return;
    const checkFullscreen = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      );
      if (!isCurrentlyFullscreen && examStarted && !isProcessingViolation) {
        handleFullscreenViolation();
      }
    };
    document.addEventListener('fullscreenchange', checkFullscreen);
    document.addEventListener('webkitfullscreenchange', checkFullscreen);
    document.addEventListener('msfullscreenchange', checkFullscreen);
    return () => {
      document.removeEventListener('fullscreenchange', checkFullscreen);
      document.removeEventListener('webkitfullscreenchange', checkFullscreen);
      document.removeEventListener('msfullscreenchange', checkFullscreen);
    };
  }, [examStarted, isProcessingViolation]);

  // ── Fetch exam and initialize session ─────────────────────────────────────
  useEffect(() => {
    initializeExam();
  }, [examId]);

  // ── Timer countdown ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!examStarted || timeRemaining <= 0) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleAutoSubmit('Time expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [examStarted, timeRemaining]);

  // ── Auto-submit event listener ─────────────────────────────────────────────
  useEffect(() => {
    const handler = () => handleAutoSubmit('Maximum warnings reached');
    window.addEventListener('auto-submit-exam', handler);
    return () => window.removeEventListener('auto-submit-exam', handler);
  }, []);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopProctoring();
      socketService.disconnect();
    };
  }, []);

  // ── Violation handlers (set once exam starts) ──────────────────────────────
  useEffect(() => {
    if (!examStarted) return;

    // Each handler receives the snapshot captured at detection moment
    const handleNoFace = (snapshot) => {
      violationSnapshotRef.current = snapshot || null;
      handleProctoringViolation('no-face-detected', '⚠️ No face detected! Please ensure your face is visible in the camera.');
    };
    const handleMultipleFaces = (count, snapshot) => {
      violationSnapshotRef.current = snapshot || null;
      handleProctoringViolation('multiple-faces', '⚠️ Multiple faces detected! Only you should be visible during the exam.');
    };
    const handleHeadMovement = (direction, snapshot) => {
      violationSnapshotRef.current = snapshot || null;
      handleProctoringViolation('excessive-head-movement', `⚠️ Excessive head movement detected! You are looking ${direction}. Please look at the screen.`);
    };
    const handleTabSwitch = (snapshot) => {
      violationSnapshotRef.current = snapshot || null;
      handleProctoringViolation('tab-switch', '⚠️ Tab switch detected! Do NOT switch tabs or windows during the exam.');
    };
    const handleFaceMismatch = (snapshot) => {
      violationSnapshotRef.current = snapshot || null;
      handleProctoringViolation('face-not-matching', '⚠️ Face mismatch detected! The face in front of the camera does not match your registered face.');
    };

    window.proctoringViolationHandlers = {
      onNoFace: handleNoFace,
      onMultipleFaces: handleMultipleFaces,
      onHeadMovement: handleHeadMovement,
      onTabSwitch: handleTabSwitch,
      onFaceMismatch: handleFaceMismatch
    };
    return () => { delete window.proctoringViolationHandlers; };
  }, [examStarted, isProcessingViolation]);

  // ─────────────────────────────────────────────────────────────────────────
  // EXAM INIT
  // ─────────────────────────────────────────────────────────────────────────
  const initializeExam = async () => {
    try {
      setLoading(true);
      console.log('🚀 Initializing exam, examId:', examId);

      const sessionRes = await api.post(`/proctoring/start/${examId}`);

      if (!sessionRes.data.success) {
        if (sessionRes.data.redirectTo) {
          alert(sessionRes.data.message);
          navigate(sessionRes.data.redirectTo);
          return;
        }
        throw new Error(sessionRes.data.message || 'Failed to start session');
      }

      const sessionData = sessionRes.data.session;
      setSession(sessionData);

      const questionsRes = await api.get(`/proctoring/session/${sessionData._id}/questions`);
      if (!questionsRes.data.success) throw new Error(questionsRes.data.message || 'Failed to get questions');

      const examData = questionsRes.data.exam;
      const questionsData = questionsRes.data.questions;
      const currentAnswers = questionsRes.data.currentAnswers || [];

      setExam(examData);
      setQuestions(questionsData);
      setTimeRemaining(examData.duration * 60);

      const answersMap = {};
      currentAnswers.forEach((ans) => { answersMap[ans.questionId] = ans.selectedOption; });
      setAnswers(answersMap);

      // Connect socket
      const token = localStorage.getItem('token');
      if (token) socketService.connect(token);

      // Load reference snapshot for display
      try {
        const meRes = await api.get('/auth/me');
        if (meRes.data?.user?.faceSnapshot) {
          setReferenceSnapshot(meRes.data.user.faceSnapshot);
        }
      } catch (_) {}

      setLoading(false);

      // Auto-initialize webcam so the camera preview is live on the pre-exam screen
      // Do it after a short tick so the video element is rendered first
      setTimeout(async () => {
        try {
          await initializeWebcam();
          setCameraInitialized(true);
        } catch (e) {
          console.warn('Could not auto-init webcam:', e.message);
        }
      }, 300);

    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.redirectTo) {
        alert(error.response.data.message);
        navigate(error.response.data.redirectTo);
        return;
      }
      console.error('❌ Error initializing exam:', error);
      alert(`Failed to load exam: ${error.response?.data?.message || error.message}`);
      navigate('/student/exams');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // FACE VERIFICATION  (runs when student clicks "Verify Face")
  // ─────────────────────────────────────────────────────────────────────────
  const handleVerifyFace = async () => {
    try {
      setVerifying(true);
      setVerificationError('');

      // 1. Make sure ML models are loaded
      const modelsLoaded = await mlService.loadModels();
      if (!modelsLoaded) {
        setVerificationError('Failed to load face detection models. Please refresh the page.');
        setVerifying(false);
        return;
      }

      // 2. Fetch stored face descriptor
      const meRes = await api.get('/auth/me');
      const storedDescriptor = meRes.data?.user?.faceDescriptor;

      if (!storedDescriptor || storedDescriptor.length === 0) {
        alert('Face registration not found. Please complete face setup before attempting an exam.');
        navigate('/student/face-setup');
        return;
      }

      // 3. Capture live face descriptor
      if (!videoRef.current) throw new Error('Camera not ready');
      const liveDescriptor = await mlService.captureFaceDescriptor(videoRef.current);

      if (!liveDescriptor) {
        setVerificationError('No face detected in camera. Ensure your face is clearly visible in good lighting and try again.');
        setVerifying(false);
        return;
      }

      // 4. Compare
      const isMatch = mlService.verifyFace(liveDescriptor, storedDescriptor);

      if (isMatch) {
        console.log('✅ Face verification passed');
        setFaceVerified(true);
        setVerificationError('');
      } else {
        setVerificationError('❌ Face does not match your registered profile. Only the registered student can attempt this exam.');
      }

    } catch (err) {
      console.error('Face verification error:', err);
      setVerificationError('Verification failed. Please try again. ' + err.message);
    } finally {
      setVerifying(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // START EXAM  (only reachable after face verified)
  // ─────────────────────────────────────────────────────────────────────────
  const handleStartExam = async () => {
    try {
      console.log('🎬 Starting exam...');

      // Step 1: Enter fullscreen
      const fullscreenSuccess = await enterFullscreen();
      if (!fullscreenSuccess) {
        alert('Please allow fullscreen mode to start the exam');
        return;
      }

      // Step 2: Flip to exam view FIRST so React mounts the exam-window <video>
      // element. startProctoring must run AFTER this so ML starts on the new node.
      setExamStarted(true);

      // Step 3: Wait one animation frame for React to commit the DOM update
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      // Step 4: NOW start proctoring — videoRef.current is the exam-window video
      const proctoringSuccess = await startProctoring();
      if (!proctoringSuccess) {
        alert('Failed to initialize proctoring. Please check camera permissions.');
        // Don't block the exam — just log
      }

      if (session?._id) socketService.joinSession(session._id);

    } catch (error) {
      console.error('❌ Error starting exam:', error);
      alert('Failed to start exam: ' + error.message);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // VIOLATION HANDLING
  // ─────────────────────────────────────────────────────────────────────────
  const handleProctoringViolation = (type, message) => {
    if (isProcessingViolation) return;
    setIsProcessingViolation(true);
    setViolationType(type);
    setViolationMessage(message);
    setShowViolationModal(true);
  };

  const handleViolationOk = async () => {
    try {
      if (violationType && session?._id) {
        // Use the snapshot stored at detection time (not captured now)
        const snapshot = violationSnapshotRef.current;
        violationSnapshotRef.current = null;
        await logViolation(violationType, 'high', {}, snapshot);
      }
      if (violationType === 'fullscreen-exit') {
        const success = await enterFullscreen();
        if (!success) {
          alert('You must enable fullscreen to continue the exam');
          return;
        }
      }
      setShowViolationModal(false);
      setViolationMessage('');
      setViolationType('');
      setIsProcessingViolation(false);
    } catch (error) {
      console.error('Error processing violation:', error);
      setIsProcessingViolation(false);
    }
  };

  // Keep a ref to the latest handleViolationOk to avoid stale closures in timeouts
  const handleViolationOkRef = useRef(null);
  useEffect(() => {
    handleViolationOkRef.current = handleViolationOk;
  });

  // Auto-dismiss the violation modal after 4 seconds
  useEffect(() => {
    if (showViolationModal) {
      const timer = setTimeout(() => {
        if (handleViolationOkRef.current) {
          handleViolationOkRef.current();
        }
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showViolationModal]);

  // ─────────────────────────────────────────────────────────────────────────
  // ANSWER + SUBMIT
  // ─────────────────────────────────────────────────────────────────────────
  const handleAnswerChange = async (questionId, selectedOption) => {
    setAnswers((prev) => ({ ...prev, [questionId]: selectedOption }));
    try {
      await api.post(`/proctoring/answer/${session._id}`, { questionId, selectedOption, timeSpent: 0 });
    } catch (error) {
      console.error('Error saving answer:', error);
    }
  };

  const handleSubmit = () => setShowSubmitModal(true);

  const confirmSubmit = async () => {
    if (submitting || autoSubmitRef.current) return;
    try {
      setSubmitting(true);
      setShowSubmitModal(false);
      stopProctoring();
      const response = await api.post(`/proctoring/submit/${session._id}`);
      if (response.data.results) {
        navigate(`/student/results/${session._id}`);
      } else {
        alert('Exam submitted successfully! Results will be available soon.');
        navigate('/student/exams');
      }
    } catch (error) {
      console.error('Error submitting exam:', error);
      alert('Failed to submit exam. Please try again.');
      setSubmitting(false);
      startProctoring();
    }
  };

  const handleAutoSubmit = async (reason) => {
    if (autoSubmitRef.current || submitting) return;
    autoSubmitRef.current = true;
    try {
      stopProctoring();
      await api.post(`/proctoring/submit/${session._id}`);
      alert(`Exam auto-submitted: ${reason}`);
      navigate('/student');
    } catch (error) {
      console.error('Error auto-submitting exam:', error);
      navigate('/student');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  const getAnsweredCount = () => Object.keys(answers).length;
  const navigateQuestion = (direction) => {
    if (direction === 'next' && currentQuestionIndex < questions.length - 1)
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    else if (direction === 'prev' && currentQuestionIndex > 0)
      setCurrentQuestionIndex(currentQuestionIndex - 1);
  };
  const jumpToQuestion = (index) => setCurrentQuestionIndex(index);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: LOADING
  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="exam-loading">
        <div className="loader-spinner"></div>
        <p>Loading exam...</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: PRE-EXAM SCREEN (face verification gate)
  // ─────────────────────────────────────────────────────────────────────────
  if (!examStarted) {
    return (
      <div className="exam-start-screen">
        <div className="exam-start-card" style={{ maxWidth: '800px' }}>
          <h1>{exam.title}</h1>
          <p className="exam-start-info">
            Duration: {exam.duration} minutes | Total Marks: {exam.totalMarks}
          </p>

          {/* ── Face Verification Panel ── */}
          <div style={{
            background: faceVerified ? '#f0fdf4' : '#fafafa',
            border: `2px solid ${faceVerified ? '#22c55e' : '#e5e7eb'}`,
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginBottom: '12px' }}>
              {faceVerified ? '✅ Identity Verified' : '🔐 Identity Verification Required'}
            </h3>

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
              {/* Reference photo */}
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '6px' }}>Your registered photo</p>
                {referenceSnapshot ? (
                  <img
                    src={referenceSnapshot}
                    alt="Registered face"
                    style={{
                      width: '200px', height: '150px',
                      objectFit: 'cover', borderRadius: '8px',
                      border: '2px solid #d1d5db',
                      transform: 'scaleX(-1)'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '200px', height: '150px', borderRadius: '8px',
                    background: '#e5e7eb', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: '#6b7280', fontSize: '0.9rem'
                  }}>
                    No photo on file
                  </div>
                )}
              </div>

              {/* Live camera */}
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '6px' }}>Live camera</p>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '200px', height: '150px',
                    objectFit: 'cover', borderRadius: '8px',
                    border: `2px solid ${faceVerified ? '#22c55e' : '#d1d5db'}`,
                    transform: 'scaleX(-1)',
                    backgroundColor: '#000'
                  }}
                />
              </div>
            </div>

            {/* Status / error message */}
            {verificationError && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fca5a5',
                borderRadius: '8px', padding: '10px 14px',
                color: '#dc2626', fontSize: '0.9rem', marginBottom: '12px'
              }}>
                {verificationError}
              </div>
            )}

            {faceVerified ? (
              <div style={{
                background: '#dcfce7', borderRadius: '8px', padding: '10px 14px',
                color: '#15803d', fontWeight: '600', textAlign: 'center'
              }}>
                ✅ Face matched successfully — you may start the exam
              </div>
            ) : (
              <Button
                variant="primary"
                onClick={handleVerifyFace}
                loading={verifying}
                fullWidth
                style={{ marginTop: '4px' }}
              >
                {verifying ? 'Verifying...' : '🔍 Verify My Face'}
              </Button>
            )}
          </div>

          {/* ── Instructions ── */}
          <div className="exam-start-instructions">
            <h3>⚠️ Before you start:</h3>
            <ul>
              <li>Ensure stable internet connection</li>
              <li>Your webcam will be monitored continuously</li>
              <li>The exam will open in fullscreen mode</li>
              <li>Do not switch tabs or exit fullscreen</li>
              <li>Keep your face visible at all times</li>
              <li>Avoid excessive head movement</li>
              <li>You have {exam.proctoringSettings?.warningThreshold || 3} warnings before auto-submission</li>
            </ul>
          </div>

          {/* ── Start button — only enabled after face is verified ── */}
          <Button
            variant="success"
            size="large"
            onClick={handleStartExam}
            fullWidth
            disabled={!faceVerified}
            title={!faceVerified ? 'Please verify your face first' : ''}
          >
            {faceVerified ? '🚀 Start Exam Now' : '🔒 Verify Face to Unlock'}
          </Button>

          <Button
            variant="secondary"
            size="large"
            onClick={() => navigate('/student/exams')}
            fullWidth
            style={{ marginTop: '12px' }}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: EXAM WINDOW
  // ─────────────────────────────────────────────────────────────────────────
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="exam-window">
      {/* Warning Banner */}
      {warningCount > 0 && (
        <div className={`warning-banner warning-level-${Math.min(warningCount, 3)}`}>
          ⚠️ Warnings: {warningCount}/{exam.proctoringSettings?.warningThreshold || 3}
          {warningCount >= (exam.proctoringSettings?.warningThreshold || 3) - 1 &&
            ' — One more violation will auto-submit your exam!'}
        </div>
      )}

      {/* Exam Header */}
      <div className="exam-header">
        <div className="exam-info">
          <h2>{exam.title}</h2>
          <span className="question-indicator">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
        </div>

        <div className="exam-stats">
          <div className="stat-item">
            <span className="stat-label">Answered: </span>
            <span className="stat-value">{getAnsweredCount()}/{questions.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Time: </span>
            <span className={`stat-value ${timeRemaining < 300 ? 'time-warning' : ''}`}>
              {formatTime(timeRemaining)}
            </span>
          </div>
        </div>

        {/* Webcam Mini Preview */}
        <div className="webcam-mini">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ transform: 'scaleX(-1)', width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <span className="webcam-status">
            {warningCount === 0 ? '✓ Monitoring' : `⚠️ ${warningCount} warnings`}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="exam-content">
        {/* Question Navigator Sidebar */}
        <div className="question-navigator">
          <h3>Questions</h3>
          <div className="question-grid">
            {questions.map((q, index) => (
              <button
                key={q._id}
                className={`question-nav-button ${index === currentQuestionIndex ? 'active' : ''} ${answers[q._id] !== undefined ? 'answered' : ''}`}
                onClick={() => jumpToQuestion(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <div className="navigator-legend">
            <div className="legend-item"><span className="legend-box answered"></span><span>Answered</span></div>
            <div className="legend-item"><span className="legend-box unanswered"></span><span>Not Answered</span></div>
          </div>
        </div>

        {/* Question Display */}
        <div className="question-container">
          <div className="question-header">
            <h3>Question {currentQuestionIndex + 1}</h3>
            <span className="question-marks">{currentQuestion.marks} mark(s)</span>
          </div>
          <div className="question-text">{currentQuestion.questionText}</div>
          {currentQuestion.image && (
            <img src={currentQuestion.image} alt="Question" className="question-image" />
          )}
          <div className="options-container">
            {currentQuestion.options.map((option, index) => (
              <label
                key={index}
                className={`option-item ${answers[currentQuestion._id] === index ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion._id}`}
                  value={index}
                  checked={answers[currentQuestion._id] === index}
                  onChange={() => handleAnswerChange(currentQuestion._id, index)}
                />
                <span className="option-label">{String.fromCharCode(65 + index)}. {option}</span>
                <span className="option-radio"></span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="exam-footer">
        <div className="footer-left">
          <Button variant="secondary" onClick={() => navigateQuestion('prev')} disabled={currentQuestionIndex === 0}>
            ← Previous
          </Button>
        </div>
        <div className="footer-center">
          <span className="progress-text">{getAnsweredCount()} of {questions.length} answered</span>
        </div>
        <div className="footer-right">
          {currentQuestionIndex < questions.length - 1 ? (
            <Button variant="secondary" onClick={() => navigateQuestion('next')}>Next →</Button>
          ) : (
            <Button variant="success" onClick={handleSubmit} disabled={submitting}>Submit Exam</Button>
          )}
        </div>
      </div>

      {/* Violation Modal */}
      <Modal
        isOpen={showViolationModal}
        onClose={() => {}}
        title="⚠️ Violation Detected"
        footer={
          <Button variant="primary" onClick={handleViolationOk} fullWidth>
            OK - I Understand
          </Button>
        }
      >
        <div className="violation-modal-content">
          <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>{violationMessage}</p>
          <p style={{ color: '#dc2626', fontWeight: '600' }}>This violation has been recorded.</p>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Warnings: {warningCount + 1}/{exam.proctoringSettings?.warningThreshold || 3}
          </p>
        </div>
      </Modal>

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Confirm Submission"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowSubmitModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={confirmSubmit} loading={submitting}>Submit Exam</Button>
          </>
        }
      >
        <div className="submit-confirmation">
          <p><strong>Are you sure you want to submit the exam?</strong></p>
          <div className="submit-stats">
            <p>Questions Answered: {getAnsweredCount()} / {questions.length}</p>
            <p>Questions Unanswered: {questions.length - getAnsweredCount()}</p>
            <p>Time Remaining: {formatTime(timeRemaining)}</p>
          </div>
          <p className="submit-warning">⚠️ Once submitted, you cannot make any changes.</p>
        </div>
      </Modal>
    </div>
  );
};

export default ExamAttempt;
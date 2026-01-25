import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
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

  // ✅ NEW:  Violation modal state
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [violationMessage, setViolationMessage] = useState('');
  const [violationType, setViolationType] = useState('');
  const [isProcessingViolation, setIsProcessingViolation] = useState(false);

  const autoSubmitRef = useRef(false);

  // Initialize proctoring
  const {
    videoRef,
    warningCount,
    violations,
    startProctoring,
    stopProctoring,
    logViolation
  } = useProctoring(session?._id, exam?. proctoringSettings);

  // ✅ NEW: Custom fullscreen handler with violation detection
  const handleFullscreenViolation = async () => {
    if (!examStarted || isProcessingViolation) return;

    setIsProcessingViolation(true);
    setViolationType('fullscreen-exit');
    setViolationMessage('You exited fullscreen mode!  Please click OK to return to fullscreen.');
    setShowViolationModal(true);
  };

  // Fullscreen management
  const { isFullscreen, enterFullscreen } = useFullscreen(handleFullscreenViolation);

  // ✅ NEW:  Monitor fullscreen during exam
  useEffect(() => {
    if (! examStarted) return;

    const checkFullscreen = () => {
      const isCurrentlyFullscreen = ! !(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document. msFullscreenElement
      );

      if (! isCurrentlyFullscreen && examStarted && ! isProcessingViolation) {
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

  // Fetch exam and session
  useEffect(() => {
    initializeExam();
  }, [examId]);

  // Timer countdown
  useEffect(() => {
    if (! examStarted || timeRemaining <= 0) return;

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

  // Listen for auto-submit event
  useEffect(() => {
    const handleAutoSubmitEvent = () => {
      handleAutoSubmit('Maximum warnings reached');
    };

    window.addEventListener('auto-submit-exam', handleAutoSubmitEvent);

    return () => {
      window.removeEventListener('auto-submit-exam', handleAutoSubmitEvent);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProctoring();
      socketService.disconnect();
    };
  }, []);

  const initializeExam = async () => {
    try {
      setLoading(true);

      console.log('🚀 Initializing exam.. .');
      console.log('📝 Exam ID:', examId);

      // Start or resume session
      console.log('📡 Starting exam session...');
      
      try {
        const sessionRes = await api.post(`/proctoring/start/${examId}`);
        
        console.log('✅ Session response:', sessionRes.data);
        
        if (! sessionRes.data.success) {
          // Check if there's a redirect path
          if (sessionRes.data.redirectTo) {
            alert(sessionRes.data.message);
            navigate(sessionRes.data.redirectTo);
            return;
          }
          throw new Error(sessionRes.data.message || 'Failed to start session');
        }

        const sessionData = sessionRes.data. session;
        setSession(sessionData);

        console.log('✅ Session created:', sessionData._id);

        // Get exam questions
        console.log('📖 Fetching questions...');
        const questionsRes = await api.get(`/proctoring/session/${sessionData._id}/questions`);
        
        console.log('✅ Questions response:', questionsRes.data);

        if (!questionsRes.data.success) {
          throw new Error(questionsRes.data.message || 'Failed to get questions');
        }

        const examData = questionsRes.data.exam;
        const questionsData = questionsRes.data.questions;
        const currentAnswers = questionsRes.data.currentAnswers || [];

        setExam(examData);
        setQuestions(questionsData);
        setTimeRemaining(examData.duration * 60);

        console.log('📚 Exam data loaded:', {
          title: examData.title,
          duration: examData.duration,
          questions: questionsData.length
        });

        // Load existing answers
        const answersMap = {};
        currentAnswers.forEach((ans) => {
          answersMap[ans. questionId] = ans.selectedOption;
        });
        setAnswers(answersMap);

        // Connect socket
        console.log('🔌 Connecting socket...');
        const token = localStorage.getItem('token');
        if (token) {
          socketService.connect(token);
        }

        setLoading(false);
        console.log('✅ Exam initialized successfully');
        
      } catch (sessionError) {
        console.error('❌ Session creation error:', sessionError);
        console.error('❌ Error response:', sessionError.response?.data);
        
        // Handle already completed exam
        if (sessionError.response?.status === 400 && sessionError.response?.data?. redirectTo) {
          alert(sessionError.response.data.message);
          navigate(sessionError. response.data.redirectTo);
          return;
        }
        
        throw sessionError;
      }
      
    } catch (error) {
      console.error('❌ Error initializing exam:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      alert(`Failed to load exam: ${error.response?.data?.message || error.message}`);
      navigate('/student/exams');
    }
  };

  const handleStartExam = async () => {
  try {
    console.log('🎬 Starting exam...');
    
    // Enter fullscreen first
    const fullscreenSuccess = await enterFullscreen();
    if (!fullscreenSuccess) {
      alert('Please allow fullscreen mode to start the exam');
      return;
    }

    // Start proctoring (this initializes camera)
    const proctoringSuccess = await startProctoring();
    if (!proctoringSuccess) {
      alert('Failed to initialize proctoring.  Please check camera permissions.');
      return;
    }

    // ✅ Manually attach stream to video element after exam starts
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      console.log('✅ Got stream with tracks:', stream.getTracks());
      
      // Ensure video is playing
      videoRef.current.muted = true;
      videoRef.current. playsInline = true;
      await videoRef.current.play();
      console.log('✅ Video playing');
    }

    // Join session room
    if (session?._id) {
      socketService.joinSession(session._id);
    }

    setExamStarted(true);
  } catch (error) {
    console.error('❌ Error starting exam:', error);
    alert('Failed to start exam: ' + error.message);
  }
};

  // ✅ NEW: Handle violation acknowledgment
  const handleViolationOk = async () => {
    try {
      console.log('⚠️ Processing violation:', violationType);

      // Log the violation to backend
      if (violationType && session?._id) {
        await logViolation(violationType);
      }

      // If fullscreen violation, re-enter fullscreen
      if (violationType === 'fullscreen-exit') {
        const success = await enterFullscreen();
        if (!success) {
          alert('You must enable fullscreen to continue the exam');
          return;
        }
      }

      // Close modal and reset
      setShowViolationModal(false);
      setViolationMessage('');
      setViolationType('');
      setIsProcessingViolation(false);

      console.log('✅ Violation processed and resolved');
    } catch (error) {
      console.error('❌ Error processing violation:', error);
      setIsProcessingViolation(false);
    }
  };

  // ✅ NEW: Handle proctoring violations from ML service
  const handleProctoringViolation = (type, message) => {
    if (isProcessingViolation) return; // Don't show multiple violations at once

    setIsProcessingViolation(true);
    setViolationType(type);
    setViolationMessage(message);
    setShowViolationModal(true);
  };

  // ✅ NEW: Override proctoring hook with custom violation handler
  useEffect(() => {
    if (! examStarted) return;

    // Listen for proctoring violations
    const handleNoFace = () => {
      handleProctoringViolation('no-face-detected', '⚠️ No face detected!  Please ensure your face is visible in the camera.');
    };

    const handleMultipleFaces = () => {
      handleProctoringViolation('multiple-faces', '⚠️ Multiple faces detected! Only you should be visible during the exam.');
    };

    const handleHeadMovement = (direction) => {
      handleProctoringViolation('head-movement', `⚠️ Excessive head movement detected! You are looking ${direction}.  Please look at the screen. `);
    };

    // Store handlers in window for ML service to call
    window.proctoringViolationHandlers = {
      onNoFace: handleNoFace,
      onMultipleFaces: handleMultipleFaces,
      onHeadMovement: handleHeadMovement
    };

    return () => {
      delete window.proctoringViolationHandlers;
    };
  }, [examStarted, isProcessingViolation]);

  const handleAnswerChange = async (questionId, selectedOption) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: selectedOption
    }));

    // Save to backend
    try {
      await api.post(`/proctoring/answer/${session._id}`, {
        questionId,
        selectedOption,
        timeSpent: 0
      });
    } catch (error) {
      console.error('Error saving answer:', error);
    }
  };

  const handleSubmit = () => {
    setShowSubmitModal(true);
  };

  const confirmSubmit = async () => {
  if (submitting || autoSubmitRef.current) return;

  try {
    setSubmitting(true);
    setShowSubmitModal(false);

    // ✅ Stop proctoring and turn off video BEFORE submitting
    console.log('🛑 Stopping proctoring before submission.. .');
    stopProctoring();

    const response = await api.post(`/proctoring/submit/${session._id}`);

    if (response.data.results) {
      // Results available immediately
      navigate(`/student/results/${session._id}`);
    } else {
      alert('Exam submitted successfully!  Results will be available soon.');
      navigate('/student/exams');
    }
  } catch (error) {
    console.error('Error submitting exam:', error);
    alert('Failed to submit exam. Please try again.');
    setSubmitting(false);
    // ✅ Restart proctoring if submission failed
    startProctoring();
  }
};

const handleAutoSubmit = async (reason) => {
  if (autoSubmitRef.current || submitting) return;
  autoSubmitRef.current = true;

  try {
    console.log('🚨 Auto-submitting exam:', reason);
    
    // ✅ Stop proctoring and turn off video BEFORE submitting
    console.log('🛑 Stopping proctoring before auto-submission...');
    stopProctoring();
    
    await api.post(`/proctoring/submit/${session._id}`);
    
    alert(`Exam auto-submitted:  ${reason}`);
    
    navigate('/student');
    
  } catch (error) {
    console.error('Error auto-submitting exam:', error);
    alert('Failed to auto-submit exam. Please contact support.');
    
    navigate('/student');
  }
};

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  const navigateQuestion = (direction) => {
    if (direction === 'next' && currentQuestionIndex < questions. length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (direction === 'prev' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const jumpToQuestion = (index) => {
    setCurrentQuestionIndex(index);
  };

  if (loading) {
    return (
      <div className="exam-loading">
        <div className="loader-spinner"></div>
        <p>Loading exam...</p>
      </div>
    );
  }

  if (!examStarted) {
    return (
      <div className="exam-start-screen">
        <div className="exam-start-card">
          <h1>{exam. title}</h1>
          <p className="exam-start-info">Duration: {exam.duration} minutes | Total Marks: {exam.totalMarks}</p>

          <div className="proctoring-preview">
            <h3>Camera Preview</h3>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline
              muted 
              className="preview-video"
              style={{
                transform: 'scaleX(-1)', // Mirror effect
                width: '100%',
                maxWidth: '640px',
                borderRadius: '8px',
                backgroundColor: '#000'
              }}
            />
            <p>Please ensure your face is clearly visible</p>
          </div>

          <div className="exam-start-instructions">
            <h3>⚠️ Before you start: </h3>
            <ul>
              <li>Ensure stable internet connection</li>
              <li>Your webcam will be monitored continuously</li>
              <li>The exam will open in fullscreen mode</li>
              <li>Do not switch tabs or exit fullscreen</li>
              <li>Keep your face visible at all times</li>
              <li>Avoid excessive head movement</li>
              <li>You have {exam.proctoringSettings?. warningThreshold || 3} warnings before auto-submission</li>
            </ul>
          </div>

          <Button variant="primary" size="large" onClick={handleStartExam} fullWidth>
            Start Exam Now
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

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="exam-window">
      {/* Warning Banner */}
      {warningCount > 0 && (
        <div className={`warning-banner warning-level-${Math.min(warningCount, 3)}`}>
          ⚠️ Warnings:  {warningCount}/{exam.proctoringSettings?.warningThreshold || 3}
          {warningCount >= (exam.proctoringSettings?.warningThreshold || 3) - 1 &&
            ' - One more violation will auto-submit your exam! '}
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
            <span className="stat-value">
              {getAnsweredCount()}/{questions.length}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Time: </span>
            <span className={`stat-value ${timeRemaining < 300 ? 'time-warning' : ''}`}>
              {formatTime(timeRemaining)}
            </span>
          </div>
        </div>

        {/* Webcam Preview */}
          <div className="webcam-mini">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline
              muted 
              style={{ 
                transform: 'scaleX(-1)',
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
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
                className={`question-nav-button ${
                  index === currentQuestionIndex ? 'active' : ''
                } ${answers[q._id] !== undefined ? 'answered' : ''}`}
                onClick={() => jumpToQuestion(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <div className="navigator-legend">
            <div className="legend-item">
              <span className="legend-box answered"></span>
              <span>Answered</span>
            </div>
            <div className="legend-item">
              <span className="legend-box unanswered"></span>
              <span>Not Answered</span>
            </div>
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
                className={`option-item ${
                  answers[currentQuestion._id] === index ? 'selected' : ''
                }`}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion._id}`}
                  value={index}
                  checked={answers[currentQuestion._id] === index}
                  onChange={() => handleAnswerChange(currentQuestion._id, index)}
                />
                <span className="option-label">
                  {String.fromCharCode(65 + index)}. {option}
                </span>
                <span className="option-radio"></span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="exam-footer">
        <div className="footer-left">
          <Button
            variant="secondary"
            onClick={() => navigateQuestion('prev')}
            disabled={currentQuestionIndex === 0}
          >
            ← Previous
          </Button>
        </div>

        <div className="footer-center">
          <span className="progress-text">
            {getAnsweredCount()} of {questions.length} answered
          </span>
        </div>

        <div className="footer-right">
          {currentQuestionIndex < questions.length - 1 ? (
            <Button variant="secondary" onClick={() => navigateQuestion('next')}>
              Next →
            </Button>
          ) : (
            <Button variant="success" onClick={handleSubmit} disabled={submitting}>
              Submit Exam
            </Button>
          )}
        </div>
      </div>

      {/* ✅ NEW: Violation Modal */}
      <Modal
        isOpen={showViolationModal}
        onClose={() => {}} // Prevent closing without OK
        title="⚠️ Violation Detected"
        footer={
          <Button variant="primary" onClick={handleViolationOk} fullWidth>
            OK - I Understand
          </Button>
        }
      >
        <div className="violation-modal-content">
          <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
            {violationMessage}
          </p>
          <p style={{ color: '#dc2626', fontWeight: '600' }}>
            This violation has been recorded.
          </p>
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
            <Button variant="secondary" onClick={() => setShowSubmitModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmSubmit} loading={submitting}>
              Submit Exam
            </Button>
          </>
        }
      >
        <div className="submit-confirmation">
          <p>
            <strong>Are you sure you want to submit the exam?</strong>
          </p>
          <div className="submit-stats">
            <p>Questions Answered: {getAnsweredCount()} / {questions.length}</p>
            <p>Questions Unanswered: {questions.length - getAnsweredCount()}</p>
            <p>Time Remaining: {formatTime(timeRemaining)}</p>
          </div>
          <p className="submit-warning">
            ⚠️ Once submitted, you cannot make any changes. 
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default ExamAttempt;
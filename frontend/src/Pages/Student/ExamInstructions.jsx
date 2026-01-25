import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Layout/Navbar';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import Loader from '../../components/Common/Loader';
import Alert from '../../components/Common/Alert';
import './ExamInstructions.css';

const ExamInstructions = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    fetchExamDetails();
  }, [examId]);

  const fetchExamDetails = async () => {
    try {
      const response = await api.get(`/student/exams/${examId}`);
      setExam(response.data. exam);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching exam:', error);
      setLoading(false);
    }
  };

  const handleStartExam = () => {
    if (! agreed) {
      alert('Please read and accept the instructions');
      return;
    }
    navigate(`/student/exam/${examId}/attempt`);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Loader fullScreen message="Loading exam details..." />
      </>
    );
  }

  if (!exam) {
    return (
      <>
        <Navbar />
        <div className="instructions-container">
          <Alert type="error" message="Exam not found" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="instructions-container">
        <Card>
          <div className="instructions-header">
            <h1>{exam.title}</h1>
            <p className="exam-course">{exam.course}</p>
          </div>

          <div className="instructions-content">
            <h2>📋 Exam Details</h2>
            <div className="exam-info-grid">
              <div className="info-item">
                <span className="info-label">Duration:</span>
                <span className="info-value">{exam. duration} minutes</span>
              </div>
              <div className="info-item">
                <span className="info-label">Total Marks:</span>
                <span className="info-value">{exam.totalMarks}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Passing Marks:</span>
                <span className="info-value">{exam.passingMarks}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Total Questions:</span>
                <span className="info-value">{exam.questions?. length || 0}</span>
              </div>
            </div>

            <h2>⚠️ Important Instructions</h2>
            <div className="instructions-list">
              <div className="instruction-item">
                <span className="instruction-icon">1️⃣</span>
                <div>
                  <h4>Exam Duration</h4>
                  <p>You have {exam.duration} minutes to complete this exam.  The exam will auto-submit when time expires.</p>
                </div>
              </div>

              <div className="instruction-item">
                <span className="instruction-icon">2️⃣</span>
                <div>
                  <h4>Full Screen Mode</h4>
                  <p>The exam will open in full-screen mode.  Exiting full-screen will be treated as a violation.</p>
                </div>
              </div>

              <div className="instruction-item">
                <span className="instruction-icon">3️⃣</span>
                <div>
                  <h4>Face Detection</h4>
                  <p>Your webcam will continuously monitor your face.  Ensure good lighting and keep looking at the screen.</p>
                </div>
              </div>

              <div className="instruction-item">
                <span className="instruction-icon">4️⃣</span>
                <div>
                  <h4>Warning System</h4>
                  <p>You will receive warnings for violations. After {exam.proctoringSettings?. warningThreshold || 3} warnings, your exam will be auto-submitted.</p>
                </div>
              </div>

              <div className="instruction-item">
                <span className="instruction-icon">5️⃣</span>
                <div>
                  <h4>Prohibited Actions</h4>
                  <ul>
                    <li>Switching tabs or windows</li>
                    <li>Looking away from screen frequently</li>
                    <li>Having multiple faces in frame</li>
                    <li>Leaving the exam area</li>
                  </ul>
                </div>
              </div>

              <div className="instruction-item">
                <span className="instruction-icon">6️⃣</span>
                <div>
                  <h4>Question Navigation</h4>
                  <p>You can navigate between questions freely. Your answers are auto-saved.</p>
                </div>
              </div>

              <div className="instruction-item">
                <span className="instruction-icon">7️⃣</span>
                <div>
                  <h4>Submission</h4>
                  <p>Once submitted, you cannot re-attempt the exam. Review all answers before final submission.</p>
                </div>
              </div>
            </div>

            <h2>🔒 Proctoring Settings for This Exam</h2>
            <div className="proctoring-settings">
              <div className={`setting-item ${exam.proctoringSettings?.enableFaceDetection ? 'enabled' : 'disabled'}`}>
                {exam.proctoringSettings?.enableFaceDetection ?  '✅' : '❌'} Face Detection
              </div>
              <div className={`setting-item ${exam.proctoringSettings?.enableMultipleFaceDetection ? 'enabled' :  'disabled'}`}>
                {exam.proctoringSettings?. enableMultipleFaceDetection ?  '✅' : '❌'} Multiple Face Detection
              </div>
              <div className={`setting-item ${exam.proctoringSettings?.enableHeadMovement ? 'enabled' : 'disabled'}`}>
                {exam.proctoringSettings?.enableHeadMovement ? '✅' : '❌'} Head Movement Detection
              </div>
              <div className={`setting-item ${exam.proctoringSettings?.enableTabSwitch ? 'enabled' : 'disabled'}`}>
                {exam.proctoringSettings?.enableTabSwitch ? '✅' : '❌'} Tab Switch Detection
              </div>
            </div>

            <Alert
              type="warning"
              message="⚠️ Ensure you have a stable internet connection and your webcam is working properly before starting the exam."
            />

            <div className="agreement-section">
              <label className="agreement-checkbox">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <span>
                  I have read and understood all the instructions.  I agree to follow all rules and regulations during the exam.
                </span>
              </label>
            </div>

            <div className="instructions-actions">
              <Button
                variant="secondary"
                size="large"
                onClick={() => navigate('/student/exams')}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="large"
                onClick={handleStartExam}
                disabled={!agreed}
              >
                I'm Ready - Start Exam
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};

export default ExamInstructions;
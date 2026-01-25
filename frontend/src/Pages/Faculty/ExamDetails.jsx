import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Layout/Navbar';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import Alert from '../../components/Common/Alert';
import './ExamDetails.css';

const ExamDetails = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('details'); // details, questions, sessions

  useEffect(() => {
    fetchExamDetails();
    fetchExamSessions();
  }, [examId]);

  const fetchExamDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/faculty/exams/${examId}`);
      
      if (response.data. success) {
        setExam(response.data.exam);
      }
    } catch (error) {
      console.error('Error fetching exam:', error);
      setError(error.response?.data?.message || 'Failed to load exam details');
    } finally {
      setLoading(false);
    }
  };

  const fetchExamSessions = async () => {
    try {
      const response = await api.get(`/faculty/exams/${examId}/sessions`);
      
      if (response.data.success) {
        setSessions(response.data.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const handleDeleteExam = async () => {
    if (! window.confirm('Are you sure you want to delete this exam?  This action cannot be undone.')) {
      return;
    }

    try {
      await api. delete(`/faculty/exams/${examId}`);
      alert('Exam deleted successfully');
      navigate('/faculty');
    } catch (error) {
      console.error('Error deleting exam:', error);
      alert('Failed to delete exam');
    }
  };

  const handleToggleActive = async () => {
  try {
    // Use the same update exam route
    const response = await api.put(`/faculty/exams/${examId}`, {
      ...exam,  // Send all existing exam data
      isActive: !exam.isActive  // Toggle the active status
    });
    
    if (response. data.success) {
      setExam(response.data.exam);
      //alert(`Exam ${response.data.exam.isActive ?  'activated' : 'deactivated'} successfully`);
    }
  } catch (error) {
    console.error('Error toggling exam status:', error);
    alert('Failed to update exam status');
  }
};

  const getExamStatus = () => {
    if (!exam) return 'unknown';
    
    const now = new Date();
    const scheduled = new Date(exam.scheduledDate);
    const ended = new Date(exam.endDate);

    if (now < scheduled) return 'upcoming';
    if (now >= scheduled && now <= ended) return 'ongoing';
    return 'ended';
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="exam-details-container">
          <div className="loading">Loading exam details...</div>
        </div>
      </>
    );
  }

  if (error || !exam) {
    return (
      <>
        <Navbar />
        <div className="exam-details-container">
          <Alert type="error" message={error || 'Exam not found'} />
          <Button variant="secondary" onClick={() => navigate('/faculty')}>
            Back to Dashboard
          </Button>
        </div>
      </>
    );
  }

  const status = getExamStatus();

  return (
    <>
      <Navbar />
      <div className="exam-details-container">
        {/* Header */}
        <div className="exam-details-header">
          <div>
            <h1>{exam.title}</h1>
            <p className="exam-course">{exam.course}</p>
          </div>
          <div className="header-actions">
            <span className={`status-badge status-${status}`}>
              {status. toUpperCase()}
            </span>
            <span className={`status-badge ${exam.isActive ? 'status-active' : 'status-inactive'}`}>
              {exam.isActive ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <Button variant="secondary" onClick={() => navigate('/faculty')}>
            ← Back to Dashboard
          </Button>
          <div className="action-buttons-right">
            <Button 
              variant={exam.isActive ? 'warning' : 'success'} 
              onClick={handleToggleActive}
            >
              {exam.isActive ? 'Deactivate' : 'Activate'}
            </Button>
            <Button variant="primary" onClick={() => navigate(`/faculty/exams/${examId}/edit`)}>
              Edit Exam
            </Button>
            <Button variant="danger" onClick={handleDeleteExam}>
              Delete Exam
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'details' ?  'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          <button 
            className={`tab ${activeTab === 'questions' ? 'active' :  ''}`}
            onClick={() => setActiveTab('questions')}
          >
            Questions ({exam.questions?. length || 0})
          </button>
          <button 
            className={`tab ${activeTab === 'sessions' ? 'active' : ''}`}
            onClick={() => setActiveTab('sessions')}
          >
            Sessions ({sessions.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'details' && (
            <Card title="Exam Information">
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Description: </span>
                  <span className="info-value">{exam. description || 'No description'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Duration:</span>
                  <span className="info-value">{exam.duration} minutes</span>
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
                  <span className="info-value">{exam.questions?.length || 0}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Scheduled Date:</span>
                  <span className="info-value">
                    {new Date(exam.scheduledDate).toLocaleString()}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">End Date:</span>
                  <span className="info-value">
                    {new Date(exam. endDate).toLocaleString()}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Allowed Students:</span>
                  <span className="info-value">{exam.allowedStudents?. length || 0}</span>
                </div>
              </div>

              <h3 style={{ marginTop: '2rem' }}>Proctoring Settings</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Face Detection:</span>
                  <span className="info-value">
                    {exam.proctoringSettings?.enableFaceDetection ? '✓ Enabled' : '✗ Disabled'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Multiple Face Detection:</span>
                  <span className="info-value">
                    {exam.proctoringSettings?.enableMultipleFaceDetection ? '✓ Enabled' : '✗ Disabled'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Tab Switch Detection:</span>
                  <span className="info-value">
                    {exam.proctoringSettings?.enableTabSwitch ? '✓ Enabled' : '✗ Disabled'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Warning Threshold:</span>
                  <span className="info-value">
                    {exam.proctoringSettings?.warningThreshold || 3}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'questions' && (
            <Card title="Questions">
              {exam.questions && exam.questions.length > 0 ? (
                <div className="questions-list">
                  {exam.questions.map((question, index) => (
                    <div key={question._id} className="question-item">
                      <div className="question-header">
                        <h4>Question {index + 1}</h4>
                        <span className="question-marks">{question.marks} marks</span>
                      </div>
                      <p className="question-text">{question.questionText}</p>
                      <div className="options-list">
                        {question.options.map((option, optIndex) => (
                          <div 
                            key={optIndex} 
                            className={`option ${optIndex === question.correctAnswer ? 'correct' : ''}`}
                          >
                            <span className="option-letter">
                              {String.fromCharCode(65 + optIndex)}. 
                            </span>
                            <span>{option}</span>
                            {optIndex === question.correctAnswer && (
                              <span className="correct-indicator">✓ Correct</span>
                            )}
                          </div>
                        ))}
                      </div>
                      {question.explanation && (
                        <div className="explanation">
                          <strong>Explanation:</strong> {question.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p>No questions added yet. </p>
              )}
            </Card>
          )}

          {activeTab === 'sessions' && (
            <Card title="Student Sessions">
              {sessions.length > 0 ? (
                <div className="sessions-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Status</th>
                        <th>Score</th>
                        <th>Result</th>
                        <th>Start Time</th>
                        <th>Warnings</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map(session => (
                        <tr key={session._id}>
                          <td>{session.student?. name || 'Unknown'}</td>
                          <td>
                            <span className={`status-badge status-${session.status}`}>
                              {session.status}
                            </span>
                          </td>
                          <td>{session.score || 0}/{exam.totalMarks}</td>
                          <td>
                            <span className={`result-badge result-${session.result}`}>
                              {session.result || 'Pending'}
                            </span>
                          </td>
                          <td>{new Date(session.startTime).toLocaleString()}</td>
                          <td>{session.warningCount || 0}</td>
                          <td>
                            <Link to={`/faculty/sessions/${session._id}`}>
                              <Button variant="primary" size="small">View</Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No sessions yet.  Students haven't attempted this exam. </p>
              )}
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default ExamDetails;
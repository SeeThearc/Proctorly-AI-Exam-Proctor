import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Layout/Navbar';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import Loader from '../../components/Common/Loader';
import './ExamResults.css';

const ExamResults = () => {
  const { sessionId } = useParams();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [sessionId]);

  const fetchResults = async () => {
    try {
      const response = await api.get(`/proctoring/results/${sessionId}`);
      setResults(response.data. results);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching results:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Loader fullScreen message="Loading results..." />
      </>
    );
  }

  if (!results) {
    return (
      <>
        <Navbar />
        <div className="results-container">
          <Card>
            <div className="empty-state">
              <h3>Results not found</h3>
            </div>
          </Card>
        </div>
      </>
    );
  }

  const isPassed = results.result === 'pass';
  const scorePercentage = parseFloat(results.percentage);

  return (
    <>
      <Navbar />
      <div className="results-container">
        <div className="results-header">
          <h1>Exam Results</h1>
          <p>{results.examTitle}</p>
        </div>

        {/* Result Summary Card */}
        <Card className="result-summary-card">
          <div className={`result-status ${isPassed ? 'status-pass' : 'status-fail'}`}>
            <div className="status-icon">
              {isPassed ? '🎉' : '📊'}
            </div>
            <h2>{isPassed ? 'Congratulations!' : 'Results'}</h2>
            <p className="result-message">
              {isPassed ? 'You have passed the exam' : 'Keep practicing! '}
            </p>
            <div className="result-badge">
              <span className={`badge ${isPassed ? 'badge-pass' : 'badge-fail'}`}>
                {isPassed ? '✓ PASS' : '✗ FAIL'}
              </span>
            </div>
          </div>

          <div className="score-display">
            <div className="score-circle">
              <svg viewBox="0 0 200 200">
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="#e0e0e0"
                  strokeWidth="20"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke={isPassed ? '#4caf50' : '#dc3545'}
                  strokeWidth="20"
                  strokeDasharray={`${(scorePercentage / 100) * 565.48} 565.48`}
                  strokeDashoffset="141.37"
                  transform="rotate(-90 100 100)"
                />
              </svg>
              <div className="score-text">
                <span className="score-value">{results.score}</span>
                <span className="score-total">/ {results.totalMarks}</span>
                <span className="score-percentage">{results.percentage}%</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Detailed Stats */}
        <div className="stats-grid">
          <Card>
            <div className="stat-card-content">
              <div className="stat-icon" style={{ background: '#e3f2fd' }}>
                ✓
              </div>
              <div className="stat-details">
                <h3>{results.correctAnswers}</h3>
                <p>Correct Answers</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="stat-card-content">
              <div className="stat-icon" style={{ background: '#ffebee' }}>
                ✗
              </div>
              <div className="stat-details">
                <h3>{results.wrongAnswers}</h3>
                <p>Wrong Answers</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="stat-card-content">
              <div className="stat-icon" style={{ background: '#fff3e0' }}>
                ⊝
              </div>
              <div className="stat-details">
                <h3>{results.unansweredQuestions}</h3>
                <p>Unanswered</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="stat-card-content">
              <div className="stat-icon" style={{ background: '#f3e5f5' }}>
                ⏱️
              </div>
              <div className="stat-details">
                <h3>{results.timeTaken}</h3>
                <p>Minutes Taken</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Additional Details */}
        <Card>
          <h3 className="section-title">Exam Details</h3>
          <div className="details-grid">
            <div className="detail-row">
              <span className="detail-label">Passing Marks:</span>
              <span className="detail-value">{results. passingMarks} / {results.totalMarks}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Total Questions:</span>
              <span className="detail-value">{results. totalQuestions}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Start Time:</span>
              <span className="detail-value">{new Date(results.startTime).toLocaleString()}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">End Time:</span>
              <span className="detail-value">{new Date(results.endTime).toLocaleString()}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Warnings Received:</span>
              <span className={`detail-value ${results.warningCount > 0 ? 'warning-text' : ''}`}>
                {results.warningCount}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Violations Logged:</span>
              <span className={`detail-value ${results.violationCount > 0 ? 'warning-text' : ''}`}>
                {results.violationCount}
              </span>
            </div>
          </div>
        </Card>

        {/* Detailed Answers (if available) */}
        {results.answers && (
          <Card>
            <h3 className="section-title">Question-wise Analysis</h3>
            <div className="answers-list">
              {results.answers. map((answer, index) => (
                <div key={index} className={`answer-item ${answer.isCorrect ? 'correct' : 'incorrect'}`}>
                  <div className="answer-header">
                    <span className="answer-number">Q{index + 1}</span>
                    <span className={`answer-result ${answer.isCorrect ? 'result-correct' : 'result-incorrect'}`}>
                      {answer.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                    </span>
                    <span className="answer-marks">
                      {answer.marksAwarded > 0 ? `+${answer.marksAwarded}` : answer.marksAwarded}
                    </span>
                  </div>
                  <p className="answer-question">{answer.questionText}</p>
                  <div className="answer-details">
                    <div className="answer-row">
                      <span className="answer-label">Your Answer:</span>
                      <span className={`answer-value ${!answer.isCorrect ? 'incorrect-answer' : ''}`}>
                        {answer.selectedAnswer}
                      </span>
                    </div>
                    {! answer.isCorrect && (
                      <div className="answer-row">
                        <span className="answer-label">Correct Answer:</span>
                        <span className="answer-value correct-answer">{answer.correctAnswer}</span>
                      </div>
                    )}
                    {answer.explanation && (
                      <div className="answer-explanation">
                        <strong>Explanation:</strong> {answer.explanation}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="results-actions">
          <Link to="/student/exams">
            <Button variant="primary" size="large">
              Back to Exams
            </Button>
          </Link>
          <Link to="/student/history">
            <Button variant="secondary" size="large">
              View All Results
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
};

export default ExamResults;
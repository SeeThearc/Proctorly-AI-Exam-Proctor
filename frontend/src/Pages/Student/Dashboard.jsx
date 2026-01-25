import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Navbar from '../../components/Layout/Navbar';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import Loader from '../../components/Common/Loader';
import Alert from '../../components/Common/Alert';
import './Dashboard.css';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [recentHistory, setRecentHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch available exams
      const examsRes = await api.get('/student/exams');
      const allExams = examsRes.data.exams;

      // Filter upcoming and ongoing
      const upcoming = allExams.filter(e => 
        e.status === 'upcoming' || (e.status === 'ongoing' && ! e.attempted)
      ).slice(0, 5);

      setUpcomingExams(upcoming);

      // Fetch exam history
      const historyRes = await api.get('/student/history');
      setRecentHistory(historyRes. data.history.slice(0, 5));

      // Calculate stats
      const attempted = historyRes.data.history.length;
      const completed = historyRes.data.history.filter(h => 
        h.status === 'completed' || h.status === 'auto-submitted'
      ).length;
      const passed = historyRes.data.history.filter(h => h.result === 'pass').length;

      setStats({
        totalExams: allExams.length,
        attempted,
        completed,
        passed,
        pending: attempted - completed
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Loader fullScreen message="Loading dashboard..." />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Welcome back, {user?.name}!  👋</h1>
          <p>Student ID: {user?.studentId}</p>
        </div>

        {! user?.faceDescriptor && (
          <Alert
            type="warning"
            message="⚠️ Face recognition not set up.  You won't be able to attempt exams until you complete the setup."
          />
        )}

        {/* Stats Cards */}
        <div className="stats-grid">
          <Card className="stat-card">
            <div className="stat-content">
              <div className="stat-icon" style={{ background: '#e3f2fd' }}>
                📚
              </div>
              <div className="stat-details">
                <h3>{stats?. totalExams || 0}</h3>
                <p>Available Exams</p>
              </div>
            </div>
          </Card>

          <Card className="stat-card">
            <div className="stat-content">
              <div className="stat-icon" style={{ background: '#fff3e0' }}>
                ✍️
              </div>
              <div className="stat-details">
                <h3>{stats?. attempted || 0}</h3>
                <p>Attempted</p>
              </div>
            </div>
          </Card>

          <Card className="stat-card">
            <div className="stat-content">
              <div className="stat-icon" style={{ background: '#e8f5e9' }}>
                ✅
              </div>
              <div className="stat-details">
                <h3>{stats?. completed || 0}</h3>
                <p>Completed</p>
              </div>
            </div>
          </Card>

          <Card className="stat-card">
            <div className="stat-content">
              <div className="stat-icon" style={{ background: '#f3e5f5' }}>
                🏆
              </div>
              <div className="stat-details">
                <h3>{stats?. passed || 0}</h3>
                <p>Passed</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <Link to="/student/exams">
              <Button variant="primary" size="large">
                📝 View Available Exams
              </Button>
            </Link>
            <Link to="/student/history">
              <Button variant="secondary" size="large">
                📊 View Exam History
              </Button>
            </Link>
            {! user?.faceDescriptor && (
              <Link to="/student/face-setup">
                <Button variant="warning" size="large">
                  📷 Setup Face Recognition
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Upcoming Exams */}
        {upcomingExams.length > 0 && (
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Upcoming Exams</h2>
              <Link to="/student/exams" className="view-all-link">View All →</Link>
            </div>
            <div className="exams-list">
              {upcomingExams.map(exam => (
                <Card key={exam._id} hoverable>
                  <div className="exam-item">
                    <div className="exam-info">
                      <h3>{exam.title}</h3>
                      <p className="exam-course">{exam.course}</p>
                      <div className="exam-meta">
                        <span>📅 {new Date(exam. scheduledDate).toLocaleString()}</span>
                        <span>⏱️ {exam.duration} mins</span>
                        <span>📊 {exam.totalMarks} marks</span>
                      </div>
                    </div>
                    <div className="exam-actions">
                      <span className={`exam-status status-${exam.status}`}>
                        {exam.status}
                      </span>
                      {exam.status === 'ongoing' && (
                        <Link to={`/student/exam/${exam._id}/instructions`}>
                          <Button variant="primary">Start Exam</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recent History */}
        {recentHistory.length > 0 && (
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Recent Exam History</h2>
              <Link to="/student/history" className="view-all-link">View All →</Link>
            </div>
            <div className="history-list">
              {recentHistory.map(session => (
                <Card key={session. sessionId} hoverable>
                  <div className="history-item">
                    <div className="history-info">
                      <h3>{session.examTitle}</h3>
                      <p>{session.course}</p>
                      <div className="history-meta">
                        <span>📅 {new Date(session.startTime).toLocaleDateString()}</span>
                        <span>Score: {session.score}/{session.totalMarks}</span>
                      </div>
                    </div>
                    <div className="history-result">
                      <span className={`result-badge result-${session.result}`}>
                        {session.result === 'pass' ? '✓ Pass' : '✗ Fail'}
                      </span>
                      <span className="result-percentage">{session.percentage?. toFixed(1)}%</span>
                      <Link to={`/student/results/${session.sessionId}`}>
                        <Button variant="outline" size="small">View Details</Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {upcomingExams.length === 0 && recentHistory.length === 0 && (
          <Card>
            <div className="empty-state">
              <span className="empty-icon">📚</span>
              <h3>No exams available yet</h3>
              <p>Check back later for upcoming exams</p>
            </div>
          </Card>
        )}
      </div>
    </>
  );
};

export default StudentDashboard;
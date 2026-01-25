import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Navbar from '../../components/Layout/Navbar';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import Loader from '../../components/Common/Loader';
import './Dashboard.css';

const FacultyDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentExams, setRecentExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch exams created by faculty
      const examsRes = await api.get('/faculty/exams');
      const exams = examsRes.data.exams;

      setRecentExams(exams. slice(0, 5));

      // Calculate stats
      const activeExams = exams.filter(e => e.isActive).length;
      const totalQuestions = exams.reduce((sum, e) => sum + (e.questions?. length || 0), 0);

      // Get session stats (would need separate endpoint, simplified here)
      setStats({
        totalExams: exams.length,
        activeExams,
        totalQuestions,
        totalStudents: 0 // Would come from sessions
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
          <h1>Welcome, {user?.name}!  👋</h1>
          <p>Faculty Dashboard</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <Card className="stat-card">
            <div className="stat-content">
              <div className="stat-icon" style={{ background: '#e3f2fd' }}>
                📚
              </div>
              <div className="stat-details">
                <h3>{stats?. totalExams || 0}</h3>
                <p>Total Exams</p>
              </div>
            </div>
          </Card>

          <Card className="stat-card">
            <div className="stat-content">
              <div className="stat-icon" style={{ background: '#e8f5e9' }}>
                ✅
              </div>
              <div className="stat-details">
                <h3>{stats?.activeExams || 0}</h3>
                <p>Active Exams</p>
              </div>
            </div>
          </Card>

          <Card className="stat-card">
            <div className="stat-content">
              <div className="stat-icon" style={{ background: '#fff3e0' }}>
                ❓
              </div>
              <div className="stat-details">
                <h3>{stats?.totalQuestions || 0}</h3>
                <p>Total Questions</p>
              </div>
            </div>
          </Card>

          <Card className="stat-card">
            <div className="stat-content">
              <div className="stat-icon" style={{ background: '#f3e5f5' }}>
                👥
              </div>
              <div className="stat-details">
                <h3>{stats?. totalStudents || 0}</h3>
                <p>Students Enrolled</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <Link to="/faculty/exams/create">
              <Button variant="primary" size="large">
                ➕ Create New Exam
              </Button>
            </Link>
            <Link to="/faculty/exams">
              <Button variant="secondary" size="large">
                📋 View All Exams
              </Button>
            </Link>
          </div>
        </div>

        {/* Recent Exams */}
        {recentExams.length > 0 && (
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Recent Exams</h2>
              <Link to="/faculty/exams" className="view-all-link">View All →</Link>
            </div>
            <div className="exams-list">
              {recentExams.map(exam => (
                <Card key={exam._id} hoverable>
                  <div className="exam-item">
                    <div className="exam-info">
                      <h3>{exam.title}</h3>
                      <p className="exam-course">{exam.course}</p>
                      <div className="exam-meta">
                        <span>📅 {new Date(exam. scheduledDate).toLocaleDateString()}</span>
                        <span>⏱️ {exam.duration} mins</span>
                        <span>❓ {exam.questions?. length || 0} questions</span>
                      </div>
                    </div>
                    <div className="exam-actions">
                      <span className={`exam-status ${exam.isActive ? 'status-active' : 'status-inactive'}`}>
                        {exam.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <Link to={`/faculty/exams/${exam._id}`}>
                        <Button variant="primary" size="small">View Details</Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {recentExams.length === 0 && (
          <Card>
            <div className="empty-state">
              <span className="empty-icon">📚</span>
              <h3>No exams created yet</h3>
              <p>Create your first exam to get started</p>
              <Link to="/faculty/exams/create">
                <Button variant="primary">Create Exam</Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </>
  );
};

export default FacultyDashboard;
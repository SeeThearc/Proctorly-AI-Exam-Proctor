import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Layout/Navbar';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import Loader from '../../components/Common/Loader';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data. stats);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
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
      <div className="admin-dashboard-container">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <p>System Overview and Management</p>
        </div>

        {/* User Stats */}
        <div className="section">
          <h2>👥 User Statistics</h2>
          <div className="stats-grid">
            <Card>
              <div className="stat-card-content">
                <div className="stat-icon" style={{ background:  '#e3f2fd' }}>
                  👤
                </div>
                <div className="stat-details">
                  <h3>{stats?. users. total || 0}</h3>
                  <p>Total Users</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="stat-card-content">
                <div className="stat-icon" style={{ background: '#e8f5e9' }}>
                  🎓
                </div>
                <div className="stat-details">
                  <h3>{stats?. users.students || 0}</h3>
                  <p>Students</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="stat-card-content">
                <div className="stat-icon" style={{ background: '#fff3e0' }}>
                  👨‍🏫
                </div>
                <div className="stat-details">
                  <h3>{stats?.users.faculty || 0}</h3>
                  <p>Faculty</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="stat-card-content">
                <div className="stat-icon" style={{ background: '#f3e5f5' }}>
                  ✅
                </div>
                <div className="stat-details">
                  <h3>{stats?.users.active || 0}</h3>
                  <p>Active Users</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Exam Stats */}
        <div className="section">
          <h2>📚 Exam Statistics</h2>
          <div className="stats-grid">
            <Card>
              <div className="stat-card-content">
                <div className="stat-icon" style={{ background: '#e3f2fd' }}>
                  📝
                </div>
                <div className="stat-details">
                  <h3>{stats?. exams.total || 0}</h3>
                  <p>Total Exams</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="stat-card-content">
                <div className="stat-icon" style={{ background: '#e8f5e9' }}>
                  ✅
                </div>
                <div className="stat-details">
                  <h3>{stats?.exams.active || 0}</h3>
                  <p>Active Exams</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="stat-card-content">
                <div className="stat-icon" style={{ background: '#fff3e0' }}>
                  📊
                </div>
                <div className="stat-details">
                  <h3>{stats?.sessions.total || 0}</h3>
                  <p>Total Sessions</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="stat-card-content">
                <div className="stat-icon" style={{ background: '#f3e5f5' }}>
                  🎯
                </div>
                <div className="stat-details">
                  <h3>{stats?.sessions.passRate || 0}%</h3>
                  <p>Pass Rate</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Violation Stats */}
        <div className="section">
          <h2>⚠️ Violation Statistics</h2>
          <Card>
            <div className="violations-stats">
              <div className="violation-summary">
                <h3>Total Violations:  {stats?.violations. total || 0}</h3>
              </div>
              <div className="violations-by-type">
                {stats?.violations.byType?.map(v => (
                  <div key={v._id} className="violation-type-stat">
                    <span className="violation-name">{v._id. replace(/-/g, ' ')}</span>
                    <span className="violation-count">{v.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="section">
          <h2>⚡ Quick Actions</h2>
          <div className="action-grid">
            <Link to="/admin/users">
              <Button variant="primary" size="large" fullWidth>
                👥 Manage Users
              </Button>
            </Link>
            <Link to="/admin/users/create">
              <Button variant="success" size="large" fullWidth>
                ➕ Create User
              </Button>
            </Link>
            <Link to="/admin/stats">
              <Button variant="secondary" size="large" fullWidth>
                📊 View Full Statistics
              </Button>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        {stats?. recentActivity && stats.recentActivity.length > 0 && (
          <div className="section">
            <h2>📋 Recent Activity</h2>
            <Card>
              <div className="recent-activity-list">
                {stats.recentActivity.map(session => (
                  <div key={session._id} className="activity-item">
                    <div className="activity-info">
                      <strong>{session.student.name}</strong>
                      <span className="activity-details">
                        {session.status} - {session.exam. title}
                      </span>
                      <span className="activity-time">
                        {new Date(session.startTime).toLocaleString()}
                      </span>
                    </div>
                    {session.score !== undefined && (
                      <span className="activity-score">
                        {session.score}/{session.exam.totalMarks}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminDashboard;
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Navbar from '../../components/Layout/Navbar';
import Card from '../../components/Common/Card';
import Loader from '../../components/Common/Loader';
import './SystemStats.css';

const SystemStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api. get('/admin/stats');
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
        <Loader fullScreen message="Loading statistics..." />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="system-stats-container">
        <div className="page-header">
          <h1>System Statistics</h1>
          <p>Comprehensive system analytics and reports</p>
        </div>

        {/* User Stats */}
        <Card title="👥 User Statistics">
          <div className="stats-detail-grid">
            <div className="stat-detail-item">
              <span className="stat-detail-label">Total Users</span>
              <span className="stat-detail-value">{stats?. users. total}</span>
            </div>
            <div className="stat-detail-item">
              <span className="stat-detail-label">Students</span>
              <span className="stat-detail-value">{stats?.users.students}</span>
            </div>
            <div className="stat-detail-item">
              <span className="stat-detail-label">Faculty</span>
              <span className="stat-detail-value">{stats?.users.faculty}</span>
            </div>
            <div className="stat-detail-item">
              <span className="stat-detail-label">Admins</span>
              <span className="stat-detail-value">{stats?.users.admins}</span>
            </div>
            <div className="stat-detail-item">
              <span className="stat-detail-label">Active Users</span>
              <span className="stat-detail-value">{stats?.users.active}</span>
            </div>
          </div>
        </Card>

        {/* Exam Stats */}
        <Card title="📚 Exam Statistics">
          <div className="stats-detail-grid">
            <div className="stat-detail-item">
              <span className="stat-detail-label">Total Exams</span>
              <span className="stat-detail-value">{stats?.exams.total}</span>
            </div>
            <div className="stat-detail-item">
              <span className="stat-detail-label">Active Exams</span>
              <span className="stat-detail-value">{stats?.exams. active}</span>
            </div>
          </div>
        </Card>

        {/* Session Stats */}
        <Card title="📊 Session Statistics">
          <div className="stats-detail-grid">
            <div className="stat-detail-item">
              <span className="stat-detail-label">Total Sessions</span>
              <span className="stat-detail-value">{stats?.sessions.total}</span>
            </div>
            <div className="stat-detail-item">
              <span className="stat-detail-label">Completed</span>
              <span className="stat-detail-value">{stats?.sessions.completed}</span>
            </div>
            <div className="stat-detail-item">
              <span className="stat-detail-label">In Progress</span>
              <span className="stat-detail-value">{stats?.sessions.inProgress}</span>
            </div>
            <div className="stat-detail-item">
              <span className="stat-detail-label">Passed</span>
              <span className="stat-detail-value">{stats?.sessions.passed}</span>
            </div>
            <div className="stat-detail-item">
              <span className="stat-detail-label">Failed</span>
              <span className="stat-detail-value">{stats?.sessions.failed}</span>
            </div>
            <div className="stat-detail-item">
              <span className="stat-detail-label">Pass Rate</span>
              <span className="stat-detail-value">{stats?.sessions.passRate}%</span>
            </div>
          </div>
        </Card>

        {/* Violation Stats */}
        <Card title="⚠️ Violation Statistics">
          <div className="violations-detail">
            <div className="violation-total">
              <h3>Total Violations:  {stats?.violations.total}</h3>
            </div>
            <div className="violations-breakdown">
              <h4>By Type:</h4>
              {stats?.violations.byType?.map(v => (
                <div key={v._id} className="violation-breakdown-item">
                  <span className="violation-type-name">{v._id. replace(/-/g, ' ')}</span>
                  <div className="violation-bar">
                    <div
                      className="violation-bar-fill"
                      style={{ width: `${(v.count / stats. violations.total) * 100}%` }}
                    ></div>
                  </div>
                  <span className="violation-count">{v.count}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};

export default SystemStats;
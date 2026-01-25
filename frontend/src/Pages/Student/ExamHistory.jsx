import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Layout/Navbar';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import Loader from '../../components/Common/Loader';
import './ExamHistory.css';

const ExamHistory = () => {
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, passed, failed
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    filterHistory();
  }, [filter, history]);

  const fetchHistory = async () => {
    try {
      const response = await api.get('/student/history');
      const historyData = response.data. history;
      setHistory(historyData);

      // Calculate stats
      const completed = historyData.filter(h => 
        h.status === 'completed' || h.status === 'auto-submitted'
      );
      const passed = completed.filter(h => h.result === 'pass');
      const avgScore = completed.length > 0
        ? completed.reduce((sum, h) => sum + h.percentage, 0) / completed.length
        : 0;

      setStats({
        total: historyData.length,
        completed: completed.length,
        passed: passed.length,
        failed: completed.length - passed.length,
        avgScore: avgScore. toFixed(1)
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching history:', error);
      setLoading(false);
    }
  };

  const filterHistory = () => {
    if (filter === 'all') {
      setFilteredHistory(history);
    } else if (filter === 'passed') {
      setFilteredHistory(history.filter(h => h.result === 'pass'));
    } else if (filter === 'failed') {
      setFilteredHistory(history.filter(h => h.result === 'fail'));
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Loader fullScreen message="Loading history..." />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="history-container">
        <div className="page-header">
          <h1>Exam History</h1>
          <p>View your past exam attempts and results</p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="stats-grid">
            <Card>
              <div className="stat-card-content">
                <div className="stat-icon" style={{ background: '#e3f2fd' }}>
                  📚
                </div>
                <div className="stat-details">
                  <h3>{stats.total}</h3>
                  <p>Total Attempts</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="stat-card-content">
                <div className="stat-icon" style={{ background: '#e8f5e9' }}>
                  ✅
                </div>
                <div className="stat-details">
                  <h3>{stats.passed}</h3>
                  <p>Passed</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="stat-card-content">
                <div className="stat-icon" style={{ background: '#ffebee' }}>
                  ❌
                </div>
                <div className="stat-details">
                  <h3>{stats.failed}</h3>
                  <p>Failed</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="stat-card-content">
                <div className="stat-icon" style={{ background: '#f3e5f5' }}>
                  📊
                </div>
                <div className="stat-details">
                  <h3>{stats.avgScore}%</h3>
                  <p>Average Score</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ?  'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({history.length})
          </button>
          <button
            className={`filter-tab ${filter === 'passed' ? 'active' : ''}`}
            onClick={() => setFilter('passed')}
          >
            Passed ({history.filter(h => h. result === 'pass').length})
          </button>
          <button
            className={`filter-tab ${filter === 'failed' ? 'active' : ''}`}
            onClick={() => setFilter('failed')}
          >
            Failed ({history.filter(h => h.result === 'fail').length})
          </button>
        </div>

        {/* History List */}
        {filteredHistory.length === 0 ? (
          <Card>
            <div className="empty-state">
              <span className="empty-icon">📝</span>
              <h3>No exam history</h3>
              <p>You haven't attempted any exams yet</p>
              <Link to="/student/exams">
                <Button variant="primary">View Available Exams</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="history-list">
            {filteredHistory. map((item) => (
              <Card key={item. sessionId} hoverable>
                <div className="history-item">
                  <div className="history-main">
                    <div className="history-info">
                      <h3>{item.examTitle}</h3>
                      <p className="history-course">{item.course}</p>
                      <div className="history-meta">
                        <span>📅 {new Date(item. startTime).toLocaleDateString()}</span>
                        <span>⏱️ {new Date(item.startTime).toLocaleTimeString()}</span>
                        <span className={`status-badge status-${item.status}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>

                    <div className="history-score">
                      <div className="score-circle-mini">
                        <svg viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="#e0e0e0"
                            strokeWidth="8"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke={item.result === 'pass' ? '#4caf50' :  '#f44336'}
                            strokeWidth="8"
                            strokeDasharray={`${(item.percentage / 100) * 282.74} 282.74`}
                            strokeDashoffset="70.685"
                            transform="rotate(-90 50 50)"
                          />
                        </svg>
                        <div className="score-text-mini">
                          <span className="score-value-mini">{item.score}</span>
                          <span className="score-total-mini">/{item.totalMarks}</span>
                        </div>
                      </div>
                      <div className="score-details">
                        <span className="percentage">{item.percentage?. toFixed(1)}%</span>
                        <span className={`result-label result-${item.result}`}>
                          {item.result === 'pass' ? '✓ Pass' : '✗ Fail'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {item.warningCount > 0 && (
                    <div className="history-warnings">
                      ⚠️ {item. warningCount} warning(s) received during exam
                    </div>
                  )}

                  <div className="history-actions">
                    <Link to={`/student/results/${item.sessionId}`}>
                      <Button variant="primary" size="small">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default ExamHistory;
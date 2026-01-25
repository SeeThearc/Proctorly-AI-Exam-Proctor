import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Layout/Navbar';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import Loader from '../../components/Common/Loader';
import Modal from '../../components/Common/Modal';
import './SessionReports.css';

const SessionReports = () => {
  const { examId } = useParams();
  const [exam, setExam] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [violations, setViolations] = useState([]);
  const [showViolationsModal, setShowViolationsModal] = useState(false);

  useEffect(() => {
    fetchSessionReports();
  }, [examId]);

  const fetchSessionReports = async () => {
    try {
      // Fetch exam details
      const examRes = await api.get(`/faculty/exams/${examId}`);
      setExam(examRes.data. exam);

      // Fetch sessions
      const sessionsRes = await api.get(`/faculty/exams/${examId}/sessions`);
      setSessions(sessionsRes.data. sessions);
      setStats(sessionsRes. data.stats);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching session reports:', error);
      setLoading(false);
    }
  };

  const viewViolations = async (session) => {
    try {
      const response = await api.get(`/proctoring/violations/${session._id}`);
      setViolations(response.data.violations);
      setSelectedSession(session);
      setShowViolationsModal(true);
    } catch (error) {
      console.error('Error fetching violations:', error);
    }
  };

  const exportToCSV = () => {
    const headers = ['Student Name', 'Student ID', 'Status', 'Score', 'Percentage', 'Result', 'Warnings', 'Start Time', 'End Time'];
    const rows = sessions.map(s => [
      s.student. name,
      s.student. studentId,
      s.status,
      s.score || 'N/A',
      s. percentage ?  s.percentage.toFixed(2) + '%' : 'N/A',
      s.result || 'N/A',
      s.warningCount,
      new Date(s.startTime).toLocaleString(),
      s.endTime ? new Date(s.endTime).toLocaleString() : 'N/A'
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document. createElement('a');
    a.href = url;
    a. download = `${exam?. title}_sessions. csv`;
    a.click();
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Loader fullScreen message="Loading session reports..." />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="session-reports-container">
        <div className="page-header">
          <div>
            <h1>{exam?.title} - Session Reports</h1>
            <p>View and analyze student submissions</p>
          </div>
          <div className="header-actions">
            <Button variant="secondary" onClick={exportToCSV}>
              📥 Export CSV
            </Button>
            <Link to={`/faculty/exams/${examId}`}>
              <Button variant="outline">← Back to Exam</Button>
            </Link>
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="stats-grid">
            <Card>
              <div className="stat-card-content">
                <div className="stat-icon" style={{ background: '#e3f2fd' }}>
                  👥
                </div>
                <div className="stat-details">
                  <h3>{stats.totalSessions}</h3>
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
                  <h3>{stats.completed}</h3>
                  <p>Completed</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="stat-card-content">
                <div className="stat-icon" style={{ background: '#fff3e0' }}>
                  ⏳
                </div>
                <div className="stat-details">
                  <h3>{stats. inProgress}</h3>
                  <p>In Progress</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="stat-card-content">
                <div className="stat-icon" style={{ background: '#f3e5f5' }}>
                  📊
                </div>
                <div className="stat-details">
                  <h3>{stats.averageScore?. toFixed(1) || 0}</h3>
                  <p>Average Score</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="stat-card-content">
                <div className="stat-icon" style={{ background: '#e8f5e9' }}>
                  🎯
                </div>
                <div className="stat-details">
                  <h3>{stats.passRate?. toFixed(1) || 0}%</h3>
                  <p>Pass Rate</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="stat-card-content">
                <div className="stat-icon" style={{ background: '#ffebee' }}>
                  ⚠️
                </div>
                <div className="stat-details">
                  <h3>{stats.autoSubmitted || 0}</h3>
                  <p>Auto-submitted</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Sessions Table */}
        {sessions.length === 0 ? (
          <Card>
            <div className="empty-state">
              <span className="empty-icon">📝</span>
              <h3>No submissions yet</h3>
              <p>Students haven't attempted this exam</p>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="table-container">
              <table className="sessions-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Student ID</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th>Percentage</th>
                    <th>Result</th>
                    <th>Warnings</th>
                    <th>Violations</th>
                    <th>Start Time</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(session => (
                    <tr key={session._id}>
                      <td>{session.student. name}</td>
                      <td>{session.student.studentId}</td>
                      <td>
                        <span className={`status-badge status-${session.status}`}>
                          {session.status}
                        </span>
                      </td>
                      <td>
                        {session.score !== undefined ?  `${session.score}/${exam.totalMarks}` : 'N/A'}
                      </td>
                      <td>
                        {session.percentage !== undefined ? `${session.percentage.toFixed(1)}%` : 'N/A'}
                      </td>
                      <td>
                        {session.result ?  (
                          <span className={`result-badge result-${session.result}`}>
                            {session.result === 'pass' ? '✓ Pass' : '✗ Fail'}
                          </span>
                        ) : 'N/A'}
                      </td>
                      <td>
                        <span className={session.warningCount > 0 ? 'warning-count' : ''}>
                          {session.warningCount}
                        </span>
                      </td>
                      <td>
                        <Button 
                          variant="outline" 
                          size="small"
                          onClick={() => viewViolations(session)}
                        >
                          View ({session.violations?. length || 0})
                        </Button>
                      </td>
                      <td>{new Date(session.startTime).toLocaleString()}</td>
                      <td>
                        <div className="action-buttons">
                          <Button variant="primary" size="small">
                            View Details
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Violations Modal */}
        <Modal
          isOpen={showViolationsModal}
          onClose={() => setShowViolationsModal(false)}
          title={`Violations - ${selectedSession?.student. name}`}
          size="large"
        >
          {violations.length === 0 ? (
            <p>No violations recorded</p>
          ) : (
            <div className="violations-list">
              {violations.map((violation, index) => (
                <div key={index} className="violation-item">
                  <div className="violation-header">
                    <span className={`violation-type type-${violation.severity}`}>
                      {violation.violationType. replace(/-/g, ' ')}
                    </span>
                    <span className="violation-time">
                      {new Date(violation.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {violation.snapshot && (
                    <img src={violation.snapshot} alt="Violation" className="violation-snapshot" />
                  )}
                  <div className="violation-severity">
                    Severity: <span className={`severity-${violation.severity}`}>{violation.severity}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      </div>
    </>
  );
};

export default SessionReports;
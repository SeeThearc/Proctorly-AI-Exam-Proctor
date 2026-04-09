import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Layout/Navbar';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import Loader from '../../components/Common/Loader';
import './SessionReports.css'; // reuse existing styles

const SessionDetail = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedSnapshot, setExpandedSnapshot] = useState(null);

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/faculty/sessions/${sessionId}`);
      if (res.data.success) {
        setSession(res.data.session);
      } else {
        setError(res.data.message || 'Failed to load session');
      }
    } catch (err) {
      console.error('Error fetching session:', err);
      setError(err.response?.data?.message || 'Failed to load session details');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (start, end) => {
    if (!start || !end) return 'N/A';
    const ms = new Date(end) - new Date(start);
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}m ${secs}s`;
  };

  const severityColor = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444' };

  if (loading) {
    return (
      <>
        <Navbar />
        <Loader fullScreen message="Loading session details..." />
      </>
    );
  }

  if (error || !session) {
    return (
      <>
        <Navbar />
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2 style={{ color: '#ef4444' }}>⚠️ {error || 'Session not found'}</h2>
          <Button variant="primary" onClick={() => navigate(-1)} style={{ marginTop: 16 }}>
            ← Go Back
          </Button>
        </div>
      </>
    );
  }

  const exam = session.exam;
  const student = session.student;
  const violations = session.violations || [];

  return (
    <>
      <Navbar />
      <div className="session-reports-container">

        {/* ── Header ── */}
        <div className="page-header">
          <div>
            <h1>Session Report</h1>
            <p>
              {student?.name} — {exam?.title}
            </p>
          </div>
          <div className="header-actions">
            <Button variant="outline" onClick={() => navigate(-1)}>
              ← Back to Sessions
            </Button>
          </div>
        </div>

        {/* ── Overview cards ── */}
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <Card>
            <div className="stat-card-content">
              <div className="stat-icon" style={{ background: '#e3f2fd' }}>👤</div>
              <div className="stat-details">
                <h3>{student?.name}</h3>
                <p>{student?.studentId} · {student?.email}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="stat-card-content">
              <div className="stat-icon" style={{ background: '#f3e5f5' }}>📊</div>
              <div className="stat-details">
                <h3>
                  {session.score !== undefined
                    ? `${session.score} / ${exam?.totalMarks}`
                    : 'Not graded'}
                </h3>
                <p>
                  {session.percentage !== undefined
                    ? `${session.percentage.toFixed(1)}%`
                    : '—'}
                  {session.result && (
                    <span
                      style={{
                        marginLeft: 8,
                        color: session.result === 'pass' ? '#22c55e' : '#ef4444',
                        fontWeight: 700,
                      }}
                    >
                      {session.result === 'pass' ? '✓ Pass' : '✗ Fail'}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="stat-card-content">
              <div className="stat-icon" style={{ background: '#fff3e0' }}>⏱️</div>
              <div className="stat-details">
                <h3>{formatDuration(session.startTime, session.endTime)}</h3>
                <p>Duration taken</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="stat-card-content">
              <div className="stat-icon" style={{ background: '#ffebee' }}>⚠️</div>
              <div className="stat-details">
                <h3>{session.warningCount}</h3>
                <p>Warnings · {violations.length} violations</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="stat-card-content">
              <div className="stat-icon" style={{
                background: session.status === 'completed' ? '#e8f5e9' :
                  session.status === 'in-progress' ? '#fff3e0' : '#ffebee'
              }}>
                {session.status === 'completed' ? '✅' :
                 session.status === 'in-progress' ? '⏳' : '🚨'}
              </div>
              <div className="stat-details">
                <h3 style={{ textTransform: 'capitalize' }}>
                  {session.status?.replace('-', ' ')}
                </h3>
                <p>Status</p>
              </div>
            </div>
          </Card>
        </div>

        {/* ── Timestamps ── */}
        <Card style={{ marginBottom: 24 }}>
          <div style={{ padding: '12px 16px' }}>
            <h3 style={{ marginBottom: 12 }}>🕐 Timeline</h3>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: 13 }}>Started</p>
                <p style={{ fontWeight: 600 }}>
                  {session.startTime ? new Date(session.startTime).toLocaleString() : 'N/A'}
                </p>
              </div>
              <div>
                <p style={{ color: '#6b7280', fontSize: 13 }}>Submitted</p>
                <p style={{ fontWeight: 600 }}>
                  {session.endTime ? new Date(session.endTime).toLocaleString() : '—'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* ── Violations ── */}
        <Card>
          <div style={{ padding: '12px 16px' }}>
            <h3 style={{ marginBottom: 16 }}>
              🚨 Violations ({violations.length})
            </h3>
            {violations.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">✅</span>
                <h3>No violations recorded</h3>
                <p>This student had a clean session</p>
              </div>
            ) : (
              <div className="violations-list">
                {violations.map((v, i) => (
                  <div key={i} className="violation-item">
                    <div className="violation-header">
                      <span
                        className="violation-type"
                        style={{
                          background: severityColor[v.severity] + '20',
                          color: severityColor[v.severity],
                          border: `1px solid ${severityColor[v.severity]}`,
                          borderRadius: 6,
                          padding: '2px 10px',
                          fontWeight: 600,
                          fontSize: 13
                        }}
                      >
                        {v.violationType?.replace(/-/g, ' ')}
                      </span>
                      <span className="violation-time">
                        {v.timestamp
                          ? new Date(v.timestamp).toLocaleTimeString()
                          : '—'}
                      </span>
                    </div>

                    <div style={{ marginTop: 6, fontSize: 13, color: '#6b7280' }}>
                      Severity:{' '}
                      <span style={{ color: severityColor[v.severity], fontWeight: 600 }}>
                        {v.severity}
                      </span>
                    </div>

                    {v.snapshot && (
                      <div style={{ marginTop: 8 }}>
                        <img
                          src={v.snapshot}
                          alt="Violation snapshot"
                          className="violation-snapshot"
                          style={{
                            width: 160,
                            height: 120,
                            objectFit: 'cover',
                            borderRadius: 6,
                            border: '1px solid #e5e7eb',
                            cursor: 'pointer',
                            transform: 'scaleX(-1)'
                          }}
                          onClick={() => setExpandedSnapshot(v.snapshot)}
                          title="Click to enlarge"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* ── Snapshot lightbox ── */}
        {expandedSnapshot && (
          <div
            onClick={() => setExpandedSnapshot(null)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 9999, cursor: 'zoom-out'
            }}
          >
            <img
              src={expandedSnapshot}
              alt="Enlarged violation snapshot"
              style={{
                maxWidth: '80vw', maxHeight: '80vh',
                borderRadius: 12, transform: 'scaleX(-1)'
              }}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default SessionDetail;

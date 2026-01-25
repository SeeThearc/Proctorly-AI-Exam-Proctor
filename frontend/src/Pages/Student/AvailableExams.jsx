import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Navbar from '../../components/Layout/Navbar';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import Loader from '../../components/Common/Loader';
import Alert from '../../components/Common/Alert';
import './AvailableExams.css';

const AvailableExams = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, upcoming, ongoing, ended

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    filterExams();
  }, [filter, exams]);

  const fetchExams = async () => {
    try {
      const response = await api.get('/student/exams');
      setExams(response.data.exams);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching exams:', error);
      setLoading(false);
    }
  };

  const filterExams = () => {
    if (filter === 'all') {
      setFilteredExams(exams);
    } else {
      setFilteredExams(exams.filter(exam => exam.status === filter));
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Loader fullScreen message="Loading exams..." />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="available-exams-container">
        <div className="page-header">
          <h1>Available Exams</h1>
          <p>View and attempt scheduled exams</p>
        </div>

        {!user?. faceDescriptor && (
          <Alert
            type="warning"
            message="⚠️ Face recognition not set up. Complete setup to attempt exams."
          />
        )}

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({exams.length})
          </button>
          <button
            className={`filter-tab ${filter === 'upcoming' ? 'active' : ''}`}
            onClick={() => setFilter('upcoming')}
          >
            Upcoming ({exams.filter(e => e.status === 'upcoming').length})
          </button>
          <button
            className={`filter-tab ${filter === 'ongoing' ? 'active' : ''}`}
            onClick={() => setFilter('ongoing')}
          >
            Ongoing ({exams.filter(e => e. status === 'ongoing').length})
          </button>
          <button
            className={`filter-tab ${filter === 'ended' ? 'active' : ''}`}
            onClick={() => setFilter('ended')}
          >
            Ended ({exams.filter(e => e.status === 'ended').length})
          </button>
        </div>

        {/* Exams List */}
        {filteredExams.length === 0 ? (
          <Card>
            <div className="empty-state">
              <span className="empty-icon">📚</span>
              <h3>No exams found</h3>
              <p>No exams available in this category</p>
            </div>
          </Card>
        ) : (
          <div className="exams-grid">
            {filteredExams.map(exam => (
              <Card key={exam._id} hoverable>
                <div className="exam-card">
                  <div className="exam-card-header">
                    <h3>{exam.title}</h3>
                    <span className={`exam-badge badge-${exam.status}`}>
                      {exam.status}
                    </span>
                  </div>

                  <p className="exam-description">{exam.description}</p>

                  <div className="exam-details">
                    <div className="detail-item">
                      <span className="detail-label">Course:</span>
                      <span className="detail-value">{exam.course}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Duration:</span>
                      <span className="detail-value">{exam.duration} minutes</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Total Marks:</span>
                      <span className="detail-value">{exam.totalMarks}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Passing Marks:</span>
                      <span className="detail-value">{exam.passingMarks}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Questions:</span>
                      <span className="detail-value">{exam.totalQuestions}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Scheduled: </span>
                      <span className="detail-value">
                        {new Date(exam.scheduledDate).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {exam.attempted && (
                    <div className="exam-attempted">
                      <Alert
                        type={exam.sessionStatus === 'completed' ? 'success' : 'info'}
                        message={`Status: ${exam.sessionStatus} ${exam.score !== undefined ? `| Score: ${exam.score}/${exam.totalMarks}` : ''}`}
                      />
                    </div>
                  )}

                  <div className="exam-card-footer">
                    {exam.status === 'ongoing' && ! exam.attempted && user?.faceDescriptor && (
                      <Link to={`/student/exam/${exam._id}/instructions`}>
                        <Button variant="primary" fullWidth>
                          Start Exam
                        </Button>
                      </Link>
                    )}
                    {exam.status === 'ongoing' && ! exam.attempted && !user?.faceDescriptor && (
                      <Button variant="primary" fullWidth disabled>
                        Setup Face Recognition First
                      </Button>
                    )}
                    {exam. status === 'ongoing' && exam.attempted && exam.sessionStatus === 'in-progress' && (
                      <Link to={`/student/exam/${exam._id}/attempt`}>
                        <Button variant="warning" fullWidth>
                          Resume Exam
                        </Button>
                      </Link>
                    )}
                    {exam.attempted && (exam.sessionStatus === 'completed' || exam. sessionStatus === 'auto-submitted') && (
                      <Link to={`/student/results/${exam.sessionId}`}>
                        <Button variant="secondary" fullWidth>
                          View Results
                        </Button>
                      </Link>
                    )}
                    {exam.status === 'upcoming' && (
                      <Button variant="secondary" fullWidth disabled>
                        Starts {new Date(exam.scheduledDate).toLocaleString()}
                      </Button>
                    )}
                    {exam. status === 'ended' && ! exam.attempted && (
                      <Button variant="secondary" fullWidth disabled>
                        Exam Ended
                      </Button>
                    )}
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

export default AvailableExams;